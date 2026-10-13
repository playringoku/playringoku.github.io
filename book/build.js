// Builds the printed book (Amazon KDP paperback, 8.5 x 11 in, black & white interior) in English and Spanish.
// Input: book/puzzles.json (node book/generate.js). Output: book/out/ringoku-interior-<lang>.pdf
// Usage: node book/build.js   (needs Playwright with Chromium)
const fs = require('fs');
const path = require('path');
const AN = require('../src/anillos-core.js');
const { N, K, NB } = AN;

const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const PUZ = JSON.parse(fs.readFileSync(path.join(__dirname, 'puzzles.json'), 'utf8'));
const SITE = 'playringoku.github.io';
const YEAR = 2026;

const T = {
  en: {
    title: 'Ringoku', sub: '150 circular logic puzzles', sub2: 'From easy to very hard · with solutions',
    copy: [`Copyright © ${YEAR}. All rights reserved.`, 'No part of this book may be reproduced without permission, except for brief quotations in reviews.',
      `A new free Ringoku puzzle every day at ${SITE}`],
    howTitle: 'How to play',
    rules: ['Each ring holds the numbers 1 to 8, each exactly once.', 'Two pieces that touch can never hold the same number or consecutive numbers: a 4 can’t touch a 3, a 4 or a 5.'],
    touch: 'The rings are offset like bricks: a piece touches the 2 pieces beside it in its own ring and 2 in each neighbouring ring. That makes 6 in the two middle rings and 4 in the outer and inner rings.',
    touchCap: 'The dark piece touches the 6 shaded ones.',
    exTitle: 'A first deduction',
    exCap: 'Which number goes in the “?”',
    exText: (v, parts, ring) => `Only a ${v} fits. ` + parts.map(x => `The ${x.n} (${x.rel === 'both' ? 'neighbour, same ring' : 'neighbour'}) rules out ${list(x.out, 'and')}.`).join(' ') + (ring.length ? ` Its ring already has ${list(ring.map(n => 'the ' + n), 'and')}.` : ''),
    unique: 'Every puzzle has exactly one solution, and you can always reach it by reasoning, with no guessing.',
    tipsTitle: 'Tips',
    tips: ['Begin with pieces that have several numbers around them: each neighbour rules out up to three values.',
      'Check each ring as a whole: if a number fits in only one of its gaps, it must go there.',
      'Pencil small candidates in a corner of the piece and cross them out as you go.',
      'Pieces in the outer and inner rings touch only 4 others; those in the two middle rings touch 6.'],
    contents: 'Contents', solutionsTitle: 'Solutions', hintsTitle: 'Hints',
    hintsA: 'Hints A', hintsB: 'Hints B',
    hintsAIntro: 'Stuck on a Hard or Very hard puzzle but don’t want to see the whole solution? Each board below reveals one key number (shaded) that gets you moving again. The grey numbers are the ones printed in the puzzle, to help you find your place. A few puzzles have a second sticking point: their Hint B is on page __HB__, kept apart so you don’t see it by accident.',
    hintsBIntro: 'A second hint, only for the puzzles that have a second sticking point. Look here only after using Hint A.',
    hintsNote: 'Stuck on a Hard or Very hard puzzle? You don’t need to look at the solution: on page __HA__ there is a hint that reveals one key number (Hints A), and on page __HB__ a second hint for the few puzzles that need one (Hints B).',
    tocHintsA: 'Hints A · Hard and Very hard', tocHintsB: 'Hints B · second hint',
    hint: 'Hint',
    levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Very hard' },
    levelNote: { easy: 'Simple deductions, many moves available.', medium: 'Still no guessing, but fewer moves at a time.', hard: 'Short “what if…” chains of reasoning.', expert: 'Longer chains of reasoning. Take your time.' },
    puzzle: 'Puzzle', more: ['Enjoyed it?', 'There’s a new free Ringoku every day at', SITE, 'Easy on Monday, harder each day until Sunday.'],
  },
  es: {
    title: 'Ringoku', sub: '150 pasatiempos de lógica circular', sub2: 'De fácil a muy difícil · con soluciones',
    copy: [`Copyright © ${YEAR}. Todos los derechos reservados.`, 'Queda prohibida la reproducción total o parcial de este libro sin permiso, salvo citas breves en reseñas.',
      `Un Ringoku nuevo y gratis cada día en ${SITE}`],
    howTitle: 'Cómo se juega',
    rules: ['Cada anillo lleva los números del 1 al 8, una vez cada uno.', 'Dos trozos que se tocan nunca pueden tener el mismo número ni números seguidos: un 4 no puede tocar ni un 3, ni un 4, ni un 5.'],
    touch: 'Los anillos están desplazados como ladrillos: cada trozo toca a los 2 de sus lados en su anillo y a 2 en cada anillo vecino. Son 6 en los dos anillos centrales y 4 en el exterior y el interior.',
    touchCap: 'El trozo oscuro toca los 6 sombreados.',
    exTitle: 'Una primera deducción',
    exCap: '¿Qué número va en la «?»',
    exText: (v, parts, ring) => `Solo cabe un ${v}. ` + parts.map(x => `El ${x.n} (${x.rel === 'both' ? 'vecino y de su anillo' : 'vecino'}) quita el ${list(x.out, 'y')}.`).join(' ') + (ring.length ? ` Su anillo ya tiene ${list(ring.map(n => 'el ' + n), 'y')}.` : ''),
    unique: 'Cada puzzle tiene una única solución y siempre se llega a ella razonando, sin adivinar.',
    tipsTitle: 'Consejos',
    tips: ['Empieza por los trozos que tienen varios números alrededor: cada vecino descarta hasta tres valores.',
      'Mira cada anillo entero: si un número solo cabe en uno de sus huecos, tiene que ir ahí.',
      'Apunta candidatos pequeños en una esquina del trozo y ve tachándolos.',
      'Los trozos del anillo exterior y del interior tocan solo a 4; los de los dos anillos centrales, a 6.'],
    contents: 'Contenido', solutionsTitle: 'Soluciones', hintsTitle: 'Pistas',
    hintsA: 'Pistas A', hintsB: 'Pistas B',
    hintsAIntro: '¿Te has atascado en un difícil o muy difícil pero no quieres ver la solución entera? Cada tablero de esta sección te revela un número clave (sombreado) para volver a avanzar. Los números grises son los que vienen impresos en el puzzle, para que te ubiques. Algunos puzzles tienen un segundo atasco: su pista B está en la página __HB__, aparte para que no la veas sin querer.',
    hintsBIntro: 'Una segunda pista, solo para los puzzles que tienen un segundo atasco. Mírala solo después de usar la pista A.',
    hintsNote: '¿Te atascas en un difícil o muy difícil? No hace falta mirar la solución: en la página __HA__ tienes una pista que te revela un número clave (pistas A), y en la página __HB__ una segunda pista para los pocos puzzles que la necesitan (pistas B).',
    tocHintsA: 'Pistas A · difíciles y muy difíciles', tocHintsB: 'Pistas B · segunda pista',
    hint: 'Pista',
    levels: { easy: 'Fácil', medium: 'Medio', hard: 'Difícil', expert: 'Muy difícil' },
    levelNote: { easy: 'Deducciones sencillas, con muchas jugadas a la vista.', medium: 'Sin adivinar, pero con pocas jugadas a la vez.', hard: 'Razonamientos cortos del tipo «si aquí fuera un…».', expert: 'Razonamientos más largos. Tómatelo con calma.' },
    puzzle: 'Puzzle', more: ['¿Te ha gustado?', 'Tienes un Ringoku nuevo y gratis cada día en', SITE, 'Fácil el lunes y cada día más difícil hasta el domingo.'],
  },
};

