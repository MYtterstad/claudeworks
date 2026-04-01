// App registry — add new apps here and they automatically appear on the main page.
// Each app needs: component, metadata, prompt steps, and source code.

import { lazy } from 'react'

const PidTank = lazy(() => import('./pid-tank/PidTank'))
const TspSolver = lazy(() => import('./tsp-solver/TspSolver'))
const AntColony = lazy(() => import('./ant-colony/AntColony'))
const GravitySim = lazy(() => import('./gravity-sim/GravitySim'))

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

**Auto-Tune Algorithm — Full Implementation**

The auto-tuner computes all three gains from two physical parameters: tank capacity (C) and maximum valve slew rate (S).

**Step 1 — Scale factor:**

scale = sqrt(C_default / C)

where C_default = 1000L. This gives scale = 1.0 for the default tank. Smaller tanks yield scale > 1 (tighter control needed), larger tanks yield scale < 1.

**Step 2 — Kp (proportional gain):**

Kp = min(0.05 × scale, TOTAL_GAIN × 0.3)

The base value of 0.05 is scaled up for smaller tanks, but capped at 30% of total gain (0.255) to leave room for derivative action.

**Step 3 — Kd (derivative gain):**

maxUsefulKd = S / 0.5
Kd = min(TOTAL_GAIN − Kp, maxUsefulKd)

The key insight: Kd generates rapid control changes, but the valve can only move at rate S per tick. If Kd demands changes faster than the valve can deliver, the excess just saturates the actuator and causes limit-cycling. So Kd is capped at maxUsefulKd = S/0.5, which represents the maximum derivative gain the valve can physically respond to.

**Step 4 — Ki (integral gain):**

slewFactor = min(1, S / 2)
Ki = 0.005 × scale × slewFactor

Ki scales with tank size like Kp, but is additionally reduced when the slew rate is tight. A slow valve cannot correct integral windup quickly — if the integral term builds up, the valve hits its limit and stays there, causing overshoot. By reducing Ki proportionally to slew rate, we prevent this.

