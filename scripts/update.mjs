// Bármiár – napi árfrissítés a GVH Árfigyelő nyilvános adataiból.
// Futtatás: node scripts/update.mjs   (Node 20+, külső csomag nélkül)
// Kimenet: data/prices.json, data/history.json, hol-olcsobb/**, sitemap.xml
import { writeFile, readFile, mkdir, rm } from 'node:fs/promises';

const API = 'https://arfigyelo.gvh.hu/api';
const SITE = (process.env.SITE_URL || 'https://barmiar.hu/').replace(/\/?$/, '/');
const CHAINS = {
  '55b678e0-4e02-49d7-86da-ba6fba862a7e': 'aldi', 'e9cc63fd-52e0-4c1e-ba8d-d135d7285c63': 'auchan',
  'f95031d8-84a5-4edf-b4fa-18b2cbae2ea1': 'lidl', '53b66cb6-a24f-420d-9861-d38757467d07': 'penny',
  '3ccc9f35-604c-4ccf-8376-64822ce4bc70': 'spar', '792ea257-0af9-4588-ada7-81bd96c96400': 'tesco',
  '555f7e7c-8229-4f4f-ba60-450925a5b308': 'dm', '41e81400-3e3d-47b4-84f7-7dce01cc9b43': 'rossmann',
  'e313905a-b57e-4016-b4d2-1d1f45e53157': 'muller',
};
const CHAIN_NAMES = { aldi: 'Aldi', auchan: 'Auchan', lidl: 'Lidl', penny: 'Penny', spar: 'Spar', tesco: 'Tesco', dm: 'dm', rossmann: 'Rossmann', muller: 'Müller' };
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
}
if (cats.length < 100) throw new Error('Túl kevés kategória érkezett (' + cats.length + '), nem írom felül az adatokat.');
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' });
await mkdir('data', { recursive: true });
await writeFile('data/prices.json', JSON.stringify({ updated: today, source: 'GVH Árfigyelő (arfigyelo.gvh.hu)', products: productCount, chains: CHAIN_NAMES, cats }));

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
const foot = depth => `</main><footer><p>Árak forrása: GVH Árfigyelő (arfigyelo.gvh.hu), frissítve: ${today}. Az árak tájékoztató jellegűek, boltonként eltérhetnek.</p>
<p><a href="${'../'.repeat(depth)}hol-olcsobb/">Összes termék</a> · <a href="${'../'.repeat(depth)}adatkezeles.html">Adatkezelés</a> · A Bármiár független szolgáltatás, nem áll kapcsolatban az áruházláncokkal.</p></footer></body></html>`;
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
  const html = head(title, desc, `hol-olcsobb/${c.s}/`, 2, `<script type="application/ld+json">${JSON.stringify(ld)}</script>`) + `
<nav class="crumb"><a href="../../">Bármiár</a> › <a href="../">Hol olcsóbb?</a> › ${esc(c.g)}</nav>
<h1>${esc(c.n)}: hol a legolcsóbb ma?</h1>
<p class="lead">Ma a legjobb egységárat a <b>${CHAIN_NAMES[best.ch]}</b> adja: <b>${ft(best.e.u)}/${unitLabel(c.u)}</b>.${rows.length > 1 ? ` A legdrágább láncnál (${CHAIN_NAMES[worst.ch]}) ugyanez ${ft(worst.e.u)}/${unitLabel(c.u)}, a különbség ${Math.round((1 - best.e.u / worst.e.u) * 100)}%.` : ''}</p>
<div class="scroll"><table><thead><tr><th>Bolt</th><th>Legolcsóbb termék</th><th class="r">Ár</th><th class="r">Egységár</th></tr></thead><tbody>
${rows.map((r, i) => `<tr${i ? '' : ' class="win"'}><td><b>${CHAIN_NAMES[r.ch]}</b></td><td>${esc(r.e.n)} <span class="m">${amount(r.e.k, c.u)}</span>${r.e.w ? ` <span class="akc">akció</span>` : ''}${r.e.l ? `<div class="m">kártyával: ${ft(r.e.l.u)}/${unitLabel(c.u)}</div>` : ''}</td><td class="r">${ft(r.e.p)}${r.e.w ? ` <s>${ft(r.e.w)}</s>` : ''}</td><td class="r">${ft(r.e.u)}/${unitLabel(c.u)}</td></tr>`).join('\n')}
</tbody></table></div>
<p class="cta"><a class="btn" href="../../?l=${c.id}">Cetlire teszem, és kiszámolom a teljes bevásárlást</a></p>
<h2>Miért érdemes a teljes listát nézni?</h2>
<p>Egy termék ritkán dönti el, hova érdemes menni. A Bármiár a teljes bevásárlólistádat nézi egyszerre: megmondja, melyik boltból mit vegyél vagy rendelj, és forintra kiszámolja, mennyit spórolsz vele. A hivatalos adatbázis kategóriánként a láncok legolcsóbb, jellemző kiszerelésű termékét mutatja (${c.f}).</p>
${related.length ? `<h2>Hasonló termékek</h2><p class="links">${related.map(x => `<a href="../${x.s}/">${esc(x.n)}</a>`).join(' ')}</p>` : ''}` + foot(2);
  await mkdir(`hol-olcsobb/${c.s}`, { recursive: true });
  await writeFile(`hol-olcsobb/${c.s}/index.html`, html);
  urls.push(`hol-olcsobb/${c.s}/`);
}
const groups = [...new Set(cats.map(c => c.g))];
await writeFile('hol-olcsobb/index.html', head('Hol olcsóbb? Élelmiszer- és drogériaárak boltonként | Bármiár', `${cats.length} termékkategória napi ára 9 áruházláncnál: Aldi, Auchan, Lidl, Penny, Spar, Tesco, dm, Rossmann, Müller.`, 'hol-olcsobb/', 1) + `
<h1>Hol olcsóbb? Napi árak boltonként</h1><p class="lead">${cats.length} termékkategória, ${productCount.toLocaleString('hu-HU')} termék ára 9 áruházláncnál. Frissítve: ${today}.</p>
${groups.map(g => `<h2>${esc(g)}</h2><p class="links">${cats.filter(c => c.g === g).map(c => `<a href="${c.s}/">${esc(c.n)}</a>`).join(' ')}</p>`).join('\n')}` + foot(1));
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
await writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
// a főoldal kanonikus címe kövesse a SITE_URL-t (domainváltáskor elég azt átírni)
try {
  const idx = await readFile('index.html', 'utf8');
  const next = idx.replace(/(<link rel="canonical" href=")[^"]*/, '$1' + SITE).replace(/(<meta property="og:url" content=")[^"]*/, '$1' + SITE);
  if (next !== idx) await writeFile('index.html', next);
} catch { /* nincs index.html */ }
console.log(`Kész: ${cats.length} kategória, ${productCount} termék, ${urls.length} oldal, dátum: ${today}`);
