export async function fetchMenu(url) {
    try {
        const xmlUrl = "https://www.strava.cz/strava5/Jidelnicky/XML?zarizeni=0059";
        console.log("Fetching from the XML Golden Grail...");
        const res = await fetch(xmlUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        const menuData = {};
        let totalItems = 0;
        const denRegex = /<den datum="(\d{2})-(\d{2})-(\d{4})">(.*?)<\/den>/gs;
        let denMatch;
        while ((denMatch = denRegex.exec(xml)) !== null) {
            const d = parseInt(denMatch[1]);
            const m = parseInt(denMatch[2]);
            const dayContent = denMatch[4];
            const key = `${d}.${m}.`;
            const meals = [];
            const jidloRegex = /<jidlo\s+([^>]*)\/?>/g;
            let jidloMatch;
            while ((jidloMatch = jidloRegex.exec(dayContent)) !== null) {
                const attrs = jidloMatch[1];
                const nazevMatch = attrs.match(/nazev="([^"]*)"/);
                const druhMatch = attrs.match(/druh="([^"]*)"/);
                if (nazevMatch && druhMatch) {
                    const name = decodeHtmlEntities(nazevMatch[1].trim());
                    const rawType = decodeHtmlEntities(druhMatch[1].trim());
                    const allowedTypes = ["Polévka", "Oběd S1", "Oběd S2", "Oběd S3", "Doplněk", "Svačina"];
                    const isIncluded = allowedTypes.some((t) => t.toLowerCase() === rawType.toLowerCase());
                    if (name && name !== "..." && isIncluded) {
                        let cleanName = name.replace(new RegExp("^" + rawType, "i"), "").replace(/^[:\s\-]+/, "").trim();
                        if (!cleanName) cleanName = name;
                        const finalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
                        meals.push(`<b>${rawType}:</b> ${finalName}`);
                        totalItems++;
                    }
                }
            }
            if (meals.length > 0) {
                menuData[key] = meals.join("<br>");
            }
        }
        return {
            data: menuData,
            debugLog: totalItems > 0 ? `Menu OK (${totalItems} položek z XML)` : "Menu empty (XML parsed 0 items)"
        };
    } catch (e) {
        return { data: {}, debugLog: "XML Grail failed: " + e.message };
    }
}

