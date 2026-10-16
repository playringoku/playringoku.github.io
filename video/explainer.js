// Vertical (1080×1920) "how to play" explainer for the pinned TikTok/Reels video, plus the exact lines to paste into
// the app's text-to-speech. Scenes: hook · the board · rule 1 (a ring fills 1–8) · rule 2 (a piece and its 6
// neighbours) · worked example (candidates 1–8 crossed out until only the 1 is left) · daily puzzle + web.
// Usage: node video/explainer.js [es|en]   →  video/out/ringoku-explicacion-<lang>.mp4 and .txt
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const AN = require('../src/anillos-core.js');
const { N, K, NB } = AN;

const lang = process.argv[2] || 'es';
const OUT = path.join(__dirname, 'out');
const FONTS = path.join(__dirname, '..', 'book', 'out', 'fonts');
const FPS = 30, W = 1080, H = 1920, TOTAL = 49;
// scene starts that the page script also uses (worked example, its answer, end card)
const T_EX = 24, T_SOL = 38, T_END = 42.5;

// Scenes: [start s, caption, small line, extra words for the voice-over]. Captions double as text-to-speech lines.
const S = {
  es: [
    [0, 'Me inventé este pasatiempo', 'Se llama Ringoku', 'Se llama Ringoku.'],
    [3.5, '4 anillos de 8 trozos', 'desplazados como ladrillos', 'Desplazados como ladrillos.'],
    [7.5, 'Regla 1: en cada anillo, del 1 al 8', 'sin repetir', 'Sin repetir ninguno.'],
    [13, 'Regla 2: los trozos que se tocan…', 'en azul, los 6 que toca este', ''],
    [17.5, '…no pueden ser iguales ni seguidos', 'junto a un 4: ni 3, ni 4, ni 5', 'Junto a un 4: ni 3, ni 4, ni 5.'],
    [24, '¿Qué número va aquí?', 'tacha lo que no puede ir', 'En su anillo ya están el 8 y el 7. El 3 quita el 2, el 3 y el 4. Y el 6 quita el 5, el 6 y el 7.'],
    [38, 'Solo queda el 1', 'así se resuelve todo, sin adivinar', 'Así se resuelve todo, sin adivinar.'],
    [42.5, 'Un puzzle nuevo cada día', 'de fácil a difícil · gratis', 'Juega gratis en playringoku punto github punto io.'],
  ],
  en: [
    [0, 'I invented this puzzle', 'It’s called Ringoku', 'It’s called Ringoku.'],
    [3.5, '4 rings of 8 pieces', 'offset like bricks', 'Offset like bricks.'],
    [7.5, 'Rule 1: each ring holds 1 to 8', 'no repeats', 'No repeats.'],
    [13, 'Rule 2: touching pieces…', 'in blue, the 6 this one touches', ''],
    [17.5, '…can’t be equal or consecutive', 'next to a 4: no 3, 4 or 5', 'Next to a 4: no 3, 4 or 5.'],
    [24, 'Which number goes here?', 'cross out what can’t go', 'Its ring already has 8 and 7. The 3 rules out 2, 3 and 4. And the 6 rules out 5, 6 and 7.'],
    [38, 'Only the 1 is left', 'that’s how it all works, no guessing', 'That’s how it all works, no guessing.'],
    [42.5, 'A new puzzle every day', 'easy to hard · free', 'Play free at playringoku dot github dot io.'],
  ],
}[lang];

// Example (as in the web tutorial, on the full board): target piece 8 (second ring) touches 15 and 9 (sides),
// 0 and 1 (outer ring), 23 and 16 (third ring). Its ring has 8 and 7; it touches a 3 and a 6 → only 1 is left.
const TARGET = 8, NBT = NB[TARGET];
const EX = { 11: 8, 13: 7, 1: 3, 16: 6 };
const RING0 = [1, 3, 5, 7, 2, 4, 6, 8];           // a valid outer ring for rule 1
// crossing order in the example: [number, piece that rules it out, time]
const CROSS = [[8, 11, 26.4], [7, 13, 27.4], [2, 1, 30], [3, 1, 30.5], [4, 1, 31], [5, 16, 34.2], [6, 16, 34.8]];

