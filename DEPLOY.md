# Cloudflare deployment

Projekt má dvě oddělená Cloudflare nasazení:

## 1. API Worker

Worker se jmenuje `rozvrh-api`. Obsahuje scraper, API endpointy, cron aktualizaci a přístup k D1 databázi.

Konfigurace: `wrangler.api.toml`

Nasazení z této složky:

```bash
npx wrangler deploy --config wrangler.api.toml
```

Cron běží každé dvě minuty. API endpoint aplikace je `/api/timetable`.

Cache klíče rozvrhů používají prefix `tt_v3_`, aby se po změně parseru nepoužily staré výsledky s celými názvy místností.

## 2. Cloudflare Pages

Pages projekt se jmenuje `rozvrh-gmh` a používá doménu `rozvrh.gmh.cz`.

Pages obsluhuje frontend z `public/` a funkce v `functions/`. Soubor `functions/api/[[path]].js` předává `/api/*` požadavky do Workeru `rozvrh-api` přes service binding `WORKER_API`.

Nasazení Pages:

```bash
npx wrangler pages deploy public --project-name rozvrh-gmh --branch production
```

Pages konfigurace je v `wrangler.toml`. API Worker musí být nasazený před Pages, aby service binding `WORKER_API` mířil na dostupný Worker.

## Po nasazení

Ověř:

```bash
curl -i https://rozvrh.gmh.cz/
curl -i 'https://rozvrh.gmh.cz/api/timetable?type=class&id=PJ'
```

Zdrojové stránky rozvrhu jsou uvedené v `wrangler.api.toml`. Parser je v `src/scraper/index.js`.

Aktuální seznam tříd se načítá dynamicky z discovery stránky Bakalářů; není potřeba ho ručně udržovat v kódu.
