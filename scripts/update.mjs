// Bármiár – napi árfrissítés a GVH Árfigyelő nyilvános adataiból.
// Futtatás: node scripts/update.mjs   (Node 20+, külső csomag nélkül)
// Kimenet: data/prices.json, data/products.json, data/history.json, hol-olcsobb/**, akciok/**, llms.txt, robots.txt, sitemap.xml
import { writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { fetchExtra } from './extra.mjs';

const API = 'https://arfigyelo.gvh.hu/api';
const SITE = (process.env.SITE_URL || 'https://barmiar.hu/').replace(/\/?$/, '/');
const CHAINS = {
  '55b678e0-4e02-49d7-86da-ba6fba862a7e': 'aldi', 'e9cc63fd-52e0-4c1e-ba8d-d135d7285c63': 'auchan',
  'f95031d8-84a5-4edf-b4fa-18b2cbae2ea1': 'lidl', '53b66cb6-a24f-420d-9861-d38757467d07': 'penny',
  '3ccc9f35-604c-4ccf-8376-64822ce4bc70': 'spar', '792ea257-0af9-4588-ada7-81bd96c96400': 'tesco',
  '555f7e7c-8229-4f4f-ba60-450925a5b308': 'dm', '41e81400-3e3d-47b4-84f7-7dce01cc9b43': 'rossmann',
  'e313905a-b57e-4016-b4d2-1d1f45e53157': 'muller',
};
const CHAIN_NAMES = { kifli: 'Kifli.hu', aldi: 'Aldi', auchan: 'Auchan', lidl: 'Lidl', penny: 'Penny', spar: 'Spar', tesco: 'Tesco', dm: 'dm', rossmann: 'Rossmann', muller: 'Müller' };
// kategória-azonosító: [rövid név, keresőszavak ékezet nélkül]
const CAT = {
  1: ['Friss tej 2,8%', 'tej,friss tej,esl tej'], 2: ['Friss tej 1,5%', 'tej 1.5,zsirszegeny tej,felzsiros tej'],
  3: ['UHT tej 2,8%', 'uht,uht tej,tartos tej'], 4: ['UHT tej 1,5%', 'uht 1.5,uht tej 1.5'],
  5: ['Tejföl 20%', 'tejfol'], 6: ['Tejföl 12%', 'tejfol 12'], 7: ['Natúr joghurt', 'joghurt,natur joghurt'],
  8: ['Kefir', 'kefir'], 9: ['Tehéntúró', 'turo,tehenturo'], 84: ['Gyümölcsjoghurt', 'gyumolcsjoghurt,gyumolcs joghurt'],
  10: ['Trappista sajt (tömb)', 'sajt,trappista'], 105: ['Trappista sajt (darabolt)', 'darabolt trappista,darabolt sajt'],
  106: ['Trappista sajt (szeletelt)', 'szeletelt sajt,szeletelt trappista'], 107: ['Ementáli', 'ementali'], 108: ['Cheddar', 'cheddar'],
  109: ['Gouda', 'gouda'], 110: ['Edami', 'edami'], 111: ['Camembert', 'camembert,camambert'], 112: ['Brie', 'brie'], 113: ['Feta', 'feta'],
  114: ['Mozzarella', 'mozzarella'], 115: ['Ömlesztett sajt', 'omlesztett sajt,omlesztett,kenheto sajt'],
  11: ['Margarin', 'margarin'], 12: ['Vaj', 'vaj,teavaj'], 13: ['Vajkrém', 'vajkrem'], 63: ['Sütőmargarin', 'sutomargarin'],
  14: ['Tojás', 'tojas'], 81: ['Főzőtejszín', 'fozotejszin,tejszin'], 82: ['Habtejszín', 'habtejszin'], 116: ['Túródesszert', 'turodesszert,turo rudi,turorudi'],
  15: ['Sertéscomb', 'sertescomb'], 16: ['Sertéskaraj', 'karaj,serteskaraj,sertes'], 85: ['Darált sertéshús', 'daralt hus,daralt,daralthus,daralt sertes'],
  118: ['Sertésoldalas', 'oldalas'], 119: ['Sertéstarja', 'tarja'], 17: ['Egész csirke', 'egesz csirke,tyuk'],
  18: ['Csirkemellfilé', 'csirkemell,csirkemellfile,csirke'], 19: ['Csirkecomb', 'csirkecomb,csirke comb'], 20: ['Csirkeszárny', 'csirkeszarny'],
  21: ['Pulykamellfilé', 'pulykamell,pulyka'], 64: ['Marhalábszár', 'marhalabszar,marha,marhahus'], 86: ['Darált marhahús', 'daralt marha,daralt marhahus'],
  87: ['Fehérpecsenye', 'feherpecsenye'], 22: ['Sertészsír', 'zsir,serteszsir'], 23: ['Virsli', 'virsli'], 24: ['Párizsi', 'parizsi'],
  25: ['Téliszalámi', 'szalami,teliszalami'], 26: ['Pulykamell sonka', 'pulykasonka,pulykamell sonka'], 27: ['Sonka', 'sonka,felvagott'],
  88: ['Szárazkolbász', 'kolbasz,szarazkolbasz'], 89: ['Császárszalonna', 'csaszarszalonna,bacon'], 90: ['Kolozsvári szalonna', 'szalonna,kolozsvari'],
  91: ['Pontyszelet', 'ponty'], 92: ['Harcsafilé', 'harcsa'], 93: ['Tengeri halfilé', 'hal,halfile,tengeri hal'],
  28: ['Alma', 'alma'], 29: ['Körte', 'korte'], 30: ['Eper', 'eper,foldieper'], 31: ['Banán', 'banan'], 32: ['Citrom', 'citrom'], 33: ['Narancs', 'narancs'],
  34: ['Paradicsom', 'paradicsom'], 35: ['Zöldpaprika', 'paprika,zoldpaprika'], 36: ['Sárgarépa', 'repa,sargarepa'], 37: ['Petrezselyemgyökér', 'petrezselyem,feherrepa'],
  38: ['Uborka', 'uborka,kigyouborka'], 39: ['Fokhagyma', 'fokhagyma'], 40: ['Vöröshagyma', 'hagyma,voroshagyma'], 41: ['Burgonya', 'krumpli,burgonya'],
  42: ['Újburgonya', 'ujkrumpli,ujburgonya'], 43: ['Fejes káposzta', 'kaposzta'], 44: ['Kelkáposzta', 'kelkaposzta'], 45: ['Karfiol', 'karfiol'],
  97: ['Brokkoli', 'brokkoli'], 59: ['Fagyasztott zöldborsó', 'borso,zoldborso'], 60: ['Hasábburgonya', 'hasabburgonya,sult krumpli,sultkrumpli'],
  98: ['Fagyasztott brokkoli', 'fagyasztott brokkoli'], 46: ['Fehér kenyér', 'kenyer,feher kenyer'], 47: ['Félbarna kenyér', 'felbarna kenyer,felbarna,barna kenyer'],
  48: ['Teljes kiőrlésű kenyér', 'teljes kiorlesu kenyer,teljes kiorlesu'], 49: ['Rozsos kenyér', 'rozskenyer,rozsos kenyer'], 94: ['Zsemle', 'zsemle'],
  50: ['Száraztészta', 'teszta,szarazteszta,spagetti'], 58: ['Háztartási keksz', 'keksz'], 51: ['Napraforgó étolaj', 'olaj,etolaj,napraforgo'],
  52: ['Finomliszt', 'liszt,finomliszt'], 53: ['Rétesliszt', 'retesliszt'], 54: ['Kristálycukor', 'cukor,cukr,kristalycukor'], 55: ['Porcukor', 'porcukor'],
  120: ['Extra szűz olívaolaj', 'olivaolaj,oliva'], 121: ['Olívapogácsa-olaj', 'olivapogacsa'], 56: ['Csemegekukorica-konzerv', 'kukorica,kukoricakonzerv'],
  57: ['Csemegeuborka', 'csemegeuborka,savanyu uborka'], 61: ['Narancslé', 'narancsle,gyumolcsle'], 62: ['Almalé', 'almale'], 67: ['Ásványvíz', 'viz,asvanyviz,asvany viz'],
  95: ['Rizs', 'rizs'], 96: ['Lencse', 'lencse'], 100: ['Földimogyoró', 'mogyoro,foldimogyoro'], 101: ['Őrölt kávé', 'kave,orolt kave'], 102: ['Tea', 'tea'],
  122: ['Szemes kávé', 'szemes kave'], 103: ['Kakaópor', 'kakao,kakaopor'], 104: ['Kakaópor (20–22%)', 'holland kakao'],
  68: ['Növényi ital', 'novenyi ital,zabital,zabtej,novenyi tej,mandulatej'], 69: ['Laktózmentes tej', 'laktozmentes tej'],
  79: ['Gluténmentes kenyér', 'glutenmentes kenyer'], 80: ['Gluténmentes tészta', 'glutenmentes teszta'], 99: ['Gluténmentes liszt', 'glutenmentes liszt'],
  123: ['Bébiétel', 'bebietel'], 124: ['Tej- és gabonapép', 'tejpep,gabonapep'], 125: ['Tápszer', 'tapszer'], 142: ['Babasampon', 'babasampon'],
  144: ['Babafürdető', 'babafurdeto,babatusfurdo'], 150: ['Babatestápoló', 'babatestapolo'], 163: ['Hintőpor', 'hintopor'],
  161: ['Pelenka', 'pelenka,pelus,nadragpelenka'], 162: ['Bugyipelenka', 'bugyipelenka'],
  126: ['WC-papír', 'wc papir,wcpapir,wc-papir,wc,toalettpapir,vecepapir'], 127: ['Papírtörlő', 'papirtorlo,keztorlo,konyhai torlo'],
  128: ['Papír zsebkendő', 'zsebkendo,papirzsebkendo'], 129: ['Alufólia', 'alufolia,folia'], 130: ['Mosópor', 'mosopor'],
  131: ['Folyékony mosószer', 'mososzer,mosogel,folyekony mososzer'], 132: ['Mosókapszula', 'mosokapszula,kapszula'], 133: ['Öblítő', 'oblito'],
  134: ['Mosogatószer', 'mosogatoszer,mosogato'], 135: ['Mosogatógép-tabletta', 'mosogatogep tabletta,tabletta,gepi mosogato'],
  136: ['Súrolószer', 'suroloszer,surolo'], 137: ['Általános tisztítószer', 'tisztitoszer,altalanos tisztito'],
  138: ['Folyékony szappan', 'folyekony szappan'], 139: ['Szappan', 'szappan'], 140: ['Kézfertőtlenítő', 'kezfertotlenito'], 141: ['Sampon', 'sampon'],
  143: ['Tusfürdő', 'tusfurdo'], 145: ['Fogkrém', 'fogkrem'], 146: ['Gyerekfogkrém', 'gyerek fogkrem,gyermek fogkrem'], 147: ['Fogkefe', 'fogkefe'],
  148: ['Gyerekfogkefe', 'gyerek fogkefe,gyermek fogkefe'], 149: ['Testápoló', 'testapolo'], 151: ['Golyós dezodor', 'golyos dezodor,golyos deo'],
  152: ['Izzadásgátló stift', 'stift'], 153: ['Dezodor', 'dezodor,deo'], 154: ['Eldobható borotva', 'borotva'], 155: ['Borotvabetét', 'borotvafej,borotvabetet'],
  156: ['Borotvahab', 'borotvahab'], 157: ['Borotvazselé', 'borotvazsele'], 158: ['Egészségügyi betét', 'betet,egeszsegugyi betet'],
  159: ['Tisztasági betét', 'tisztasagi betet'], 160: ['Tampon', 'tampon'],
};
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9.\s-]/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = s => norm(s).replace(/[.\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ft = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(path) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(API + path, { headers: { 'User-Agent': 'barmiar.hu arfrissito (napi 1 futas)', Accept: 'application/json' } });
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
    } catch (e) { /* újrapróbáljuk */ }
    await sleep(1500 * (i + 1));
  }
  throw new Error('Nem érhető el: ' + path);
}
const typ = (c, t) => c.prices.find(p => p.type === t);

