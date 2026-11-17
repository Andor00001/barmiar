// Generate web-ready brand PNGs and social OG JPEG from the checked-in SVG identity.
// Requires: npm install --no-save sharp
import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
const icon = await readFile('icon.svg');
const navy = '#0F2537', red = '#E63946', yellow = '#FFB703';
for (const size of [192,512]) {
  const square = await sharp(icon).resize(Math.round(size*.77),Math.round(size*.77),{fit:'contain'}).png().toBuffer();
  await sharp({create:{width:size,height:size,channels:4,background:'#ffffff'}})
    .composite([{input:square,gravity:'centre'}]).png().toFile('icon-'+size+'.png');
}
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${navy}"/>
<circle cx="1060" cy="112" r="262" fill="#1B4057"/>
<path d="M90 215 Q190 156 300 210 L300 490 Q191 431 90 478Z" fill="white"/>
<path d="M115 261 Q195 222 270 263 M115 323 Q195 287 270 327 M115 387 Q194 353 270 392" stroke="${navy}" stroke-width="19" stroke-linecap="round" fill="none"/>
<path d="M315 210 Q405 165 489 210 L489 482 Q401 441 315 495Z" fill="${red}"/>
<path d="M113 510 Q213 470 293 523 M321 523 Q404 472 478 502" stroke="${yellow}" stroke-width="20" fill="none" stroke-linecap="round"/>
<circle cx="374" cy="300" r="24" stroke="white" fill="none" stroke-width="18"/>
<circle cx="437" cy="394" r="24" stroke="white" fill="none" stroke-width="18"/>
<path d="M351 420 L455 271" stroke="white" stroke-width="20" stroke-linecap="round"/>
<text x="550" y="252" font-size="79" font-weight="bold" font-family="DejaVu Sans, Arial, sans-serif" fill="white">barmi<tspan fill="${red}">ar</tspan>.hu</text>
<text x="550" y="336" font-size="39" font-weight="bold" font-family="DejaVu Sans, Arial, sans-serif" fill="${yellow}">${esc('Legjobb árak bármiár-on')}</text>
<text x="550" y="420" font-size="27" font-family="DejaVu Sans, Arial, sans-serif" fill="white">Akciók · Ár-összehasonlítás</text>
<text x="550" y="462" font-size="27" font-family="DejaVu Sans, Arial, sans-serif" fill="white">Bevásárlólista · Ingyenesen</text></svg>`;
await mkdir('img',{recursive:true});
await sharp(Buffer.from(svg)).jpeg({quality:90,chromaSubsampling:'4:4:4'}).toFile('img/og.jpg');
console.log('Generated icon-192.png, icon-512.png, img/og.jpg');
