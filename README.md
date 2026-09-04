# GMH Rozvrh

Nejnovější lokální snapshot Cloudflare Pages/Worker aplikace pro `rozvrh.gmh.cz`.

## Nasazení

- Cloudflare Pages projekt: `rozvrh-gmh`
- Nejnovější dohledaný deployment: `94238be7-2782-459e-abcc-e221d21aec5f`
- Veřejná stránka: https://rozvrh.gmh.cz/

## Zdrojové endpointy rozvrhu

```text
https://znamky.gmh.cz/Timetable/Public/Actual/Class/{ID}
https://znamky.gmh.cz/Timetable/Public/Next/Class/{ID}
```

Parser je v `src/scraper/index.js`. Zdrojové stránky aktuálně vrací data přes Knockout binding `data-bind`, takže staré hledání skutečného atributu `data-detail` vrací prázdný výsledek.

