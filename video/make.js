// Builds a vertical (1080×1920) video of a daily puzzle for TikTok / Reels / Shorts, plus a short voice-over script.
// The video never spoils the whole puzzle: board → key move highlighted → countdown → reveal → two more moves →
// "can you finish it?" end card. Frames are drawn in Chromium (Playwright) and encoded with ffmpeg; no music
// (add it in the app, from its licensed library).
// Usage: node video/make.js [YYYY-MM-DD] [es|en]   →  video/out/ringoku-<date>-<lang>.mp4 and .txt
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const AN = require('../src/anillos-core.js');
const { N, K, NB } = AN;

const key = process.argv[2] || AN.keyOf(new Date());
const lang = process.argv[3] || 'es';
const OUT = path.join(__dirname, 'out');
const FONTS = path.join(__dirname, '..', 'book', 'out', 'fonts');
const FPS = 30, W = 1080, H = 1920;

const T = {
  es: {
    number: n => `Ringoku nº ${n}`, days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    easy: 'Fácil', medium: 'Medio', hard: 'Difícil', expert: 'Muy difícil',
    hook: '¿Lo resuelves?', ask: 'Solo cabe un número aquí. ¿Cuál?', reveal: '¡El {v}!', more: 'Y sigue…',
    end1: '¿Sacas el resto?', end2: 'Un puzzle nuevo cada día', end3: 'Gratis · sin registro',
    rules: 'Del 1 al 8 en cada anillo · los trozos que se tocan, ni iguales ni seguidos',
    rel: { ring: 'de su anillo', nb: 'que lo toca', both: 'que lo toca y es de su anillo' },
  },
  en: {
    number: n => `Ringoku #${n}`, days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert',
    hook: 'Can you solve it?', ask: 'Only one number fits here. Which one?', reveal: 'It’s {v}!', more: 'And on it goes…',
    end1: 'Can you finish it?', end2: 'A new puzzle every day', end3: 'Free · no sign-up',
    rules: '1 to 8 in each ring · touching pieces: never equal or consecutive',
    rel: { ring: 'in its ring', nb: 'touching it', both: 'touching it, in its ring' },
  },
}[lang];

const p = AN.daily(key);
const weekday = new Date(AN.parseKey(key)).getUTCDay();

// The key move (first hint) and two follow-up moves, in the order a player would find them.
let known = [...p.giv];
const moves = [];
for (let i = 0; i < 3; i++) {
  const h = AN.hint(p.sol, known); if (!h) break;
  moves.push(h); known = known.concat(h.cell);
}
const key0 = moves[0];

// Voice-over script (recorded by the player over the video, in their own words).
const rel = (c, d) => { const r = Math.floor(c / N) === Math.floor(d / N), n = NB[c].includes(d); return r && n ? 'both' : n ? 'nb' : 'ring'; };
function outOf(c, d) {
  const out = new Set(); if (Math.floor(c / N) === Math.floor(d / N)) out.add(p.sol[d]);
  if (NB[c].includes(d)) for (const w of [p.sol[d] - 1, p.sol[d], p.sol[d] + 1]) if (w >= 1 && w <= N) out.add(w);
  return [...out].sort((a, b) => a - b);
}
const list = (a, and) => a.length > 1 ? a.slice(0, -1).join(', ') + ` ${and} ` + a[a.length - 1] : String(a[0]);
const explain = lang === 'es'
  ? (key0.kind === 'ring'
    ? `En este anillo, el ${key0.value} no cabe en ningún otro hueco: lo impiden ${list(key0.why.map(d => 'el ' + p.sol[d]), 'y')}.`
    : key0.why.map(d => `El ${p.sol[d]}, ${T.rel[rel(key0.cell, d)]}, quita el ${list(outOf(key0.cell, d), 'y')}.`).join(' '))
  : (key0.kind === 'ring'
    ? `In this ring, the ${key0.value} can't go in any other gap: ${list(key0.why.map(d => 'the ' + p.sol[d]), 'and')} block it.`
    : key0.why.map(d => `The ${p.sol[d]}, ${T.rel[rel(key0.cell, d)]}, rules out ${list(outOf(key0.cell, d), 'and')}.`).join(' '));