**Total gain budget:** TOTAL_GAIN is fixed at 0.85 (proven stable across all tank sizes at S=2). The split is: Kp gets first allocation, Kd gets the remainder (capped by valve physics), and Ki is scaled independently to prevent windup.`,
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

**State of the Art: Concorde and LKH**

Despite TSP being NP-hard, modern solvers perform far better than naive approaches. The Concorde solver (Applegate, Bixby, Chvátal & Cook) uses branch-and-cut — an integer linear programming approach that formulates the tour as a 0/1 variable for each edge, relaxes to a continuous LP, solves it, then generates cutting planes (subtour elimination constraints, comb inequalities, Chvátal-Gomory cuts) to tighten the relaxation. This has solved instances with up to 85,900 cities to proven optimality. Concorde is roughly 130,000 lines of C and represents decades of research — it is not something that can be reimplemented in a browser app.

On the heuristic side, the Lin-Kernighan-Helsgaun (LKH) algorithm is the gold standard. The original Lin-Kernighan (1973) performs variable-depth edge exchanges: starting from a tour, it removes one edge, reconnects the tour differently, then checks if removing a second edge yields further improvement, continuing as long as gains are found. Helsgaun's extension uses 5-opt moves, alpha-nearness candidate lists (derived from minimum spanning trees), and sophisticated backtracking. LKH routinely finds solutions within 0.5–2% of optimal for instances with millions of cities.

The solvers in this app — our genetic algorithm, branch-and-bound, and mutation operators — are educational implementations that illustrate the core ideas. They are not competitive with Concorde or LKH on large instances, but they make the concepts visible and interactive.

**Ordered Crossover (OX)**

Given parents P1 and P2, select a random substring from P1. Copy it to the child at the same positions. Fill remaining positions with cities from P2 in their relative order, skipping those already placed. This preserves absolute position from P1 and relative ordering from P2.

**2-opt Mutation**

For edges (i,i+1) and (j,j+1), reversing the segment [i+1..j] replaces these two edges with (i,j) and (i+1,j+1). Accept only if: d(i,j) + d(i+1,j+1) < d(i,i+1) + d(j,j+1). This resolves any crossing, since two crossing edges always have a shorter non-crossing alternative (triangle inequality). This is a single step of what Lin-Kernighan generalizes to variable depth — our GA applies 2-opt as a random mutation, whereas LK uses it as a systematic local search.

**Edge Similarity**

Two routes are compared by their edge sets. Each route defines n edges (unordered city pairs, including the return edge). Similarity = |edges_A ∩ edges_B| / n. Routes sharing >80% of edges are considered structurally equivalent for diversity enforcement purposes.

**Branch-and-Bound**

Our exact solver uses DFS through the permutation tree, maintaining a running path cost. At each node, if current_cost ≥ best_known, prune the entire subtree. This is the simplest exact approach and scales to roughly 20 cities. By contrast, Concorde's branch-and-cut uses LP relaxations for much tighter lower bounds, enabling it to prune vastly more of the search tree and handle thousands of cities.

**Diversity-Enforced Elitism**

The elite set of size k is filled greedily by fitness, but a maximum of ⌊k · maxSameRatio⌋ slots may contain "similar" individuals (edge similarity > 0.8). Remaining slots go to the best *dissimilar* individuals. This maintains selection pressure while preventing premature convergence.`,
    },
  },
  {
    id: 'ant-colony',
    title: 'Ant Colony Optimization',
    icon: '🐜',
    category: 'Engineering',
    summary: 'Watch ants discover food through pheromone trails. Place cookies, stones, and logs, then observe emergent swarm intelligence.',
    description: `An interactive simulation of ant colony optimization (ACO), inspired by Marco Dorigo's 1992 work. Individual ants forage randomly from their nest, and when one discovers food it leaves a pheromone trail on its way home. Other ants detect the pheromone and are drawn toward it, reinforcing successful paths while pheromone on unused paths evaporates.

Features include a forest glade visual theme with cartoon ants (named individuals with legs, antennae, and carrying animation), depletable cookie food sources, placeable obstacles (stones and logs), an edit mode for adding items, an ant inspector showing the full 8-direction decision table (τ^α, η^β, momentum, score, probability), a math panel with the live transition formula, and colony statistics.

This app demonstrates pheromone-based communication, positive feedback loops, exploration vs. exploitation, and how simple local rules produce globally intelligent behavior.`,
    path: '/apps/ant-colony',
    preview: '/previews/ant-colony.svg',
    version: '0.2',
    language: 'jsx',
    tags: ['React', 'Ant Colony Optimization', 'Simulation', 'Swarm Intelligence'],
    glowColor: 'var(--glow-amber)',
    component: AntColony,
    documentation: {
      howToUse: [
        { title: 'Start the colony', text: 'Press Start to release the ants from their nest. They will fan out randomly searching for food.' },
        { title: 'Watch pheromone trails form', text: 'When an ant finds a cookie, it carries a piece back to the nest, leaving a golden food-pheromone trail. Other foraging ants detect this trail and follow it, reinforcing the path.' },
        { title: 'Place food and obstacles', text: 'Switch to Edit mode (pencil icon) to place cookies, stones, or logs. Try placing a cookie closer to the nest than the existing one — watch how long it takes the colony to discover the shorter path.' },
        { title: 'Tune parameters', text: 'Use the controls to adjust colony size, simulation speed, α (pheromone importance), β (direction weight), and ρ (evaporation rate). Higher α makes ants follow trails more strongly; higher ρ makes trails fade faster, encouraging exploration.' },
        { title: 'Inspect individual ants', text: 'Pause the simulation and click any ant to see its decision breakdown — an 8-direction table showing pheromone strength, directional bias, momentum, and resulting probability for each possible move.' },
      ],
      mathSimple: `**How do ants find food without a map?**

Real ants are nearly blind and have tiny brains, yet colonies efficiently find and exploit food sources. The secret is pheromone — a chemical scent ants leave on the ground.

**The foraging loop:** An ant wanders randomly until it stumbles upon food. It picks up a piece and heads home, leaving a scent trail. Other ants who cross this trail are attracted to it and follow it to the food. They pick up food and head home too, leaving more scent on the same path. The trail gets stronger and stronger.

**Evaporation is key:** Pheromone slowly fades over time. A long, winding path takes more time to walk, so its pheromone evaporates more between reinforcements. A short, direct path gets reinforced faster than it evaporates. Over time, the colony converges on the shortest route — without any single ant knowing the big picture.

**Two types of trail:** Ants heading home leave "food pheromone" (golden trails) that guides foragers toward food. Ants heading out leave "home pheromone" (blue trails) that helps returning ants find their way back. This two-scent system creates a bidirectional highway.

In our simulation, each ant makes decisions based on pheromone strength and its current momentum (tendency to keep walking forward), producing the characteristic streaming behavior you see in real ant trails.`,
      mathAdvanced: `**Ant Colony Optimization (Dorigo, 1992)**

Each ant at position i chooses its next cell j with probability:

P(i → j) = [τ(j)]^α × [η(j)]^β × momentum / Σ [τ(k)]^α × [η(k)]^β × momentum_k

where:
- τ(j) is the pheromone intensity at cell j (food-pheromone for foraging ants, home-pheromone for returning ants)
- η(j) is a heuristic desirability — in our simulation, this is the dot-product alignment between the direction to j and the direction toward the target (detected food or nest), raised to the power β
- momentum is a bias toward continuing in the current direction: 1.5 for forward, 0.8 for perpendicular, 0.3 for backward
- α controls pheromone influence (higher = stronger trail following)
- β controls heuristic influence (higher = more directed movement toward known targets)

**Pheromone dynamics:**

On each step, an ant deposits pheromone: τ(cell) ← min(τ_max, τ(cell) + deposit). Foraging ants deposit home-pheromone (weaker, 0.3× rate). Returning ants deposit food-pheromone (full rate).

Evaporation occurs globally each tick: τ(cell) ← τ(cell) × (1 - ρ). With ρ = 0.005, each cell loses 0.5% of its pheromone per tick. This exponential decay means a trail that isn't reinforced halves roughly every 139 ticks.

**Exploration floor:**

To prevent stagnation (where one dominant trail captures 100% of traffic), a proportional floor is added: floor = max(maxScore × 0.02, 0.001). This ensures every walkable direction retains at least ~2% relative probability, mimicking the random exploration that real ants exhibit even on established trails.

**Stagnation escape:**

If an ant has been in the same state (foraging or returning) for more than 300 steps without success, it has a 30% chance per step of making a completely random move. This prevents ants from being permanently trapped in pheromone loops.

**Emergence:**

No ant knows the location of food sources (until within detection range of 30 cells). No ant plans a route. Yet the colony collectively discovers and optimizes paths through positive feedback (pheromone reinforcement) balanced by negative feedback (evaporation). This is the hallmark of swarm intelligence — global optimization from purely local interactions.`,
    },
  },
  {
    id: 'gravity-sim',
    title: 'Gravity Simulator',
    icon: '🪐',
    category: 'Engineering',
    summary: 'Watch planets orbit, collide, and merge in a 3D N-body gravity simulation. Rotate the camera, place new planets, and tune the gravitational constant.',
    description: `An interactive N-body gravity simulation rendered in 3D with perspective projection and click-drag camera control. Planets orbit a central star, pulled by the gravitational forces of every other body in the system.

Features include Velocity Verlet integration for accurate energy conservation, collision detection with momentum-conserving mergers, a sun that serves as both gravitational anchor and light source (with corona glow and pulsing animation), orbital trails, velocity vectors, gravitational force lines in 5 intensity ranges, center-of-mass tracking, an energy display, and a planet inspector showing each body's gravitational influences.

Two startup modes — Orbital (near-circular orbits) and Chaotic (random velocities) — let users explore stable vs. unstable configurations. Planet names are drawn from Greek/Roman mythology and classic sci-fi.`,
    path: '/apps/gravity-sim',
    preview: '/previews/gravity-sim.svg',
    version: '0.1',
    language: 'jsx',
    tags: ['React', 'Physics', 'N-Body', 'Simulation', '3D'],
    glowColor: 'var(--glow-blue)',
    component: GravitySim,
    documentation: {
      howToUse: [
        { title: 'Generate a system', text: 'Press "New Space" to create a new planetary system. Adjust the planet count slider before generating to control how many bodies appear.' },
        { title: 'Watch and rotate', text: 'Press Start to begin the simulation. Click and drag on empty space to rotate the 3D camera. Horizontal drag rotates the view, vertical drag tilts it.' },
        { title: 'Inspect a planet', text: 'Click any planet to see its name, mass, velocity, and the top gravitational forces acting on it. The selected planet\'s force lines are shown even if the global toggle is off.' },
        { title: 'Toggle overlays', text: 'Enable Trails to see orbital paths, Velocity Vectors to see movement direction, Force Lines to visualize gravitational connections, Center of Mass to track the system\'s balance point, and Energy to monitor conservation.' },
        { title: 'Edit the system', text: 'Press Edit to enter placement mode. Click anywhere on the canvas to add a new planet with random properties. Press Done when finished.' },
        { title: 'Experiment', text: 'Try Orbital vs Chaotic startup modes. Increase the G multiplier to see more dramatic interactions. Watch how collisions reduce planet count over time as bodies merge.' },
      ],
      mathSimple: `**How does gravity work in an N-body system?**

Every object with mass pulls on every other object. The force between two bodies depends on their masses and distance: double the mass = double the pull, double the distance = quarter the pull (it falls off with the square of distance).

**Why do planets orbit?** A planet moving sideways past a star is constantly pulled inward by gravity, but its sideways motion keeps it from falling in. The result is a curved path — an orbit. If the speed is just right, the orbit is circular. Too slow and the planet spirals inward; too fast and it escapes.

**Why do orbits become chaotic?** With two bodies, orbits are perfectly predictable (Kepler's laws). But add a third body and the math becomes unsolvable — tiny differences in starting positions lead to wildly different outcomes over time. This is the famous "three-body problem." With 15+ bodies, the system is deeply chaotic and collisions are inevitable.

**What happens when planets collide?** They merge into one larger body. The merged planet conserves the total momentum (mass × velocity) of both parents, so it inherits a velocity that's a mass-weighted average of both. Its mass is the sum of both, and its radius grows as the cube root of the combined volume.`,
      mathAdvanced: `**Velocity Verlet Integration**

The standard Euler method (x += v·dt, v += a·dt) accumulates energy errors over time — orbits spiral outward or inward. Velocity Verlet is symplectic, meaning it conserves the Hamiltonian (total energy) much better:

1. x(t+dt) = x(t) + v(t)·dt + ½·a(t)·dt²
2. Compute a(t+dt) from new positions
3. v(t+dt) = v(t) + ½·[a(t) + a(t+dt)]·dt

This two-step velocity update uses the average of old and new accelerations, giving second-order accuracy and excellent long-term stability.

**Gravitational Force with Softening**

F_ij = G · m_i · m_j / (r² + ε²)

where ε is a softening length (~5 units). Without softening, two bodies passing very close would experience near-infinite forces, causing numerical explosion. Softening caps the maximum force, mimicking the finite size of real bodies. The acceleration on body i from body j is:

a_i += G · m_j · (r_j - r_i) / (|r|² + ε²)^(3/2)

**Collision Detection**

Bodies merge when their centers are closer than the sum of their radii: |r_i - r_j| < R_i + R_j. The merged body has:
- Mass: M = m_i + m_j
- Velocity: V = (m_i·v_i + m_j·v_j) / M (momentum conservation)
- Radius: R = ∛(R_i³ + R_j³) (volume conservation)
- Position: weighted average by mass

**Orbital Velocity Setup**

For roughly circular orbits, a body at distance r from the sun needs tangential speed v = √(G·M_sun/r). This balances gravitational acceleration (GM/r²) against centripetal acceleration (v²/r). We add ±15% random perturbation to create slightly elliptical, more natural-looking orbits.

**Three-Body Problem**

Henri Poincaré proved in 1890 that the general three-body problem has no closed-form solution. The system exhibits sensitive dependence on initial conditions — the hallmark of chaos. Karl Sundman later showed a convergent series solution exists, but it converges so slowly that it has no practical use. For N > 2, numerical integration is the only viable approach, which is exactly what this simulator does.`,
    },
  },
]

export default apps
