// Builds the full paperback cover (back + spine + front, with bleed) for Amazon KDP, in English and Spanish.
// Spine width follows KDP's white-paper formula (0.002252 in per page) using the page count written by build.js.
// Usage: node book/cover.js   (after node book/build.js)
const fs = require('fs');
const path = require('path');
const { board, PUZ, SITE, esc, logoTitle } = require('./build.js');
const AN = require('../src/anillos-core.js');

const OUT = path.join(__dirname, 'out');
const TRIM_W = 8.5, TRIM_H = 11, BLEED = 0.125, PER_PAGE = 0.002252;

const TXT = {
  en: {
    title: 'Ringoku', sub: '150 circular logic puzzles', tags: ['Easy to very hard', 'Step-by-step guide', 'All solutions included'],
    badge: '150', badgeSub: 'puzzles',
    back: [
      'Meet Ringoku, a new kind of logic puzzle played on rings.',
      '__RULES__',
      'The rings are offset like bricks, so every number you place affects pieces in three rings at once. No maths and no guessing: just pure deduction.',
    ],
    rulesTitle: 'Two simple rules',
    rules: ['Each ring holds the numbers 1 to 8, once each.', 'Touching pieces can never hold the same or consecutive numbers.'],
    inside: 'Inside this book', insideList: ['150 brand-new puzzles, from gentle warm-ups to real challenges', 'A clear guide with a worked example', 'Hints for the hard puzzles, so you never get stuck', 'Large boards with room for notes', 'Solutions for every puzzle'],
    web: `Play a new free puzzle every day at ${SITE}`,
  },
  es: {
    title: 'Ringoku', sub: '150 pasatiempos de lógica circular', tags: ['De fácil a muy difícil', 'Guía paso a paso', 'Con todas las soluciones'],
    badge: '150', badgeSub: 'puzzles',
    back: [
      'Descubre Ringoku, un pasatiempo de lógica nuevo que se juega sobre anillos.',
      '__RULES__',
      'Los anillos están desplazados como ladrillos, así que cada número que colocas afecta a trozos de tres anillos a la vez. Sin cálculos y sin adivinar: solo deducción.',
    ],
    rulesTitle: 'Dos reglas sencillas',
    rules: ['Cada anillo lleva los números del 1 al 8, una vez cada uno.', 'Los trozos que se tocan nunca pueden tener el mismo número ni números seguidos.'],
    inside: 'En este libro', insideList: ['150 puzzles inéditos, de calentamiento suave a verdaderos retos', 'Una guía clara con un ejemplo resuelto', 'Pistas para los difíciles, por si te atascas', 'Tableros grandes con espacio para anotar', 'Las soluciones de todos los puzzles'],
    web: `Juega gratis a un puzzle nuevo cada día en ${SITE}`,
  },
};

// Front-cover board in the website's colours: a "?" piece in yellow and its neighbours in blue.
function frontBoard() {
  const p = PUZ[0], h = AN.hint(p.sol, p.giv);
  const fill = { [h.cell]: '#F6D27A' }; for (const e of AN.NB[h.cell]) fill[e] = '#BFD9F2';
  const values = Object.fromEntries(p.giv.map(c => [c, p.sol[c]]));
  return board({ values, bold: new Set(p.giv), fill, marks: { [h.cell]: '?' }, stroke: 2.2,
    palette: { a: '#FFFFFF', b: '#EEF2EA', line: '#1E2630', hole: '#1E2630', ink: '#1E2630', soft: '#1E2630' } });
}

