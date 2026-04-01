import { useState, useRef, useCallback, useMemo, useEffect } from "react";

// ============================================================
// BRITISH TOWN NAME GENERATOR
// ============================================================
// Combines real English prefixes and suffixes to create
// plausible-sounding fictional town names. Rare prefixes
// (Upper, Nether, etc.) appear ~8% of the time.

const PREFIXES_COMMON = [
  "Ash", "Barn", "Beck", "Black", "Brad", "Bram", "Brid", "Brom", "Bur",
  "Cal", "Cam", "Chad", "Ches", "Chip", "Clan", "Cog", "Col", "Cran",
  "Crom", "Dal", "Dart", "Dun", "Eas", "El", "Farn", "Fen", "Flit",
  "Gar", "Gil", "Glas", "Gos", "Gran", "Had", "Hal", "Hamp", "Har",
  "Hazel", "Helm", "Hex", "Hol", "Horn", "Hud", "Hunt", "Ilk", "Ips",
  "Ken", "Ket", "Kings", "Kirk", "Knares", "Lang", "Led", "Lin", "Lud",
  "Mal", "Mar", "Mel", "Mid", "Mil", "Mor", "Nor", "Oak", "Os", "Ox",
  "Pad", "Pen", "Pick", "Rams", "Red", "Rich", "Ring", "Rod", "Ros",
  "Roth", "Sand", "Sed", "Shep", "Sher", "Skip", "Stan", "Stock", "Stow",
  "Strat", "Sud", "Sut", "Tad", "Tam", "Thorn", "Tod", "Trow", "Tun",
  "Wal", "War", "Wed", "Wel", "West", "Whit", "Wick", "Wil", "Win",
  "Wit", "Wol", "Wood", "Woot", "Wor", "Wy",
];

const SUFFIXES = [
  "bury", "ford", "ham", "ton", "ley", "wick", "worth", "minster",
  "bridge", "mouth", "pool", "gate", "field", "well", "stead",
  "combe", "thorpe", "by", "dale", "den", "hurst", "mere",
  "stone", "church", "grove", "haven", "caster", "chester",
  "borough", "shaw", "cliff", "wood", "moor", "stoke",
  "bourne", "marsh", "leigh", "holm", "beck", "cross",
];

const RARE_PREFIXES = [
  "Upper ", "Lower ", "Nether ", "Great ", "Little ",
  "North ", "South ", "East ", "West ", "Long ", "Broad ",
  "Old ", "New ", "Kings ", "Bishops ",
];

function generateTownName(rng) {
  const prefix = PREFIXES_COMMON[Math.floor(rng() * PREFIXES_COMMON.length)];
  const suffix = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
  let name = prefix + suffix;

  // ~8% chance of a rare prefix
  if (rng() < 0.08) {
    const rare = RARE_PREFIXES[Math.floor(rng() * RARE_PREFIXES.length)];
    name = rare + name;
  }

  return name;
}

// Seeded random number generator for reproducible city layouts
function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ============================================================
// CITY GENERATION
// ============================================================

function generateCities(count, seed) {
  const rng = seededRng(seed);
  const cities = [];
  const usedNames = new Set();

  for (let i = 0; i < count; i++) {
    let name;
    let attempts = 0;
    do {
      name = generateTownName(rng);
      attempts++;
    } while (usedNames.has(name) && attempts < 50);
    usedNames.add(name);

    cities.push({
      id: i,
      name,
      x: 30 + rng() * 740, // padding from edges
      y: 30 + rng() * 540,
    });
  }

  // Randomly select start city
  const startIdx = Math.floor(rng() * count);
  cities[startIdx].isStart = true;

  return cities;
}

// ============================================================
// DISTANCE HELPERS
// ============================================================

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function totalDistance(route, cities) {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++) {
    d += dist(cities[route[i]], cities[route[i + 1]]);
  }
  // Return to start
  d += dist(cities[route[route.length - 1]], cities[route[0]]);
  return d;
}

// ============================================================
// GENETIC ALGORITHM
// ============================================================

// Create a random route starting and ending at startIdx
function randomRoute(numCities, startIdx, rng) {
  const others = [];
  for (let i = 0; i < numCities; i++) {
    if (i !== startIdx) others.push(i);
  }
  // Fisher-Yates shuffle
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  return [startIdx, ...others];
}

// Wrap a route with metadata
function makeIndividual(route, born, method) {
  return { route, meta: { born, method } };
}

// Initialize population of random routes
function initPopulation(size, numCities, startIdx, rng) {
  const pop = [];
  for (let i = 0; i < size; i++) {
    pop.push(makeIndividual(randomRoute(numCities, startIdx, rng), 0, "random"));
  }
  return pop;
}

// Tournament selection: pick `k` random individuals, return the best
function tournamentSelect(population, fitnesses, k, rng) {
  let bestIdx = Math.floor(rng() * population.length);
  for (let i = 1; i < k; i++) {
    const idx = Math.floor(rng() * population.length);
    if (fitnesses[idx] < fitnesses[bestIdx]) bestIdx = idx;
  }
  return population[bestIdx];
}

// Ordered Crossover (OX): produces one child from two parents
// Both parents start with startIdx; child inherits that constraint
function orderedCrossover(parent1, parent2, rng) {
  const len = parent1.length;
  const startCity = parent1[0];

  // Work on the non-start portion
  const p1 = parent1.slice(1);
  const p2 = parent2.slice(1);
  const n = p1.length;

  let i = Math.floor(rng() * n);
  let j = Math.floor(rng() * n);
  if (i > j) [i, j] = [j, i];

  const child = new Array(n).fill(-1);
  // Copy segment from p1
  const segment = new Set();
  for (let k = i; k <= j; k++) {
    child[k] = p1[k];
    segment.add(p1[k]);
  }

  // Fill remaining from p2 in order
  let pos = (j + 1) % n;
  for (let k = 0; k < n; k++) {
    const candidate = p2[(j + 1 + k) % n];
    if (!segment.has(candidate)) {
      child[pos] = candidate;
      pos = (pos + 1) % n;
    }
  }

  return [startCity, ...child];
}

// Mutation 1: swap two random non-start cities (diversity)
function mutateSwap(route, rng) {
  const r = [...route];
  const i = 1 + Math.floor(rng() * (r.length - 1));
  const j = 1 + Math.floor(rng() * (r.length - 1));
  [r[i], r[j]] = [r[j], r[i]];
  return r;
}

// Mutation 2: 2-opt — reverse a segment if it shortens the route (resolves crossings)
function mutate2opt(route, cities, rng) {
  if (route.length < 4) return route; // need at least 3 non-start cities
  const r = [...route];
  // Pick two random cut points in the non-start portion (indices 1..len-1)
  let i = 1 + Math.floor(rng() * (r.length - 1));
  let j = 1 + Math.floor(rng() * (r.length - 1));
  if (i > j) [i, j] = [j, i];
  if (i === j) return r;

  // Calculate distance before and after reversal
  // Edges affected: (i-1, i) and (j, j+1 mod len)
  const prev = i - 1;
  const nextJ = (j + 1) % r.length;
  // Handle the circular return-to-start: if nextJ === 0, the edge is (j, route[0])
  const dBefore = dist(cities[r[prev]], cities[r[i]]) + dist(cities[r[j]], cities[r[nextJ]]);
  const dAfter = dist(cities[r[prev]], cities[r[j]]) + dist(cities[r[i]], cities[r[nextJ]]);

  if (dAfter < dBefore) {
    // Reverse the segment [i..j]
    while (i < j) {
      [r[i], r[j]] = [r[j], r[i]];
      i++;
      j--;
    }
  }
  return r;
}

// Mutation 3: reverse a random sub-sequence of 3+ cities (structural shake-up)
function mutateSegmentReverse(route, rng) {
  if (route.length < 5) return route; // need at least 4 non-start cities for a 3+ segment
  const r = [...route];
  const maxLen = r.length - 1; // indices 1..maxLen
  // Pick a random start (in non-start portion) and length >= 3
  const minSeg = 3;
  const maxSeg = Math.min(maxLen, Math.floor(maxLen / 2) + 1);
  if (maxSeg < minSeg) return r;
  const segLen = minSeg + Math.floor(rng() * (maxSeg - minSeg + 1));
  const start = 1 + Math.floor(rng() * (maxLen - segLen + 1));
  // Reverse the segment [start..start+segLen-1]
  let lo = start;
  let hi = start + segLen - 1;
  while (lo < hi) {
    [r[lo], r[hi]] = [r[hi], r[lo]];
    lo++;
    hi--;
  }
  return r;
}

