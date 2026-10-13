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
console.log('tiempo máximo', maxMs, 'ms · problemas', problems);
