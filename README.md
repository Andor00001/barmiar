# Bármiár

Bevásárlólista-optimalizáló: megmondja, melyik boltból mit érdemes venni vagy rendelni, és mennyit spórolsz vele.
Élő oldal: https://barmiar.hu/

## Mi hol van
- `index.html` – a teljes alkalmazás (kosárbontó, cetli, akciók, boltok, beépíthető kalkulátor).
- `scripts/update.mjs` – napi árfrissítés a GVH Árfigyelő nyilvános adataiból. Ebből készül a `data/prices.json`, a `hol-olcsobb/` keresőbarát aloldalak és a `sitemap.xml`.
- `.github/workflows/prices.yml` – naponta kétszer magától lefuttatja a frissítést.
- `manifest.webmanifest`, `sw.js`, `icon*` – ettől tehető ki a telefon kezdőképernyőjére, és ettől nyílik meg térerő nélkül.
- `adatkezeles.html` – adatkezelési tájékoztató (tervezet, kiegészítendő).

## Saját domain (barmiar.hu) rákötése
1. A repó Settings → Pages → Custom domain mezőjébe: `barmiar.hu`.
2. A domain DNS-ében a GitHub Pages címeire kell mutatni (A rekordok: 185.199.108.153, .109.153, .110.153, .111.153).
3. A `.github/workflows/prices.yml` fájlban a `SITE_URL` értékét át kell írni `https://barmiar.hu/`-ra.

## Regisztráció és átkattintás-mérés
A `signups` és `outbound_clicks` táblák a `barmiar` Supabase-projektben vannak. A böngésző csak beírni tud, olvasni nem.
