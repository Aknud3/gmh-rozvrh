# Setup a nasazení

Aplikace používá Cloudflare Worker pro API, scraper, cron a D1 databázi. Frontend běží na Cloudflare Pages.

## Požadavky

- Node.js
- Cloudflare účet
- přihlášení přes Wrangler

```bash
git clone https://github.com/Aknud3/gmh-rozvrh.git
cd gmh-rozvrh
npm ci
npx wrangler login
```

## 1. D1 databáze

```bash
npx wrangler d1 create YOUR_D1_DATABASE_NAME
cp wrangler.api.example.toml wrangler.api.toml
```

Do `wrangler.api.toml` doplň jméno Workeru, jméno databáze, `database_id` a URL zdroje. Potom vytvoř tabulky:

```bash
npx wrangler d1 execute YOUR_D1_DATABASE_NAME --remote --file=./schema.sql --config=wrangler.api.toml
```

Schéma v `schema.sql` obsahuje tabulky `timetable_cache` a `analytics`.

## 2. API Worker

```bash
npx wrangler deploy --config=wrangler.api.toml
```

API endpointy:

```text
/api/timetable?type=class&id=PY
/api/timetable?type=teacher&id=NOVAK
```

Cron aktualizuje data každé dvě minuty. Cache se ukládá do D1.

## 3. Cloudflare Pages

```bash
cp wrangler.pages.example.toml wrangler.toml
```

V `wrangler.toml` nastav jméno Pages projektu a `service` na přesné jméno API Workeru. Binding musí zůstat `WORKER_API`.

```bash
npm run build
npx wrangler pages project create YOUR_PAGES_PROJECT_NAME --production-branch=main
npx wrangler pages deploy public --project-name YOUR_PAGES_PROJECT_NAME --branch=production
```

Vlastní doménu přidej u Pages projektu v Cloudflare Dashboardu.

## Konfigurace zdroje

V API konfiguraci se nastavují:

- `TIMETABLE_BASE_URL` – základní URL veřejného rozvrhu
- `DISCOVERY_URL` – stránka s třídami a učiteli
- `STRAVA_MENU_URL` – XML endpoint jídelníčku

Scraper očekává Bakaláři endpointy ve tvaru:

```text
https://skola.example/Timetable/Public
https://skola.example/Timetable/Public/Actual/Class/{ID}
https://skola.example/Timetable/Public/Next/Class/{ID}
```

### Aktuální zdrojové stránky

Scraper aktuálně volá tyto celé URL:

```text
# Discovery tříd a učitelů
https://znamky.gmh.cz/Timetable/Public

# Permanentní rozvrh – používá se pro onboarding a skupiny
https://znamky.gmh.cz/Timetable/Public/Permanent/Class/PY?ShowCaption=0&ShowFilter=1&TouchMode=1&showTerm=1

# Aktuální rozvrh
https://znamky.gmh.cz/Timetable/Public/Actual/Class/PY?ShowCaption=0&ShowFilter=1&TouchMode=1&showTerm=1

# Rozvrh na následující týden
https://znamky.gmh.cz/Timetable/Public/Next/Class/PY?showCaption=0&showFilter=1&showTerm=1

# Jídelníček Strava ve formátu XML
https://www.strava.cz/strava5/Jidelnicky/XML?zarizeni=0059
```

Odkazy pro prohlédnutí:

- [Discovery tříd a učitelů](https://znamky.gmh.cz/Timetable/Public)
- [Permanentní rozvrh PY](https://znamky.gmh.cz/Timetable/Public/Permanent/Class/PY?ShowCaption=0&ShowFilter=1&TouchMode=1&showTerm=1)
- [Aktuální rozvrh PY](https://znamky.gmh.cz/Timetable/Public/Actual/Class/PY?ShowCaption=0&ShowFilter=1&TouchMode=1&showTerm=1)
- [Následující týden PY](https://znamky.gmh.cz/Timetable/Public/Next/Class/PY?showCaption=0&showFilter=1&showTerm=1)
- [Strava XML jídelníček](https://www.strava.cz/strava5/Jidelnicky/XML?zarizeni=0059)

`PY` je pouze ukázkové ID. Třídy a učitelé se načítají dynamicky.

## Testování

```bash
npm run build
node --check src/scraper/index.js
node scripts/test-scraper.mjs PY
```

Pro lokální vývoj Workeru:

```bash
npx wrangler dev --config=wrangler.api.toml
```
