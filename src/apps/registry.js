// App registry — add new apps here and they automatically appear on the main page.
// Each app needs: component, metadata, prompt steps, and source code.

import { lazy } from 'react'

const PidTank = lazy(() => import('./pid-tank/PidTank'))

const apps = [
  {
    id: 'pid-tank',
    title: 'PID Water Tank Controller',
    icon: '🔧',
    summary: 'Interactive PID controller simulation for a water tank system. Adjust inflow disturbances and tune Kp, Ki, Kd gains in real time.',
    description: `A real-time simulation of a PID (Proportional-Integral-Derivative) controller managing water flow in a tank. The user controls inflow as a disturbance, and the PID controller adjusts the outflow valve to maintain a target water level.

Features include adjustable tank capacity (100–1000L), PID gain tuning with sliders and text inputs, valve slew rate limiting for physical realism, auto-tune that calculates optimal gains based on tank size and valve constraints, and a rolling time-history chart showing level, setpoint, inflow, and outflow.

This app demonstrates core control theory concepts: proportional response, integral wind-up, derivative damping, discrete-time stability, actuator constraints, and the interplay between controller aggressiveness and physical system limits.`,
    path: '/apps/pid-tank',
    version: '1.6',
    language: 'jsx',
    tags: ['React', 'Control Theory', 'Simulation', 'Interactive'],
    glowColor: 'var(--glow-blue)',
    component: PidTank,
  },
]

export default apps