function list(a, and) { return a.length > 1 ? a.slice(0, -1).join(', ') + ` ${and} ` + a[a.length - 1] : String(a[0]); }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Board drawing: same geometry as the website (ring 0 is the outermost).
const CX = 300, R = 290, WD = 59;
const pt = (r, deg) => { const a = deg * Math.PI / 180; return [CX + r * Math.sin(a), CX - r * Math.cos(a)]; };
const f1 = p => p.map(x => x.toFixed(1)).join(' ');
// opts: values (id -> number), bold (Set of ids), fill (id -> colour), marks (id -> text), stroke, palette
function board(opts) {
  const pal = opts.palette || { a: '#FFFFFF', b: '#EBEBEB', line: '#1A1A1A', hole: '#FFFFFF', ink: '#000000', soft: '#555555' };
  let s = `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">`;
  for (let k = 0; k < K; k++) {
    const r1 = R - k * WD, r0 = r1 - WD;
    for (let i = 0; i < N; i++) {
      const id = k * N + i, th = 45 * i + 22.5 * k;
      const a = pt(r1, th - 22.5), b = pt(r1, th + 22.5), c = pt(r0, th + 22.5), d = pt(r0, th - 22.5);
      const fill = (opts.fill && opts.fill[id]) || (k % 2 ? pal.b : pal.a);
      s += `<path d="M${f1(a)} A${r1} ${r1} 0 0 1 ${f1(b)} L${f1(c)} A${r0} ${r0} 0 0 0 ${f1(d)} Z" fill="${fill}" stroke="${pal.line}" stroke-width="${opts.stroke || 1.6}"/>`;
      const m = pt((r0 + r1) / 2, th);
      const txt = opts.marks && opts.marks[id] !== undefined ? opts.marks[id] : opts.values && opts.values[id];
      if (txt !== undefined && txt !== null) {
        const bold = opts.bold && opts.bold.has(id);
        s += `<text x="${m[0].toFixed(1)}" y="${(m[1] + 11).toFixed(1)}" text-anchor="middle" font-family="BookDisplay, sans-serif" font-size="32" font-weight="${bold ? 800 : 400}" fill="${bold ? pal.ink : pal.soft}">${txt}</text>`;
      }
    }
  }
  return s + `<circle cx="${CX}" cy="${CX}" r="${R - K * WD}" fill="${pal.hole}" stroke="${pal.line}" stroke-width="${opts.stroke || 1.6}"/></svg>`;
}
const givenVals = p => Object.fromEntries(p.giv.map(c => [c, p.sol[c]]));
// The pieces that unblock a puzzle: one for each point where simple deductions run out (at most 2).
function keyPieces(p) {
  const known = [...p.giv], keys = [];
  while (known.length < AN.C && keys.length < 2) { const h = AN.hint(p.sol, known); if (h.kind === 'unlock') keys.push(h.cell); known.push(h.cell); }
  return keys.length ? keys : [AN.hint(p.sol, p.giv).cell];
}
// The website icon used as the "o" in "Ringoku". mode 'print' = greyscale for the black & white interior.
const ICON = fs.readFileSync(path.join(__dirname, '..', 'favicon.svg'), 'utf8').replace(/ width="64" height="64"/, '');
function logoTitle(mode) {
  let svg = ICON;
  if (mode === 'print') svg = svg.replace(/#1E2630/g, '#111111').replace(/#BFD9F2/g, '#BDBDBD').replace(/#F6D27A/g, '#8C8C8C').replace(/#E3E9DF/g, '#E6E6E6');
  return `Ring<span class="logo-o" role="img" aria-label="o">${svg}</span>ku`;
}

// Worked example for "How to play": the first simple deduction in the first easy puzzle.
function example(lang) {
  const p = PUZ[0], sol = p.sol;
  let h = AN.hint(sol, p.giv);
  if (h.kind !== 'direct') throw new Error('first puzzle does not open with a direct deduction');
  const id = h.cell, v = h.value, sameRing = e => Math.floor(e / N) === Math.floor(id / N);
  const parts = h.why.filter(e => NB[id].includes(e)).map(e => {
    const out = new Set(sameRing(e) ? [sol[e]] : []);
    [sol[e] - 1, sol[e], sol[e] + 1].forEach(w => { if (w >= 1 && w <= N) out.add(w); });
    out.delete(v);
    return { n: sol[e], rel: sameRing(e) ? 'both' : 'nb', out: [...out].sort((a, b) => a - b) };
  });
  const ring = h.why.filter(e => !NB[id].includes(e)).map(e => sol[e]).sort((a, b) => a - b);
  const fill = { [id]: '#BDBDBD' }; for (const e of h.why) fill[e] = '#DCDCDC';
  return { svg: board({ values: givenVals(p), bold: new Set([...p.giv, id]), fill, marks: { [id]: '?' } }), text: T[lang].exText(v, parts, ring) };
}
function neighboursDemo() {
  const id = 8 + 2;   // a piece in the second ring touches 6
  const fill = { [id]: '#555555' }; for (const e of NB[id]) fill[e] = '#C4C4C4';
  return board({ fill });
}

// TrueType copies of Inter (made by book/make-fonts.py) so the PDF embeds proper TrueType fonts.
const FONTS = [['BookSans', 'Inter-Regular', 400], ['BookSans', 'Inter-SemiBold', 600], ['BookSans', 'Inter-Bold', 700],
  ['BookDisplay', 'InterDisplay-Regular', 400], ['BookDisplay', 'InterDisplay-SemiBold', 600], ['BookDisplay', 'InterDisplay-ExtraBold', 800]]
  .map(([fam, file, w]) => `@font-face { font-family: ${fam}; src: url("fonts/${file}.ttf") format("truetype"); font-weight: ${w}; }`).join('\n');
const CSS = FONTS + `
@page { size: 8.5in 11in; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: BookSans, sans-serif; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 8.5in; height: 11in; padding: 0.7in 0.75in 0.8in; position: relative; break-after: page; overflow: hidden; }
.num { position: absolute; bottom: 0.4in; left: 0; right: 0; text-align: center; font-size: 10pt; color: #555; }
h1, h2, h3, .url { font-family: BookDisplay, sans-serif; margin: 0; }
.title { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 0.18in; }
.title h1 { font-size: 66pt; font-weight: 800; letter-spacing: -1.5pt; }
.logo-o { display: inline-block; height: 0.64em; width: 0.64em; vertical-align: -0.02em; margin: 0 0.015em; }
.title h1 .logo-o svg, .logo-o svg { width: 100%; height: 100%; display: block; margin: 0; }
.title .s1 { font-size: 20pt; font-weight: 600; }
.title .s2 { font-size: 13pt; color: #444; }
.title svg { width: 4.4in; margin-top: 0.3in; }
.copy { display: flex; flex-direction: column; justify-content: flex-end; font-size: 9.5pt; color: #333; gap: 6pt; }
.copy p { margin: 0; font-size: 9.5pt; }
h2 { font-size: 24pt; font-weight: 800; margin-bottom: 10pt; }
h3 { font-size: 14pt; font-weight: 800; margin: 14pt 0 4pt; }
p, li { font-size: 11.5pt; line-height: 1.45; margin: 0 0 6pt; }
ol.rules { padding-left: 20pt; margin: 0 0 8pt; } ol.rules li { margin-bottom: 4pt; font-weight: 600; font-size: 12.5pt; }
.fig { display: flex; gap: 0.3in; align-items: center; margin: 6pt 0; }
.fig svg { width: 3.1in; flex: none; }
.fig figcaption { font-size: 11pt; line-height: 1.45; color: #222; }
.fig.small svg { width: 2.1in; }
.toc { width: 100%; border-collapse: collapse; font-size: 12pt; margin: 6pt 0 10pt; }
.toc td { padding: 6pt 0; border-bottom: 1px solid #ccc; } .toc td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
ul { padding-left: 18pt; margin: 0; }
.lvlhead { display: flex; justify-content: space-between; align-items: baseline; gap: 12pt; border-bottom: 2px solid #111; padding-bottom: 4pt; margin-bottom: 8pt; height: 0.5in; }
.lvlhead h2 { margin: 0; font-size: 20pt; } .lvlhead span { font-size: 10pt; color: #444; text-align: right; }
.two { display: flex; flex-direction: column; height: 100%; gap: 0.2in; }
.with-head .two { height: calc(100% - 0.6in); }
.pz { flex: 1; display: flex; flex-direction: column; align-items: center; min-height: 0; }
.pzh { width: 100%; display: flex; justify-content: center; font-size: 11pt; font-weight: 700; margin-bottom: 4pt; }
.pzh .t { font-weight: 400; color: #444; }
.pz svg { flex: 1; min-height: 0; width: 100%; }
.sols { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(3, 1fr); gap: 0.15in 0.3in; height: calc(100% - 0.55in); }
.sol { display: flex; flex-direction: column; align-items: center; min-height: 0; }
.sol b { font-size: 10pt; margin-bottom: 2pt; }
.sol svg { flex: 1; min-height: 0; width: 100%; }
.hintintro { font-size: 11pt; color: #333; margin-bottom: 8pt; }
.hints { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 2.3in; gap: 0.08in 0.25in; }
.hint { display: flex; flex-direction: column; align-items: center; min-height: 0; border-top: 1px solid #ccc; padding-top: 4pt; }
.hint b { font-size: 10pt; margin-bottom: 3pt; align-self: flex-start; }
.hint svg { flex: 1; min-height: 0; width: 100%; }
.note { font-size: 11pt; background: #EFEFEF; border-left: 3pt solid #111; padding: 6pt 10pt; }
.end { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 8pt; }
.end h2 { font-size: 28pt; } .end .url { font-size: 22pt; font-weight: 800; margin: 4pt 0 10pt; }
`;

function interior(lang) {
  const t = T[lang], pages = [];
  const page = (html, cls = '', num = true) => pages.push({ html, cls, num });
  page(`<h1>${logoTitle('print')}</h1><div class="s1">${esc(t.sub)}</div><div class="s2">${esc(t.sub2)}</div>${board({ values: givenVals(PUZ[0]), bold: new Set(PUZ[0].giv), stroke: 1.8 })}`, 'title', false);
  page(t.copy.map(x => `<p>${esc(x)}</p>`).join(''), 'copy', false);
  const ex = example(lang);
  page(`<h2>${t.howTitle}</h2><ol class="rules">${t.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>
    <p>${esc(t.touch)}</p>
    <figure class="fig small">${neighboursDemo()}<figcaption>${esc(t.touchCap)}</figcaption></figure>
    <h3>${t.exTitle}</h3>
    <figure class="fig">${ex.svg}<figcaption><b>${esc(t.exCap)}</b><br>${esc(ex.text)}</figcaption></figure>
    <p>${esc(t.unique)}</p>
    <p class="note">${esc(t.hintsNote)}</p>`);
  page('__TOC__');
  const levelStart = {};
  for (let i = 0; i < PUZ.length; i += 2) {
    const a = PUZ[i], b = PUZ[i + 1];
    if (b && b.level !== a.level) throw new Error('level change inside a page');
    let head = '';
    if (!levelStart[a.level]) { levelStart[a.level] = pages.length + 1; head = `<div class="lvlhead"><h2>${t.levels[a.level]}</h2><span>${esc(t.levelNote[a.level])}</span></div>`; }
    const one = p => p ? `<div class="pz"><div class="pzh"><span>${t.puzzle} ${p.n} · ${t.levels[p.level]}</span></div>${board({ values: givenVals(p), bold: new Set(p.giv) })}</div>` : '<div class="pz"></div>';
    page(`${head}<div class="two">${one(a)}${one(b)}</div>`, head ? 'with-head' : '');
  }
  // Hints: all the A hints first, then the B hints on separate pages, so nobody sees a B hint by accident.
  const keys = new Map(PUZ.filter(p => p.level === 'hard' || p.level === 'expert').map(p => [p, keyPieces(p)]));
  const hintCell = (p, c, label) => `<div class="hint"><b>${t.puzzle} ${p.n} · ${label}</b>${board({ values: { ...givenVals(p), [c]: p.sol[c] }, bold: new Set([c]), fill: { [c]: '#CFCFCF' }, stroke: 1.4 })}</div>`;
  const hintPages = (items, title, intro) => {
    const start = pages.length + 1;
    for (let i = 0; i < items.length; ) {
      const first = i === 0, size = first ? 9 : 12, chunk = items.slice(i, i + size); i += size;
      page(`${first ? `<h2>${esc(title)}</h2><p class="hintintro">${esc(intro)}</p>` : ''}<div class="hints">${chunk.join('')}</div>`, first ? 'hints-first' : '');
    }
    return start;
  };
  const hintA = hintPages([...keys].map(([p, k]) => hintCell(p, k[0], `${t.hint} A`)), t.hintsA, t.hintsAIntro);
  const hintB = hintPages([...keys].filter(([, k]) => k.length > 1).map(([p, k]) => hintCell(p, k[1], `${t.hint} B`)), t.hintsB, t.hintsBIntro);
  const solStart = pages.length + 1;
  for (let i = 0; i < PUZ.length; i += 6) {
    const chunk = PUZ.slice(i, i + 6);
    page(`<h2 style="height:0.45in">${i === 0 ? t.solutionsTitle : ''}</h2><div class="sols">${chunk.map(p => `<div class="sol"><b>${t.puzzle} ${p.n}</b>${board({ values: Object.fromEntries(p.sol.map((v, c) => [c, v])), bold: new Set(p.giv), stroke: 1.4 })}</div>`).join('')}</div>`);
  }
  page(`<h2>${esc(t.more[0])}</h2><p>${esc(t.more[1])}</p><div class="url">${t.more[2]}</div><p>${esc(t.more[3])}</p>`, 'end');
  if (pages.length % 2) page('', '', false);   // KDP prefers an even page count
  const toc = `<h2>${t.contents}</h2><table class="toc">${['easy', 'medium', 'hard', 'expert'].map(l => {
    const ps = PUZ.filter(p => p.level === l); return `<tr><td>${t.levels[l]} · ${t.puzzle} ${ps[0].n}–${ps[ps.length - 1].n}</td><td>${levelStart[l]}</td></tr>`; }).join('')}
    <tr><td>${esc(t.tocHintsA)}</td><td>${hintA}</td></tr>
    <tr><td>${esc(t.tocHintsB)}</td><td>${hintB}</td></tr>
    <tr><td>${t.solutionsTitle}</td><td>${solStart}</td></tr></table>
    <h3>${t.tipsTitle}</h3><ul>${[...t.tips, t.hintsNote].map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const html = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><style>${CSS}</style><body>` +
    pages.map((p, i) => `<section class="page ${p.cls}">${p.html === '__TOC__' ? toc : p.html}${p.num ? `<div class="num">${i + 1}</div>` : ''}</section>`).join('')
      .replace(/__HA__/g, hintA).replace(/__HB__/g, hintB) + '</body></html>';
  return { html, count: pages.length };
}

module.exports = { T, board, givenVals, PUZ, SITE, list, esc, logoTitle };

if (require.main === module) {
  (async () => {
    const { chromium } = require('playwright');
    const browser = await chromium.launch();
    for (const lang of ['en', 'es']) {
      const { html, count } = interior(lang);
      const file = path.join(OUT, `interior-${lang}.html`);
      fs.writeFileSync(file, html);
      const pg = await browser.newPage();
      await pg.goto('file://' + file);
      await pg.pdf({ path: path.join(OUT, `ringoku-interior-${lang}.pdf`), width: '8.5in', height: '11in', printBackground: true, preferCSSPageSize: true });
      await pg.close();
      fs.writeFileSync(path.join(OUT, `pages-${lang}.txt`), String(count));
      console.log(lang, 'interior:', count, 'páginas');
    }
    await browser.close();
  })();
}