const tree = (await get('/categories')).categories;
const leaves = [];
(function walk(nodes, group) { for (const n of nodes) { if (n.categoryNodes.length) walk(n.categoryNodes, group || n.name); else leaves.push({ id: n.id, name: n.name, group }); } })(tree, null);

const cats = []; const slugs = new Set(); let productCount = 0;
// az összes termék a termékkeresőhöz és a „Kívánság szerint” listához: [név, kategória, kiszerelés, árak láncsorrendben(, eltérő egység)]
const ORDER = ['lidl', 'aldi', 'penny', 'tesco', 'auchan', 'spar', 'dm', 'rossmann', 'muller', 'kifli'];
const allProducts = [];
for (const leaf of leaves) {
  let products = [], off = 0, total = Infinity;
  while (off < total && off < 1000) {
    const d = await get(`/products-by-category/${leaf.id}?limit=100&offset=${off}`);
    if (!d || !d.products.length) break;
    total = d.count ?? d.products.length; products = products.concat(d.products); off += d.products.length;
    await sleep(120);
  }
  if (!products.length) continue;
  productCount += products.length;
  const unitCount = {}; for (const p of products) unitCount[p.unit] = (unitCount[p.unit] || 0) + 1;
  const unit = Object.entries(unitCount).sort((a, b) => b[1] - a[1])[0][0];
  const same = products.filter(p => p.unit === unit && parseFloat(p.packaging) > 0);
  const packCount = {}; for (const p of same) { const k = parseFloat(p.packaging); packCount[k] = (packCount[k] || 0) + 1; }
  const ref = +Object.entries(packCount).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  const offers = {};
  for (const p of same) {
    const pack = parseFloat(p.packaging), typical = pack >= ref * 0.4 && pack <= ref * 2.5;
    for (const c of p.pricesOfChainStores) {
      const chain = CHAINS[c.id]; if (!chain) continue;
      const normal = typ(c, 'NORMAL'), disc = typ(c, 'DISCOUNTED'), loy = typ(c, 'LOYALTY'), every = disc || normal;
      if (!every || !(every.unitAmount > 0)) continue;
      const o = offers[chain] || (offers[chain] = { all: [], typ: [] });
      const e = { n: p.name.replace(/\s+/g, ' ').trim(), k: pack, p: Math.round(every.amount), u: +every.unitAmount.toFixed(2) };
      if (disc && normal && normal.amount > disc.amount) e.w = Math.round(normal.amount);
      const l = loy && loy.unitAmount > 0 && loy.unitAmount < every.unitAmount ? { n: e.n, k: pack, p: Math.round(loy.amount), u: +loy.unitAmount.toFixed(2) } : null;
      (typical ? o.typ : o.all).push({ e, l });
    }
  }
  // a láncok néha eltérő egységben töltik fel ugyanazt (tekercs vs. lap): a kiugró egységárakat kiszűrjük
  const us = Object.values(offers).flatMap(v => v.typ.map(x => x.e.u)).sort((a, b) => a - b);
  const med = us.length ? us[Math.floor(us.length / 2)] : 0;
  const sane = x => !med || (x.e.u >= med * 0.3 && x.e.u <= med * 4);
  const o = {};
  for (const [chain, v] of Object.entries(offers)) {
    let pool = v.typ.filter(sane);
    if (!pool.length) pool = v.all.filter(x => sane(x) && x.e.k >= ref * 0.1 && x.e.k <= ref * 10);
    if (!pool.length) continue;
    const best = pool.reduce((a, b) => (b.e.u < a.e.u ? b : a)).e;
    const bl = pool.filter(x => x.l && (!med || x.l.u >= med * 0.25)).map(x => x.l).reduce((a, b) => (!a || b.u < a.u ? b : a), null);
    o[chain] = bl && bl.u < best.u ? { ...best, l: bl } : best;
  }
  if (!Object.keys(o).length) continue;
  const meta = CAT[leaf.id] || [leaf.name, norm(leaf.name)];
  let slug = slugify(meta[0]); while (slugs.has(slug)) slug += '-' + leaf.id; slugs.add(slug);
  // a terméknevek gyakori szavai: ebből talál az oldal kapcsolódó termékkört ahhoz, amire nincs pontos ár
  const wc = {};
  for (const p of products) for (const w of new Set(norm(p.name).split(' '))) if (w.length >= 4 && !/\d/.test(w)) wc[w] = (wc[w] || 0) + 1;
  const words = Object.entries(wc).filter(([, n]) => n >= 2 || products.length < 12).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([w]) => w);
  cats.push({ id: leaf.id, n: meta[0], f: leaf.name, g: leaf.group, s: slug, u: unit, r: ref, k: meta[1].split(','), c: products.length, w: words, o });
  for (const p of products) {
    const pr = new Array(ORDER.length).fill(0), was = new Array(ORDER.length).fill(0); let any = false, anyW = false;
    for (const c of p.pricesOfChainStores) {
      const chain = CHAINS[c.id]; if (!chain) continue;
      const disc = typ(c, 'DISCOUNTED'), normal = typ(c, 'NORMAL'), every = disc || normal; if (!every || !(every.amount > 0)) continue;
      const j = ORDER.indexOf(chain); pr[j] = Math.round(every.amount); any = true;
      // akció: csak hihető mértékű (5–80%) kedvezményt jegyzünk fel
      if (disc && normal && normal.amount > disc.amount * 1.05 && disc.amount > normal.amount * 0.2) { was[j] = Math.round(normal.amount); anyW = true; }
    }
    if (!any) continue;
    const row = [p.name.replace(/\s+/g, ' ').trim(), leaf.id, parseFloat(p.packaging) || 0, pr, p.unit !== unit ? p.unit : 0];
    if (anyW) row.push(was);
    allProducts.push(row);
  }
}
if (cats.length < 100) throw new Error('Túl kevés kategória érkezett (' + cats.length + '), nem írom felül az adatokat.');
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' });
await mkdir('data', { recursive: true });
// ---- kiegészítő forrás (sör, csokoládé, üdítő): naponta egyszer kérdezzük, a nap többi futása a reggeli adatot viszi tovább ----
let oldCats = [], oldRows = [];
try { oldCats = JSON.parse(await readFile('data/prices.json', 'utf8')).cats.filter(c => c.x); oldRows = JSON.parse(await readFile('data/products.json', 'utf8')).p.filter(r => r[1] >= 9000); } catch { /* első futás */ }
let extra = { cats: [], rows: [], log: [] };
if (!process.env.FORCE_EXTRA && oldCats.length && oldCats.every(c => c.x === today)) extra = { cats: oldCats, rows: oldRows, log: ['ma már lekérdezve, a reggeli adat marad'] };
else {
  try { extra = await fetchExtra({ ORDER, norm, slugify, today }); } catch (e) { extra.log.push('hiba: ' + e.message); }
  // ami ma nem jött meg, azt legfeljebb 3 napig a legutóbbi ismert árral mutatjuk
  const limit = new Date(Date.now() - 3 * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' });
  for (const c of oldCats) if (!extra.cats.some(x => x.id === c.id) && c.x >= limit) { extra.cats.push(c); extra.rows.push(...oldRows.filter(r => r[1] === c.id)); }
}
for (const c of extra.cats) { while (slugs.has(c.s)) c.s += '-' + c.id; slugs.add(c.s); cats.push(c); }
allProducts.push(...extra.rows);
console.log(`Kiegészítő forrás: ${extra.cats.length} kategória, ${extra.rows.length} termék. ${extra.log.join(' | ')}`);
await writeFile('data/prices.json', JSON.stringify({ updated: today, source: 'GVH Árfigyelő (arfigyelo.gvh.hu); sör, üdítő, csokoládé: Kifli.hu és Auchan webáruház', products: productCount + extra.rows.length, chains: CHAIN_NAMES, cats }));
if (allProducts.length > 5000) await writeFile('data/products.json', JSON.stringify({ updated: today, chains: ORDER, p: allProducts }));

// napi legjobb egységár kategóriánként – ebből épül az ártrend
let hist = { days: [], min: {} };
try { hist = JSON.parse(await readFile('data/history.json', 'utf8')); } catch { /* első futás */ }
if (hist.days[hist.days.length - 1] !== today) {
  hist.days.push(today);
  for (const c of cats) { const a = hist.min[c.id] || (hist.min[c.id] = new Array(hist.days.length - 1).fill(null)); a.push(Math.min(...Object.values(c.o).map(e => e.u))); }
  for (const id of Object.keys(hist.min)) while (hist.min[id].length < hist.days.length) hist.min[id].push(null);
  if (hist.days.length > 400) { hist.days.shift(); for (const id of Object.keys(hist.min)) hist.min[id].shift(); }
  await writeFile('data/history.json', JSON.stringify(hist));
}

// ---- keresőbarát aloldalak: hol-olcsobb/<termék>/ ----
const unitLabel = u => ({ kg: 'kg', l: 'l', db: 'db', m: 'm', g: 'g' }[u] || u);
const amount = (k, u) => String(k).replace('.', ',') + ' ' + unitLabel(u);
const head = (title, desc, path, depth, extra = '') => `<!DOCTYPE html>
<html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:url" content="${SITE}${path}"><meta property="og:locale" content="hu_HU">
<link rel="icon" href="${'../'.repeat(depth)}icon.svg" type="image/svg+xml"><link rel="stylesheet" href="${'../'.repeat(depth)}pages.css">${extra}</head><body>
<header class="top"><a class="logo" href="${'../'.repeat(depth)}">bármiár<i></i></a><a class="btn" href="${'../'.repeat(depth)}">Kosárbontó megnyitása</a></header><main>`;
const foot = depth => `</main><footer><p>Árak forrása: GVH Árfigyelő (arfigyelo.gvh.hu); sör, üdítő, csokoládé: Kifli.hu és Auchan webáruház. Frissítve: ${today}. Az árak tájékoztató jellegűek, boltonként eltérhetnek.</p>
<p><a href="${'../'.repeat(depth)}akciok/">Mai akciók</a> · <a href="${'../'.repeat(depth)}hol-olcsobb/">Összes termék</a> · <a href="${'../'.repeat(depth)}adatkezeles.html">Adatkezelés</a> · A Bármiár független szolgáltatás, nem áll kapcsolatban az áruházláncokkal.</p></footer></body></html>`;
await rm('hol-olcsobb', { recursive: true, force: true });
const urls = ['', 'hol-olcsobb/'];
for (const c of cats) {
  const rows = Object.entries(c.o).map(([ch, e]) => ({ ch, e })).sort((a, b) => a.e.u - b.e.u);
  const best = rows[0], worst = rows[rows.length - 1];
  const title = `${c.n} ára boltonként – hol a legolcsóbb ma? | Bármiár`;
  const desc = `${c.n}: ma a legjobb egységár ${ft(best.e.u)}/${unitLabel(c.u)} (${CHAIN_NAMES[best.ch]}). ${rows.length} áruházlánc ára egy helyen, naponta frissítve.`;
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Bármiár', item: SITE }, { '@type': 'ListItem', position: 2, name: 'Hol olcsóbb?', item: SITE + 'hol-olcsobb/' },
    { '@type': 'ListItem', position: 3, name: c.n, item: `${SITE}hol-olcsobb/${c.s}/` }] };
  const related = cats.filter(x => x.g === c.g && x.id !== c.id).slice(0, 12);
  const ld2 = { '@context': 'https://schema.org', '@type': 'Product', name: c.n, category: c.g, description: desc,
    offers: { '@type': 'AggregateOffer', priceCurrency: 'HUF', lowPrice: Math.min(...rows.map(r => r.e.p)), highPrice: Math.max(...rows.map(r => r.e.p)), offerCount: rows.length } };
  const html = head(title, desc, `hol-olcsobb/${c.s}/`, 2, `<script type="application/ld+json">${JSON.stringify(ld)}</script><script type="application/ld+json">${JSON.stringify(ld2)}</script>`) + `
<nav class="crumb"><a href="../../">Bármiár</a> › <a href="../">Hol olcsóbb?</a> › ${esc(c.g)}</nav>
<h1>${esc(c.n)}: hol a legolcsóbb ma?</h1>
<p class="lead">Ma a legjobb egységárat a <b>${CHAIN_NAMES[best.ch]}</b> adja: <b>${ft(best.e.u)}/${unitLabel(c.u)}</b>.${rows.length > 1 ? ` A legdrágább láncnál (${CHAIN_NAMES[worst.ch]}) ugyanez ${ft(worst.e.u)}/${unitLabel(c.u)}, a különbség ${Math.round((1 - best.e.u / worst.e.u) * 100)}%.` : ''}</p>
<div class="scroll"><table><thead><tr><th>Bolt</th><th>Legolcsóbb termék</th><th class="r">Ár</th><th class="r">Egységár</th></tr></thead><tbody>
${rows.map((r, i) => `<tr${i ? '' : ' class="win"'}><td><b>${CHAIN_NAMES[r.ch]}</b></td><td>${esc(r.e.n)} <span class="m">${amount(r.e.k, c.u)}</span>${r.e.w ? ` <span class="akc">akció</span>` : ''}${r.e.l ? `<div class="m">kártyával: ${ft(r.e.l.u)}/${unitLabel(c.u)}</div>` : ''}</td><td class="r">${ft(r.e.p)}${r.e.w ? ` <s>${ft(r.e.w)}</s>` : ''}</td><td class="r">${ft(r.e.u)}/${unitLabel(c.u)}</td></tr>`).join('\n')}
</tbody></table></div>
<p class="cta"><a class="btn" href="../../?l=${c.id}">Cetlire teszem, és kiszámolom a teljes bevásárlást</a></p>
<h2>Miért érdemes a teljes listát nézni?</h2>
<p>Egy termék ritkán dönti el, hova érdemes menni. A Bármiár a teljes bevásárlólistádat nézi egyszerre: megmondja, melyik boltból mit vegyél vagy rendelj, és forintra kiszámolja, mennyit spórolsz vele. ${c.x ? `Ennek a termékkörnek az árai a Kifli.hu és az Auchan saját webáruházából származnak (frissítve: ${c.x}); az Auchannál a kategória kiemelt termékeit nézzük.` : `A hivatalos adatbázis kategóriánként a láncok legolcsóbb, jellemző kiszerelésű termékét mutatja (${c.f}).`}</p>
${related.length ? `<h2>Hasonló termékek</h2><p class="links">${related.map(x => `<a href="../${x.s}/">${esc(x.n)}</a>`).join(' ')}</p>` : ''}` + foot(2);
  await mkdir(`hol-olcsobb/${c.s}`, { recursive: true });
  await writeFile(`hol-olcsobb/${c.s}/index.html`, html);
  urls.push(`hol-olcsobb/${c.s}/`);
}
const groups = [...new Set(cats.map(c => c.g))];
await writeFile('hol-olcsobb/index.html', head('Hol olcsóbb? Élelmiszer- és drogériaárak boltonként | Bármiár', `${cats.length} termékkategória napi ára 9 áruházláncnál: Aldi, Auchan, Lidl, Penny, Spar, Tesco, dm, Rossmann, Müller; sör, üdítő, csokoládé a Kifli.hu-ról is.`, 'hol-olcsobb/', 1) + `
<h1>Hol olcsóbb? Napi árak boltonként</h1><p class="lead">${cats.length} termékkategória, ${productCount.toLocaleString('hu-HU')} termék ára 9 áruházláncnál. Frissítve: ${today}.</p>
${groups.map(g => `<h2>${esc(g)}</h2><p class="links">${cats.filter(c => c.g === g).map(c => `<a href="${c.s}/">${esc(c.n)}</a>`).join(' ')}</p>`).join('\n')}` + foot(1));

