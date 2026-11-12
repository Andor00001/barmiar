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
  { id: 9001, fk: n => /(^| )sor( |$)|sor \d/.test(n) && !/alkoholmentes|radler|0\.0|pohar|korso|nyito|kolbasz|virsli|sajt/.test(n), n: 'Világos sör', u: 'l', r: 0.5, k: 'sor,vilagos sor,dobozos sor,uveges sor', kifli: [300113077], auchan: ['italok/sorok-cider/klasszikus-vilagos-sorok.c-14818', 'italok/sorok-cider/klasszikus-vilagos-sorok/lager.c-15278', 'italok/sorok-cider/klasszikus-vilagos-sorok/pilsner.c-15281', 'italok/sorok-cider/klasszikus-vilagos-sorok/vilagos-sor.c-6125'] },
  { id: 9002, fk: n => /sor/.test(n) && /alkoholmentes/.test(n), n: 'Alkoholmentes sör', u: 'l', r: 0.5, k: 'alkoholmentes sor', kifli: [300113086], auchan: ['italok/sorok-cider/alkoholmentes-alacsony-alkoholtartalmu-sorok.c-14821', 'italok/sorok-cider/alkoholmentes-alacsony-alkoholtartalmu-sorok/alkoholmentes-sor.c-6122', 'italok/sorok-cider/alkoholmentes-alacsony-alkoholtartalmu-sorok/kasszikus-vilagos.c-15308', 'italok/sorok-cider/alkoholmentes-alacsony-alkoholtartalmu-sorok/gyumolcsos.c-15311'] },
  { id: 9003, fk: n => /tablas|tejcsokolade|etcsokolade|fehercsokolade/.test(n) && !/szaloncukor|ostya|panettone|csomag|nyaloka|merci|rud|szelet|drazse|bonbon|mikulas|figura|desszert|praline|forro|izu/.test(n), n: 'Táblás csokoládé', u: 'kg', r: 0.1, k: 'csoki,csokolade,tablas csoki,tablas csokolade,tejcsoki,tejcsokolade,etcsoki,etcsokolade', kifli: [300113056], auchan: ['tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade.c-5588', 'tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade/etcsokolade-izesitett.c-5816', 'tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade/etcsokolade-natur.c-5817', 'tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade/fehercsokolade.c-5818', 'tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade/tejcsokolade-izesitett.c-5819', 'tartos-elelmiszer/edesseg-csokolade-desszert/tablas-csokolade/tejcsokolade-natur.c-5820'] },
  { id: 9004, fk: n => /szelet/.test(n) && /csoki|csokolade|ostya|karamell/.test(n) && !/nugat|marcipan|suti|torta/.test(n), n: 'Szeletes csokoládé', u: 'kg', r: 0.05, k: 'csokiszelet,szeletes csoki,csoki szelet,csokolade szelet', kifli: [300113104], auchan: ['tartos-elelmiszer/edesseg-csokolade-desszert/szeletes-termek.c-5587', 'tartos-elelmiszer/edesseg-csokolade-desszert/szeletes-termek/szeletes-termek-csokolade.c-5813', 'tartos-elelmiszer/edesseg-csokolade-desszert/szeletes-termek/szeletes-termek-ostya-alapu.c-5814'] },
  { id: 9005, fk: n => /szensavas|cola|kola|tonic|tonik|fanta|sprite|pepsi|traubi|schweppes/.test(n) && !/szensavmentes|tea|energia|sportital|izoton|isotonic|szorp|pezsgo/.test(n), n: 'Szénsavas üdítő', u: 'l', r: 1.5, k: 'udito,szensavas udito,kola,cola,narancsos udito,uditoital', kifli: [300113554], auchan: ['italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok.c-5645', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok/citrusos-szensavas-uditok.c-6127', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok/cola.c-6128', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok/egyeb-szensavas-uditok.c-6129', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok/pirosgyumolcs-szensavas-uditok.c-6130', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/szensavas-uditok/tonic.c-6131'] },
  { id: 9006, fk: n => /jeges tea|ice ?tea|limonade|szensavmentes|topjoy/.test(n) && !/szorp|sportital/.test(n), n: 'Jeges tea, limonádé', u: 'l', r: 1.5, k: 'jeges tea,ice tea,limonade,szensavmentes udito', kifli: [300113638], auchan: ['italok/asvanyviz-gyumolcsle-uditoital-szorp/limonade-es-ice-tea.c-5642', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/limonade-es-ice-tea/limonadek.c-6115', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/limonade-es-ice-tea/tea-alapu-uditok.c-6117', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/limonade-es-ice-tea/zold-tea-alapu-uditok.c-6114'] },
  { id: 9007, fk: n => /energiaital|energy drink/.test(n), n: 'Energiaital', u: 'l', r: 0.25, k: 'energiaital,energia ital', kifli: [300113620], auchan: ['italok/asvanyviz-gyumolcsle-uditoital-szorp/energia-italok.c-5638', 'italok/asvanyviz-gyumolcsle-uditoital-szorp/energia-italok/energia-italok.c-6089'] },
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
const unesc = t => t.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (m, c) => String.fromCharCode(+c)).replace(/&amp;/g, '&');
const tidy = t => { let n = String(t).replace(/\+\s*\d+\s*FT\s*BET[ÉE]TD[ÍI]J/i, '').replace(/\s+/g, ' ').trim(); if (n === n.toUpperCase() && n.length > 3) n = n.charAt(0) + n.slice(1).toLowerCase(); return n; };
const unitOf = t => (/\d\s*(k?g|dkg)\b|\/\s*kg/i.test(t) ? 'kg' : /\d\s*(m|c|d)?l\b|\/\s*l\b/i.test(t) ? 'l' : '');
function nuxt(html) {
  const m = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/); if (!m) return null;
  const arr = JSON.parse(m[1]);
  const res = (i, d = 0) => { if (typeof i !== 'number' || i < 0) return undefined; const v = arr[i]; if (d > 5 || v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) { if (typeof v[0] === 'string') return v.length > 1 ? res(v[1], d + 1) : undefined; return v.map(x => res(x, d + 1)); }
    const o = {}; for (const key in v) o[key] = res(v[key], d + 1); return o; };
  return { arr, res };
}
// Heti szórólap-ajánlatok a boltok saját honlapjáról (Lidl, Penny, Aldi). A Tesco elutasítja a robotot, a Spar tiltja: azokat nem olvassuk.
export async function fetchFlyers() {
  const items = [], log = [], page = async (host, url) => { try { return await get(host, url, false); } catch (e) { if (blocked[host]) throw e; return null; } };
  try {
    const home = await get('lidl', 'https://www.lidl.hu/', false);
    for (const pg of [...new Set(home.match(/\/c\/store\/(?:akcioink|lidl-plus)[^"']*\/a\d+/g) || [])].slice(0, 5)) {
      const h = await page('lidl', 'https://www.lidl.hu' + pg); if (!h) continue;
      for (const m of h.matchAll(/data-grid-data="([^"]{50,})"/g)) {
        let g; try { g = JSON.parse(unesc(m[1])); } catch { continue; }
        const pr = g.price || {}; if (!(pr.price > 0) || !g.fullTitle) continue;
        const pk = (pr.packaging && pr.packaging.text) || '', u = unitOf(pk); let k = u ? amount(pk, u) : 0; if (!k && /^\s*\/\s*(kg|l)\b/i.test(pk)) k = 1;
        const b = (((g.stockAvailability || {}).badgeInfo || {}).badges || [])[0];
        items.push({ s: 'lidl', n: tidy(g.fullTitle), k, u, p: Math.round(pr.price), w: pr.oldPrice > pr.price ? Math.round(pr.oldPrice) : 0, v: b && b.text ? String(b.text).replace(/^Ajánlat érvényes:\s*/, '') : '' });
      }
    }
  } catch (e) { log.push('Lidl: ' + e.message); }
  try {
    const home = await get('penny', 'https://www.penny.hu/', false);
    for (const pg of ['/ajanlatok', ...new Set(home.match(/\/category\/ajanlatok-[^"'?#]+/g) || [])].slice(0, 4)) {
      const h = await page('penny', 'https://www.penny.hu' + pg), d = h && nuxt(h); if (!d) continue;
      for (const v of d.arr) {
        if (!v || typeof v !== 'object' || Array.isArray(v) || !('price' in v) || !('name' in v) || !('amount' in v)) continue;
        const name = d.arr[v.name], pr = d.res(v.price) || {}, reg = pr.regular && pr.regular.value, loy = pr.loyalty && pr.loyalty.value, cur = loy > 0 && loy < reg ? loy : reg;
        if (typeof name !== 'string' || !(cur > 0)) continue;
        const lab = String(d.arr[v.volumeLabelKey] || '').toLowerCase(), a = parseFloat(d.arr[v.amount]) || 0;
        const f = { lt: [1, 'l'], l: [1, 'l'], ml: [.001, 'l'], cl: [.01, 'l'], kg: [1, 'kg'], gr: [.001, 'kg'], g: [.001, 'kg'], dkg: [.01, 'kg'] }[lab];
        const old = Math.max(pr.crossed > 0 ? pr.crossed : 0, loy > 0 && loy < reg ? reg : 0);
        items.push({ s: 'penny', n: tidy(name), k: f ? +(a * f[0]).toFixed(4) : 0, u: f ? f[1] : '', p: Math.round(cur / 100), w: old > cur ? Math.round(old / 100) : 0, v: pr.validityEnd ? String(pr.validityEnd).slice(5).replace('-', '.') + '.-ig' : '' });
      }
    }
  } catch (e) { log.push('Penny: ' + e.message); }
  try {
    const home = await get('aldi', 'https://www.aldi.hu/hu/ajanlatok.html', false);
    for (const date of [...new Set(home.match(/\/ajanlatok\/\d{4}-\d\d-\d\d/g) || [])].sort().slice(-4)) {
      const h = await page('aldi', 'https://www.aldi.hu' + date), d = h && nuxt(h); if (!d) continue;
      for (const v of d.arr) {
        if (!v || typeof v !== 'object' || Array.isArray(v) || !('sellingSize' in v) || !('name' in v) || !('price' in v)) continue;
        const name = d.arr[v.name], brand = d.arr[v.brandName], size = String(d.arr[v.sellingSize] || ''), pr = d.res(v.price) || {};
        if (typeof name !== 'string' || !(pr.amountRelevant > 0)) continue;
        const u = unitOf(size), p = Math.round(pr.amountRelevant / 100), w = +String(pr.wasPriceDisplay || '').replace(/,\d+/, '').replace(/[^\d]/g, '') || 0;
        items.push({ s: 'aldi', n: tidy((typeof brand === 'string' && brand && !name.toLowerCase().includes(brand.toLowerCase()) ? brand + ' ' : '') + name), k: u ? amount(size, u) : 0, u, p, w: w > p ? w : 0, v: date.slice(-5).replace('-', '.') + '.-től' });
      }
    }
  } catch (e) { log.push('Aldi: ' + e.message); }
  const seen = new Set();
  return { items: items.filter(x => { const key = x.s + '|' + x.n + '|' + x.p; if (seen.has(key)) return false; seen.add(key); return true; }), log };
}
// Visszaad: { cats: [...], rows: [...] } ugyanabban a formában, ahogy az update.mjs a GVH-adatot tárolja.
export async function fetchExtra({ ORDER, norm, slugify, today, flyers = [] }) {
  const cats = [], rows = [], log = [];
  for (const def of EXTRA) {
    let prods = [];
    for (const [nm, fn] of [['kifli', kifli], ['auchan', auchan]]) { try { prods = prods.concat(await fn(def)); } catch (e) { log.push(def.n + ': ' + e.message); } }
    for (const f of flyers) if (f.u === def.u && f.k > 0 && def.fk(norm(f.n), f.k)) prods.push({ ch: f.s, n: /\d\s*(ml|l|g|kg)\b/i.test(f.n) ? f.n : f.n + ' ' + String(f.k).replace('.', ',') + ' ' + f.u, k: f.k, p: f.p, w: f.w });
    const seen = new Set(); prods = prods.filter(x => { const key = x.ch + '|' + x.n + '|' + x.k; if (seen.has(key)) return false; seen.add(key); return true; });
    if (!prods.length) continue;
    const us = prods.map(x => x.p / x.k).sort((a, b) => a - b), med = us[Math.floor(us.length / 2)];
    const sane = prods.filter(x => x.p / x.k >= med * 0.2 && x.p / x.k <= med * 6);
    const o = {};
    for (const ch of [...new Set(sane.map(x => x.ch))]) {
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
