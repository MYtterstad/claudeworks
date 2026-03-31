// App registry — add new apps here and they automatically appear on the main page.
// Each app needs: component, metadata, prompt steps, and source code.

import { lazy } from 'react'

const PidTank = lazy(() => import('./pid-tank/PidTank'))
const TspSolver = lazy(() => import('./tsp-solver/TspSolver'))

const apps = [
  {
    id: 'pid-tank',
    title: 'PID Water Tank Controller',
    icon: '🔧',
    category: 'Engineering',
    summary: 'Interactive PID controller simulation for a water tank system. Adjust inflow disturbances and tune Kp, Ki, Kd gains in real time.',
    description: `A real-time simulation of a PID (Proportional-Integral-Derivative) controller managing water flow in a tank. The user controls inflow as a disturbance, and the PID controller adjusts the outflow valve to maintain a target water level.

Features include adjustable tank capacity (100–1000L), PID gain tuning with sliders and text inputs, valve slew rate limiting for physical realism, auto-tune that calculates optimal gains based on tank size and valve constraints, and a rolling time-history chart showing level, setpoint, inflow, and outflow.

This app demonstrates core control theory concepts: proportional response, integral wind-up, derivative damping, discrete-time stability, actuator constraints, and the interplay between controller aggressiveness and physical system limits.`,
    path: '/apps/pid-tank',
    preview: '/previews/pid-tank.svg',
    version: '1.6',
    language: 'jsx',
    tags: ['React', 'Control Theory', 'Simulation', 'Interactive'],
    glowColor: 'var(--glow-blue)',
    component: PidTank,
    documentation: {
      howToUse: [
        { title: 'Set a target', text: 'Use the setpoint slider to choose your desired water level (0–100%).' },
        { title: 'Create a disturbance', text: 'Adjust the inflow slider to simulate water entering the tank — this is the disturbance the controller must counteract.' },
        { title: 'Tune the PID gains', text: 'Use the Kp, Ki, and Kd sliders to adjust the controller. Watch the chart to see how each gain affects response.' },
        { title: 'Change the tank', text: 'Adjust tank capacity (100–1000L) and valve slew rate to see how physical constraints affect controllability.' },
        { title: 'Auto-tune', text: 'Press Auto-Tune to let the algorithm calculate gains based on your tank size and slew rate.' },
      ],
      mathSimple: `**What is PID control?**

Imagine you're driving a car and trying to maintain exactly 60 mph. PID control uses three strategies simultaneously:

**P (Proportional):** The further you are from 60, the harder you press the gas or brake. Big error = big correction.

**I (Integral):** If you've been slightly below 60 for a while, the controller gradually increases the gas. It "remembers" past errors and eliminates persistent drift.

**D (Derivative):** If the speed is rising quickly toward 60, the controller eases off early to prevent overshooting. It reacts to the *rate of change*.

In our water tank, the "speed" is the water level, and the "gas pedal" is the outflow valve. The controller constantly adjusts the valve to keep the water at your target level, even when inflow (the disturbance) changes unexpectedly.`,
      mathAdvanced: `**Discrete-Time PID Implementation**

The controller runs at fixed timestep Δt and computes the control signal u(k):

u(k) = Kp·e(k) + Ki·Σe(j)·Δt + Kd·(e(k) - e(k-1))/Δt

where e(k) = setpoint - measured_level.

**Stability constraint:** In discrete time, the loop gain (Kp + Kd/Δt) must satisfy |1 - (Kp + Kd/Δt)| < 1 for the closed-loop system to be stable. Our implementation keeps the total effective gain at 0.85 to provide margin.

**Anti-windup:** The integral term is clamped to prevent accumulation when the valve is saturated (fully open or closed). Without this, the integral "winds up" during saturation and causes large overshoot when the valve comes off its limit.

**Slew rate limiting:** The valve position change is clamped per timestep: |Δvalve| ≤ maxSlew·Δt. This models real actuator dynamics. The auto-tuner accounts for this constraint by reducing Kd when the slew rate is tight — aggressive derivative action is useless if the actuator can't follow it.

**Auto-tune strategy:** Total gain is fixed at 0.85. The Kp/Kd split is determined by tank size (larger tanks need more derivative), and Ki is scaled inversely with tank capacity to prevent slow wind-up in large systems.`,
    },
  },
  {
    id: 'tsp-solver',
    title: 'Travelling Salesman Problem',
    icon: '🗺️',
    category: 'Engineering',
    summary: 'Race a genetic algorithm to find the shortest route through British towns. Visualize evolution, mutation, and convergence in real time.',
    description: `An interactive exploration of the Travelling Salesman Problem (TSP) — one of the most famous optimization problems in computer science. Generate a map of fictional British towns, try to find the shortest route yourself, then watch a genetic algorithm compete against an exact branch-and-bound solver.

Features include a British town name generator, three mutation operators (swap, 2-opt, segment reversal), elite diversity enforcement using edge similarity, a convergence chart showing distance vs. generation, and an elite analysis panel that highlights shared sub-sequences across top solutions.

This app teaches genetic algorithms, combinatorial optimization, the exploration/exploitation tradeoff, and why exact solvers don't scale.`,
    path: '/apps/tsp-solver',
    preview: '/previews/tsp-solver.svg',
    version: '0.4',
    language: 'jsx',
    tags: ['React', 'Genetic Algorithm', 'Optimization', 'Interactive'],
    glowColor: 'var(--glow-green)',
    component: TspSolver,
    documentation: {
      howToUse: [
        { title: 'Generate a map', text: 'Use the Cities slider and "Generate New Map" to create a random map of British towns.' },
        { title: 'Draw your route', text: 'Click the start city (black center dot) first, then click cities in order to build your path. Your distance updates in real time.' },
        { title: 'Run the GA', text: 'Adjust Population, Mutation, Elites, Stagnation, Diversity, and Speed, then press Start. Watch the red route evolve on the map.' },
        { title: 'Compare with exact solver', text: 'With ≤20 cities, enable the Exact checkbox. The blue dashed route shows the branch-and-bound solver\'s progress toward the true optimum.' },
        { title: 'Analyze elites', text: 'Pause the GA to see the Elite Analysis panel. Click an elite to show its route in orange. Yellow = shared by some elites, green = shared by all.' },
        { title: 'Experiment', text: 'Try high vs. low mutation rates, different diversity levels, or more cities. The convergence chart shows how your choices affect the algorithm.' },
      ],
      mathSimple: `**What is the Travelling Salesman Problem?**

Imagine a delivery driver who needs to visit 20 towns and return home. Which order minimizes total driving distance? With 20 towns, there are about 60 quadrillion possible routes — far too many to check one by one.

**Genetic Algorithm approach:** Instead of checking every route, we use evolution. Start with 100 random routes (the "population"). The shorter routes survive and "mate" — two good routes are combined to produce children that hopefully inherit the best parts of each parent. Occasionally a random change ("mutation") introduces variety. Over hundreds of generations, the routes get shorter.

**Why three mutations?** Swap mutation randomly exchanges two cities — it's simple but rarely finds improvements. 2-opt detects where two path segments cross each other and uncrosses them — this is targeted and almost always helps. Segment reversal flips a chunk of the route, creating bigger structural changes that help escape dead ends.

**The diversity problem:** Without controls, the GA quickly converges to one solution and stops improving. By forcing the elite set to include structurally different routes (measured by how many road connections they share), we keep the population diverse and exploring.`,
      mathAdvanced: `**Combinatorial Complexity**

For n cities, the number of distinct circular tours is (n-1)!/2. This grows super-exponentially: 10 cities = 181,440 tours; 20 cities ≈ 6.1 × 10¹⁶ tours. TSP is NP-hard — no known polynomial-time algorithm finds the optimal solution for all instances.

**Ordered Crossover (OX)**

Given parents P1 and P2, select a random substring from P1. Copy it to the child at the same positions. Fill remaining positions with cities from P2 in their relative order, skipping those already placed. This preserves absolute position from P1 and relative ordering from P2.

**2-opt Mutation**

For edges (i,i+1) and (j,j+1), reversing the segment [i+1..j] replaces these two edges with (i,j) and (i+1,j+1). Accept only if: d(i,j) + d(i+1,j+1) < d(i,i+1) + d(j,j+1). This resolves any crossing, since two crossing edges always have a shorter non-crossing alternative (triangle inequality).

**Edge Similarity**

Two routes are compared by their edge sets. Each route defines n edges (unordered city pairs, including the return edge). Similarity = |edges_A ∩ edges_B| / n. Routes sharing >80% of edges are considered structurally equivalent for diversity enforcement purposes.

**Branch-and-Bound**

DFS through the permutation tree, maintaining a running path cost. At each node, if current_cost ≥ best_known, prune the entire subtree. This dramatically reduces the search space but worst-case is still O(n!). The implementation processes nodes in batches and yields to the browser between batches for UI responsiveness.

**Diversity-Enforced Elitism**

The elite set of size k is filled greedily by fitness, but a maximum of ⌊k · maxSameRatio⌋ slots may contain "similar" individuals (edge similarity > 0.8). Remaining slots go to the best *dissimilar* individuals. This maintains selection pressure while preventing premature convergence.`,
    },
  },
]

export default apps