const script = lang === 'es' ? [
  `[0–3 s] Me he inventado este pasatiempo. Se llama Ringoku. ¿Lo resuelves?`,
  `[3–7 s] Dos reglas: en cada anillo, del 1 al 8 sin repetir, y los trozos que se tocan no pueden tener números iguales ni seguidos. Mira el trozo marcado.`,
  `[7–10 s] ${explain} ¿Lo ves?`,
  `[10–13 s] Solo puede ser un ${key0.value}.`,
  `[13 s–final] Con eso ya salen más. ¿Sacas el resto? El de hoy está en playringoku punto github punto io, gratis.`,
] : [
  `[0–3 s] I invented this puzzle. It's called Ringoku. Can you solve it?`,
  `[3–7 s] Two rules: each ring holds 1 to 8 with no repeats, and touching pieces can't be equal or consecutive. Look at the highlighted piece.`,
  `[7–10 s] ${explain} See it?`,
  `[10–13 s] It can only be a ${key0.value}.`,
  `[13 s–end] That unlocks more. Can you finish it? Today's puzzle is at playringoku dot github dot io, free.`,
];

// ---- page: board + scenes, drawn for any time t by window.frame(t) ----
const DATA = { N, K, sol: p.sol, giv: p.giv, moves, geo: { cx: 510, cy: 990, R: 430, WD: 88 },
  T: { hook: T.hook, ask: T.ask, reveal: T.reveal, more: T.more } };