async function scrapeUrl(url, cacheKey, env, lastData, lastHashes) {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Cache-Control": "no-cache"
            },
            cf: { cacheTtl: 0, cacheKey: `${cacheKey}_${Date.now()}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        const msgUint8 = new TextEncoder().encode(html);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        if (lastHashes && hashHex === lastHashes[cacheKey]) {
            // Return existing data if hash matches
            const parts = cacheKey.split("_"); // type_id_week
            const type = parts[0];
            const id = parts[1];
            const week = parts[2];
            if (lastData && lastData[type] && lastData[type][id] && lastData[type][id][week]) {
                return { items: lastData[type][id][week].items, hash: hashHex, changed: false, success: true };
            }
        }

        const items = await parseTimetable(html);
        return { items, hash: hashHex, changed: true, success: true };
    } catch (e) {
        console.error(`Failed to scrape ${url}: ${e.message}`);
        return {
            items: [],
            hash: "",
            changed: false,
            success: false
        };
    }
}

export async function fetchTimetable(type, id, env) {
    const baseUrl = "https://znamky.gmh.cz/Timetable/Public";
    const typePath = type === "teacher" ? "Teacher" : "Class";
    const actualUrl = `${baseUrl}/Actual/${typePath}/${id}?ShowCaption=0&ShowFilter=1&TouchMode=1&showTerm=1`;
    const nextUrl = `${baseUrl}/Next/${typePath}/${id}?showCaption=0&showFilter=1&showTerm=1`;

    const timestamp = new Date().toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Europe/Prague"
    });

    const [actualRes, nextRes] = await Promise.all([
        scrapeUrl(actualUrl, `${type}_${id}_actual`, env),
        scrapeUrl(nextUrl, `${type}_${id}_next`, env)
    ]);

    return {
        actual: { items: actualRes.items, timestamp },
        next: { items: nextRes.items, timestamp },
        success: actualRes.success && nextRes.success
    };
}

export function decodeHtmlEntities(text) {
    if (!text) return text;
    
    // 1. Handle double encoding (e.g. &amp;#237;) by decoding common named entities first
    const named = {
        "&quot;": '"', "&amp;": "&", "&lt;": "<", "&gt;": ">", "&nbsp;": " ",
        "&aacute;": "á", "&ccaron;": "č", "&dcaron;": "ď", "&eacute;": "é", "&ecaron;": "ě",
        "&iacute;": "í", "&ncaron;": "ň", "&oacute;": "ó", "&rcaron;": "ř", "&scaron;": "š",
        "&tcaron;": "ť", "&uacute;": "ú", "&uring;": "ů", "&yacute;": "ý", "&zcaron;": "ž",
        "&Aacute;": "Á", "&Ccaron;": "Č", "&Dcaron;": "Ď", "&Eacute;": "É", "&Ecaron;": "Ě",
        "&Iacute;": "Í", "&Ncaron;": "Ň", "&Oacute;": "Ó", "&Rcaron;": "Ř", "&Scaron;": "Š",
        "&Tcaron;": "Ť", "&Uacute;": "Ú", "&Uring;": "Ů", "&Yacute;": "Ý", "&Zcaron;": "Ž"
    };
    let decoded = text.replace(/&[a-zA-Z]+;/g, (match) => named[match] || match);

    // 2. Decode numeric entities (decimal &#123; and hex &#x123;), semicolon is optional
    // We run this twice to handle potential double numeric encoding or nested cases
    const decodeNumeric = (str) => {
        return str
            .replace(/&#(\d+);?/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
            .replace(/&#x([0-9a-fA-F]+);?/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
    };
    
    decoded = decodeNumeric(decoded);
    decoded = decodeNumeric(decoded); // Second pass for double encoding like &amp;#237; -> &#237; -> í

    // 3. Fallback for common Czech numeric patterns that might be missing the prefix or semicolon in weird scraped data
    // (though the above usually covers it, being explicit for common chars helps)
    const manualMap = {
        "&#237": "í", "&#225": "á", "&#253": "ý", "&#233": "é", "&#283": "ě", 
        "&#353": "š", "&#269": "č", "&#345": "ř", "&#382": "ž", "&#250": "ú", "&#367": "ů"
    };
    Object.keys(manualMap).forEach(key => {
        if (decoded.includes(key)) {
            decoded = decoded.split(key).join(manualMap[key]);
        }
    });

    return decoded;
}

export async function discoverEntities(env) {
    try {
        const url = "https://znamky.gmh.cz/Timetable/Public";
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();

        const classes = [];
        const teachers = [];

        // Bakal\xE1\u0159i specific selectors (regex for simplicity in worker environment)
        const classRegex = /<option\s+value="([^"]+)"[^>]*>([^<]+)<\/option>/g;
        
        // Let's try to find the select for classes and teachers
        const classSelectMatch = html.match(/<select[^>]*id="selectedClass"[^>]*>(.*?)<\/select>/s);
        if (classSelectMatch) {
            let match;
            while ((match = classRegex.exec(classSelectMatch[1])) !== null) {
                if (match[1]) classes.push({ id: match[1], name: decodeHtmlEntities(match[2].trim()) });
            }
        }

        const teacherSelectMatch = html.match(/<select[^>]*id="selectedTeacher"[^>]*>(.*?)<\/select>/s);
        if (teacherSelectMatch) {
            let match;
            while ((match = classRegex.exec(teacherSelectMatch[1])) !== null) {
                if (match[1]) teachers.push({ id: match[1], name: decodeHtmlEntities(match[2].trim()) });
            }
        }

        return { classes, teachers };
    } catch (e) {
        console.error("Discovery failed:", e);
        return { classes: [], teachers: [] };
    }
}

export async function updateCache(env) {
    const startTime = Date.now();
    
    // Night Mode: 22:00 - 05:30 (Prague Time)
    const pragueTimeParts = new Intl.DateTimeFormat("cs-CZ", {
        hour: "numeric", minute: "numeric", timeZone: "Europe/Prague", hour12: false
    }).formatToParts(new Date());
    
    const hour = parseInt(pragueTimeParts.find(p => p.type === 'hour').value);
    const minute = parseInt(pragueTimeParts.find(p => p.type === 'minute').value);

    if (hour >= 22 || hour < 5 || (hour === 5 && minute < 30)) {
        console.log("Night Mode active, skipping scrape.");
        return { success: true, message: "Night mode" };
    }

    const timestamp = new Date().toLocaleTimeString("cs-CZ", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Prague"
    });

    // 1. Get current hashes to avoid redundant writes
    let hashes = {};
    let oldData = null;
    try {
        const rows = await env.timetable_db.prepare("SELECT key, value FROM timetable_cache WHERE key IN (?, ?)").bind("cache_hashes", "latest_v5").all();
        const hashRow = rows.results.find(r => r.key === "cache_hashes");
        const dataRow = rows.results.find(r => r.key === "latest_v5");
        
        if (hashRow) hashes = JSON.parse(hashRow.value);
        if (dataRow) oldData = JSON.parse(dataRow.value);
    } catch (e) {
        console.error("D1 Hash fetch error:", e.message);
    }

    // 2. Discover all entities
    const discoveryRes = await discoverEntities(env);
    const menuRes = await fetchMenu(env.STRAVA_MENU_URL);

    const newData = {
        classes: {}, teachers: {}, menu: menuRes.data,
        discovery: discoveryRes, lastChecked: timestamp, debug: menuRes.debugLog
    };

    const allEntities = [
        ...discoveryRes.classes.map(c => ({ type: "class", id: c.id })),
        ...discoveryRes.teachers.map(t => ({ type: "teacher", id: t.id }))
    ];

    let writeCount = 0;
    const concurrency = 5;
    for (let i = 0; i < allEntities.length; i += concurrency) {
        const batch = allEntities.slice(i, i + concurrency);
        await Promise.all(batch.map(async (e) => {
            const res = await fetchTimetable(e.type, e.id, env);
            if (res.success) {
                const cacheKey = `tt_v3_${e.type}_${e.id.toUpperCase()}`;
                
                // Create a hash of the new data
                const resStr = JSON.stringify(res);
                const msgUint8 = new TextEncoder().encode(resStr);
                const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
                const newHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

                // ONLY write to D1 if the data actually changed!
                if (hashes[cacheKey] !== newHash) {
                    await env.timetable_db.prepare("INSERT OR REPLACE INTO timetable_cache (key, value, updated_at) VALUES (?, ?, ?)")
                        .bind(cacheKey, resStr, Date.now())
                        .run();
                    hashes[cacheKey] = newHash;
                    writeCount++;
                }
                
                if (e.type === "class") {
                    newData.classes[e.id.toLowerCase()] = res;
                }
            }
        }));
    }

    // ONLY write if something actually changed
    if (writeCount > 0 || !oldData) {
        await env.timetable_db.batch([
            env.timetable_db.prepare("INSERT OR REPLACE INTO timetable_cache (key, value, updated_at) VALUES (?, ?, ?)").bind("cache_hashes", JSON.stringify(hashes), Date.now()),
            env.timetable_db.prepare("INSERT OR REPLACE INTO timetable_cache (key, value, updated_at) VALUES (?, ?, ?)").bind("latest_v5", JSON.stringify(newData), Date.now())
        ]);
    }

    return { success: true, timestamp, total: allEntities.length, updated: writeCount };
}

export async function parseTimetable(fullHtml) {
    const items = [];
    const seen = new Set();
    const dayNames = {
        "pondělí": "po", "úterý": "út", "středa": "st",
        "čtvrtek": "čt", "pátek": "pá"
    };

    const normalizeDay = (day) => {
        const match = String(day || "").match(/^(\d{1,2})\.(\d{1,2})\.\d{4} \(([^)]+)\)/);
        if (!match) return "";
        const [, d, m, fullName] = match;
        const shortName = dayNames[fullName.toLowerCase()] || fullName.slice(0, 2);
        return `${shortName} ${parseInt(d)}.${parseInt(m)}.`;
    };

    const normalizeRoom = (room) => {
        const value = String(room || "").trim();
        if (!value) return "-";
        return value.match(/\b(\d{3})\b/)?.[1] || value;
    };

    const addDetail = (detail) => {
        if (detail?.type !== "atom" || !detail.subjecttext) return;

        const subjectText = String(detail.subjecttext).trim();
        const oldParts = subjectText.split("|").map((part) => part.trim());
        const isOldFormat = oldParts.length >= 3;
        const timeText = String(detail.time || (isOldFormat ? oldParts[2] : ""));
        const hourMatch = timeText.match(/^(\d+)/) || timeText.match(/(\d+)/);
        const date = normalizeDay(detail.day) || (isOldFormat ? oldParts[1] : "");
        const item = {
            subject: isOldFormat ? oldParts[0] : subjectText,
            date,
            hour: hourMatch ? parseInt(hourMatch[1]) : 0,
            time: timeText.match(/\(([^)]+)\)/)?.[1] || "",
            teacher: detail.teacher || "-",
            room: normalizeRoom(detail.room),
            group: detail.group || "-",
            theme: detail.theme || "",
            change: detail.changeinfo || ""
        };

        if (!item.date) return;
        const identity = detail.IdentCode || `${item.date}|${item.hour}|${item.subject}|${item.teacher}|${item.room}|${item.group}`;
        if (seen.has(identity)) return;
        seen.add(identity);
        items.push(item);
    };

    // New Bakaláři HTML: TooltipDetails is a JSON object encoded as a JSON string.
    for (const match of fullHtml.matchAll(/"TooltipDetails":"((?:\\.|[^"\\])*)"/g)) {
        try {
            const tooltipJson = JSON.parse(`"${match[1]}"`);
            addDetail(JSON.parse(decodeHtmlEntities(tooltipJson)));
        } catch (e) {
            // Ignore null/invalid tooltip values and continue with other lessons.
        }
    }

    // Backward compatibility with the old rendered data-detail attribute.
    if (items.length === 0) {
        for (const match of fullHtml.matchAll(/data-detail='({[^']*}?)'/g)) {
            try {
                addDetail(JSON.parse(decodeHtmlEntities(match[1])));
            } catch (e) {
                // Ignore malformed legacy entries.
            }
        }
    }
    return items;
}
