# GMH Rozvrh

Jednoduchá webová aplikace pro studenty a učitele Gymnázia Mnichovo Hradiště. Zobrazuje aktuální i následující rozvrh a automaticky načítá dostupné třídy, učitele a skupiny z Bakalářů.

Projekt vyvinul **Eduard Wojnar** pro **Gymnázium v Mnichově Hradiště**.

## O projektu

GMH Rozvrh vznikl jako přehlednější a pohodlnější způsob, jak si rychle zobrazit školní rozvrh.

Hlavní myšlenka je offline provoz díky local storage v prohlížeči a instantní načítání web app.

Aplikace je vysoce přizpůsobitelná uživateli a kombinuje i data obědů ze Stravy. Lze jí používat bez jakéhokoliv účtu a nesbírá žádná data.

Naleznete jí na **https://rozvrh.gmh.cz/**

## Onboarding

Při prvním spuštění webové stránky se zapne onboarding

Zadejte svoje jméno nebo přezdívku (Je to pouze jak se v aplikaci budete jmenovat)

Vyberete svojí třídu, nebo učitelské jméno a vyberete si hodiny.

**Vybírání hodin není moc uživatelsky přívětivé a při půlených hodinách se stejným učitelem je nutné postupovat metodou pokus omyl. V nastevní je možnost rozvrh kdykoliv změnit**

## Aplikace

Pro IOS a Android se používá web app

**Návody:**

https://support.apple.com/en-euro/guide/iphone/iphea86e5236/ios

https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid


## Získávání dat

Scraper používá veřejné stránky [Bakalářů Gymnázia Mnichovo Hradiště](https://znamky.gmh.cz/timetable/public?ShowCaption=0&ShowFilter=1&TouchMode=1&showTerm=1).

Pro obědy využívá [Strava jídelníček pro jídelnu 0059 v MH](https://www.strava.cz/strava5/Jidelnicky/XML?zarizeni=0059)

Scraper se spouští od 5:30 do 22:00 každé 2 minuty bere 5 položek, které se změnily. Změny můžou v nejhorším případě trvat až 20 minut. Důvod je abychom se vešli do Cloudflare free tieru i s 300 uživateli.

## Setup a nasazení nového systému

Kompletní návod pro vlastní hosting je v [SETUP.md](SETUP.md).

## Licence

MIT. Viz [public/LICENSE](public/LICENSE).