// ---- mai akciók: keresőknek és MI-asszisztenseknek is olvasható, naponta frissülő oldalak ----
const catName = {}; for (const c of cats) catName[c.id] = c;
const deals = [];
for (const r of allProducts) { if (!r[5]) continue; const c = catName[r[1]]; if (!c) continue;
  r[5].forEach((w, j) => { if (w && r[3][j]) deals.push({ n: r[0], c, k: r[2], u: r[4] || c.u, ch: ORDER[j], p: r[3][j], w, pct: Math.round((1 - r[3][j] / w) * 100) }); }); }
deals.sort((a, b) => b.pct - a.pct || a.p - b.p);
const dealRow = d => `<tr><td><b>${esc(d.n)}</b><div class="m">${d.k > 0 ? amount(d.k, d.u) + ' · ' : ''}${esc(d.c.n)}</div></td><td>${CHAIN_NAMES[d.ch]}</td><td class="r"><span class="pct">−${d.pct}%</span></td><td class="r"><b>${ft(d.p)}</b> <s>${ft(d.w)}</s></td><td class="r">${d.k > 0 ? ft(d.p / d.k) + '/' + unitLabel(d.u) : ''}</td></tr>`;
const dealTable = list => `<div class="scroll"><table><thead><tr><th>Termék</th><th>Bolt</th><th class="r">Kedvezmény</th><th class="r">Ár</th><th class="r">Egységár</th></tr></thead><tbody>\n${list.map(dealRow).join('\n')}\n</tbody></table></div>`;
const dealLd = (list, name, path) => ({ '@context': 'https://schema.org', '@type': 'ItemList', name, url: SITE + path, numberOfItems: list.length,
  itemListElement: list.slice(0, 25).map((d, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: d.n, category: d.c.n,
    offers: { '@type': 'Offer', price: d.p, priceCurrency: 'HUF', availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: CHAIN_NAMES[d.ch] } } } })) });
