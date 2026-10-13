// Checks the daily generator: speed, determinism, valid solutions and uniqueness (independent naive solver).
const AN = require("../src/anillos-core.js");
const { N, K, C, NB } = AN;

function valid(sol) {
  for (let k = 0; k < K; k++) {
    const r = sol.slice(k * N, (k + 1) * N).slice().sort((a, b) => a - b);
    if (r.join() !== '1,2,3,4,5,6,7,8') return false;
  }
  for (let c = 0; c < C; c++) for (const d of NB[c]) if (Math.abs(sol[c] - sol[d]) <= 1) return false;
  return true;
}
function naiveCount(sol, giv) {
  const g = new Set(giv), b = sol.map((v, c) => (g.has(c) ? v : 0));
  const order = []; for (let c = 0; c < C; c++) if (!g.has(c)) order.push(c);
  let cnt = 0;
  const ok = (c, v) => {
    const k = Math.floor(c / N);
    for (let i = 0; i < N; i++) if (b[k * N + i] === v) return false;
    for (const d of NB[c]) if (b[d] && Math.abs(b[d] - v) <= 1) return false;
    return true;
  };
  (function rec(j) {
    if (cnt > 1) return;
    if (j === order.length) { cnt++; return; }
    const c = order[j];
    for (let v = 1; v <= 8; v++) if (ok(c, v)) { b[c] = v; rec(j + 1); b[c] = 0; }
  })(0);
  return cnt;
}

const start = new Date(Date.UTC(2026, 9, 12));
let maxMs = 0, problems = 0;
for (let d = 0; d < 28; d++) {
  const dt = new Date(start.getTime() + d * 86400000);
  const key = dt.toISOString().slice(0, 10);
  const t0 = Date.now(); const p = AN.daily(key); const ms = Date.now() - t0; maxMs = Math.max(maxMs, ms);
  const again = AN.daily(key);
  const same = JSON.stringify(p) === JSON.stringify(again);
  const v = valid(p.sol), u = naiveCount(p.sol, p.giv);
  if (!same || !v || u !== 1) problems++;
  console.log(`${key} nº${p.number} ${p.level.padEnd(11)} pistas ${String(p.giv.length).padStart(2)} pruebas ${String(p.trials).padStart(2)} ${ms}ms determinista=${same} válida=${v} soluciones=${u}`);
}
// Hint explanations: the highlighted pieces alone must justify the answer.
let hintsChecked = 0, badWhy = 0;
for (let d = 0; d < 56; d++) {
  const key = new Date(start.getTime() + d * 86400000).toISOString().slice(0, 10);
  const p = AN.daily(key), known = [...p.giv];
  while (known.length < C) {
    const h = AN.hint(p.sol, known);
    if (h.value !== p.sol[h.cell]) badWhy++;
    if (h.kind === 'direct') {
      const out = new Set();
      for (const e of h.why) {
        if (Math.floor(e / N) === Math.floor(h.cell / N)) out.add(p.sol[e]);
        if (NB[h.cell].includes(e)) [p.sol[e] - 1, p.sol[e], p.sol[e] + 1].forEach(w => out.add(w));
      }
      for (let w = 1; w <= 8; w++) if (w !== h.value && !out.has(w)) { badWhy++; break; }
    } else if (h.kind === 'ring') {
      const k = Math.floor(h.cell / N);
      for (let i = 0; i < N; i++) {
        const o = k * N + i;
        if (o === h.cell || known.includes(o)) continue;
        if (!h.why.some(e => NB[o].includes(e) && Math.abs(p.sol[e] - h.value) <= 1)) { badWhy++; break; }
      }
    }
    known.push(h.cell); hintsChecked++;
  }
}
if (badWhy) problems++;
console.log(`pistas comprobadas ${hintsChecked} · explicaciones incorrectas ${badWhy}`);
console.log('tiempo máximo', maxMs, 'ms · problemas', problems);
