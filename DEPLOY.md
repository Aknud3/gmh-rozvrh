# Deployment checklist

Kompletní návod pro nový Cloudflare účet je v [README.md](README.md).

## API Worker

1. `cp wrangler.api.example.toml wrangler.api.toml`
2. Vytvoř D1 databázi: `npx wrangler d1 create NAME`
3. Doplň `database_name`, `database_id` a URL zdroje do `wrangler.api.toml`.
4. Inicializuj tabulky:

   ```bash
   npx wrangler d1 execute NAME --remote --file=./schema.sql --config=wrangler.api.toml
   ```

5. Nasaď Worker:

   ```bash
   npx wrangler deploy --config=wrangler.api.toml
   ```

## Pages

1. `cp wrangler.pages.example.toml wrangler.toml`
2. Nastav Pages `name` a `service` na jméno API Workeru.
3. Sestav a nasaď:

   ```bash
   npm run build
   npx wrangler pages deploy public --project-name NAME --branch=production
   ```

Binding `WORKER_API` v Pages musí odkazovat na API Worker. Vlastní doménu se nastavuje u Pages projektu v Cloudflare Dashboardu.