const page = `<!doctype html><html><meta charset="utf-8"><style>
@font-face { font-family: S; src: url("file://${FONTS}/Inter-SemiBold.ttf"); font-weight: 600; }
@font-face { font-family: D; src: url("file://${FONTS}/InterDisplay-ExtraBold.ttf"); font-weight: 800; }
html, body { margin: 0; width: ${W}px; height: ${H}px; background: #F3F4F1; overflow: hidden; font-family: S, sans-serif; color: #1E2630; }
#cap { position: absolute; top: 200px; left: 60px; right: 120px; text-align: center; font-family: D; font-weight: 800; font-size: 60px; line-height: 1.12; }
#small { position: absolute; top: 400px; left: 60px; right: 120px; text-align: center; font-size: 40px; font-weight: 600; color: #5A6470; }
#chips { position: absolute; top: 1430px; left: 40px; right: 140px; display: flex; gap: 12px; justify-content: center; opacity: 0; }
#chips div { width: 84px; height: 96px; border-radius: 14px; background: #FFFFFF; border: 3px solid #CDD3CB; font-family: D; font-weight: 800; font-size: 54px; display: flex; align-items: center; justify-content: center; position: relative; }
#chips div.x { color: #B8BFC6; background: #F3F4F1; }
#chips div.x::after { content: ''; position: absolute; left: 8px; right: 8px; top: 50%; height: 6px; background: #B3261E; transform: rotate(-35deg); border-radius: 3px; }
#chips div.win { background: #E3F1E8; border-color: #2D7A4D; color: #2D7A4D; }
#end { position: absolute; inset: 0; background: #1E2630; color: #F3F4F1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; opacity: 0; gap: 26px; padding: 0 60px; }
#end .a { font-family: D; font-weight: 800; font-size: 96px; line-height: 1.05; }
#end .b { font-size: 48px; font-weight: 600; color: #BFD9F2; }
#end .c { font-family: D; font-weight: 800; font-size: 62px; color: #F6D27A; margin-top: 30px; }
</style><body>
<div id="cap"></div><div id="small"></div>
<svg id="b" width="${W}" height="${H}" style="position:absolute;inset:0"></svg>
<div id="chips">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<div>${n}</div>`).join('')}</div>
<div id="end"><div class="a">${S[7][1]}</div><div class="b">${S[7][2]}</div><div class="c">playringoku.github.io</div></div>
<script>
const S = ${JSON.stringify(S)}, N = ${N}, K = ${K}, TARGET = ${TARGET}, NBT = ${JSON.stringify(NBT)};
const T_EX = ${T_EX}, T_SOL = ${T_SOL}, T_END = ${T_END};
const EX = ${JSON.stringify(EX)}, RING0 = ${JSON.stringify(RING0)}, CROSS = ${JSON.stringify(CROSS)};
const NS = 'http://www.w3.org/2000/svg', svg = document.getElementById('b');
const G = { cx: 510, cy: 960, R: 420, WD: 86 };
const pt = (r, deg) => { const a = deg * Math.PI / 180; return [G.cx + r * Math.sin(a), G.cy - r * Math.cos(a)]; };
function el(tag, a) { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; }
const ease = x => x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3);
const pop = s => s < 0 ? 0 : 0.55 + 0.45 * ease(s / 0.3) + 0.3 * Math.max(0, 1 - Math.abs(s - 0.22) / 0.22);
window.frame = function (t) {
  svg.textContent = '';
  const scene = S.filter(s => t >= s[0]).pop();
  const cap = document.getElementById('cap'), small = document.getElementById('small');
  const fadeIn = ease((t - scene[0]) / 0.35);
  cap.textContent = scene[1]; small.textContent = scene[2];
  cap.style.opacity = small.style.opacity = fadeIn; cap.style.transform = 'translateY(' + (1 - fadeIn) * 20 + 'px)';
  cap.style.color = t >= T_SOL && t < T_END ? '#2D7A4D' : '#1E2630';
  const val = {}, glow = {}, size = {}, blue = new Set(), why = new Set();
  let sel = null;
  if (t >= 3.5 && t < 7.5) { const k = Math.min(3, Math.floor((t - 3.7) / 0.85)); if (k >= 0) for (let i = 0; i < N; i++) glow[k * N + i] = '#BFD9F2'; }
  if (t >= 7.5 && t < 13) RING0.forEach((v, i) => { const at = 8.2 + i * 0.5; if (t >= at) { val[i] = v; size[i] = pop(t - at); } if (t >= 12.2) glow[i] = '#E3F1E8'; });
  if (t >= 13 && t < T_EX) { sel = TARGET; val[TARGET] = 4; size[TARGET] = pop(t - 13.3); if (t >= 14) NBT.forEach(n => blue.add(n)); }
  if (t >= T_EX && t < T_END) {
    sel = TARGET; NBT.forEach(n => blue.add(n));
    for (const id in EX) val[id] = EX[id];
    CROSS.filter(c => t >= c[2] && t < c[2] + 0.9).forEach(c => why.add(c[1]));
    if (t >= T_SOL) { val[TARGET] = 1; size[TARGET] = pop(t - T_SOL); }
  }
  for (let k = 0; k < K; k++) {
    const r1 = G.R - k * G.WD, r0 = r1 - G.WD;
    for (let i = 0; i < N; i++) {
      const id = k * N + i, th = 45 * i + 22.5 * k;
      const a = pt(r1, th - 22.5), b = pt(r1, th + 22.5), c = pt(r0, th + 22.5), d = pt(r0, th - 22.5);
      let fill = glow[id] || (k % 2 ? '#EEF2EA' : '#FFFFFF'), stroke = '#1E2630', sw = 2.5;
      if (blue.has(id)) fill = '#BFD9F2';
      if (why.has(id)) { fill = '#F9DEDC'; stroke = '#B3261E'; sw = 7; }
      if (id === sel) { fill = t >= T_SOL && t < T_END ? '#E3F1E8' : '#F6D27A'; stroke = '#2F6FB0'; sw = 9; }
      el('path', { d: 'M' + a + ' A' + r1 + ' ' + r1 + ' 0 0 1 ' + b + ' L' + c + ' A' + r0 + ' ' + r0 + ' 0 0 0 ' + d + ' Z', fill, stroke, 'stroke-width': sw, 'stroke-linejoin': 'round' });
      const m = pt((r0 + r1) / 2, th);
      let v = val[id]; if (id === sel && t >= T_EX && t < T_SOL) v = '?';
      if (v !== undefined) {
        const base = k === 3 ? 40 : 56, sz = base * (size[id] !== undefined ? size[id] : 1);
        el('text', { x: m[0], y: m[1] + sz * 0.36, 'text-anchor': 'middle', 'font-family': 'D', 'font-weight': 800, 'font-size': sz,
          fill: id === sel ? (v === '?' ? '#2F6FB0' : t >= T_SOL ? '#2D7A4D' : '#1E2630') : '#1E2630' }).textContent = v;
      } else if (t >= 17.5 && t < T_EX && blue.has(id)) {
        el('text', { x: m[0], y: m[1] + 10, 'text-anchor': 'middle', 'font-family': 'S', 'font-weight': 600, 'font-size': k === 3 ? 20 : 27,
          fill: '#B3261E', opacity: ease((t - 17.8) / 0.4) }).textContent = '≠ 3 4 5';
      }
    }
  }
  const chips = document.getElementById('chips');
  chips.style.opacity = t >= T_EX && t < T_END ? ease((t - (T_EX + 0.3)) / 0.4) : 0;
  [...chips.children].forEach((ch, i) => {
    const n = i + 1, x = CROSS.find(c => c[0] === n);
    ch.className = x && t >= x[2] ? 'x' : (n === 1 && t >= T_SOL ? 'win' : '');
  });
  svg.style.opacity = t < 0.6 ? ease(t / 0.6) : 1;
  document.getElementById('end').style.opacity = ease((t - T_END) / 0.5);
};
</script></body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const base = path.join(OUT, `ringoku-explicacion-${lang}`);
  fs.writeFileSync(base + '.html', page);
  const lines = S.map(s => `[${s[0].toFixed(1)} s] ${s[1].replace(/…/g, '').trim().replace(/^./, c => c.toUpperCase())}.${s[3] ? ' ' + s[3] : ''}`.replace('..', '.').replace('?.', '?'));
  fs.writeFileSync(base + '.txt', (lang === 'es'
    ? 'Frases para «Texto a voz» de TikTok. Añade cada una como texto en su momento, tócala y elige «Texto a voz». Después puedes ocultar ese texto, porque el vídeo ya lleva los rótulos.\n\n'
    : 'Lines for TikTok text-to-speech. Add each as text at its time, tap it and choose “Text-to-speech”. You can then hide that text, since the video already has captions.\n\n')
    + lines.join('\n') + '\n\n'
    + (lang === 'es'
      ? 'Texto de la publicación:\nAsí se juega a Ringoku, el pasatiempo que me inventé 🧩 Dos reglas y un puzzle nuevo cada día. Pruébalo gratis 👉 playringoku.github.io\n#puzzle #logica #sudoku #pasatiempos #ringoku #juegosmentales\n'
      : 'Post caption:\nHow to play Ringoku, the puzzle I invented 🧩 Two rules and a new puzzle every day. Play free 👉 playringoku.github.io\n#puzzle #logic #sudoku #brainteaser #ringoku\n'));
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: W, height: H } });
  await pg.goto('file://' + base + '.html');
  await pg.evaluate(() => document.fonts.ready);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', base + '.mp4']);
  for (let f = 0, n = Math.ceil(TOTAL * FPS); f < n; f++) {
    await pg.evaluate(t => window.frame(t), f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
  await browser.close();
  fs.unlinkSync(base + '.html');
  console.log(`${base}.mp4 (${TOTAL} s) · ${base}.txt`);
})();