// Edge similarity: fraction of edges shared between two circular routes (0..1)
// An edge is an unordered pair {A,B}. Both routes are circular (last city connects to first).
function edgeSimilarity(routeA, routeB) {
  const edgesA = new Set();
  for (let i = 0; i < routeA.length; i++) {
    const a = routeA[i], b = routeA[(i + 1) % routeA.length];
    edgesA.add(a < b ? `${a},${b}` : `${b},${a}`);
  }
  let shared = 0;
  for (let i = 0; i < routeB.length; i++) {
    const a = routeB[i], b = routeB[(i + 1) % routeB.length];
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    if (edgesA.has(key)) shared++;
  }
  return shared / routeA.length;
}

// Run one generation: selection, crossover, mutations, elitism
// Population is array of { route, meta: { born, method } }
function evolveOnce(population, cities, params, rng, currentGen) {
  const { eliteCount, mutationRate, tournamentSize, maxSameRatio } = params;
  const fitnesses = population.map((ind) => totalDistance(ind.route, cities));

  // Sort by fitness (ascending = shortest first)
  const sorted = population
    .map((ind, i) => ({ ind, fitness: fitnesses[i] }))
    .sort((a, b) => a.fitness - b.fitness);

  const nextGen = [];

  // Elitism with diversity enforcement
  // maxSameRatio (0-1): max fraction of elite slots that can hold "similar" routes
  // Similarity threshold: routes sharing >80% edges are considered "same"
  const SIM_THRESHOLD = 0.8;
  const maxSameSlots = Math.max(1, Math.round(eliteCount * maxSameRatio));
  const selectedElites = [];

  for (let i = 0; i < sorted.length && selectedElites.length < eliteCount; i++) {
    const candidate = sorted[i];

    // Check similarity to already-selected elites
    const isSimilar = selectedElites.some(
      (sel) => edgeSimilarity(candidate.ind.route, sel.ind.route) > SIM_THRESHOLD
    );

    if (isSimilar) {
      // Count how many "similar cluster" members we already have
      const sameCount = selectedElites.filter((sel) =>
        edgeSimilarity(candidate.ind.route, sel.ind.route) > SIM_THRESHOLD
      ).length;
      if (sameCount >= maxSameSlots) continue; // skip, quota full
    }

    selectedElites.push(candidate);
  }

  // If we couldn't fill all elite slots (rare), fill remaining with best available
  for (let i = 0; i < sorted.length && selectedElites.length < eliteCount; i++) {
    if (!selectedElites.includes(sorted[i])) {
      selectedElites.push(sorted[i]);
    }
  }

  // Add elites to next generation
  for (const sel of selectedElites) {
    const elite = sel.ind;
    nextGen.push({
      route: elite.route,
      meta: { ...elite.meta, method: elite.meta.born === currentGen ? elite.meta.method : "elite (survived)" },
    });
  }

  // Fill rest with crossover + three-tier mutation
  while (nextGen.length < population.length) {
    const p1 = tournamentSelect(population, fitnesses, tournamentSize, rng);
    const p2 = tournamentSelect(population, fitnesses, tournamentSize, rng);
    let child = orderedCrossover(p1.route, p2.route, rng);

    // Track which mutations were applied
    const methods = ["crossover"];

    // 2-opt: 80% chance — targeted crossing resolution
    if (rng() < 0.8) {
      child = mutate2opt(child, cities, rng);
      methods.push("2-opt");
    }
    // Segment reversal: 30% chance — structural diversity
    if (rng() < 0.3) {
      child = mutateSegmentReverse(child, rng);
      methods.push("reverse");
    }
    // Swap: at user's mutation rate — point diversity
    if (rng() < mutationRate) {
      child = mutateSwap(child, rng);
      methods.push("swap");
    }

    nextGen.push(makeIndividual(child, currentGen, methods.join(" + ")));
  }

  const bestRoute = sorted[0].ind.route;
  const bestDist = sorted[0].fitness;
  const elites = selectedElites.map((s) => ({
    route: s.ind.route,
    meta: s.ind.meta,
    fitness: s.fitness,
  }));

  return { population: nextGen, bestRoute, bestDist, elites };
}

// ============================================================
// BRANCH-AND-BOUND EXACT SOLVER (incremental, yields control)
// ============================================================
// Runs in batches so the UI stays responsive. Each call to
// branchAndBoundStep processes `batchSize` nodes, then returns.
// The solver state is kept in a mutable object passed by ref.

function initBranchAndBound(numCities, startIdx, cities) {
  // State object for the incremental solver
  const state = {
    n: numCities,
    startIdx,
    cities,
    bestDist: Infinity,
    bestRoute: null,
    // Stack-based DFS: each entry is { path, visited, cost }
    stack: [],
    nodesVisited: 0,
    finished: false,
  };

  // Seed the stack with the start city
  const visited = new Set([startIdx]);
  state.stack.push({ path: [startIdx], visited, cost: 0 });

  return state;
}

function branchAndBoundStep(state, batchSize) {
  const { n, startIdx, cities, stack } = state;
  let count = 0;

  while (stack.length > 0 && count < batchSize) {
    const { path, visited, cost } = stack.pop();
    count++;
    state.nodesVisited++;

    // If we have a complete path, check return-to-start distance
    if (path.length === n) {
      const totalCost = cost + dist(cities[path[path.length - 1]], cities[startIdx]);
      if (totalCost < state.bestDist) {
        state.bestDist = totalCost;
        state.bestRoute = [...path];
      }
      continue;
    }

    // Branch: try adding each unvisited city
    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue;

      const edgeCost = dist(cities[path[path.length - 1]], cities[i]);
      const newCost = cost + edgeCost;

      // Bound: prune if already worse than best known
      if (newCost >= state.bestDist) continue;

      const newVisited = new Set(visited);
      newVisited.add(i);
      stack.push({ path: [...path, i], visited: newVisited, cost: newCost });
    }
  }

  if (stack.length === 0) {
    state.finished = true;
  }
}

// ============================================================
// CONVERGENCE CHART COMPONENT
// ============================================================