function cover(lang, pages) {
  const t = TXT[lang], spine = pages * PER_PAGE;
  const W = BLEED * 2 + TRIM_W * 2 + spine, H = TRIM_H + BLEED * 2;
  const spineText = pages >= 80;   // KDP allows spine text from 80 pages
  const css = `
@font-face { font-family: BookSans; src: url("fonts/Inter-Regular.ttf"); font-weight: 400; }
@font-face { font-family: BookSans; src: url("fonts/Inter-SemiBold.ttf"); font-weight: 600; }
@font-face { font-family: BookSans; src: url("fonts/Inter-Bold.ttf"); font-weight: 700; }
@font-face { font-family: BookDisplay; src: url("fonts/InterDisplay-ExtraBold.ttf"); font-weight: 800; }
@font-face { font-family: BookDisplay; src: url("fonts/InterDisplay-SemiBold.ttf"); font-weight: 600; }
@page { size: ${W}in ${H}in; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; width: ${W}in; height: ${H}in; background: #1E2630; color: #F3F4F1; font-family: BookSans, sans-serif; position: relative; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.back, .front, .spine { position: absolute; top: 0; height: ${H}in; }
.back { left: 0; width: ${BLEED + TRIM_W}in; padding: ${BLEED + 0.6}in 0.75in ${BLEED + 0.6}in ${BLEED + 0.6}in; }
.spine { left: ${BLEED + TRIM_W}in; width: ${spine}in; background: #2F6FB0; display: flex; align-items: center; justify-content: center; }
.spine span { writing-mode: vertical-rl; font-family: BookDisplay, sans-serif; font-weight: 800; font-size: ${Math.min(11, spine * 72 * 0.55).toFixed(1)}pt; letter-spacing: 2pt; color: #FFFFFF; }
.front { left: ${BLEED + TRIM_W + spine}in; width: ${BLEED + TRIM_W}in; padding: ${BLEED + 0.65}in ${BLEED + 0.6}in ${BLEED + 0.6}in 0.6in; display: flex; flex-direction: column; align-items: center; text-align: center; }
.front h1 { font-family: BookDisplay, sans-serif; font-weight: 800; font-size: 96pt; letter-spacing: -2pt; margin: 0; line-height: 1; }
.logo-o { display: inline-block; height: 0.64em; width: 0.64em; vertical-align: -0.02em; margin: 0 0.015em; }
.logo-o svg { width: 100%; height: 100%; display: block; }
.logo-o svg > circle { stroke: #F3F4F1; stroke-width: 1.2; }
.front .sub { font-family: BookDisplay, sans-serif; font-weight: 600; font-size: 24pt; color: #BFD9F2; margin-top: 10pt; }
.front .art { position: relative; width: 6.3in; margin-top: 0.35in; }
.front .art svg { width: 100%; display: block; }
.badge { position: absolute; right: -0.15in; top: -0.1in; width: 1.35in; height: 1.35in; border-radius: 50%; background: #F6D27A; color: #1E2630; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: rotate(8deg); }
.badge b { font-family: BookDisplay, sans-serif; font-weight: 800; font-size: 34pt; line-height: 1; } .badge span { font-weight: 700; font-size: 12pt; }
.tags { margin-top: auto; display: flex; gap: 0.18in; justify-content: center; flex-wrap: wrap; }
.tags span { border: 1.5pt solid #BFD9F2; border-radius: 99px; padding: 5pt 12pt; font-weight: 600; font-size: 12.5pt; color: #F3F4F1; }
.back h2 { font-family: BookDisplay, sans-serif; font-weight: 800; font-size: 44pt; margin: 0 0 18pt; letter-spacing: -1pt; }
.back p { font-size: 15.5pt; line-height: 1.5; margin: 0 0 16pt; color: #E3E7EC; }
.rules { background: #F3F4F1; color: #1E2630; border-radius: 12pt; padding: 16pt 20pt; margin: 4pt 0 18pt; }
.rules b { display: block; font-family: BookDisplay, sans-serif; font-weight: 800; font-size: 16pt; margin-bottom: 8pt; }
.rules ol { margin: 0; padding-left: 20pt; } .back .rules li { font-weight: 600; font-size: 15pt; line-height: 1.45; margin-bottom: 4pt; color: #1E2630; }
.back h3 { font-family: BookDisplay, sans-serif; font-weight: 800; font-size: 19pt; margin: 8pt 0 8pt; color: #F6D27A; }
.back ul { margin: 0 0 20pt; padding-left: 20pt; } .back li { font-size: 15pt; line-height: 1.55; color: #E3E7EC; }
.web { font-weight: 700; font-size: 15pt; line-height: 1.4; color: #BFD9F2; max-width: 5in; }
`;
  const backHtml = `<h2>${logoTitle('cover')}</h2>` + t.back.map(x => x === '__RULES__'
    ? `<div class="rules"><b>${esc(t.rulesTitle)}</b><ol>${t.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol></div>`
    : `<p>${esc(x)}</p>`).join('') +
    `<h3>${esc(t.inside)}</h3><ul>${t.insideList.map(x => `<li>${esc(x)}</li>`).join('')}</ul><div class="web">${esc(t.web)}</div>`;
  // The barcode goes in the lower right of the back cover (KDP adds it): nothing is placed there.
  const html = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><style>${css}</style><body>
<div class="back">${backHtml}</div>
<div class="spine">${spineText ? '<span>RINGOKU</span>' : ''}</div>
<div class="front"><h1>${logoTitle('cover')}</h1><div class="sub">${esc(t.sub)}</div>
<div class="art">${frontBoard()}<div class="badge"><b>${t.badge}</b><span>${t.badgeSub}</span></div></div>
<div class="tags">${t.tags.map(x => `<span>${esc(x)}</span>`).join('')}</div></div>
</body></html>`;
  return { html, W, H, spine };
}

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  for (const lang of ['en', 'es']) {
    const pages = Number(fs.readFileSync(path.join(OUT, `pages-${lang}.txt`), 'utf8'));
    const { html, W, H, spine } = cover(lang, pages);
    const file = path.join(OUT, `cover-${lang}.html`);
    fs.writeFileSync(file, html);
    const pg = await browser.newPage();
    await pg.goto('file://' + file);
    await pg.pdf({ path: path.join(OUT, `ringoku-cover-${lang}.pdf`), width: `${W}in`, height: `${H}in`, printBackground: true, preferCSSPageSize: true });
    await pg.close();
    console.log(lang, `cubierta ${W.toFixed(3)} × ${H} in · lomo ${spine.toFixed(3)} in (${pages} páginas)`);
  }
  await browser.close();
})();
