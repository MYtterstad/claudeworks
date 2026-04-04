// Cleaned-up prompt walkthrough for the PID Water Tank Controller.
// Personal details and unnecessary back-and-forth have been removed.
// Each step shows the core prompt and what it produced.

const promptSteps = [
  {
    title: 'Define the system requirements',
    description: 'Started by specifying the physical system and what the UI should include.',
    prompt: `Build a PID regulator for a water tank. The tank stores up to 1000 liters with inflow 0–10 L/t (user-controlled slider) and outflow 0–10 L/t (PID-controlled). Include a graphical tank visualization showing the water level, a setpoint slider, and a time-history chart of level vs. setpoint.`,
    outcome: 'Base simulation with tank visualization, inflow/setpoint sliders, and a Recharts time-history chart.',
  },
  {
    title: 'Add PID tuning controls',
    description: 'Exposed Kp, Ki, Kd as adjustable sliders so users can experiment with tuning.',
    prompt: `Expose Kp, Ki, Kd as sliders with sensible defaults that are optimal for this system. All sliders should show their values in editable text fields so users can type exact numbers. Add a simulation speed control as well.`,
    outcome: 'PID tuning section with three gain sliders, text inputs on all controls, and a speed slider.',
  },
  {
    title: 'Add adjustable tank capacity',
    description: 'Made the tank size dynamic to explore how the same PID behaves with different plant sizes.',
    prompt: `Add a slider that controls the tank capacity from 100 to 1000 liters. The setpoint slider max and chart Y-axis should adjust dynamically. Clamp the current level and setpoint when the capacity decreases.`,
    outcome: 'Dynamic tank capacity with automatic clamping of level and setpoint.',
  },
  {
    title: 'Create an auto-tune function',
    description: 'Added a button that calculates reasonable PID gains based on the current system parameters.',
    prompt: `Add an auto-tune button that calculates optimal Kp, Ki, Kd based on the current tank capacity. The discrete-time loop gain (Kp + Kd) must stay below ~0.85 for stability. Smaller tanks should get proportionally more Kp but the total gain budget must be constant.`,
    outcome: 'Auto-Tune PID button with stability-aware gain calculation. Fixed through iteration — initial versions caused oscillation at small tank sizes because Kd scaled too aggressively.',
  },
  {
    title: 'Add valve slew rate limiting',
    description: 'Real valves can\'t change instantaneously. Added a physical constraint on how fast the outflow can change.',
    prompt: `The outflow can currently jump from 0 to 10 instantly, which is unrealistic and causes oscillation. Add a max change rate per tick (slew rate) as a user-controllable slider. Default to 2 L/t per tick.`,
    outcome: 'Valve slew rate slider that constrains the PID output to physically realistic changes per tick.',
  },
  {
    title: 'Integrate slew rate into auto-tune',
    description: 'The auto-tune should respect the valve\'s physical limitations when calculating gains.',
    prompt: `The slew rate is a physical property of the valve — the user sets it. Auto-tune should read this constraint and calculate gains that work within it. Cap Kd so it never demands more change than the valve can deliver. Reduce Ki when slew rate is tight to prevent integral windup.`,
    outcome: 'Auto-tune now factors in slew rate: Kd is capped by valve speed, Ki is reduced for slow valves. The valve constraint drives the tuning, not the other way around.',
  },
]

export default promptSteps
