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


## 2026. novemberi bővítés

- **Cetli a főoldal tetején**: jegyzettömb, pipálható tételek, egy gombos ár-összehasonlítás.
- **Két lista**: „Legjobb áron” és „Kívánság szerint” (a felírt márka, termék pontos ára). Ehhez a `data/products.json` tartalmazza mind a ~15 600 terméket.
- **Termékkereső** (`#termekek`, illetve `?q=keresőszó`).
- **Akciók fül**: az összes ma jelentett akció, boltra, kategóriára szűrve; keresőknek a naponta generált `akciok/` oldalak.
- **Kiszállítás**: boltonként szerkeszthető minimum, díj és ingyenes határ; Kifli.hu és Metro feltételei (áradat nélkül).
- **Ingyenes keret**: 1 összeállítás regisztráció nélkül, utána e-mail-címenként 10 (Supabase `usage` tábla, `bump_build` függvény).
- **MI-asszisztenseknek**: `llms.txt` és bővített `robots.txt`. Fotók: Unsplash (szabad felhasználású).

## Kiegészítő árforrás (2026-11-12)

- `scripts/extra.mjs`: sör, csokoládé, üdítő (7 termékkör) a Kifli.hu és az Auchan nyilvános webáruházából.
- Naponta legfeljebb egyszer kérdez, névvel azonosított robotként, kb. 60 kéréssel; ha egy bolt elutasít, aznap leáll. Ami nem jön meg, legfeljebb 3 napig a legutóbbi árral látszik.
- A Tesco webáruháza robotot nem enged be, a Spar mindent tilt: ezeket nem olvassuk.
- A számítás valós kiszerelésekkel dolgozik: annyi csomag ára, amennyi a kért mennyiséghez kell.
- Egyelőre minden ingyenes; az első összeállítás után csak ingyenes e-mailes regisztráció kell.