const byChain = {}; for (const d of deals) (byChain[d.ch] || (byChain[d.ch] = [])).push(d);
const chainLinks = depth => `<p class="links">${ORDER.filter(ch => byChain[ch]).map(ch => `<a href="${'../'.repeat(depth)}akciok/${ch}/">${CHAIN_NAMES[ch]} akciók (${byChain[ch].length})</a>`).join(' ')}</p>`;
const faq = [
  ['Honnan tudjátok, mi akciós ma?', 'Az áruházláncok naponta jelentik áraikat a Gazdasági Versenyhivatal Árfigyelő adatbázisába, az akciós árat külön megjelölve. A Bármiár ebből számolja a kedvezmény mértékét, naponta kétszer frissítve.'],
  ['Melyik boltok akciói szerepelnek?', 'Aldi, Auchan, Lidl, Penny, Spar, Tesco, dm, Rossmann és Müller.'],
  ['Mennyibe kerül a Bármiár?', 'A cetli, az akciók és a termékkereső ingyenes. A teljes lista bolti szétosztása az első alkalommal regisztráció nélkül, utána ingyenes regisztrációval korlátlanul használható.'],
  ['Hogyan lesz az akciókból bevásárlóterv?', 'Tedd a termékeket a cetlire, és a Bármiár kiszámolja, melyik boltból mit érdemes venni vagy rendelni, a kiszállítási díjjal és a minimális rendelési értékkel együtt.'],
];
const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
const faqHtml = `<h2>Gyakori kérdések</h2>${faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('\n')}`;
await rm('akciok', { recursive: true, force: true });
if (deals.length) {
  const top = deals[0], n = deals.length;
  const title = `Mai akciók: a ${Math.min(100, n)} legnagyobb kedvezmény 9 áruházláncban | Bármiár`;
  const desc = `Ma ${n} akciós terméket jelentettek a láncok. A legnagyobb kedvezmény: ${top.n} −${top.pct}% (${CHAIN_NAMES[top.ch]}, ${ft(top.p)}). Aldi, Auchan, Lidl, Penny, Spar, Tesco, dm, Rossmann, Müller akciói egy helyen.`;
  await mkdir('akciok', { recursive: true });
  await writeFile('akciok/index.html', head(title, desc, 'akciok/', 1, `<meta property="og:image" content="${SITE}img/og.jpg"><script type="application/ld+json">${JSON.stringify(dealLd(deals.slice(0, 100), 'Mai legnagyobb akciók', 'akciok/'))}</script><script type="application/ld+json">${JSON.stringify(faqLd)}</script>`) + `
<nav class="crumb"><a href="../">Bármiár</a> › Mai akciók</nav>
<img class="ban" src="../img/akciok.webp" width="1280" height="384" alt="Áruházi polcsor akciós termékekkel">
<h1>Mai legnagyobb akciók</h1>
<p class="lead">Ma (${today}) <b>${n} akciós terméket</b> jelentettek az áruházláncok. A legnagyobb kedvezmény: <b>${esc(top.n)}</b>, <b>−${top.pct}%</b> a ${CHAIN_NAMES[top.ch]} kínálatában, ${ft(top.w)} helyett ${ft(top.p)}.</p>
<p class="cta"><a class="btn" href="../#akciok">Szűrés boltra, kategóriára, és cetlire tétel</a></p>
<h2>Akciók boltonként</h2>${chainLinks(1)}
<h2>A ${Math.min(100, n)} legnagyobb kedvezmény ma</h2>
${dealTable(deals.slice(0, 100))}
${faqHtml}` + foot(1));
  urls.push('akciok/');
  for (const ch of ORDER) { const list = byChain[ch]; if (!list) continue; const t = list[0], nm = CHAIN_NAMES[ch];
    const ti = `${nm} akciók ma: ${list.length} kedvezményes termék, akár −${t.pct}% | Bármiár`;
    const de = `${nm} mai akciói: ${list.length} termék kedvezménnyel. A legnagyobb: ${t.n} −${t.pct}% (${ft(t.p)}). Naponta frissülő lista a hivatalos áradatbázisból.`;
    await mkdir(`akciok/${ch}`, { recursive: true });
    await writeFile(`akciok/${ch}/index.html`, head(ti, de, `akciok/${ch}/`, 2, `<meta property="og:image" content="${SITE}img/og.jpg"><script type="application/ld+json">${JSON.stringify(dealLd(list.slice(0, 80), nm + ' mai akciói', `akciok/${ch}/`))}</script>`) + `
<nav class="crumb"><a href="../../">Bármiár</a> › <a href="../">Mai akciók</a> › ${nm}</nav>
<h1>${nm} akciók ma</h1>
<p class="lead">A ${nm} ma (${today}) <b>${list.length} terméket</b> jelentett akciós áron. A legnagyobb kedvezmény: <b>${esc(t.n)}</b>, <b>−${t.pct}%</b>, ${ft(t.w)} helyett ${ft(t.p)}.</p>
<p class="cta"><a class="btn" href="../../#akciok">Összes akció szűrhetően, cetlire tétellel</a></p>
${dealTable(list.slice(0, 80))}
<h2>Más boltok akciói</h2>${chainLinks(2)}` + foot(2));
    urls.push(`akciok/${ch}/`);
  }
}
// llms.txt: rövid, tényszerű leírás MI-asszisztenseknek (naponta a friss számokkal)
await writeFile('llms.txt', `# Bármiár (barmiar.hu)

> Magyar bevásárlólista-optimalizáló és élelmiszerár-összehasonlító. A felhasználó felírja, mit venne, a Bármiár megmondja, melyik boltból mit érdemes venni vagy rendelni, és forintra kiszámolja a megtakarítást. Üzemelteti: Országos Rendezvényiroda Zrt.

## Tények (frissítve: ${today})
- ${productCount} termék napi ára, ${cats.length} termékkategóriában, 9 áruházláncnál: Aldi, Auchan, Lidl, Penny, Spar, Tesco, dm, Rossmann, Müller.
- Adatforrás: a Gazdasági Versenyhivatal Árfigyelő adatbázisa (arfigyelo.gvh.hu), amelybe a láncok naponta jelentik áraikat. A sör, az üdítő és a csokoládé ára a Kifli.hu és az Auchan nyilvános webáruházából származik, naponta egyszer frissítve.
- Ma ${deals.length} akciós ár szerepel az adatbázisban.${deals.slice(0, 5).map(d => `\n- Mai kiemelt akció: ${d.n}, ${CHAIN_NAMES[d.ch]}, ${ft(d.p)} (−${d.pct}%, eredetileg ${ft(d.w)}).`).join('')}

## Mit tud
- Bevásárlócetli: szabad szöveges vagy diktált lista, pipálható, telefonra tehető, megosztható.
- Két lista: „Legjobb áron” (kategóriánként a legolcsóbb megfelelő termék) és „Kívánság szerint” (pontosan a felírt márka vagy termék).
- Kosárbontás több bolt között személyes vásárlásra, online rendelésre vagy vegyesen; számol a kiszállítási díjjal, a minimális rendelési értékkel és a plusz megálló költségével.
- Termékkereső az összes termék áraival, és napi akciólista boltonként.
- Ár: a cetli, az akciók és a kereső ingyenes; a kosárbontás az első alkalommal regisztráció nélkül, utána ingyenes regisztrációval korlátlan.

## Oldalak
- [Kezdőlap, cetli és kosárbontó](${SITE})
- [Mai akciók](${SITE}akciok/): a nap legnagyobb kedvezményei, boltonként is
- [Hol olcsóbb?](${SITE}hol-olcsobb/): ${cats.length} termékkategória ára boltonként
- [Oldaltérkép](${SITE}sitemap.xml)

## Hivatkozás
Forrásként így érdemes megjelölni: „Bármiár (barmiar.hu), a GVH Árfigyelő adatai alapján, ${today}”. Az árak tájékoztató jellegűek, boltonként eltérhetnek.
`);
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
await writeFile('robots.txt', `User-agent: *\nAllow: /\n\n# MI-asszisztensek és keresőik is olvashatják\n${['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'bingbot'].map(b => `User-agent: ${b}\nAllow: /\n`).join('\n')}\nSitemap: ${SITE}sitemap.xml\n`);
// a főoldal kanonikus címe kövesse a SITE_URL-t (domainváltáskor elég azt átírni)
try {
  const idx = await readFile('index.html', 'utf8');
  const next = idx.replace(/(<link rel="canonical" href=")[^"]*/, '$1' + SITE).replace(/(<meta property="og:url" content=")[^"]*/, '$1' + SITE);
  if (next !== idx) await writeFile('index.html', next);
} catch { /* nincs index.html */ }
console.log(`Kész: ${cats.length} kategória, ${productCount} termék (${allProducts.length} a keresőben), ${urls.length} oldal, dátum: ${today}`);
