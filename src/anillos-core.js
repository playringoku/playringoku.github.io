// Anillos core: deterministic daily puzzle generator for Ringoku.
// Board: 4 rings x 8 pieces, offset like bricks. Each ring holds 1..8 once;
// touching pieces never hold the same number or consecutive numbers.
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
      const bad = (1 << (v - 1)) | (1 << v) | (1 << (v + 1));
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
  // why: the visible pieces that force the answer (a small set, chosen greedily), so the game can show them.
  function hint(sol, known) {
    const knownSet = new Set(known);
    const empty = [];
    for (let c = 0; c < C; c++) if (!knownSet.has(c)) empty.push(c);
    if (!empty.length) return null;
    // First-order candidates: only what the visible numbers rule out (same ring, equal or consecutive neighbours).
    const cand = new Array(C).fill(0);
    for (const c of empty) {
      let m = FULL;
      for (const d of RING[RINGOF[c]]) if (knownSet.has(d)) m &= ~(1 << sol[d]);
      for (const d of NB[c]) if (knownSet.has(d)) m &= ~((1 << (sol[d] - 1)) | (1 << sol[d]) | (1 << (sol[d] + 1)));
      cand[c] = m & FULL;
    }
    const direct = empty.filter(c => pc(cand[c]) === 1);
    if (direct.length) { const c = direct[0]; return { cell: c, value: sol[c], kind: 'direct', why: whyDirect(sol, knownSet, c) }; }
    for (const ringCells of RING) for (let v = 1; v <= N; v++) {
      if (ringCells.some(d => knownSet.has(d) && sol[d] === v)) continue;
      const spots = ringCells.filter(d => !knownSet.has(d) && (cand[d] >> v) & 1);
      if (spots.length === 1) return { cell: spots[0], value: v, kind: 'ring', why: whyRing(sol, knownSet, ringCells, spots[0], v) };
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
    return { cell: best, value: sol[best], kind: 'unlock', why: [] };
  }
  // Values a visible piece d rules out for the empty piece c (same ring: its number; neighbour: equal or consecutive).
  function rulesOut(sol, c, d) {
    const out = new Set();
    if (RINGOF[d] === RINGOF[c]) out.add(sol[d]);
    if (NB[c].includes(d)) for (const w of [sol[d] - 1, sol[d], sol[d] + 1]) if (w >= 1 && w <= N) out.add(w);
    return out;
  }
  // Greedy cover: pick the fewest visible pieces that together rule out every other number for this piece.
  function whyDirect(sol, knownSet, c) {
    const need = new Set(); for (let w = 1; w <= N; w++) if (w !== sol[c]) need.add(w);
    const pool = [...new Set([...RING[RINGOF[c]], ...NB[c]])].filter(d => knownSet.has(d));
    const why = [];
    while (need.size) {
      let best = null, gain = 0;
      for (const d of pool) {
        const g = [...rulesOut(sol, c, d)].filter(w => need.has(w)).length + (NB[c].includes(d) ? 0.1 : 0);
        if (g > gain) { gain = g; best = d; }
      }
      if (best === null) break;
      for (const w of rulesOut(sol, c, best)) need.delete(w);
      why.push(best); pool.splice(pool.indexOf(best), 1);
    }
    return why;
  }
  // For "only place in its ring": the visible neighbours that stop v from going in each other empty piece of the ring.
  function whyRing(sol, knownSet, ringCells, cell, v) {
    const blocked = ringCells.filter(d => d !== cell && !knownSet.has(d));
    const blocks = e => blocked.filter(d => NB[d].includes(e) && Math.abs(sol[e] - v) <= 1);
    const pool = [...new Set(blocked.flatMap(d => NB[d]))].filter(e => knownSet.has(e));
    const left = new Set(blocked), why = [];
    while (left.size) {
      let best = null, gain = 0;
      for (const e of pool) { const g = blocks(e).filter(d => left.has(d)).length; if (g > gain) { gain = g; best = e; } }
      if (best === null) break;
      for (const d of blocks(best)) left.delete(d);
      why.push(best);
    }
    return why;
  }

  // Human-like difficulty. Each time simple reasoning stalls, the player needs a "what if" that breaks.
  // Cost = length of the easiest contradiction chain + a bonus when such breakthroughs are rare (hard to spot).
  function humanScore(sol, giv, cap = Infinity) {
    const D = startState(sol, giv);
    if (!D || !fullProp(D)) return null;
    let total = 0;
    while (!D.every(m => pc(m) === 1)) {
      if (total >= cap) return total + 1;   // already too hard for this level: stop early
      const base = D.filter(m => pc(m) === 1).length;
      let best = 99, options = 0, pick = null;
      for (let c = 0; c < C; c++) if (pc(D[c]) > 1) for (let v = 1; v <= N; v++) {
        if (!((D[c] >> v) & 1) || v === sol[c]) continue;
        const E = D.slice();
        if (assign(E, c, v) && fullProp(E)) continue;
        const depth = E.filter(m => pc(m) === 1).length - base;
        options++;
        if (depth < best) { best = depth; pick = [c, v]; }
      }
      if (!pick) return null;
      total += Math.max(1, best) + (options < 4 ? 3 : options < 10 ? 1 : 0);
      D[pick[0]] &= ~(1 << pick[1]);
      if (pc(D[pick[0]]) === 1 && !assign(D, pick[0], bitval(D[pick[0]]))) return null;
      if (!fullProp(D)) return null;
    }
    return total;
  }

  // Average number of pieces that can be placed with simple reasoning at each step of a simple-only solve.
  // Wide (many options) feels easy; narrow (you have to hunt for the one move) feels harder.
  function simpleFan(sol, giv) {
    const known = new Set(giv); let steps = 0, sum = 0;
    while (known.size < C) {
      const cand = new Array(C).fill(0), moves = new Map();
      for (let c = 0; c < C; c++) if (!known.has(c)) {
        let m = FULL;
        for (const d of RING[RINGOF[c]]) if (known.has(d)) m &= ~(1 << sol[d]);
        for (const d of NB[c]) if (known.has(d)) m &= ~((1 << (sol[d] - 1)) | (1 << sol[d]) | (1 << (sol[d] + 1)));
        cand[c] = m & FULL;
        if (pc(cand[c]) === 1) moves.set(c, 1);
      }
      for (const ringCells of RING) for (let v = 1; v <= N; v++) {
        if (ringCells.some(d => known.has(d) && sol[d] === v)) continue;
        const spots = ringCells.filter(d => !known.has(d) && (cand[d] >> v) & 1);
        if (spots.length === 1) moves.set(spots[0], 1);
      }
      if (!moves.size) return null;
      sum += moves.size; steps++;
      known.add(moves.keys().next().value);
    }
    return sum / steps;
  }
  // Number of pieces a player can place with simple deductions before the first real stall.
  function openingRun(sol, giv) {
    const known = [...giv]; let run = 0;
    for (;;) { const h = hint(sol, known); if (!h || h.kind === 'unlock') return run; known.push(h.cell); run++; }
  }
  // Add back givens (one at a time) until the opening reaches the target.
  function soften(rng, p, target) {
    let giv = [...p.giv], run = openingRun(p.sol, giv);
    while (run < target) {
      const cands = shuffle(rng, Array.from({ length: C }, (_, i) => i).filter(c => !giv.includes(c)));
      let best = null, bestRun = run;
      for (const c of cands) { const r = openingRun(p.sol, giv.concat(c)); if (r > bestRun) { best = c; bestRun = r; if (r >= target) break; } }
      if (best === null) return null;
      giv = giv.concat(best).sort((a, b) => a - b); run = bestRun;
    }
    return { sol: p.sol, giv };
  }
  // Difficulty by weekday (0 = Sunday). h = humanScore, fan = simple moves per step (null = notes needed).
  // Mon/Tue easy: only simple deductions, many moves at hand. Wed/Thu medium: still no "what if",
  // but few moves at a time or notes needed. Fri/Sat hard: a few short "what if" steps. Sun expert: longer ones.
  const LEVELS = {
    easy:   { max: 0,  ok: (h, fan) => h === 0 && fan !== null && fan >= 3, open: 0 },
    medium: { max: 0,  ok: (h, fan) => h === 0 && (fan === null || fan <= 2.5), open: 0 },
    hard:   { max: 12, ok: h => h >= 3, open: 4 },
    expert: { max: 35, ok: h => h >= 15, open: 3 },
  };
  const DAYLEVEL = ['expert', 'easy', 'easy', 'medium', 'medium', 'hard', 'hard'];
  // Start from a minimal (usually very hard) puzzle and add givens back until it fits the level.
  function tune(rng, p, L) {
    let giv = [...p.giv];
    for (;;) {
      const h = humanScore(p.sol, giv, L.max);
      if (h === null) return null;
      if (h <= L.max) {
        const fan = h === 0 ? simpleFan(p.sol, giv) : null;
        if (L.ok(h, fan)) return { sol: p.sol, giv, h };
        if (L.max > 0) return null;                    // overshot: now too easy for this level
        if (fan !== null && fan > 2.5 && fan < 3 || L === LEVELS.medium) return null;
        // easy but still too narrow: keep adding givens (widens the choice)
      }
      const free = Array.from({ length: C }, (_, i) => i).filter(c => !giv.includes(c));
      if (!free.length || giv.length >= 14) return null;   // keep the board from looking pre-solved
      giv = giv.concat(free[Math.floor(rng() * free.length)]).sort((a, b) => a - b);
    }
  }
  const LAUNCH = Date.UTC(2026, 9, 12);   // Puzzle nº 1 = 12 Oct 2026
  function parseKey(key) { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); }
  function keyOf(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  // One puzzle of the given level from a numeric seed (used by the daily puzzle and by the printed books).
  function generate(seed, level) {
    const L = LEVELS[level], rng = mulberry32(Math.imul(seed, 2654435761) >>> 0);
    let last = null;
    for (let attempt = 0; attempt < 400; attempt++) {
      let q = tune(rng, makePuzzle(rng), L);
      if (!q) continue;
      last = q;
      if (L.open) {
        const s2 = soften(rng, q, L.open); if (!s2) continue;
        const h2 = humanScore(s2.sol, s2.giv, L.max);
        if (h2 === null || h2 > L.max || !L.ok(h2, null)) continue;
        q = { ...s2, h: h2 };
      }
      return q;
    }
    return last;
  }
  function levelOf(key) { return DAYLEVEL[new Date(parseKey(key)).getUTCDay()]; }
  function daily(key) {
    const t = parseKey(key), level = DAYLEVEL[new Date(t).getUTCDay()];
    const q = generate(Number(key.replace(/-/g, '')), level);
    return { sol: q.sol, giv: q.giv, level, trials: q.h, number: Math.round((t - LAUNCH) / 86400000) + 1, dateKey: key };
  }
  return { N, K, C, NB, RING, daily, generate, levelOf, keyOf, parseKey, LAUNCH, count, startState, hint };
})();
if (typeof module !== 'undefined') module.exports = AN;
