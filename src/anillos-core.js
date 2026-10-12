// Anillos core: deterministic daily puzzle generator for the ring "no consecutive" puzzle.
// Board: 4 rings x 8 pieces, offset like bricks. Each ring holds 1..8 once;
// touching pieces never hold consecutive numbers.
const AN = (function () {
  const N = 8, K = 4, C = N * K, FULL = 0x1FE;
  const cid = (k, i) => k * N + ((i % N) + N) % N;
  const NB = [], RING = [], RINGOF = [];
  for (let c = 0; c < C; c++) {
    const k = Math.floor(c / N), i = c % N, s = [];
    for (const [kk, ii] of [[k, i - 1], [k, i + 1], [k - 1, i], [k - 1, i + 1], [k + 1, i - 1], [k + 1, i]])
      if (kk >= 0 && kk < K) { const d = cid(kk, ii); if (!s.includes(d)) s.push(d); }
    NB.push(s); RINGOF.push(k);
  }
  for (let k = 0; k < K; k++) { const r = []; for (let i = 0; i < N; i++) r.push(cid(k, i)); RING.push(r); }

  const pc = m => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
  const bitval = m => 31 - Math.clz32(m);

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function assign(D, c0, v0) {
    const stack = [[c0, v0]];
    while (stack.length) {
      const [c, v] = stack.pop();
      if (!((D[c] >> v) & 1)) return false;
      D[c] = 1 << v;
      const bad = (1 << (v - 1)) | (1 << (v + 1));
      for (const d of NB[c]) if (D[d] & bad) {
        D[d] &= ~bad;
        if (!D[d]) return false;
        if (pc(D[d]) === 1) stack.push([d, bitval(D[d])]);
      }
      for (const d of RING[RINGOF[c]]) if (d !== c && (D[d] >> v) & 1) {
        D[d] &= ~(1 << v);
        if (!D[d]) return false;
        if (pc(D[d]) === 1) stack.push([d, bitval(D[d])]);
      }
    }
    return true;
  }
  // Hidden singles inside each ring. Returns -1 contradiction, 0 no change, 1 changed.
  function hiddenPass(D) {
    let changed = 0;
    for (const ring of RING) for (let v = 1; v <= N; v++) {
      let where = -1, n = 0;
      for (const c of ring) if ((D[c] >> v) & 1) { n++; where = c; }
      if (!n) return -1;
      if (n === 1 && pc(D[where]) > 1) { if (!assign(D, where, v)) return -1; changed = 1; }
    }
    return changed;
  }
  function fullProp(D) { for (;;) { const r = hiddenPass(D); if (r < 0) return false; if (!r) return true; } }
  function pickCell(D) {
    let best = -1, bn = 99;
    for (let c = 0; c < C; c++) { const n = pc(D[c]); if (n > 1 && n < bn) { bn = n; best = c; } }
    return best;
  }
  function count(D0, limit) {
    const D = D0.slice();
    if (!fullProp(D)) return 0;
    const c = pickCell(D);
    if (c < 0) return 1;
    let tot = 0;
    for (let v = 1; v <= N && tot < limit; v++) if ((D[c] >> v) & 1) {
      const E = D.slice();
      if (assign(E, c, v)) tot += count(E, limit - tot);
    }
    return tot;
  }
  function shuffle(rng, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function randomSolution(rng) {
    function rec(D) {
      if (!fullProp(D)) return null;
      const c = pickCell(D);
      if (c < 0) return D;
      const vals = []; for (let v = 1; v <= N; v++) if ((D[c] >> v) & 1) vals.push(v);
      for (const v of shuffle(rng, vals)) { const E = D.slice(); if (assign(E, c, v)) { const r = rec(E); if (r) return r; } }
      return null;
    }
    const r = rec(new Array(C).fill(FULL));
    return r ? r.map(bitval) : null;
  }
  function startState(sol, giv) {
    const D = new Array(C).fill(FULL);
    for (const c of giv) if (!assign(D, c, sol[c])) return null;
    return D;
  }
  function grade(sol, giv) {
    const D = startState(sol, giv);
    if (D.every(m => pc(m) === 1)) return { tier: 1, trials: 0 };
    if (!fullProp(D)) return null;
    if (D.every(m => pc(m) === 1)) return { tier: 2, trials: 0 };
    let trials = 0;
    while (!D.every(m => pc(m) === 1)) {
      let prog = false;
      outer: for (let c = 0; c < C; c++) {
        if (pc(D[c]) === 1) continue;
        for (let v = 1; v <= N; v++) {
          if (!((D[c] >> v) & 1)) continue;
          const E = D.slice();
          if (!(assign(E, c, v) && fullProp(E))) {
            D[c] &= ~(1 << v); trials++; prog = true;
            if (pc(D[c]) === 1 && !assign(D, c, bitval(D[c]))) return null;
            if (!fullProp(D)) return null;
            break outer;
          }
        }
      }
      if (!prog) return null;
    }
    return { tier: 3, trials };
  }
  function makePuzzle(rng) {
    const sol = randomSolution(rng);
    const giv = new Set(Array.from({ length: C }, (_, i) => i));
    for (const c of shuffle(rng, Array.from({ length: C }, (_, i) => i))) {
      giv.delete(c);
      const D = startState(sol, giv);
      if (!(D && count(D, 2) === 1)) giv.add(c);
    }
    return { sol, giv: [...giv].sort((a, b) => a - b) };
  }

  // Smart hint: the next empty piece that can be deduced from what is already on the board.
  // known = indices of pieces whose value is known (givens + correct entries).
  // kind: 'direct' (forced by its neighbours and ring), 'ring' (only place left in its ring for a number),
  // 'unlock' (no simple deduction available: the piece that resolves the most others once revealed).
  function hint(sol, known) {
    const knownSet = new Set(known);
    const empty = [];
    for (let c = 0; c < C; c++) if (!knownSet.has(c)) empty.push(c);
    if (!empty.length) return null;
    // First-order candidates: only what the visible numbers rule out (same ring, consecutive neighbours).
    const cand = new Array(C).fill(0);
    for (const c of empty) {
      let m = FULL;
      for (const d of RING[RINGOF[c]]) if (knownSet.has(d)) m &= ~(1 << sol[d]);
      for (const d of NB[c]) if (knownSet.has(d)) m &= ~((1 << (sol[d] - 1)) | (1 << (sol[d] + 1)));
      cand[c] = m & FULL;
    }
    const direct = empty.filter(c => pc(cand[c]) === 1);
    if (direct.length) return { cell: direct[0], value: sol[direct[0]], kind: 'direct' };
    for (const ringCells of RING) for (let v = 1; v <= N; v++) {
      if (ringCells.some(d => knownSet.has(d) && sol[d] === v)) continue;
      const spots = ringCells.filter(d => !knownSet.has(d) && (cand[d] >> v) & 1);
      if (spots.length === 1) return { cell: spots[0], value: v, kind: 'ring' };
    }
    const E = startState(sol, known);
    fullProp(E);
    let best = empty[0], bestN = -1;
    for (const c of empty) {
      const F = E.slice();
      if (!assign(F, c, sol[c]) || !fullProp(F)) continue;
      const n = empty.filter(d => pc(F[d]) === 1).length;
      if (n > bestN) { bestN = n; best = c; }
    }
    return { cell: best, value: sol[best], kind: 'unlock' };
  }

  // Difficulty by weekday (0 = Sunday): Mon/Tue easy, Wed/Thu medium, Fri/Sat hard, Sun very hard.
  const BANDS = {
    1: ['easy', g => g.tier <= 2], 2: ['easy', g => g.tier <= 2],
    3: ['medium', g => g.tier === 3 && g.trials >= 3 && g.trials <= 7], 4: ['medium', g => g.tier === 3 && g.trials >= 3 && g.trials <= 7],
    5: ['hard', g => g.tier === 3 && g.trials >= 10 && g.trials <= 18], 6: ['hard', g => g.tier === 3 && g.trials >= 10 && g.trials <= 18],
    0: ['expert', g => g.tier === 3 && g.trials >= 19],
  };
  const LAUNCH = Date.UTC(2026, 9, 12);   // Puzzle nº 1 = 12 Oct 2026
  function parseKey(key) { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); }
  function keyOf(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function daily(key) {
    const t = parseKey(key), wd = new Date(t).getUTCDay();
    const [level, ok] = BANDS[wd];
    const seed = Number(key.replace(/-/g, ''));
    const rng = mulberry32(Math.imul(seed, 2654435761) >>> 0);
    let fallback = null;
    for (let attempt = 0; attempt < 400; attempt++) {
      const p = makePuzzle(rng), g = grade(p.sol, p.giv);
      if (!g) continue;
      if (ok(g)) return { ...p, level, trials: g.trials, number: Math.round((t - LAUNCH) / 86400000) + 1, dateKey: key };
      if (!fallback || (g.tier === 3 && g.trials > fallback.trials)) fallback = { ...p, trials: g.trials };
    }
    return { ...fallback, level, number: Math.round((t - LAUNCH) / 86400000) + 1, dateKey: key };
  }
  return { N, K, C, NB, RING, daily, keyOf, parseKey, LAUNCH, count, startState, hint };
})();
if (typeof module !== 'undefined') module.exports = AN;
