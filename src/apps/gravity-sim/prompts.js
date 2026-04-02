// Prompt walkthrough for the Gravity Simulator.
// Each step shows the core prompt and what it produced.

const promptSteps = [
  {
    title: 'Core physics & canvas',
    description: 'Defined the fundamental physics engine and rendering surface.',
    prompt: `Build an N-body gravity simulator on a canvas with a black starfield background. Use Newton's universal gravitation F = G·m₁·m₂/r² for pairwise forces, and Velocity Verlet integration for time-stepping (better energy conservation than Euler). Include a softening parameter to prevent division by zero. Bodies should merge on collision — conserve momentum, combine mass, blend colors, compute new radius as cbrt(r₁³ + r₂³). Abstract units for mass and distance.`,
    outcome: 'Working N-body simulation with Velocity Verlet integration, collision detection, and merging physics.',
  },
  {
    title: '3D projection & camera',
    description: 'Added perspective projection and interactive camera rotation.',
    prompt: `Implement perspective projection (x_screen = x·f/(z+f)) with click-drag camera rotation. Horizontal drag rotates around Y axis, vertical drag around X axis. Apply rotation matrix before projection. Use painter's algorithm (depth sort) for rendering order, with brightness/opacity fading for distant bodies. Default camera at ~15° elevation for immediate 3D feel.`,
    outcome: 'Full 3D perspective rendering with click-drag orbit controls and depth-sorted drawing.',
  },
  {
    title: 'Sun & planet rendering',
    description: 'Upgraded rendering with sun glow, 3D sphere shading, and themed names.',
    prompt: `One body per system is a "star" — bright yellow-white with radial gradient core and corona glow with subtle pulsing animation. It's the light source for other planets. Planets get radial gradients for 3D sphere illusion with highlight position based on angle to the sun. Larger planets get subtle horizontal color bands (gas giant style). Each planet has a thin atmosphere halo. Names drawn from Greek/Roman mythology and sci-fi literature.`,
    outcome: 'Sun with pulsing corona, 3D-shaded planets with atmosphere halos, mythology and sci-fi names.',
  },
  {
    title: 'Visual overlays (trails, vectors, forces, CoM)',
    description: 'Added toggleable visualization layers for physics analysis.',
    prompt: `Add toggleable visual overlays: (1) Fading orbital trails — last ~80 positions as polyline with decreasing opacity. (2) Velocity vectors — cyan arrows showing direction and magnitude. (3) Gravitational force lines between planet pairs in 5 visual ranges (faint dotted → solid thick), warm amber color, only top ~35-40% of forces shown. (4) Center of mass crosshair — pulsing marker at mass-weighted average position. (5) Energy display — kinetic, potential, and total energy.`,
    outcome: 'Five toggleable overlays: trails, velocity arrows, force lines with 5 intensity levels, CoM crosshair, and energy readout.',
  },
  {
    title: 'Generation modes (orbital vs chaotic)',
    description: 'Created two distinct startup modes for different simulation experiences.',
    prompt: `Two startup modes. Orbital: position bodies randomly in a sphere, assign tangential velocities ~sqrt(G·M_sun/r) with ±15% perturbation for near-circular orbits. The sun (solar deity name) anchors the system at 1.5-2x mass of second largest. Chaotic: same positions but small random velocities in random directions — produces dramatic slingshots and collisions.`,
    outcome: 'Orbital mode with stable-ish orbits and Chaotic mode with dramatic gravitational interactions.',
  },
  {
    title: 'Planet inspector & edit mode',
    description: 'Added planet click inspection and interactive planet placement.',
    prompt: `Click a planet to see an inspector popup: name, mass, radius, velocity, and top-4 gravitational influences (body name, force, distance). When selected, show that planet's force lines to all others even if global toggle is off. Edit mode lets you click canvas to place new planets with random mass/color/name and zero velocity. Inspector updates in real time while simulation runs.`,
    outcome: 'Planet inspector with real-time stats, force line highlighting for selected planets, and click-to-place edit mode.',
  },
  {
    title: 'Responsive layout & polish',
    description: 'Applied responsive layout and added collision mode toggle.',
    prompt: `Match the ACO app's responsive layout: wide mode (aspect > 1.2) = canvas left + side panel right; tall mode = canvas top + tabbed bottom panel. Controls overlaid on canvas (Start/Pause, Generate top-left; Edit top-right). Side panel has sliders (planets, speed, min/max size, G multiplier), toggles including elastic bounce collision mode, math panel (Newton's law, Verlet), and stats panel (mass, mergers, velocities). No scrolling in either mode.`,
    outcome: 'Responsive two-mode layout with full control panel, elastic bounce toggle, and polished styling.',
  },
]

export default promptSteps
