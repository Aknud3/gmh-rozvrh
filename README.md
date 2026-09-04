# GMH Rozvrh

Jednoduchý a rychlý rozvrh pro studenty a učitele. Aplikace převádí veřejná data z Bakalářů do přehledného webového rozhraní, kde si každý může vybrat třídu, učitele nebo skupinu a mít aktuální rozvrh pohodlně po ruce.

Projekt je navržený tak, aby se rozvrh aktualizoval automaticky a aby šel snadno přizpůsobit i jiné škole, která používá veřejné rozhraní Bakalářů. Frontend běží na Cloudflare Pages, zatímco API, scraping a ukládání dat zajišťuje Cloudflare Worker s D1 databází.

## Co projekt umí

- zobrazuje aktuální i následující týden
- automaticky objevuje dostupné třídy a učitele
- podporuje onboarding podle permanentního rozvrhu
- převádí HTML data do jednotného formátu pro frontend
- ukládá načtená data do cache, takže je aplikace rychlá
- umožňuje nasazení do vlastního Cloudflare účtu

## Architektura

Aplikace se skládá ze dvou Cloudflare nasazení:

- API Worker: scraper, API endpointy, cron a D1 databáze
- Cloudflare Pages: frontend v `public/`, který volá API Worker přes service binding

Každý uživatel si vytvoří vlastní Worker, Pages projekt a D1 databázi.

## Rychlé nasazení do vlastního Cloudflare účtu

Potřebuješ Node.js, účet Cloudflare a přihlášení přes Wrangler:

```bash
git clone https://github.com/Aknud3/gmh-rozvrh.git
cd gmh-rozvrh
npm ci
npx wrangler login
```

### 1. Vytvoření D1 databáze

```bash
npx wrangler d1 create YOUR_D1_DATABASE_NAME
```

Z výstupu zkopíruj `database_id` a vytvoř API konfiguraci:

```bash
cp wrangler.api.example.toml wrangler.api.toml
```

Do `wrangler.api.toml` doplň jméno Workeru, jméno databáze, `database_id` a URL zdrojového webu. Aplikace očekává veřejné Bakaláři endpointy ve tvaru:

```text
https://skola.example/Timetable/Public
https://skola.example/Timetable/Public/Actual/Class/{ID}
https://skola.example/Timetable/Public/Next/Class/{ID}
```

Databázové tabulky vytvoř jednou příkazem:

```bash
npx wrangler d1 execute YOUR_D1_DATABASE_NAME --remote --file=./schema.sql --config=wrangler.api.toml
```

Schéma v `schema.sql` obsahuje tabulky `timetable_cache` a `analytics`.

### 2. Nasazení API Workeru

```bash
npx wrangler deploy --config=wrangler.api.toml
```

API endpointy:

```text
/api/timetable?type=class&id=PY
/api/timetable?type=teacher&id=NOVAK
```

Cron aktualizuje discovery, rozvrhy a jídelníček každé dvě minuty. Cache se ukládá do D1; klíče rozvrhů používají prefix `tt_v3_`.

### 3. Nasazení Pages frontendu

```bash
cp wrangler.pages.example.toml wrangler.toml
```

Nastav `name` Pages projektu a `service` na přesné jméno API Workeru z `wrangler.api.toml`. Binding se musí jmenovat `WORKER_API`.

Potom sestav a nasaď frontend:

```bash
npm run build
npx wrangler pages project create YOUR_PAGES_PROJECT_NAME --production-branch=main
npx wrangler pages deploy public --project-name YOUR_PAGES_PROJECT_NAME --branch=production
```

Pages funkce v `functions/api/[[path]].js` předávají `/api/*` požadavky do API Workeru. Vlastní doménu přidej v Cloudflare Dashboardu u Pages projektu.

## Konfigurace zdroje

`TIMETABLE_BASE_URL` je základní URL veřejného rozvrhu a `DISCOVERY_URL` je stránka, ze které se načítají třídy a učitelé. `STRAVA_MENU_URL` určuje XML endpoint jídelníčku.

Pokud jiný web používá jinou HTML strukturu, uprav parser v `src/scraper/index.js` a spusť:

```bash
node scripts/test-scraper.mjs PY
```

Test ověřuje permanentní, aktuální i následující rozvrh a onboardingové skupiny.

## Lokální kontrola

```bash
npm run build
node --check src/scraper/index.js
node scripts/test-scraper.mjs PY
```

Pro lokální vývoj Workeru:

```bash
npx wrangler dev --config=wrangler.api.toml
```

## Licence

MIT. Viz `public/LICENSE`.