function ConvergenceChart({ history, userDistance, exactDistance, compact = false }) {
  const W = compact ? 300 : 800;
  const H = compact ? 120 : 200;
  const PAD = compact ? { top: 10, right: 10, bottom: 20, left: 30 } : { top: 20, right: 20, bottom: 35, left: 55 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  if (history.length === 0) return null;

  const maxGen = history[history.length - 1].gen;
  const distances = history.map((h) => h.best);
  let minD = Math.min(...distances);
  let maxD = Math.max(...distances);
  if (userDistance && userDistance > maxD) maxD = userDistance;
  if (userDistance && userDistance < minD) minD = userDistance;
  if (exactDistance && exactDistance > maxD) maxD = exactDistance;
  if (exactDistance && exactDistance < minD) minD = exactDistance;
  // Add 5% padding to Y range
  const rangeD = maxD - minD || 1;
  minD -= rangeD * 0.05;
  maxD += rangeD * 0.05;

  const xScale = (gen) => PAD.left + (maxGen > 0 ? (gen / maxGen) * plotW : 0);
  const yScale = (d) => PAD.top + plotH - ((d - minD) / (maxD - minD)) * plotH;

  // Build path for the best-distance line
  const linePath = history
    .map((h, i) => `${i === 0 ? "M" : "L"}${xScale(h.gen).toFixed(1)},${yScale(h.best).toFixed(1)}`)
    .join(" ");

  // X-axis ticks (5-8 nice ticks)
  const xTicks = [];
  if (maxGen > 0) {
    const step = Math.max(1, Math.pow(10, Math.floor(Math.log10(maxGen))));
    const niceStep = maxGen / step < 3 ? step / 2 : step;
    for (let t = 0; t <= maxGen; t += niceStep) {
      xTicks.push(Math.round(t));
    }
    if (xTicks[xTicks.length - 1] < maxGen) xTicks.push(maxGen);
  }

  // Y-axis ticks (4-5 ticks)
  const yTicks = [];
  const yStep = (maxD - minD) / 4;
  for (let i = 0; i <= 4; i++) {
    yTicks.push(minD + i * yStep);
  }

  return (
    <div style={{
      background: "#f8fafc",
      borderRadius: 10,
      padding: 14,
      border: "1px solid #e2e8f0",
    }}>
      <div style={{ fontSize: compact ? 10 : 12, fontWeight: 700, color: "#334155", marginBottom: compact ? 4 : 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Convergence
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line key={`yg-${i}`} x1={PAD.left} x2={W - PAD.right} y1={yScale(t)} y2={yScale(t)}
            stroke="#e2e8f0" strokeWidth={1} />
        ))}

        {/* User distance reference line */}
        {userDistance && (
          <g>
            <line
              x1={PAD.left} x2={W - PAD.right}
              y1={yScale(userDistance)} y2={yScale(userDistance)}
              stroke="#facc15" strokeWidth={1.5} strokeDasharray="6,4"
            />
            <text
              x={W - PAD.right - 4} y={yScale(userDistance) - 5}
              fontSize={10} fill="#a16207" textAnchor="end" fontFamily="'Inter', sans-serif"
            >
              Your route: {Math.round(userDistance)}
            </text>
          </g>
        )}

        {/* Exact solver reference line */}
        {exactDistance && (
          <g>
            <line
              x1={PAD.left} x2={W - PAD.right}
              y1={yScale(exactDistance)} y2={yScale(exactDistance)}
              stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="6,4"
            />
            <text
              x={PAD.left + 4} y={yScale(exactDistance) - 5}
              fontSize={10} fill="#1d4ed8" textAnchor="start" fontFamily="'Inter', sans-serif"
            >
              Exact: {Math.round(exactDistance)}
            </text>
          </g>
        )}

        {/* GA best distance line */}
        <path d={linePath} fill="none" stroke="#ef4444" strokeWidth={2} />

        {/* Axes */}
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} stroke="#94a3b8" strokeWidth={1} />
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="#94a3b8" strokeWidth={1} />

        {/* X ticks */}
        {xTicks.map((t, i) => (
          <text key={`xt-${i}`} x={xScale(t)} y={H - PAD.bottom + 16}
            fontSize={10} fill="#64748b" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
            {t}
          </text>
        ))}

        {/* Y ticks */}
        {yTicks.map((t, i) => (
          <text key={`yt-${i}`} x={PAD.left - 8} y={yScale(t) + 4}
            fontSize={10} fill="#64748b" textAnchor="end" fontFamily="'JetBrains Mono', monospace">
            {Math.round(t)}
          </text>
        ))}

        {/* Axis labels */}
        {!compact && (
          <>
            <text x={W / 2} y={H - 2} fontSize={11} fill="#64748b" textAnchor="middle" fontFamily="'Inter', sans-serif">
              Generation
            </text>
            <text x={14} y={H / 2} fontSize={11} fill="#64748b" textAnchor="middle" fontFamily="'Inter', sans-serif"
              transform={`rotate(-90, 14, ${H / 2})`}>
              Distance
            </text>
          </>
        )}

        {/* Current best label */}
        {history.length > 0 && (
          <text
            x={xScale(history[history.length - 1].gen) + 4}
            y={yScale(history[history.length - 1].best) - 6}
            fontSize={10} fill="#ef4444" fontWeight={700} fontFamily="'JetBrains Mono', monospace"
          >
            {Math.round(history[history.length - 1].best)}
          </text>
        )}
      </svg>
    </div>
  );
}

// ============================================================
// SHARED SUB-SEQUENCE FINDER
// ============================================================

// Find all sub-sequences of length >= minLen shared between routes.
// Returns a Map: routeIndex -> Set of city-index positions that are part of shared sequences.
// "some" = shared by 2+ elites, "all" = shared by ALL elites.
function findSharedSubsequences(elites, minLen) {
  if (elites.length < 2 || minLen < 2) return { some: new Map(), all: new Map() };

  // Extract all sub-sequences of length minLen..route.length from each route
  // A sub-sequence is a consecutive run of city IDs (including wrap-around for the circular tour)
  const routeSubseqs = elites.map((e) => {
    const r = e.route;
    const n = r.length;
    const seqs = new Map(); // key: "cityA,cityB,cityC" -> [startPos]
    for (let len = minLen; len <= n; len++) {
      for (let start = 0; start < n; start++) {
        const seq = [];
        for (let k = 0; k < len; k++) {
          seq.push(r[(start + k) % n]);
        }
        const key = seq.join(",");
        if (!seqs.has(key)) seqs.set(key, []);
        seqs.get(key).push(start);
      }
    }
    return seqs;
  });

  // Count how many routes contain each sub-sequence
  const allKeys = new Set();
  routeSubseqs.forEach((seqs) => {
    for (const key of seqs.keys()) allKeys.add(key);
  });

  const somePositions = new Map(); // routeIdx -> Set<position>
  const allPositions = new Map();
  elites.forEach((_, i) => {
    somePositions.set(i, new Set());
    allPositions.set(i, new Set());
  });

  for (const key of allKeys) {
    const parts = key.split(",").map(Number);
    const len = parts.length;
    // Which routes have this sub-sequence?
    const presentIn = [];
    for (let ri = 0; ri < elites.length; ri++) {
      if (routeSubseqs[ri].has(key)) {
        presentIn.push(ri);
      }
    }

    if (presentIn.length >= 2) {
      // Mark positions in each route that has this sub-sequence
      for (const ri of presentIn) {
        const starts = routeSubseqs[ri].get(key);
        const n = elites[ri].route.length;
        for (const start of starts) {
          for (let k = 0; k < len; k++) {
            somePositions.get(ri).add((start + k) % n);
          }
        }
      }
    }

    if (presentIn.length === elites.length) {
      for (const ri of presentIn) {
        const starts = routeSubseqs[ri].get(key);
        const n = elites[ri].route.length;
        for (const start of starts) {
          for (let k = 0; k < len; k++) {
            allPositions.get(ri).add((start + k) % n);
          }
        }
      }
    }
  }

  return { some: somePositions, all: allPositions };
}

// ============================================================
// ELITE PANEL COMPONENT
// ============================================================

