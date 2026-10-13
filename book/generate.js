// Generates the puzzles for the printed book (book/puzzles.json).
// Seeds 1..9999 never collide with the daily puzzles (those use 8-digit dates), so the book is exclusive.
// Usage: node book/generate.js
const fs = require('fs');
const path = require('path');
const AN = require('../src/anillos-core.js');
const { N, K, C, NB } = AN;

// Even counts so two puzzles of the same level share each page.
const PLAN = [['easy', 40, 1000], ['medium', 46, 2000], ['hard', 44, 3000], ['expert', 20, 4000]];

// Independent brute-force check of uniqueness (same as the test suite).
function solutions(sol, giv) {
  const g = new Set(giv), b = sol.map((v, c) => (g.has(c) ? v : 0)), order = [];
  for (let c = 0; c < C; c++) if (!g.has(c)) order.push(c);
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
// Simple moves available per step (higher = easier to spot), used only to order puzzles within a level.
function fan(sol, giv) {
  const known = new Set(giv); let steps = 0, sum = 0;
  while (known.size < C) {
    let moves = 0;
    const h = AN.hint(sol, [...known]);
    if (h.kind === 'unlock') return 0;
    for (let c = 0; c < C; c++) if (!known.has(c)) {
      let m = 0x1FE;
      for (let i = 0; i < N; i++) { const d = Math.floor(c / N) * N + i; if (known.has(d)) m &= ~(1 << sol[d]); }
      for (const d of NB[c]) if (known.has(d)) m &= ~((1 << (sol[d] - 1)) | (1 << sol[d]) | (1 << (sol[d] + 1)));
      m &= 0x1FE;
      if (m && !(m & (m - 1))) moves++;   // direct moves only (cheap approximation)
    }
    sum += Math.max(1, moves); steps++;
    known.add(h.cell);
  }
  return sum / steps;
}

const out = [], seen = new Set();
for (const [level, count, base] of PLAN) {
  const list = [];
  for (let seed = base; list.length < count; seed++) {
    const q = AN.generate(seed, level);
    if (seen.has(q.sol.join(''))) continue;
    if (solutions(q.sol, q.giv) !== 1) { console.error('ambiguous', level, seed); continue; }
    seen.add(q.sol.join(''));
    list.push({ level, seed, sol: q.sol, giv: q.giv, score: q.h, fan: fan(q.sol, q.giv) });
  }
  // gentle progression inside each level
  list.sort((a, b) => level === 'easy' || level === 'medium' ? b.fan - a.fan || b.giv.length - a.giv.length : a.score - b.score);
  out.push(...list);
}
out.forEach((p, i) => { p.n = i + 1; });
fs.writeFileSync(path.join(__dirname, 'puzzles.json'), JSON.stringify(out));
const by = {}; for (const p of out) (by[p.level] = by[p.level] || []).push(p);
for (const l in by) console.log(l.padEnd(7), by[l].length, 'puzzles · números de partida', Math.min(...by[l].map(p => p.giv.length)) + '–' + Math.max(...by[l].map(p => p.giv.length)), '· puntuación', Math.min(...by[l].map(p => p.score)) + '–' + Math.max(...by[l].map(p => p.score)));
