export async function handleTimetable(request, env, ctx) {
    const url = new URL(request.url);
    const type = url.searchParams.get("type"); // 'class' or 'teacher'
    const id = url.searchParams.get("id")?.toUpperCase(); 

    // --- 1. Edge Cache Check ---
    // Note: caches.default only works on Custom Domains
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    let response = await cache.match(cacheKey);
    if (response) {
        return response; // Return the cached response immediately
    }

    // Always get the main cache for menu, discovery, etc.
    let mainCache = {};
    try {
        const row = await env.timetable_db.prepare("SELECT value FROM timetable_cache WHERE key = ?").bind("latest_v5").first();
        if (row && row.value) mainCache = JSON.parse(row.value);
    } catch (e) {}

    // --- 2. Security Shield: Validation ---
    if (type && id && mainCache.discovery) {
        const list = type === 'class' ? mainCache.discovery.classes : mainCache.discovery.teachers;
        const exists = list.some(item => item.id.toUpperCase() === id);
        
        if (!exists) {
            const errorBody = JSON.stringify({ error: true, message: "Neplatné ID." });
            const errorResponse = new Response(errorBody, { 
                status: 404,
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "public, s-maxage=3600",
                    "X-Cache-Status": "INVALID-ID"
                } 
            });
            ctx.waitUntil(cache.put(cacheKey, errorResponse.clone()));
            return errorResponse;
        }
    }

    // If no specific entity requested, return the full cached dashboard
    if (!type || !id) {
        if (Object.keys(mainCache).length === 0) {
            return Response.json({ error: true, message: "Data se připravují (první spuštění scraperu)..." }, { status: 503 });
        }
        
        return createCachedResponse(JSON.stringify(mainCache), request, cache, cacheKey, ctx);
    }

    const dbKey = `tt_${type}_${id}`;
    let data = null;
    try {
        const row = await env.timetable_db.prepare("SELECT value FROM timetable_cache WHERE key = ?").bind(dbKey).first();
        if (row && row.value) data = JSON.parse(row.value);
    } catch (e) {}

    if (!data) {
        // Data is missing from D1. Let's fetch it on-demand.
        try {
            const { fetchTimetable } = await import("../scraper/index.js");
            data = await fetchTimetable(type, id, env);
            
            // Save it so the next person gets it instantly.
            ctx.waitUntil(
                env.timetable_db.prepare("INSERT OR REPLACE INTO timetable_cache (key, value, updated_at) VALUES (?, ?, ?)")
                    .bind(dbKey, JSON.stringify(data), Date.now())
                    .run()
            );
        } catch (e) {
            return Response.json({ error: true, message: "Nepodařilo se načíst data z Bakalářů." }, { status: 502 });
        }
    }

    // Construct response
    const responseData = {
        ...mainCache,
        selectedEntity: { type, id, data },
        [id.toLowerCase()]: data
    };

    return createCachedResponse(JSON.stringify(responseData), request, cache, cacheKey, ctx);
}

/**
 * Helper to handle ETag and Edge Caching
 */
async function createCachedResponse(responseText, request, cache, cacheKey, ctx) {
    const myText = new TextEncoder().encode(responseText);
    const myDigest = await crypto.subtle.digest('SHA-1', myText);
    const hash = [...new Uint8Array(myDigest)].map(b => b.toString(16).padStart(2, '0')).join('');
    const etag = `"${hash}"`;

    if (request.headers.get("If-None-Match") === etag) {
        return new Response(null, { status: 304 });
    }

    const response = new Response(responseText, {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=60, s-maxage=600",
            "ETag": etag,
            "X-Cache-Status": "MISS"
        }
    });

    // Store in Edge Cache (async)
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
}