const page = `<!doctype html><html><meta charset="utf-8"><style>
@font-face { font-family: S; src: url("file://${FONTS}/Inter-Bold.ttf"); font-weight: 700; }
@font-face { font-family: S; src: url("file://${FONTS}/Inter-SemiBold.ttf"); font-weight: 600; }
@font-face { font-family: D; src: url("file://${FONTS}/InterDisplay-ExtraBold.ttf"); font-weight: 800; }
html, body { margin: 0; width: ${W}px; height: ${H}px; background: #F3F4F1; overflow: hidden; font-family: S, sans-serif; color: #1E2630; }
#top { position: absolute; top: 150px; left: 0; right: 0; text-align: center; }
#title { font-family: D; font-weight: 800; font-size: 84px; letter-spacing: -1px; }
#sub { margin-top: 6px; font-size: 40px; font-weight: 600; color: #5A6470; }
#sub b { display: inline-block; margin-left: 14px; padding: 4px 22px; border-radius: 99px; border: 3px solid #1E2630; color: #1E2630; font-size: 34px; }
#cap { position: absolute; top: 400px; left: 60px; right: 120px; text-align: center; font-family: D; font-weight: 800; font-size: 60px; line-height: 1.15; }
#rules { position: absolute; top: 1450px; left: 70px; right: 170px; text-align: center; font-size: 32px; font-weight: 600; color: #5A6470; line-height: 1.35; }
#count { position: absolute; left: 0; right: 60px; top: 840px; text-align: center; font-family: D; font-weight: 800; font-size: 280px; color: #2F6FB0; opacity: 0; }
#end { position: absolute; inset: 0; background: #1E2630; color: #F3F4F1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; opacity: 0; gap: 28px; }
#end .a { font-family: D; font-weight: 800; font-size: 104px; letter-spacing: -1px; }
#end .b { font-size: 50px; font-weight: 600; color: #BFD9F2; }
#end .c { font-family: D; font-weight: 800; font-size: 62px; color: #F6D27A; margin-top: 30px; }
#end .d { font-size: 40px; font-weight: 600; color: #BFD9F2; }
</style><body>
<div id="top"><div id="title">${T.number(p.number)}</div><div id="sub">${T.days[weekday]}<b>${T[p.level]}</b></div></div>
<div id="cap"></div>
<svg id="b" width="${W}" height="${H}" style="position:absolute;inset:0"></svg>
<div id="rules">${T.rules}</div>
<div id="count"></div>
<div id="end"><div class="a">${T.end1}</div><div class="b">${T.end2}</div><div class="c">playringoku.github.io</div><div class="d">${T.end3}</div></div>
<script>
const D = ${JSON.stringify(DATA)};
const NS = 'http://www.w3.org/2000/svg', svg = document.getElementById('b');
const pt = (r, deg) => { const a = deg * Math.PI / 180; return [D.geo.cx + r * Math.sin(a), D.geo.cy - r * Math.cos(a)]; };
function el(tag, a) { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; }
const ease = x => x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3);
// Scene times (s): 0 hook · 3 highlight · 7 countdown · 10 reveal · 13 follow-up moves · END end card
const M1 = 13, STEP = 1.3, END = M1 + STEP * (D.moves.length - 1) + 1.2;
const appear = D.moves.map((m, i) => i === 0 ? 10 : M1 + STEP * (i - 1));
window.TOTAL = END + 3.5;
window.frame = function (t) {
  svg.textContent = '';
  const k0 = D.moves[0], hl = t >= 3 && t < 10;
  const placed = new Map(); D.moves.forEach((m, i) => { if (t >= appear[i]) placed.set(m.cell, appear[i]); });
  for (let k = 0; k < D.K; k++) {
    const r1 = D.geo.R - k * D.geo.WD, r0 = r1 - D.geo.WD;
    for (let i = 0; i < D.N; i++) {
      const id = k * D.N + i, th = 45 * i + 22.5 * k;
      const a = pt(r1, th - 22.5), b = pt(r1, th + 22.5), c = pt(r0, th + 22.5), d = pt(r0, th - 22.5);
      let fill = k % 2 ? '#EEF2EA' : '#FFFFFF', stroke = '#1E2630', sw = 2.5;
      const since = placed.has(id) ? t - placed.get(id) : null;
      if ((hl || (t >= 10 && t < 13)) && k0.why.includes(id)) { fill = '#FCEFC7'; stroke = '#C99A2E'; sw = 7; }
      if ((hl && id === k0.cell) || (since !== null && since < 1.1)) { fill = '#F6D27A'; stroke = '#2F6FB0'; sw = 9; }
      el('path', { d: 'M' + a + ' A' + r1 + ' ' + r1 + ' 0 0 1 ' + b + ' L' + c + ' A' + r0 + ' ' + r0 + ' 0 0 0 ' + d + ' Z', fill, stroke, 'stroke-width': sw, 'stroke-linejoin': 'round' });
      const m = pt((r0 + r1) / 2, th), base = k === 3 ? 40 : 56;
      let v = '', size = base, color = '#1E2630';
      if (D.giv.includes(id)) v = D.sol[id];
      else if (since !== null) { v = D.sol[id]; color = '#2F6FB0'; size = base * (0.55 + 0.45 * ease(since / 0.3)) + base * 0.3 * Math.max(0, 1 - Math.abs(since - 0.22) / 0.22); }
      else if (hl && id === k0.cell && t >= 5) { v = '?'; color = '#2F6FB0'; }
      if (v !== '') el('text', { x: m[0], y: m[1] + size * 0.36, 'text-anchor': 'middle', 'font-family': 'D', 'font-weight': 800, 'font-size': size, fill: color }).textContent = v;
    }
  }
  const cap = document.getElementById('cap');
  cap.textContent = t < 3 ? D.T.hook : t < 10 ? D.T.ask : t < 13 ? D.T.reveal.replace('{v}', k0.value) : D.T.more;
  cap.style.color = t >= 10 && t < 13 ? '#2D7A4D' : '#1E2630';
  const cnt = document.getElementById('count');
  if (t >= 7 && t < 10) { const s = t - 7; cnt.textContent = 3 - Math.floor(s); cnt.style.opacity = 1 - (s % 1) * 0.5; cnt.style.transform = 'scale(' + (1.3 - 0.3 * ease((s % 1) / 0.3)) + ')'; }
  else cnt.style.opacity = 0;
  svg.style.opacity = t >= 7 && t < 10 ? 0.3 : 1;
  document.getElementById('end').style.opacity = ease((t - END) / 0.5);
};
</script></body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const base = path.join(OUT, `ringoku-${key}-${lang}`);
  fs.writeFileSync(base + '.html', page);
  const post = lang === 'es'
    ? `¿Sacas el Ringoku de hoy? 🧩 Un pasatiempo de lógica que me he inventado. Juega gratis en playringoku.github.io\n#puzzle #logica #sudoku #pasatiempos #ringoku`
    : `Can you solve today's Ringoku? 🧩 A logic puzzle I invented. Play free at playringoku.github.io\n#puzzle #logic #sudoku #brainteaser #ringoku`;
  fs.writeFileSync(base + '.txt', `${T.number(p.number)} · ${key} · ${T[p.level]}\n\n` +
    (lang === 'es' ? 'Guion para grabar encima (orientativo, dilo a tu manera):' : 'Voice-over script (a guide, say it your way):') +
    `\n\n${script.join('\n\n')}\n\n` + (lang === 'es' ? 'Texto para la publicación:' : 'Post caption:') + `\n${post}\n`);
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: W, height: H } });
  await pg.goto('file://' + base + '.html');
  await pg.evaluate(() => document.fonts.ready);
  const total = await pg.evaluate(() => window.TOTAL);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', base + '.mp4']);
  for (let f = 0, n = Math.ceil(total * FPS); f < n; f++) {
    await pg.evaluate(t => window.frame(t), f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
  await browser.close();
  fs.unlinkSync(base + '.html');
  console.log(`${base}.mp4 (${total.toFixed(1)} s) · ${base}.txt`);
})();