function ElitePanel({ elites, cities, minSeqLength, setMinSeqLength, selectedEliteIdx, setSelectedEliteIdx, currentGen, onClose }) {
  // Compute shared sub-sequences
  const { some: someShared, all: allShared } = useMemo(
    () => findSharedSubsequences(elites, minSeqLength),
    [elites, minSeqLength]
  );

  if (elites.length === 0) return null;

  return (
    <div style={{
      background: "#fff7ed",
      borderRadius: 10,
      padding: 14,
      border: "1px solid #fed7aa",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9a3412", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Elite Analysis
          <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 8, fontSize: 11, color: "#c2410c" }}>
            (paused — {elites.length} elites)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 11, color: "#9a3412", fontWeight: 600 }}>Min shared sequence:</label>
          <input
            type="range" min={2} max={Math.max(2, Math.floor(elites[0]?.route.length / 2) || 5)}
            value={minSeqLength}
            onChange={(e) => setMinSeqLength(parseInt(e.target.value))}
            style={{ width: 100, accentColor: "#f97316" }}
          />
          <span style={{ fontSize: 12, fontFamily: "monospace", color: "#9a3412", minWidth: 20 }}>{minSeqLength}</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #fed7aa",
              borderRadius: 6,
              color: "#9a3412",
              fontSize: 14,
              fontWeight: 700,
              width: 26,
              height: 26,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 4,
            }}
            title="Close elite analysis"
          >
            X
          </button>
        </div>
      </div>

      {/* Color key */}
      <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 11, color: "#78350f" }}>
        <span><span style={{ background: "#fde68a", padding: "1px 6px", borderRadius: 3, marginRight: 4 }}>yellow</span> shared by 2+ elites</span>
        <span><span style={{ background: "#86efac", padding: "1px 6px", borderRadius: 3, marginRight: 4 }}>green</span> shared by ALL elites</span>
      </div>

      {/* Elite sequences */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {elites.map((elite, idx) => {
          const isSelected = selectedEliteIdx === idx;
          const age = currentGen - elite.meta.born;
          const someSet = someShared.get(idx) || new Set();
          const allSet = allShared.get(idx) || new Set();

          return (
            <div
              key={idx}
              onClick={() => setSelectedEliteIdx(isSelected ? null : idx)}
              style={{
                background: isSelected ? "#ffedd5" : "white",
                border: isSelected ? "2px solid #f97316" : "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "8px 10px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {/* Header: rank, distance, metadata */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    background: idx === 0 ? "#f97316" : "#94a3b8",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 4,
                  }}>
                    #{idx + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>
                    {Math.round(elite.fitness)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 10, color: "#64748b" }}>
                  <span>born: gen {elite.meta.born}</span>
                  <span>age: {age}</span>
                  <span style={{
                    background: "#f1f5f9",
                    padding: "1px 5px",
                    borderRadius: 3,
                    fontFamily: "monospace",
                  }}>{elite.meta.method}</span>
                </div>
              </div>

              {/* City sequence with highlighting */}
              <div style={{ fontSize: 11, lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace", color: "#334155" }}>
                {elite.route.map((cityId, pos) => {
                  const inAll = allSet.has(pos);
                  const inSome = someSet.has(pos);
                  const bg = inAll ? "#86efac" : inSome ? "#fde68a" : "transparent";
                  const city = cities[cityId];
                  return (
                    <span key={pos}>
                      {pos > 0 && <span style={{ color: "#cbd5e1" }}> → </span>}
                      <span style={{
                        background: bg,
                        padding: bg !== "transparent" ? "0px 3px" : 0,
                        borderRadius: 3,
                      }}>
                        {city?.name || cityId}
                      </span>
                    </span>
                  );
                })}
                <span style={{ color: "#cbd5e1" }}> → </span>
                <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                  {cities[elite.route[0]]?.name || elite.route[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MAP COMPONENT
// ============================================================

function MapView({ cities, userPath, bestRoute, exactRoute, selectedEliteRoute, startCityId, onCityClick, hoveredCity, setHoveredCity, selectedCity, setSelectedCity }) {
  const MAP_W = 800;
  const MAP_H = 600;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      style={{
        background: "#2d5a27",
        borderRadius: 12,
        border: "1px solid #1a3a15",
        cursor: "crosshair",
      }}
    >
      {/* Subtle grid for depth */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3a6e33" strokeWidth="0.5" opacity="0.3" />
        </pattern>
      </defs>
      <rect width={MAP_W} height={MAP_H} fill="url(#grid)" />

      {/* Exact solver's best route (blue dashed) */}
      {exactRoute && exactRoute.length > 1 && (
        <g>
          {exactRoute.map((cityIdx, i) => {
            const next = exactRoute[(i + 1) % exactRoute.length];
            return (
              <line
                key={`exact-${i}`}
                x1={cities[cityIdx].x}
                y1={cities[cityIdx].y}
                x2={cities[next].x}
                y2={cities[next].y}
                stroke="#3b82f6"
                strokeWidth={2.5}
                opacity={0.7}
                strokeDasharray="8,4"
              />
            );
          })}
        </g>
      )}

      {/* GA's best route (red solid) */}
      {bestRoute && bestRoute.length > 1 && (
        <g>
          {bestRoute.map((cityIdx, i) => {
            const next = bestRoute[(i + 1) % bestRoute.length];
            return (
              <line
                key={`best-${i}`}
                x1={cities[cityIdx].x}
                y1={cities[cityIdx].y}
                x2={cities[next].x}
                y2={cities[next].y}
                stroke="#ef4444"
                strokeWidth={2}
                opacity={0.7}
              />
            );
          })}
        </g>
      )}

      {/* Selected elite route (orange) */}
      {selectedEliteRoute && selectedEliteRoute.length > 1 && (
        <g>
          {selectedEliteRoute.map((cityIdx, i) => {
            const next = selectedEliteRoute[(i + 1) % selectedEliteRoute.length];
            return (
              <line
                key={`elite-${i}`}
                x1={cities[cityIdx].x}
                y1={cities[cityIdx].y}
                x2={cities[next].x}
                y2={cities[next].y}
                stroke="#f97316"
                strokeWidth={3}
                opacity={0.8}
                strokeDasharray="5,3"
              />
            );
          })}
        </g>
      )}

      {/* User's path (yellow) */}
      {userPath.length > 1 && (
        <g>
          {userPath.map((cityIdx, i) => {
            if (i === userPath.length - 1) return null;
            const next = userPath[i + 1];
            return (
              <line
                key={`user-${i}`}
                x1={cities[cityIdx].x}
                y1={cities[cityIdx].y}
                x2={cities[next].x}
                y2={cities[next].y}
                stroke="#facc15"
                strokeWidth={2.5}
                opacity={0.9}
                strokeDasharray="6,3"
              />
            );
          })}
          {/* If user completed the loop, draw return line */}
          {userPath.length === cities.length && (
            <line
              x1={cities[userPath[userPath.length - 1]].x}
              y1={cities[userPath[userPath.length - 1]].y}
              x2={cities[userPath[0]].x}
              y2={cities[userPath[0]].y}
              stroke="#facc15"
              strokeWidth={2.5}
              opacity={0.9}
              strokeDasharray="6,3"
            />
          )}
        </g>
      )}

      {/* Cities */}
      {cities.map((city) => {
        const isHovered = hoveredCity === city.id;
        const isSelected = selectedCity === city.id;
        const isInUserPath = userPath.includes(city.id);
        const r = isHovered ? 8 : 6;

        return (
          <g
            key={city.id}
            onClick={() => onCityClick(city.id)}
            onMouseEnter={() => setHoveredCity(city.id)}
            onMouseLeave={() => setHoveredCity(null)}
            style={{ cursor: "pointer" }}
          >
            {/* Outer ring */}
            <circle
              cx={city.x}
              cy={city.y}
              r={r}
              fill={isInUserPath ? "#facc15" : "white"}
              stroke="#1a1a1a"
              strokeWidth={2}
              opacity={0.95}
            />
            {/* Start city: black center dot */}
            {city.isStart && (
              <circle cx={city.x} cy={city.y} r={3} fill="#1a1a1a" />
            )}
            {/* Hover tooltip */}
            {isHovered && (
              <g>
                <rect
                  x={city.x + 12}
                  y={city.y - 28}
                  width={Math.max(city.name.length * 7.5 + 16, 120)}
                  height={38}
                  rx={6}
                  fill="rgba(0,0,0,0.85)"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1}
                />
                <text
                  x={city.x + 20}
                  y={city.y - 14}
                  fontSize={11}
                  fontWeight={600}
                  fill="white"
                  fontFamily="'Inter', sans-serif"
                >
                  {city.name}
                </text>
                <text
                  x={city.x + 20}
                  y={city.y + 1}
                  fontSize={9}
                  fill="#94a3b8"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  ({Math.round(city.x)}, {Math.round(city.y)})
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// MAIN APP COMPONENT
// ============================================================

export default function TspSolver() {
  const containerRef = useRef(null);
  const [layoutMode, setLayoutMode] = useState('wide');
  const [availHeight, setAvailHeight] = useState(600);
  const [controlTab, setControlTab] = useState('setup');

  const [numCities, setNumCities] = useState(10);
  const [seed, setSeed] = useState(42);
  const [cities, setCities] = useState(() => generateCities(10, 42));
  const [userPath, setUserPath] = useState([]);
  const [bestRoute, setBestRoute] = useState(null);
  const [hoveredCity, setHoveredCity] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // GA parameters
  const [popSize, setPopSize] = useState(100);
  const [mutationRate, setMutationRate] = useState(0.02);
  const [eliteCount, setEliteCount] = useState(5);
  const [stagnationLimit, setStagnationLimit] = useState(500);
  const [maxSameRatio, setMaxSameRatio] = useState(0.75); // 0=all unique, 1=allow all duplicates
  const [speed, setSpeed] = useState(2); // 0=1x(50ms), 1=5x(10ms), 2=Max(0ms)
  const speedLabels = ["1x", "5x", "Max"];
  const speedDelays = [50, 10, 0];

  // GA running state
  const [gaRunning, setGaRunning] = useState(false);
  const [gaGeneration, setGaGeneration] = useState(0);
  const [gaHistory, setGaHistory] = useState([]); // [{ gen, best }]
  const [gaBestDist, setGaBestDist] = useState(null);
  const [gaLastImproved, setGaLastImproved] = useState(0);
  const [gaFinished, setGaFinished] = useState(false);

  // GA refs for the animation loop (avoid stale closures)
  const gaPopRef = useRef(null);
  const gaRngRef = useRef(null);
  const gaGenRef = useRef(0);
  const gaBestDistRef = useRef(Infinity);
  const gaLastImprovedRef = useRef(0);
  const gaHistoryRef = useRef([]);
  const gaRunningRef = useRef(false);
  const gaTimerRef = useRef(null);

  // Exact solver state
  const [exactEnabled, setExactEnabled] = useState(true);
  const [exactRoute, setExactRoute] = useState(null);
  const [exactDist, setExactDist] = useState(null);
  const [exactFinished, setExactFinished] = useState(false);
  const [exactNodes, setExactNodes] = useState(0);
  const exactStateRef = useRef(null);
  const exactRunningRef = useRef(false);
  const exactTimerRef = useRef(null);

  // Auto-disable exact solver above 20 cities
  const exactAvailable = cities.length <= 20;

  // Elite analysis state (computed when paused)
  const [displayElites, setDisplayElites] = useState([]);
  const [selectedEliteIdx, setSelectedEliteIdx] = useState(null);
  const [minSeqLength, setMinSeqLength] = useState(3);
  const [elitePanelOpen, setElitePanelOpen] = useState(false);
  const gaElitesRef = useRef([]);

  const startCity = useMemo(() => cities.find((c) => c.isStart), [cities]);

  // Layout detection: wide (>1.2 AR) vs tall (<=1.2 AR)
  useEffect(() => {
    const computeLayout = () => {
      const ww = window.innerWidth;
      const wh = window.innerHeight;
      const aH = wh - 120;
      setAvailHeight(aH);
      setLayoutMode(ww / wh > 1.2 ? 'wide' : 'tall');
    };

    computeLayout();
    const raf = requestAnimationFrame(computeLayout);
    const timer = setTimeout(computeLayout, 200);
    window.addEventListener('resize', computeLayout);

    const ro = typeof window !== 'undefined' && window.ResizeObserver
      ? new window.ResizeObserver(computeLayout)
      : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', computeLayout);
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      if (ro) ro.disconnect();
    };
  }, []);

  // Stop the exact solver helper
  const stopExact = useCallback(() => {
    exactRunningRef.current = false;
    if (exactTimerRef.current) {
      clearTimeout(exactTimerRef.current);
      cancelAnimationFrame(exactTimerRef.current);
    }
  }, []);

  // Start the exact solver (runs independently of GA)
  const startExact = useCallback(() => {
    stopExact();
    const state = initBranchAndBound(cities.length, startCity.id, cities);
    exactStateRef.current = state;
    exactRunningRef.current = true;
    setExactRoute(null);
    setExactDist(null);
    setExactFinished(false);
    setExactNodes(0);

    // Batch size: more cities = smaller batches to stay responsive
    const batchSize = cities.length <= 10 ? 50000 : cities.length <= 15 ? 10000 : 2000;

    const runExactStep = () => {
      if (!exactRunningRef.current) return;
      const s = exactStateRef.current;

      branchAndBoundStep(s, batchSize);

      // Update React state
      setExactNodes(s.nodesVisited);
      if (s.bestRoute) {
        setExactRoute(s.bestRoute);
        setExactDist(s.bestDist);
      }

      if (s.finished) {
        exactRunningRef.current = false;
        setExactFinished(true);
        return;
      }

      exactTimerRef.current = requestAnimationFrame(runExactStep);
    };

    requestAnimationFrame(runExactStep);
  }, [cities, startCity, stopExact]);

  // Start or stop the GA (and optionally exact solver)
  const handleStartStopGA = useCallback(() => {
    if (gaRunning) {
      // Stop both
      gaRunningRef.current = false;
      setGaRunning(false);
      if (gaTimerRef.current) clearTimeout(gaTimerRef.current);
      stopExact();
      // Snapshot elites for analysis
      setDisplayElites(gaElitesRef.current);
      setSelectedEliteIdx(null);
      setElitePanelOpen(true);
      return;
    }

    // Initialize if starting fresh (generation 0 or finished)
    if (gaGenRef.current === 0 || gaFinished) {
      const rng = seededRng(Date.now());
      gaRngRef.current = rng;
      gaPopRef.current = initPopulation(popSize, cities.length, startCity.id, rng);
      gaGenRef.current = 0;
      gaBestDistRef.current = Infinity;
      gaLastImprovedRef.current = 0;
      gaHistoryRef.current = [];
      setGaGeneration(0);
      setGaBestDist(null);
      setGaLastImproved(0);
      setGaHistory([]);
      setGaFinished(false);
      setDisplayElites([]);
      setSelectedEliteIdx(null);
      setElitePanelOpen(false);

      // Also start exact solver if enabled and available
      if (exactEnabled && exactAvailable) {
        startExact();
      }
    }

    gaRunningRef.current = true;
    setGaRunning(true);

    const runStep = () => {
      if (!gaRunningRef.current) return;

      const params = {
        eliteCount,
        mutationRate,
        tournamentSize: 3,
        maxSameRatio,
      };

      const nextGenNum = gaGenRef.current + 1;
      const result = evolveOnce(gaPopRef.current, cities, params, gaRngRef.current, nextGenNum);
      gaPopRef.current = result.population;
      gaGenRef.current = nextGenNum;

      // Track best and elites
      if (result.bestDist < gaBestDistRef.current) {
        gaBestDistRef.current = result.bestDist;
        gaLastImprovedRef.current = gaGenRef.current;
        setBestRoute(result.bestRoute);
      }
      gaElitesRef.current = result.elites;

      // Record history (sample to keep chart manageable)
      const gen = gaGenRef.current;
      const hist = gaHistoryRef.current;
      // Always record first 100, then every 10th, then every 100th past 1000
      if (gen <= 100 || (gen <= 1000 && gen % 10 === 0) || gen % 100 === 0) {
        hist.push({ gen, best: gaBestDistRef.current });
      }

      // Update React state periodically (every N steps for performance)
      const delay = speedDelays[speed];
      const updateEvery = delay === 0 ? 20 : 1;
      if (gen % updateEvery === 0) {
        setGaGeneration(gen);
        setGaBestDist(gaBestDistRef.current);
        setGaLastImproved(gaLastImprovedRef.current);
        setGaHistory([...hist]);
      }

      // Check stagnation
      if (gen - gaLastImprovedRef.current >= stagnationLimit) {
        gaRunningRef.current = false;
        setGaRunning(false);
        setGaFinished(true);
        // Final state update
        setGaGeneration(gen);
        setGaBestDist(gaBestDistRef.current);
        setGaLastImproved(gaLastImprovedRef.current);
        setGaHistory([...hist]);
        // Snapshot elites for analysis
        setDisplayElites(gaElitesRef.current);
        setSelectedEliteIdx(null);
        setElitePanelOpen(true);
        return;
      }

      if (delay === 0) {
        // Run multiple steps per frame for max speed
        gaTimerRef.current = requestAnimationFrame(runStep);
      } else {
        gaTimerRef.current = setTimeout(runStep, delay);
      }
    };

    runStep();
  }, [gaRunning, gaFinished, popSize, cities, startCity, eliteCount, mutationRate, stagnationLimit, maxSameRatio, speed, exactEnabled, exactAvailable, startExact, stopExact]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gaRunningRef.current = false;
      if (gaTimerRef.current) {
        clearTimeout(gaTimerRef.current);
        cancelAnimationFrame(gaTimerRef.current);
      }
      exactRunningRef.current = false;
      if (exactTimerRef.current) {
        clearTimeout(exactTimerRef.current);
        cancelAnimationFrame(exactTimerRef.current);
      }
    };
  }, []);

  // Generate new cities
  const handleGenerate = useCallback(() => {
    // Stop GA and exact solver if running
    gaRunningRef.current = false;
    setGaRunning(false);
    if (gaTimerRef.current) clearTimeout(gaTimerRef.current);
    stopExact();

    const newSeed = Math.floor(Math.random() * 100000);
    setSeed(newSeed);
    const newCities = generateCities(numCities, newSeed);
    setCities(newCities);
    setUserPath([]);
    setBestRoute(null);
    setSelectedCity(null);

    // Reset GA state
    gaGenRef.current = 0;
    gaBestDistRef.current = Infinity;
    gaLastImprovedRef.current = 0;
    gaHistoryRef.current = [];
    gaPopRef.current = null;
    setGaGeneration(0);
    setGaBestDist(null);
    setGaLastImproved(0);
    setGaHistory([]);
    setGaFinished(false);

    // Reset exact solver state
    exactStateRef.current = null;
    setExactRoute(null);
    setExactDist(null);
    setExactFinished(false);
    setExactNodes(0);

    // Auto-enable exact if new city count allows it
    if (numCities > 20) setExactEnabled(false);
  }, [numCities, stopExact]);

  // Reset everything
  const handleReset = useCallback(() => {
    setUserPath([]);
    setBestRoute(null);
    setSelectedCity(null);
  }, []);

  // Reset just the user path
  const handleResetUserPath = useCallback(() => {
    setUserPath([]);
  }, []);

  // Handle city click for user path building
  const handleCityClick = useCallback((cityId) => {
    setSelectedCity(cityId);

    const city = cities.find((c) => c.id === cityId);
    if (!city) return;

    setUserPath((prev) => {
      // If path is empty, only allow starting from the start city
      if (prev.length === 0) {
        if (city.isStart) return [cityId];
        return prev; // must start from start city
      }

      // Don't allow clicking a city already in the path
      if (prev.includes(cityId)) return prev;

      // If we've visited all cities, path is complete
      if (prev.length >= cities.length) return prev;

      return [...prev, cityId];
    });
  }, [cities]);

  // Calculate user path distance
  const userDistance = useMemo(() => {
    if (userPath.length < 2) return null;
    let d = 0;
    for (let i = 0; i < userPath.length - 1; i++) {
      d += dist(cities[userPath[i]], cities[userPath[i + 1]]);
    }
    // If complete loop, add return to start
    if (userPath.length === cities.length) {
      d += dist(cities[userPath[userPath.length - 1]], cities[userPath[0]]);
    }
    return d;
  }, [userPath, cities]);

  const userPathComplete = userPath.length === cities.length;

  const buttonStyle = {
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 600,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: "'Inter', -apple-system, sans-serif",
        width: "100%",
        height: `${availHeight}px`,
        display: "flex",
        flexDirection: layoutMode === 'wide' ? 'row' : 'column',
        gap: 12,
        padding: 12,
        overflow: "hidden",
      }}
    >
      {/* WIDE MODE: side-by-side (LEFT: Map, RIGHT: Controls) */}
      {layoutMode === 'wide' && (
        <>
          {/* LEFT: Map taking ~60-65% width */}
          <div style={{
            flex: "0 0 calc(62% - 6px)",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            borderRadius: 12,
          }}>
            <MapView
              cities={cities}
              userPath={userPath}
              bestRoute={bestRoute}
              exactRoute={exactRoute}
              selectedEliteRoute={selectedEliteIdx !== null && displayElites[selectedEliteIdx] ? displayElites[selectedEliteIdx].route : null}
              startCityId={startCity?.id}
              onCityClick={handleCityClick}
              hoveredCity={hoveredCity}
              setHoveredCity={setHoveredCity}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
            />
            {/* Map overlay: distance + stats */}
            <div style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "rgba(0,0,0,0.7)",
              borderRadius: 8,
              padding: "8px 14px",
              color: "white",
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              display: "flex",
              gap: 12,
              pointerEvents: "none",
              flexWrap: "wrap",
            }}>
              <span>Cities: <b style={{ color: "#4ade80" }}>{cities.length}</b></span>
              {userPath.length > 0 && (
                <span>Visited: <b style={{ color: "#facc15" }}>{userPath.length}/{cities.length}</b></span>
              )}
              {userPath.length >= 2 && (
                <span>{userPathComplete ? "Your route" : "So far"}: <b style={{ color: "#facc15" }}>{Math.round(userDistance)}</b></span>
              )}
              {bestRoute && (
                <span>GA: <b style={{ color: "#ef4444" }}>{Math.round(totalDistance(bestRoute, cities))}</b></span>
              )}
              {exactRoute && (
                <span>Exact: <b style={{ color: "#3b82f6" }}>{Math.round(totalDistance(exactRoute, cities))}</b></span>
              )}
            </div>
          </div>

          {/* RIGHT: Side panel (35-40% width) with scrollable content */}
          <div style={{
            flex: "1 1 calc(38% - 6px)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            overflow: "hidden",
            minWidth: 0,
          }}>
            {/* Map Setup section */}
            <div style={{
              background: "#f0fdf4",
              borderRadius: 10,
              padding: 10,
              border: "1px solid #bbf7d0",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Map Setup
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>Cities</label>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#166534" }}>{numCities}</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={200}
                  value={numCities}
                  onChange={(e) => setNumCities(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#22c55e" }}
                />
              </div>
              <button
                onClick={handleGenerate}
                style={{ ...buttonStyle, background: "#22c55e", color: "white", width: "100%", padding: "6px 12px", fontSize: 12 }}
              >
                Generate
              </button>
            </div>

            {/* Your Path section */}
            <div style={{
              background: "#fefce8",
              borderRadius: 10,
              padding: 10,
              border: "1px solid #fde68a",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a16207", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Your Path
              </div>
              <div style={{ fontSize: 12, color: "#92400e", marginBottom: 6, lineHeight: 1.4 }}>
                {userPath.length === 0 ? (
                  <span style={{ fontSize: 11 }}>Click start city to begin.</span>
                ) : (
                  <>
                    <div style={{ marginBottom: 3 }}><b>{userPath.length} / {cities.length}</b></div>
                    {userPathComplete && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", marginBottom: 3 }}>Complete!</div>
                    )}
                    {userPath.length >= 2 && (
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", fontFamily: "monospace" }}>
                        {Math.round(userDistance)}
                      </div>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={handleResetUserPath}
                style={{ ...buttonStyle, background: "#fbbf24", color: "#92400e", width: "100%", padding: "4px 10px", fontSize: 11 }}
              >
                Reset
              </button>
            </div>

            {/* Scrollable area for GA controls and stats */}
            <div style={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minHeight: 0,
            }}>
              {/* GA Controls section */}
              <div style={{
                background: "#fef2f2",
                borderRadius: 10,
                padding: 10,
                border: "1px solid #fecaca",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  GA Controls
                </div>

                {/* GA sliders in compact 2-column grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 8,
                }}>
                  {/* Population */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: "#991b1b" }}>Pop</label>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#991b1b" }}>{popSize}</span>
                    </div>
                    <input type="range" min={20} max={500} step={10} value={popSize}
                      onChange={(e) => setPopSize(parseInt(e.target.value))}
                      disabled={gaRunning}
                      style={{ width: "100%", accentColor: "#ef4444", height: 4 }} />
                  </div>

                  {/* Mutation */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: "#991b1b" }}>Mut</label>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#991b1b" }}>{(mutationRate * 100).toFixed(1)}%</span>
                    </div>
                    <input type="range" min={1} max={100} value={mutationRate * 1000}
                      onChange={(e) => setMutationRate(parseInt(e.target.value) / 1000)}
                      disabled={gaRunning}
                      style={{ width: "100%", accentColor: "#ef4444", height: 4 }} />
                  </div>

                  {/* Elites */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: "#991b1b" }}>Elite</label>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#991b1b" }}>{eliteCount}</span>
                    </div>
                    <input type="range" min={1} max={20} value={eliteCount}
                      onChange={(e) => setEliteCount(parseInt(e.target.value))}
                      disabled={gaRunning}
                      style={{ width: "100%", accentColor: "#ef4444", height: 4 }} />
                  </div>

                  {/* Stagnation */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: "#991b1b" }}>Stag</label>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#991b1b" }}>{stagnationLimit}</span>
                    </div>
                    <input type="range" min={50} max={2000} step={50} value={stagnationLimit}
                      onChange={(e) => setStagnationLimit(parseInt(e.target.value))}
                      disabled={gaRunning}
                      style={{ width: "100%", accentColor: "#ef4444", height: 4 }} />
                  </div>

                  {/* Diversity */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: "#991b1b" }}>Diversity</label>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#991b1b" }}>{Math.round((1 - maxSameRatio) * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={Math.round((1 - maxSameRatio) * 100)}
                      onChange={(e) => setMaxSameRatio(1 - parseInt(e.target.value) / 100)}
                      disabled={gaRunning}
                      style={{ width: "100%", accentColor: "#ef4444", height: 4 }} />
                  </div>
                </div>

                {/* Speed buttons in a row */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#991b1b", marginBottom: 3 }}>Speed</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {speedLabels.map((label, i) => (
                      <button key={label}
                        onClick={() => setSpeed(i)}
                        style={{
                          ...buttonStyle,
                          padding: "3px 8px",
                          fontSize: 10,
                          flex: 1,
                          background: speed === i ? "#ef4444" : "#fecaca",
                          color: speed === i ? "white" : "#991b1b",
                        }}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* Exact solver toggle */}
                <div style={{ marginBottom: 8, opacity: exactAvailable ? 1 : 0.5 }}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: 6,
                    cursor: exactAvailable && !gaRunning ? "pointer" : "default",
                    fontSize: 11, color: "#991b1b",
                  }}>
                    <input
                      type="checkbox"
                      checked={exactEnabled && exactAvailable}
                      onChange={(e) => setExactEnabled(e.target.checked)}
                      disabled={!exactAvailable || gaRunning}
                      style={{ accentColor: "#3b82f6" }}
                    />
                    Exact {exactAvailable ? "(on)" : "(off)"}
                  </label>
                </div>

                {/* GA Start/Stop buttons */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={handleStartStopGA}
                    disabled={cities.length < 3}
                    style={{
                      ...buttonStyle,
                      padding: "6px 14px",
                      background: gaRunning ? "#991b1b" : "#ef4444",
                      color: "white",
                      fontSize: 12,
                      flex: 1,
                    }}
                  >
                    {gaRunning ? "Stop" : (gaFinished ? "Restart" : "Start")}
                  </button>
                  {!gaRunning && displayElites.length > 0 && !elitePanelOpen && (
                    <button
                      onClick={() => { setElitePanelOpen(true); setSelectedEliteIdx(null); }}
                      style={{
                        ...buttonStyle,
                        padding: "6px 12px",
                        background: "#f97316",
                        color: "white",
                        fontSize: 12,
                      }}
                    >
                      Elites
                    </button>
                  )}
                </div>
              </div>

              {/* GA Stats line */}
              {(gaGeneration > 0 || gaFinished) && (
                <div style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#991b1b",
                  background: "#fef2f2",
                  borderRadius: 8,
                  padding: 8,
                  border: "1px solid #fecaca",
                }}>
                  <div style={{ marginBottom: 3 }}>Gen: <b>{gaGeneration}</b> | Best: <b>{gaBestDist !== null ? Math.round(gaBestDist) : "—"}</b></div>
                  <div>Last improved: gen <b>{gaLastImproved}</b></div>
                  {gaFinished && (
                    <div style={{ color: "#22c55e", fontWeight: 700, marginTop: 3, fontSize: 9 }}>
                      Stopped (stagnation)
                    </div>
                  )}
                </div>
              )}

              {/* Exact Stats */}
              {exactEnabled && exactAvailable && (exactRoute || exactFinished) && (
                <div style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#1d4ed8",
                  background: "#eff6ff",
                  borderRadius: 8,
                  padding: 8,
                  border: "1px solid #bfdbfe",
                }}>
                  <div style={{ marginBottom: 3 }}>Exact: <b>{exactDist !== null ? Math.round(exactDist) : "—"}</b></div>
                  <div>Nodes: <b>{exactNodes.toLocaleString()}</b></div>
                  {exactFinished && (
                    <div style={{ color: "#22c55e", fontWeight: 700, marginTop: 3, fontSize: 9 }}>
                      Optimal!
                    </div>
                  )}
                </div>
              )}

              {/* Convergence Chart - Compact */}
              {gaHistory.length > 0 && (
                <ConvergenceChart
                  history={gaHistory}
                  userDistance={userPathComplete ? userDistance : null}
                  exactDistance={exactDist}
                  compact={true}
                />
              )}
            </div>
          </div>

          {/* Elite panel - overlaid or in scrollable area if space */}
          {!gaRunning && elitePanelOpen && displayElites.length > 0 && (
            <div style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 300,
              maxHeight: availHeight - 24,
              overflow: "auto",
              zIndex: 10,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}>
              <ElitePanel
                elites={displayElites}
                cities={cities}
                minSeqLength={minSeqLength}
                setMinSeqLength={setMinSeqLength}
                selectedEliteIdx={selectedEliteIdx}
                setSelectedEliteIdx={setSelectedEliteIdx}
                currentGen={gaGeneration}
                onClose={() => { setElitePanelOpen(false); setSelectedEliteIdx(null); }}
              />
            </div>
          )}
        </>
      )}

      {/* TALL MODE: stacked layout with tabs */}
      {layoutMode === 'tall' && (
        <>
          {/* TOP: Map taking ~55% height */}
          <div style={{
            flex: "0 0 55%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            borderRadius: 12,
          }}>
            <MapView
              cities={cities}
              userPath={userPath}
              bestRoute={bestRoute}
              exactRoute={exactRoute}
              selectedEliteRoute={selectedEliteIdx !== null && displayElites[selectedEliteIdx] ? displayElites[selectedEliteIdx].route : null}
              startCityId={startCity?.id}
              onCityClick={handleCityClick}
              hoveredCity={hoveredCity}
              setHoveredCity={setHoveredCity}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
            />
            {/* Map overlay */}
            <div style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "rgba(0,0,0,0.7)",
              borderRadius: 8,
              padding: "6px 12px",
              color: "white",
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              display: "flex",
              gap: 10,
              pointerEvents: "none",
              flexWrap: "wrap",
            }}>
              <span>Cities: <b style={{ color: "#4ade80" }}>{cities.length}</b></span>
              {userPath.length > 0 && (
                <span>Visited: <b style={{ color: "#facc15" }}>{userPath.length}/{cities.length}</b></span>
              )}
              {userPath.length >= 2 && (
                <span>{userPathComplete ? "Your" : "So far"}: <b style={{ color: "#facc15" }}>{Math.round(userDistance)}</b></span>
              )}
              {bestRoute && (
                <span>GA: <b style={{ color: "#ef4444" }}>{Math.round(totalDistance(bestRoute, cities))}</b></span>
              )}
            </div>
          </div>

          {/* BOTTOM: Tabbed panel (45% height) */}
          <div style={{
            flex: "1 1 45%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}>
            {/* Tabs */}
            <div style={{
              display: "flex",
              gap: 0,
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
              padding: "0 8px",
            }}>
              {["setup", "ga", "stats"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setControlTab(tab)}
                  style={{
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    color: controlTab === tab ? "#1e293b" : "#94a3b8",
                    borderBottom: controlTab === tab ? "2px solid #ef4444" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textTransform: "capitalize",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content area - scrollable */}
            <div style={{
              flex: 1,
              overflow: "auto",
              padding: 12,
              display: controlTab ? "block" : "none",
            }}>
              {/* SETUP TAB */}
              {controlTab === "setup" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Map Setup */}
                  <div style={{
                    background: "#f0fdf4",
                    borderRadius: 10,
                    padding: 12,
                    border: "1px solid #bbf7d0",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Map Setup
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>Cities</label>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: "#166534" }}>{numCities}</span>
                      </div>
                      <input
                        type="range"
                        min={3}
                        max={200}
                        value={numCities}
                        onChange={(e) => setNumCities(parseInt(e.target.value))}
                        style={{ width: "100%", accentColor: "#22c55e" }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", marginBottom: 8 }}>
                      seed: {seed}
                    </div>
                    <button
                      onClick={handleGenerate}
                      style={{ ...buttonStyle, background: "#22c55e", color: "white", width: "100%" }}
                    >
                      Generate New Map
                    </button>
                  </div>

                  {/* Your Path */}
                  <div style={{
                    background: "#fefce8",
                    borderRadius: 10,
                    padding: 12,
                    border: "1px solid #fde68a",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#a16207", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Your Path
                    </div>
                    <div style={{ fontSize: 12, color: "#92400e", marginBottom: 8, lineHeight: 1.5 }}>
                      {userPath.length === 0 ? (
                        <span>Click the start city (black center dot) to begin your route.</span>
                      ) : (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span>Visited:</span>
                            <b>{userPath.length} / {cities.length}</b>
                          </div>
                          {userPathComplete && (
                            <div style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#22c55e",
                              textTransform: "uppercase",
                              marginBottom: 4,
                            }}>
                              Route complete!
                            </div>
                          )}
                          {userPath.length >= 2 && (
                            <div style={{
                              background: "#fef9c3",
                              border: "1px solid #fde68a",
                              borderRadius: 8,
                              padding: "8px 12px",
                              marginTop: 6,
                              textAlign: "center",
                            }}>
                              <div style={{ fontSize: 10, color: "#a16207", marginBottom: 2 }}>
                                {userPathComplete ? "Total Distance" : "Distance So Far"}
                              </div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: "#92400e", fontFamily: "monospace" }}>
                                {Math.round(userDistance)}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      onClick={handleResetUserPath}
                      style={{ ...buttonStyle, background: "#fbbf24", color: "#92400e", width: "100%", fontSize: 12 }}
                    >
                      Reset My Path
                    </button>
                  </div>
                </div>
              )}

              {/* GA TAB */}
              {controlTab === "ga" && (
                <div style={{
                  background: "#fef2f2",
                  borderRadius: 10,
                  padding: 12,
                  border: "1px solid #fecaca",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Genetic Algorithm
                  </div>
                  <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                    {/* Population size */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>Population</label>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: "#991b1b" }}>{popSize}</span>
                      </div>
                      <input type="range" min={20} max={500} step={10} value={popSize}
                        onChange={(e) => setPopSize(parseInt(e.target.value))}
                        disabled={gaRunning}
                        style={{ width: "100%", accentColor: "#ef4444" }} />
                    </div>
                    {/* Mutation rate */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>Mutation</label>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: "#991b1b" }}>{(mutationRate * 100).toFixed(1)}%</span>
                      </div>
                      <input type="range" min={1} max={100} value={mutationRate * 1000}
                        onChange={(e) => setMutationRate(parseInt(e.target.value) / 1000)}
                        disabled={gaRunning}
                        style={{ width: "100%", accentColor: "#ef4444" }} />
                    </div>
                    {/* Elite count */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>Elites</label>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: "#991b1b" }}>{eliteCount}</span>
                      </div>
                      <input type="range" min={1} max={20} value={eliteCount}
                        onChange={(e) => setEliteCount(parseInt(e.target.value))}
                        disabled={gaRunning}
                        style={{ width: "100%", accentColor: "#ef4444" }} />
                    </div>
                    {/* Stagnation limit */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>Stagnation</label>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: "#991b1b" }}>{stagnationLimit}</span>
                      </div>
                      <input type="range" min={50} max={2000} step={50} value={stagnationLimit}
                        onChange={(e) => setStagnationLimit(parseInt(e.target.value))}
                        disabled={gaRunning}
                        style={{ width: "100%", accentColor: "#ef4444" }} />
                    </div>
                    {/* Elite diversity */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>Diversity</label>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: "#991b1b" }}>{Math.round((1 - maxSameRatio) * 100)}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={Math.round((1 - maxSameRatio) * 100)}
                        onChange={(e) => setMaxSameRatio(1 - parseInt(e.target.value) / 100)}
                        disabled={gaRunning}
                        style={{ width: "100%", accentColor: "#ef4444" }} />
                    </div>
                    {/* Speed */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", marginBottom: 3 }}>Speed</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {speedLabels.map((label, i) => (
                          <button key={label}
                            onClick={() => setSpeed(i)}
                            style={{
                              ...buttonStyle,
                              padding: "4px 10px",
                              fontSize: 11,
                              flex: 1,
                              background: speed === i ? "#ef4444" : "#fecaca",
                              color: speed === i ? "white" : "#991b1b",
                            }}
                          >{label}</button>
                        ))}
                      </div>
                    </div>
                    {/* Exact solver toggle */}
                    <div style={{ opacity: exactAvailable ? 1 : 0.4 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", marginBottom: 3 }}>Exact</div>
                      <label style={{
                        display: "flex", alignItems: "center", gap: 6,
                        cursor: exactAvailable && !gaRunning ? "pointer" : "default",
                        fontSize: 12, color: "#991b1b",
                      }}>
                        <input
                          type="checkbox"
                          checked={exactEnabled && exactAvailable}
                          onChange={(e) => setExactEnabled(e.target.checked)}
                          disabled={!exactAvailable || gaRunning}
                          style={{ accentColor: "#3b82f6" }}
                        />
                        {exactAvailable ? (cities.length <= 12 ? "On" : `On (${cities.length} cities)`) : ">20 cities"}
                      </label>
                    </div>
                    {/* Start / Stop */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={handleStartStopGA}
                        disabled={cities.length < 3}
                        style={{
                          ...buttonStyle,
                          padding: "8px 24px",
                          background: gaRunning ? "#991b1b" : "#ef4444",
                          color: "white",
                          fontSize: 13,
                          flex: 1,
                        }}
                      >
                        {gaRunning ? "Stop" : (gaFinished ? "Restart" : "Start")}
                      </button>
                      {!gaRunning && displayElites.length > 0 && !elitePanelOpen && (
                        <button
                          onClick={() => { setElitePanelOpen(true); setSelectedEliteIdx(null); }}
                          style={{
                            ...buttonStyle,
                            padding: "8px 16px",
                            background: "#f97316",
                            color: "white",
                            fontSize: 13,
                          }}
                        >
                          Elites
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STATS TAB */}
              {controlTab === "stats" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* GA Stats */}
                  {(gaGeneration > 0 || gaFinished) && (
                    <div style={{
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#991b1b",
                      background: "#fef2f2",
                      borderRadius: 10,
                      padding: 12,
                      border: "1px solid #fecaca",
                    }}>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ marginBottom: 3 }}>Gen: <b>{gaGeneration}</b></div>
                        <div style={{ marginBottom: 3 }}>Best: <b>{gaBestDist !== null ? Math.round(gaBestDist) : "—"}</b></div>
                        <div>Last improved: <b>gen {gaLastImproved}</b></div>
                      </div>
                      {gaFinished && (
                        <div style={{ color: "#22c55e", fontWeight: 700, fontSize: 11 }}>
                          Stopped — no improvement for {stagnationLimit} generations
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exact Stats */}
                  {exactEnabled && exactAvailable && (exactRoute || exactFinished) && (
                    <div style={{
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#1d4ed8",
                      background: "#eff6ff",
                      borderRadius: 10,
                      padding: 12,
                      border: "1px solid #bfdbfe",
                    }}>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ marginBottom: 3 }}>Exact best: <b>{exactDist !== null ? Math.round(exactDist) : "—"}</b></div>
                        <div>Nodes: <b>{exactNodes.toLocaleString()}</b></div>
                      </div>
                      {exactFinished && (
                        <div style={{ color: "#22c55e", fontWeight: 700, fontSize: 11 }}>
                          Optimal found!
                        </div>
                      )}
                    </div>
                  )}

                  {/* Convergence chart */}
                  {gaHistory.length > 0 && (
                    <ConvergenceChart
                      history={gaHistory}
                      userDistance={userPathComplete ? userDistance : null}
                      exactDistance={exactDist}
                      compact={false}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Elite panel overlay */}
          {!gaRunning && elitePanelOpen && displayElites.length > 0 && (
            <div style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 320,
              maxHeight: availHeight - 24,
              overflow: "auto",
              zIndex: 10,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}>
              <ElitePanel
                elites={displayElites}
                cities={cities}
                minSeqLength={minSeqLength}
                setMinSeqLength={setMinSeqLength}
                selectedEliteIdx={selectedEliteIdx}
                setSelectedEliteIdx={setSelectedEliteIdx}
                currentGen={gaGeneration}
                onClose={() => { setElitePanelOpen(false); setSelectedEliteIdx(null); }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
