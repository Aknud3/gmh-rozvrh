import { HTML_SHELL } from '../public/index.template.js';
import { SW_CODE } from '../public/js/sw-code.js';
import { handleTimetable } from './api/timetable.js';
import { updateCache } from './scraper/index.js';

export default {
    /**
     * Hlavní mozek - jen přijímá dotazy a posílá je do správných souborů
     */
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;




        try {
            // TADY SE VOLÁ TVŮJ NOVÝ SOUBOR!
            if (path === "/api/timetable") {
                return await handleTimetable(request, env, ctx);
            }

            // Analytika - zaznamenání návštěvy
            if (path === "/api/analytics" && request.method === "POST") {
                try {
                    const { user_id } = await request.json();
                    if (user_id && typeof user_id === 'string') {
                        await env.timetable_db.prepare("INSERT INTO analytics (user_id) VALUES (?)")
                            .bind(user_id)
                            .run();
                    }
                    return Response.json({ success: true });
                } catch (e) {
                    console.error("Analytics error:", e.message);
                    return Response.json({ success: false, error: e.message }, { status: 400 });
                }
            }

            // Odběry notifikací
            if (path === "/api/subscribe" && request.method === "POST") {
                const { subscription, class: cls } = await request.json();
                const subKey = `sub_${subscription.endpoint.split("/").pop()}`;
                try {
                    await env.timetable_db.prepare("INSERT OR REPLACE INTO timetable_cache (key, value, updated_at) VALUES (?, ?, ?)")
                        .bind(subKey, JSON.stringify({ subscription, class: cls }), Date.now())
                        .run();
                } catch (e) {
                    console.error("D1 Subscribe error:", e.message);
                }
                return Response.json({ success: true });
            }

            // Service Worker
            if (path === "/sw.js") {
                return new Response(SW_CODE, {
                    headers: { "Content-Type": "application/javascript", "Cache-Control": "public, max-age=3600" }
                });
            }

            // Hlavní HTML stránka (pouze pro "/" nebo cesty bez tečky - SPA routing)
            if (path === "/" || !path.includes(".")) {
                let cached = null;
                try {
                    const row = await env.timetable_db.prepare("SELECT value FROM timetable_cache WHERE key = ?").bind("latest_v5").first();
                    if (row && row.value) cached = JSON.parse(row.value);
                } catch (e) {
                    console.error("D1 Read error:", e.message);
                }

                // --- Etag pro HTML (Phase 5) ---
                const myText = new TextEncoder().encode(HTML_SHELL);
                const myDigest = await crypto.subtle.digest('SHA-1', myText);
                const hash = [...new Uint8Array(myDigest)].map(b => b.toString(16).padStart(2, '0')).join('');
                const etag = `"${hash}"`;

                if (request.headers.get("If-None-Match") === etag && !cached) {
                    return new Response(null, { status: 304 });
                }
                // ------------------------------

                const response = new Response(HTML_SHELL, {
                    headers: {
                        "Content-Type": "text/html",
                        "Cache-Control": "public, max-age=60, s-maxage=600",
                        "ETag": etag
                    }
                });

                if (!cached) return response;

                return new HTMLRewriter().on("head", {
                    element(el) {
                        el.append(`<script>window.__INITIAL_DATA__ = ${JSON.stringify(cached)};<\/script>`, { html: true });
                    }
                }).transform(response);
            }

            // Pokud cesta neodpovídá ničemu nahoře, nevracíme nic -> Cloudflare zkusí najít soubor v [assets] složce "public"
            return;

        } catch (e) {
            console.error(`Critical fetch error: ${e.message}`);
            return new Response(`Internal Server Error: ${e.message}`, { status: 500 });
        }
    },

    /**
     * Automatické aktualizace (Cron)
     */
    async scheduled(event, env, ctx) {
        console.log("CRON: Start");
        ctx.waitUntil(
            updateCache(env).catch(async (err) => {
                const errorReport = {
                    message: err.message,
                    stack: err.stack,
                    time: new Date().toLocaleString("cs-CZ", { timeZone: "Europe/Prague" }),
                    type: "CRON_ERROR"
                };

                try {
                    await env.timetable_db.prepare("INSERT OR REPLACE INTO timetable_cache (key, value, updated_at) VALUES (?, ?, ?)")
                        .bind("last_error", JSON.stringify(errorReport), Date.now())
                        .run();
                } catch (e) {
                    console.error("Failed to save error to D1:", e.message);
                }
                console.error("Cron failed, error saved to D1.");
            })
        );
    }
};