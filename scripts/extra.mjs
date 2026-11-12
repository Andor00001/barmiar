// Bármiár – kiegészítő árforrás azokra a termékkörökre, amelyek nincsenek a GVH Árfigyelőben (sör, csokoládé, üdítő).
// Szabályok, amelyeket a kód betart:
//  - naponta legfeljebb egyszer kérdez (az update.mjs a nap második futásakor a reggeli adatot viszi tovább),
//  - névvel azonosítja magát (User-Agent), kérések között szünetet tart, összesen kb. 60 kérés naponta,
//  - csak a boltok nyilvános, a robots.txt által nem tiltott oldalait olvassa; ha egy bolt elutasít (403/429), aznap nem próbálkozik tovább,
//  - a forrást az oldal minden érintett helyen megnevezi.
const UA = 'barmiar.hu-arfrissito/1.0 (+https://barmiar.hu/; napi egy lekerdezes)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const GROUP = 'Sör, üdítő, csokoládé';
export const EXTRA = [
  { id: 9001, n: 'Világos sör', u: 'l', r: 0.5, k: 'sor,vilagos sor,dobozos sor,uveges sor', kifli: [300113077], auchan: ['italok/sorok-cider/klasszikus-vilagos-sorok.c-14818', 'italok/sorok-cider/klasszikus-vilagos-sorok/lager.c-15278', 'italok/sorok-cider/klasszikus-vilagos-sorok/pilsner.c-15281', 'italok/sorok-cider/klasszikus-vilagos-sorok/vilagos-sor.c-6125'] },
  { id: 9002, n: 'Alkoholmentes sör', u: 'l', r: 0.5, k: 'alkoholmentes sor', kifli: [300113086], auchan: ['italok/sorok-cider/alkoholmentes-alacsony-alkoholtartalmu-sorok.c-14821', 'italok/sorok-cider/alkoholmentes-alacsony-alkoholtartalmu-sorok/alkoholmentes-sor.c-6122', 'italok/sorok-cider/alkoholmentes-alacsony-alkoholtartalmu-sorok/kasszikus-vilagos.c-15308', 'italok/sorok-cider/alkoholmentes-alacsony-alkoholtartalmu-sorok/gyumolcsos.c-15311'] },
  { id: 9003, n: 'Táblás csokoládé', u: 'kg', r: 0.1, k: 'csoki,csokolade,tablas csoki,tablas csokolade,tejcsoki,tejcsokolade,etcsoki,etcsokolade', kifli: [300113056], auchan: ['tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade.c-5588', 'tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade/etcsokolade-izesitett.c-5816', 'tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade/etcsokolade-natur.c-5817', 'tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade/fehercsokolade.c-5818', 'tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade/tejcsokolade-izesitett.c-5819', 'tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade/tejcsokolade-natur.c-5820'] },
  { id: 9004, n: 'Szeletes csokoládé', u: 'kg', r: 0.05, k: 'csokiszelet,szeletes csoki,csoki szelet,csokolade szelet', kifli: [300113104], auchan: ['tartos-elelmiszer/edesseg-csokolade-desszert/szeletes-termek.c-5587', 'tartos-elelmiszer/edesseg-csokolade-desszert/szeletes-termek/szeletes-termek-csokolade.c-5813', 'tartos-elelmiszer/edesseg-csokolade-desszert/szeletes-termek/szeletes-termek-ostya-alapu.c-5814'] },
  { id: 9005, n: 'Szénsavas üdítő', u: 'l', r: 1.5, k: 'udito,szensavas udito,kola,cola,narancsos udito,uditoital', kifli: [300113554], auchan: ['italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok.c-5645', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok/citrusos-szensavas-uditok.c-6127', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok/cola.c-6128', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok/egyeb-szensavas-uditok.c-6129', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok/pirosgyumolcs-szensavas-uditok.c-6130', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok/tonic.c-6131'] },
  { id: 9006, n: 'Jeges tea, limonádé', u: 'l', r: 1.5, k: 'jeges tea,ice tea,limonade,szensavmentes udito', kifli: [300113638], auchan: ['italok/asvanyviz-gyumolcsle-uditoital-szorp/limonade-es-ice-tea.c-5642', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/limonade-es-ice-tea/limonadek.c-6115', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/limonade-es-ice-tea/tea-alapu-uditok.c-6117', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/limonade-es-ice-tea/zold-tea-alapu-uditok.c-6114'] },
  { id: 9007, n: 'Energiaital', u: 'l', r: 0.25, k: 'energiaital,energia ital', kifli: [300113620], auchan: ['italok/asvanyviz-gyumolcsle-uditoital-szorp/energia-italok.c-5638', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/energia-italok/energia-italok.c-6089'] },
];
const blocked = {};
async function get(host, url, json) {
  if (blocked[host]) throw new Error(host + ' ma elutasított');
  await sleep(1200);
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: json ? 'application/json' : 'text/html', 'Accept-Language': 'hu' } });
  if (r.status === 403 || r.status === 429) { blocked[host] = true; throw new Error(host + ' elutasított (' + r.status + ')'); }
  if (!r.ok) throw new Error(host + ' ' + r.status);
  return json ? r.json() : r.text();
}
// "6 x 0,5 l", "250 ml", "100 g" → mennyiség az alapegységben (l vagy kg)
function amount(txt, unit) {
  const m = String(txt || '').replace(',', '.').match(/(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(ml|cl|dl|l|g|dkg|kg)\b/i);
  if (!m) return 0;
  const f = { ml: [.001, 'l'], cl: [.01, 'l'], dl: [.1, 'l'], l: [1, 'l'], g: [.001, 'kg'], dkg: [.01, 'kg'], kg: [1, 'kg'] }[m[3].toLowerCase()];
  return f[1] === unit ? +((+m[1] || 1) * +m[2] * f[0]).toFixed(4) : 0;
}
async function kifli(def) {
  const out = [];
  for (const cid of def.kifli) {
    let ids = [];
    for (let page = 0; page < 6; page++) {
      const d = await get('kifli', `https://www.kifli.hu/api/v1/categories/normal/${cid}/products?page=${page}&size=100&sort=recommended`, true);
      ids = ids.concat(d.productIds || []); if (!d.productIds || d.productIds.length < 100) break;
    }
    for (let i = 0; i < ids.length; i += 40) {
      const cards = await get('kifli', 'https://www.kifli.hu/api/v1/products/card?' + ids.slice(i, i + 40).map(x => 'products=' + x).join('&') + '&categoryType=normal', true);
      for (const c of cards) {
        const pr = c.prices || {}; if (c.archived || !c.stock || c.stock.availabilityStatus !== 'AVAILABLE' || !(pr.originalPrice > 0)) continue;
        const p = Math.round(pr.salePrice > 0 ? pr.salePrice : pr.originalPrice);
        let k = amount(c.textualAmount, def.u); if (!k && c.unit === def.u && pr.unitPrice > 0) k = +(p / pr.unitPrice).toFixed(3);
        if (!(k > 0)) continue;
        const nm = String(c.name).replace(/\s+/g, ' ').trim();
        out.push({ ch: 'kifli', n: /\d\s*(ml|l|g|kg)\b/i.test(nm) ? nm : nm + ' ' + String(c.textualAmount || '').trim(), k, p, w: pr.salePrice > 0 && pr.originalPrice > p ? Math.round(pr.originalPrice) : 0 });
      }
    }
  }
  return out;
}
async function auchan(def) {
  const out = [];
  for (const path of def.auchan) {
    let html; try { html = await get('auchan', 'https://auchan.hu/shop/' + path, false); } catch (e) { if (blocked.auchan) throw e; continue; } // egy-egy megszűnt alkategória nem állítja meg a többit
    const m = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/); if (!m) continue;
    const arr = JSON.parse(m[1]);
    const res = (i, d = 0) => { if (typeof i !== 'number' || i < 0) return undefined; const v = arr[i]; if (d > 6 || v === null || typeof v !== 'object') return v;
      if (Array.isArray(v)) { if (typeof v[0] === 'string') return v.length > 1 ? res(v[1], d + 1) : undefined; return v.map(x => res(x, d + 1)); }
      const o = {}; for (const key in v) o[key] = res(v[key], d + 1); return o; };
    for (const v of arr) {
      if (!v || typeof v !== 'object' || Array.isArray(v) || !('selectedVariant' in v) || !('categoryName' in v)) continue;
      const sv = arr[v.selectedVariant]; if (!sv || typeof sv !== 'object') continue;
      const name = arr[sv.name], price = res(sv.price), pk = res(sv.packageInfo);
      if (typeof name !== 'string' || !price || !(price.gross > 0) || !pk || !(pk.packageSize > 0)) continue;
      const un = /^L/i.test(pk.packageUnit) ? 'l' : /^K/i.test(pk.packageUnit) ? 'kg' : ''; if (un !== def.u) continue;
      const p = Math.round(price.isDiscounted && price.grossDiscounted > 0 ? price.grossDiscounted : price.gross);
      out.push({ ch: 'auchan', n: name.replace(/\s+/g, ' ').trim(), k: +(+pk.packageSize).toFixed(4), p, w: price.gross > p ? Math.round(price.gross) : 0 });
    }
  }
  return out;
}
// Visszaad: { cats: [...], rows: [...] } ugyanabban a formában, ahogy az update.mjs a GVH-adatot tárolja.
export async function fetchExtra({ ORDER, norm, slugify, today }) {
  const cats = [], rows = [], log = [];
  for (const def of EXTRA) {
    let prods = [];
    for (const [nm, fn] of [['kifli', kifli], ['auchan', auchan]]) { try { prods = prods.concat(await fn(def)); } catch (e) { log.push(def.n + ': ' + e.message); } }
    const seen = new Set(); prods = prods.filter(x => { const key = x.ch + '|' + x.n + '|' + x.k; if (seen.has(key)) return false; seen.add(key); return true; });
    if (!prods.length) continue;
    const us = prods.map(x => x.p / x.k).sort((a, b) => a - b), med = us[Math.floor(us.length / 2)];
    const sane = prods.filter(x => x.p / x.k >= med * 0.2 && x.p / x.k <= med * 6);
    const o = {};
    for (const ch of ['kifli', 'auchan']) {
      let pool = sane.filter(x => x.ch === ch && x.k >= def.r * 0.4 && x.k <= def.r * 2.5); if (!pool.length) pool = sane.filter(x => x.ch === ch);
      if (!pool.length) continue;
      const b = pool.reduce((a, c) => (c.p / c.k < a.p / a.k ? c : a));
      o[ch] = { n: b.n, k: b.k, p: b.p, u: +(b.p / b.k).toFixed(2) }; if (b.w) o[ch].w = b.w;
    }
    if (!Object.keys(o).length) continue;
    const wc = {}; for (const p of sane) for (const w of new Set(norm(p.n).split(' '))) if (w.length >= 4 && !/\d/.test(w)) wc[w] = (wc[w] || 0) + 1;
    const words = Object.entries(wc).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 60).map(([w]) => w);
    cats.push({ id: def.id, n: def.n, f: def.n, g: GROUP, s: slugify(def.n), u: def.u, r: def.r, k: def.k.split(','), c: sane.length, w: words, o, x: today });
    for (const p of sane) { const pr = new Array(ORDER.length).fill(0), was = new Array(ORDER.length).fill(0), j = ORDER.indexOf(p.ch); pr[j] = p.p; const row = [p.n, def.id, p.k, pr, 0]; if (p.w) { was[j] = p.w; row.push(was); } rows.push(row); }
  }
  return { cats, rows, log };
}
