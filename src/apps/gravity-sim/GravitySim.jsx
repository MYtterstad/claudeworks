import React, { useState, useRef, useEffect, useCallback } from 'react'

const CELL = 1

// ============================================================================
// NAME POOLS
// ============================================================================

const SOLAR_DEITY_NAMES = [
  'Helios', 'Sol', 'Ra', 'Surya', 'Amaterasu', 'Hyperion', 'Apollo',
  'Shamash', 'Tonatiuh', 'Inti'
]

const PLANET_NAMES = [
  // Greek/Roman
  'Zeus', 'Kronos', 'Athena', 'Mars', 'Juno', 'Ceres', 'Erebus', 'Nyx',
  'Ares', 'Poseidon', 'Hades', 'Hermes', 'Artemis', 'Hera', 'Aphrodite',
  'Demeter', 'Hestia', 'Persephone', 'Prometheus', 'Atlas', 'Titan', 'Rhea',
  'Hyperion', 'Theia', 'Phoebe', 'Selene', 'Eos', 'Helios',
  // Sci-fi
  'Arrakis', 'Solaris', 'Trantor', 'Pandora', 'Krypton', 'Coruscant',
  'Reach', 'Thessia', 'Gallifrey', 'Vulcan', 'Tatooine', 'Endor',
  'Dagobah', 'Hoth', 'Mustafar', 'Kamino', 'Naboo', 'Mandalore',
  'Asgard', 'Midgard'
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

function randomColor() {
  const hue = Math.random() * 360
  const sat = randomRange(50, 100)
  const light = randomRange(40, 70)
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

function sunColor() {
  return `hsl(50, 100%, 70%)`
}

function hslToRgb(h, s, l) {
  s /= 100
  l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255)
  ]
}

function distance3D(p1, p2) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dz = p2.z - p1.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function rotatePoint3D(x, y, z, azimuth, elevation) {
  // Rotate around Y axis by azimuth
  const cosA = Math.cos(azimuth)
  const sinA = Math.sin(azimuth)
  const x1 = x * cosA - z * sinA
  const z1 = x * sinA + z * cosA

  // Rotate around X axis by elevation
  const cosE = Math.cos(elevation)
  const sinE = Math.sin(elevation)
  const y2 = y * cosE - z1 * sinE
  const z2 = y * sinE + z1 * cosE

  return { x: x1, y: y2, z: z2 }
}

function projectToScreen(x, y, z, focalLength) {
  const depth = z + focalLength
  if (depth <= 0) return null
  return {
    sx: x * focalLength / depth,
    sy: y * focalLength / depth,
    z: z
  }
}

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

function createBody(x, y, z, mass, radius, color, name, isSun = false) {
  return {
    x, y, z,
    vx: 0, vy: 0, vz: 0,
    ax: 0, ay: 0, az: 0,
    mass,
    radius,
    color,
    name,
    isSun,
    trail: [],
    merged: false
  }
}

function generateSystem(
  numBodies,
  minSize,
  maxSize,
  orbitalMode,
  G
) {
  const bodies = []
  const usedNames = new Set()

  // Create bodies with random positions in sphere
  for (let i = 0; i < numBodies; i++) {
    const r = randomRange(0, 200)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)

    const mass = randomRange(minSize, maxSize)
    const radius = randomRange(4, 8)
    const color = randomColor()

    let name
    do {
      name = PLANET_NAMES[Math.floor(Math.random() * PLANET_NAMES.length)]
    } while (usedNames.has(name))
    usedNames.add(name)

    bodies.push(createBody(x, y, z, mass, radius, color, name, false))
  }

  // Designate sun (largest or 1.5-2x second largest)
  if (bodies.length > 0) {
    bodies.sort((a, b) => b.mass - a.mass)
    const maxMass = bodies[0].mass
    const secondMaxMass = bodies.length > 1 ? bodies[1].mass : maxMass * 0.5

    const sunBody = createBody(0, 0, 0, randomRange(secondMaxMass * 1.5, secondMaxMass * 2), 12, sunColor(), SOLAR_DEITY_NAMES[Math.floor(Math.random() * SOLAR_DEITY_NAMES.length)], true)
    bodies.unshift(sunBody)
  }

  // Assign velocities
  if (orbitalMode) {
    // Orbital: tangential velocity based on sun
    const sun = bodies[0]
    for (let i = 1; i < bodies.length; i++) {
      const b = bodies[i]
      const dx = b.x - sun.x
      const dy = b.y - sun.y
      const dz = b.z - sun.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist > 0.1) {
        const orbitalSpeed = Math.sqrt((G * sun.mass) / dist)
        const perturbation = randomRange(0.85, 1.15)
        const speed = orbitalSpeed * perturbation

        // Tangential direction (perpendicular to radius)
        const randAxis = Math.random()
        let tx, ty, tz
        if (randAxis < 0.33) {
          tx = -dy
          ty = dx
          tz = 0
        } else if (randAxis < 0.66) {
          tx = -dz
          ty = 0
          tz = dx
        } else {
          tx = 0
          ty = -dz
          tz = dy
        }
        const tlen = Math.sqrt(tx * tx + ty * ty + tz * tz)
        if (tlen > 0) {
          b.vx = (tx / tlen) * speed
          b.vy = (ty / tlen) * speed
          b.vz = (tz / tlen) * speed
        }
      }
    }
  } else {
    // Chaotic: small random velocities
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].vx = randomRange(-20, 20)
      bodies[i].vy = randomRange(-20, 20)
      bodies[i].vz = randomRange(-20, 20)
    }
  }

  return bodies
}

function computeAccelerations(bodies, G, softening) {
  for (let i = 0; i < bodies.length; i++) {
    bodies[i].ax = 0
    bodies[i].ay = 0
    bodies[i].az = 0
  }

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const b1 = bodies[i]
      const b2 = bodies[j]

      const dx = b2.x - b1.x
      const dy = b2.y - b1.y
      const dz = b2.z - b1.z
      const distSq = dx * dx + dy * dy + dz * dz + softening * softening
      const dist = Math.sqrt(distSq)

      const force = (G * b1.mass * b2.mass) / distSq
      const ax = (force / b1.mass) * (dx / dist)
      const ay = (force / b1.mass) * (dy / dist)
      const az = (force / b1.mass) * (dz / dist)

      b1.ax += ax
      b1.ay += ay
      b1.az += az

      b2.ax -= (force / b2.mass) * (dx / dist)
      b2.ay -= (force / b2.mass) * (dy / dist)
      b2.az -= (force / b2.mass) * (dz / dist)
    }
  }
}

function verletStep(bodies, dt, G, softening) {
  // Update positions
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    b.x += b.vx * dt + 0.5 * b.ax * dt * dt
    b.y += b.vy * dt + 0.5 * b.ay * dt * dt
    b.z += b.vz * dt + 0.5 * b.az * dt * dt
  }

  // Store old accelerations
  const oldAx = bodies.map(b => b.ax)
  const oldAy = bodies.map(b => b.ay)
  const oldAz = bodies.map(b => b.az)

  // Recompute accelerations
  computeAccelerations(bodies, G, softening)

  // Update velocities
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    b.vx += 0.5 * (oldAx[i] + b.ax) * dt
    b.vy += 0.5 * (oldAy[i] + b.ay) * dt
    b.vz += 0.5 * (oldAz[i] + b.az) * dt
  }
}

function createExplosion(x, y, z, explosions, startTime) {
  const particles = []
  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18
    const elevation = Math.random() * Math.PI - Math.PI / 2
    const speed = randomRange(15, 35)
    particles.push({
      x, y, z,
      vx: speed * Math.cos(angle) * Math.cos(elevation),
      vy: speed * Math.sin(elevation),
      vz: speed * Math.sin(angle) * Math.cos(elevation),
      life: 1.0
    })
  }
  explosions.push({
    x, y, z,
    particles,
    startTime
  })
}

function checkCollisions(bodies, explosions = [], currentTime = 0) {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const b1 = bodies[i]
      const b2 = bodies[j]

      const dx = b2.x - b1.x
      const dy = b2.y - b1.y
      const dz = b2.z - b1.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < b1.radius + b2.radius) {
        // Merge: conserve momentum and mass
        const newMass = b1.mass + b2.mass
        const newVx = (b1.mass * b1.vx + b2.mass * b2.vx) / newMass
        const newVy = (b1.mass * b1.vy + b2.mass * b2.vy) / newMass
        const newVz = (b1.mass * b1.vz + b2.mass * b2.vz) / newMass
        const newRadius = Math.cbrt(b1.radius ** 3 + b2.radius ** 3)

        // Blend colors (simple average in RGB space)
        const c1 = hslToRgb(...b1.color.match(/\d+/g).map(Number))
        const c2 = hslToRgb(...b2.color.match(/\d+/g).map(Number))
        const newColor = `rgb(${Math.round((c1[0] + c2[0]) / 2)}, ${Math.round((c1[1] + c2[1]) / 2)}, ${Math.round((c1[2] + c2[2]) / 2)})`

        // Create explosion at collision point
        const collisionX = (b1.x * b1.mass + b2.x * b2.mass) / newMass
        const collisionY = (b1.y * b1.mass + b2.y * b2.mass) / newMass
        const collisionZ = (b1.z * b1.mass + b2.z * b2.mass) / newMass
        createExplosion(collisionX, collisionY, collisionZ, explosions, currentTime)

        // Keep larger body, mark smaller for removal
        if (b1.mass >= b2.mass) {
          b1.mass = newMass
          b1.vx = newVx
          b1.vy = newVy
          b1.vz = newVz
          b1.radius = newRadius
          b1.color = newColor
          b2.merged = true
        } else {
          b2.mass = newMass
          b2.vx = newVx
          b2.vy = newVy
          b2.vz = newVz
          b2.radius = newRadius
          b2.color = newColor
          b1.merged = true
        }
      }
    }
  }

  return bodies.filter(b => !b.merged)
}

function computeEnergy(bodies, G) {
  let ke = 0
  let pe = 0

  // Kinetic energy
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    const v2 = b.vx * b.vx + b.vy * b.vy + b.vz * b.vz
    ke += 0.5 * b.mass * v2
  }

  // Potential energy
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const b1 = bodies[i]
      const b2 = bodies[j]
      const dx = b2.x - b1.x
      const dy = b2.y - b1.y
      const dz = b2.z - b1.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist > 0.1) {
        pe -= (G * b1.mass * b2.mass) / dist
      }
    }
  }

  return { ke, pe, total: ke + pe }
}

function computeCenterOfMass(bodies) {
  let totalMass = 0
  let cx = 0, cy = 0, cz = 0

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i]
    totalMass += b.mass
    cx += b.x * b.mass
    cy += b.y * b.mass
    cz += b.z * b.mass
  }

  if (totalMass > 0) {
    return { x: cx / totalMass, y: cy / totalMass, z: cz / totalMass }
  }
  return { x: 0, y: 0, z: 0 }
}

// ============================================================================
// RENDERING
// ============================================================================

function drawStarfield(ctx, width, height) {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  // Generate stars (cached approach: store in component state)
  const numStars = 250
  for (let i = 0; i < numStars; i++) {
    const seed = i
    const x = ((seed * 73856093) ^ (seed >> 16)) % width
    const y = ((seed * 19349663) ^ (seed >> 24)) % height
    const brightness = ((seed * 83492791) ^ (seed >> 8)) % 100

    ctx.fillStyle = brightness > 80 ? '#ffffff' : '#aaaaaa'
    ctx.globalAlpha = 0.3 + (brightness / 100) * 0.7
    ctx.fillRect(x, y, 1, 1)
  }
  ctx.globalAlpha = 1.0
}

function drawSun(ctx, body, sx, sy, pulseAmount) {
  const coreRadius = body.radius
  const coronaRadius = coreRadius + 15 + pulseAmount * 5

  // Corona
  const coronaGrad = ctx.createRadialGradient(sx, sy, coreRadius, sx, sy, coronaRadius)
  coronaGrad.addColorStop(0, 'rgba(255, 200, 0, 0.3)')
  coronaGrad.addColorStop(0.5, 'rgba(255, 150, 0, 0.1)')
  coronaGrad.addColorStop(1, 'rgba(255, 100, 0, 0)')

  ctx.fillStyle = coronaGrad
  ctx.fillRect(sx - coronaRadius, sy - coronaRadius, coronaRadius * 2, coronaRadius * 2)

  // Core
  const coreGrad = ctx.createRadialGradient(sx - coreRadius * 0.3, sy - coreRadius * 0.3, 0, sx, sy, coreRadius)
  coreGrad.addColorStop(0, '#ffff99')
  coreGrad.addColorStop(0.7, '#ffcc00')
  coreGrad.addColorStop(1, '#ff8800')

  ctx.fillStyle = coreGrad
  ctx.beginPath()
  ctx.arc(sx, sy, coreRadius, 0, Math.PI * 2)
  ctx.fill()
}

function drawPlanet(ctx, body, sx, sy, lightDir) {
  const r = body.radius
  const grad = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.3, 0, sx, sy, r)

  // Extract HSL from color
  const match = body.color.match(/\d+/g)
  if (match && match.length >= 3) {
    const h = parseInt(match[0])
    const s = parseInt(match[1])
    const l = parseInt(match[2])

    grad.addColorStop(0, `hsl(${h}, ${s}%, ${Math.min(l + 20, 100)}%)`)
    grad.addColorStop(0.7, `hsl(${h}, ${s}%, ${l}%)`)
    grad.addColorStop(1, `hsl(${h}, ${s}%, ${Math.max(l - 20, 0)}%)`)
  } else {
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.7, body.color)
    grad.addColorStop(1, '#333333')
  }

  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(sx, sy, r, 0, Math.PI * 2)
  ctx.fill()

  // Atmosphere halo
  ctx.strokeStyle = `rgba(100, 150, 255, 0.2)`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(sx, sy, r + 3, 0, Math.PI * 2)
  ctx.stroke()
}

function drawTrail(ctx, trail, color) {
  if (trail.length < 2) return

  ctx.strokeStyle = color
  ctx.lineWidth = 1.5

  for (let i = 0; i < trail.length - 1; i++) {
    const opacity = i / trail.length
    ctx.globalAlpha = opacity * 0.6
    ctx.beginPath()
    ctx.moveTo(trail[i].sx, trail[i].sy)
    ctx.lineTo(trail[i + 1].sx, trail[i + 1].sy)
    ctx.stroke()
  }
  ctx.globalAlpha = 1.0
}

function drawVelocityVector(ctx, sx, sy, vx, vy, speed, scale = 0.02) {
  if (speed < 0.1) return

  const len = Math.sqrt(vx * vx + vy * vy)
  if (len === 0) return

  const ux = (vx / len) * speed * scale
  const uy = (vy / len) * speed * scale

  ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.lineTo(sx + ux, sy + uy)
  ctx.stroke()

  // Arrowhead
  const arrowSize = 5
  const angle = Math.atan2(uy, ux)
  ctx.beginPath()
  ctx.moveTo(sx + ux, sy + uy)
  ctx.lineTo(sx + ux - arrowSize * Math.cos(angle - Math.PI / 6), sy + uy - arrowSize * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(sx + ux - arrowSize * Math.cos(angle + Math.PI / 6), sy + uy - arrowSize * Math.sin(angle + Math.PI / 6))
  ctx.fill()
}

function drawGravitationalLines(ctx, bodies, forces, showLines) {
  if (!showLines || forces.length === 0) return

  const maxForce = Math.max(...forces.map(f => f.magnitude))
  const p20 = maxForce * 0.2
  const p40 = maxForce * 0.4
  const p60 = maxForce * 0.6
  const p80 = maxForce * 0.8

  ctx.lineWidth = 1

  for (const f of forces) {
    if (!f.screen1 || !f.screen2) continue

    let dashPattern = []
    let width = 1

    if (f.magnitude < p20) {
      dashPattern = [2, 4]
      ctx.globalAlpha = 0.1
    } else if (f.magnitude < p40) {
      dashPattern = [4, 4]
      ctx.globalAlpha = 0.15
    } else if (f.magnitude < p60) {
      dashPattern = [6, 3]
      ctx.globalAlpha = 0.25
      width = 1.5
    } else if (f.magnitude < p80) {
      dashPattern = []
      ctx.globalAlpha = 0.4
      width = 1.5
    } else {
      dashPattern = []
      ctx.globalAlpha = 0.6
      width = 2
    }

    ctx.strokeStyle = 'rgba(220, 140, 60, 1)'
    ctx.lineWidth = width

    ctx.setLineDash(dashPattern)
    ctx.beginPath()
    ctx.moveTo(f.screen1.sx, f.screen1.sy)
    ctx.lineTo(f.screen2.sx, f.screen2.sy)
    ctx.stroke()
  }

  ctx.setLineDash([])
  ctx.globalAlpha = 1.0
}

function drawCenterOfMass(ctx, com, pulse) {
  const size = 8 + pulse * 3
  ctx.strokeStyle = `rgba(255, 255, 100, ${0.5 + pulse * 0.5})`
  ctx.lineWidth = 2

  // Cross
  ctx.beginPath()
  ctx.moveTo(com.sx - size, com.sy)
  ctx.lineTo(com.sx + size, com.sy)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(com.sx, com.sy - size)
  ctx.lineTo(com.sx, com.sy + size)
  ctx.stroke()

  // Diamond
  ctx.strokeStyle = `rgba(255, 200, 50, ${0.3 + pulse * 0.3})`
  ctx.beginPath()
  ctx.moveTo(com.sx + size, com.sy)
  ctx.lineTo(com.sx, com.sy + size)
  ctx.lineTo(com.sx - size, com.sy)
  ctx.lineTo(com.sx, com.sy - size)
  ctx.closePath()
  ctx.stroke()
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GravitySim() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [layoutMode, setLayoutMode] = useState('wide')
  const [availHeight, setAvailHeight] = useState(600)
  const [controlTab, setControlTab] = useState('controls')

  // Simulation state
  const [bodies, setBodies] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [tickCount, setTickCount] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [mergerCount, setMergerCount] = useState(0)

  // Control sliders
  const [numPlanets, setNumPlanets] = useState(15)
  const [timeScale, setTimeScale] = useState(1)
  const [minSize, setMinSize] = useState(6)
  const [maxSize, setMaxSize] = useState(25)
  const [gMultiplier, setGMultiplier] = useState(1)
  const [orbitalMode, setOrbitalMode] = useState(true)

  // Toggles
  const [showTrails, setShowTrails] = useState(true)
  const [showVelocity, setShowVelocity] = useState(false)
  const [showForces, setShowForces] = useState(false)
  const [showCOM, setShowCOM] = useState(false)
  const [showEnergy, setShowEnergy] = useState(false)

  // Camera
  const [azimuth, setAzimuth] = useState(0)
  const [elevation, setElevation] = useState(Math.PI / 12)

  // Zoom and camera
  const [zoom, setZoom] = useState(1.0)

  // Energy state
  const [energy, setEnergy] = useState({ ke: 0, pe: 0, total: 0 })

  // Inspector state
  const [inspectorData, setInspectorData] = useState(null)

  // Refs for animation loop
  const simulationRef = useRef({
    bodies: [],
    tickCount: 0,
    timeElapsed: 0,
    mergerCount: 0,
    lastMergedCount: 0,
    accumulator: 0,
    cameraAzimuth: 0,
    cameraElevation: Math.PI / 12,
    dragStart: null,
    clickStart: null,
    pulsePhase: 0,
    explosions: [],
    zoom: 1.0
  })

  const G = 100 * gMultiplier
  const DT = 0.01
  const SOFTENING = 15

  // ========================================================================
  // INITIALIZATION & GENERATION
  // ========================================================================

  const generateNewSpace = useCallback(() => {
    const newBodies = generateSystem(numPlanets, minSize, maxSize, orbitalMode, G)
    simulationRef.current.bodies = newBodies
    simulationRef.current.tickCount = 0
    simulationRef.current.timeElapsed = 0
    simulationRef.current.mergerCount = 0
    simulationRef.current.lastMergedCount = 0
    setBodies(newBodies)
    setTickCount(0)
    setTimeElapsed(0)
    setMergerCount(0)
    setSelectedPlanet(null)
    computeAccelerations(newBodies, G, SOFTENING)
  }, [numPlanets, minSize, maxSize, orbitalMode, G])

  useEffect(() => {
    generateNewSpace()
  }, [])

  // ========================================================================
  // CANVAS SIZING & LAYOUT
  // ========================================================================

  useEffect(() => {
    const computeLayout = () => {
      const ww = window.innerWidth
      const wh = window.innerHeight
      const aH = wh - 120
      setAvailHeight(aH)
      setLayoutMode(ww / wh > 1.2 ? 'wide' : 'tall')
    }
    computeLayout()
    const raf = requestAnimationFrame(computeLayout)
    const timer = setTimeout(computeLayout, 200)
    window.addEventListener('resize', computeLayout)
    return () => {
      window.removeEventListener('resize', computeLayout)
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [])

  // ========================================================================
  // ANIMATION LOOP
  // ========================================================================

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animationId

    const animate = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const sim = simulationRef.current

      // Physics update
      if (isRunning) {
        sim.accumulator += timeScale * 0.016 // ~60fps

        while (sim.accumulator > DT) {
          verletStep(sim.bodies, DT, G, SOFTENING)

          sim.bodies = checkCollisions(sim.bodies, sim.explosions, sim.timeElapsed)
          if (sim.bodies.length !== sim.lastMergedCount) {
            sim.mergerCount += 1
            sim.lastMergedCount = sim.bodies.length
          }

          sim.tickCount += 1
          sim.timeElapsed += DT
          sim.accumulator -= DT
        }

        setBodies([...sim.bodies])
        setTickCount(sim.tickCount)
        setTimeElapsed(sim.timeElapsed)
        setMergerCount(sim.mergerCount)

        if (showEnergy) {
          const e = computeEnergy(sim.bodies, G)
          setEnergy(e)
        }
      }

      // Update trails
      if (showTrails) {
        for (let i = 0; i < sim.bodies.length; i++) {
          const b = sim.bodies[i]
          b.trail.push({ x: b.x, y: b.y, z: b.z })
          if (b.trail.length > 80) {
            b.trail.shift()
          }
        }
      } else {
        for (let i = 0; i < sim.bodies.length; i++) {
          sim.bodies[i].trail = []
        }
      }

      // Pulse animation
      sim.pulsePhase += 0.05
      const pulseAmount = (Math.sin(sim.pulsePhase) + 1) / 2

      // Rendering
      const width = canvas.width
      const height = canvas.height

      drawStarfield(ctx, width, height)

      // 3D projection with zoom
      const effectiveFocal = 300 * sim.zoom
      const projected = []
      for (let i = 0; i < sim.bodies.length; i++) {
        const b = sim.bodies[i]

        const rotated = rotatePoint3D(
          b.x, b.y, b.z,
          sim.cameraAzimuth,
          sim.cameraElevation
        )

        const screen = projectToScreen(
          rotated.x, rotated.y, rotated.z,
          effectiveFocal
        )

        if (screen) {
          screen.sx += width / 2
          screen.sy += height / 2
          projected.push({
            body: b,
            screen,
            dist: screen.z
          })
        }
      }

      // Depth sort
      projected.sort((a, b) => a.dist - b.dist)

      // Compute forces for visualization
      const forces = []
      if (showForces) {
        const forceData = []
        for (let i = 0; i < sim.bodies.length; i++) {
          for (let j = i + 1; j < sim.bodies.length; j++) {
            const b1 = sim.bodies[i]
            const b2 = sim.bodies[j]
            const dx = b2.x - b1.x
            const dy = b2.y - b1.y
            const dz = b2.z - b1.z
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
            if (dist > 0.1) {
              const mag = (G * b1.mass * b2.mass) / (dist * dist)
              forceData.push({
                i, j, magnitude: mag
              })
            }
          }
        }

        forceData.sort((a, b) => b.magnitude - a.magnitude)
        const topCount = Math.ceil(forceData.length * 0.35)
        const topForces = forceData.slice(0, topCount)

        for (const f of topForces) {
          const b1 = sim.bodies[f.i]
          const b2 = sim.bodies[f.j]

          const rotated1 = rotatePoint3D(b1.x, b1.y, b1.z, sim.cameraAzimuth, sim.cameraElevation)
          const rotated2 = rotatePoint3D(b2.x, b2.y, b2.z, sim.cameraAzimuth, sim.cameraElevation)

          const screen1 = projectToScreen(rotated1.x, rotated1.y, rotated1.z, effectiveFocal)
          const screen2 = projectToScreen(rotated2.x, rotated2.y, rotated2.z, effectiveFocal)

          if (screen1 && screen2) {
            forces.push({
              magnitude: f.magnitude,
              screen1: { sx: screen1.sx + width / 2, sy: screen1.sy + height / 2 },
              screen2: { sx: screen2.sx + width / 2, sy: screen2.sy + height / 2 }
            })
          }
        }
      }

      drawGravitationalLines(ctx, sim.bodies, forces, showForces)

      // Draw bodies
      for (const proj of projected) {
        const b = proj.body
        const depthFade = Math.max(0.5, 1 - Math.abs(proj.dist) / 500)
        ctx.globalAlpha = depthFade

        if (b.isSun) {
          drawSun(ctx, b, proj.screen.sx, proj.screen.sy, pulseAmount)
        } else {
          drawPlanet(ctx, b, proj.screen.sx, proj.screen.sy, {})
        }

        // Trails
        if (showTrails && b.trail.length > 0) {
          const projectedTrail = b.trail.map(pos => {
            const rotated = rotatePoint3D(pos.x, pos.y, pos.z, sim.cameraAzimuth, sim.cameraElevation)
            const screen = projectToScreen(rotated.x, rotated.y, rotated.z, effectiveFocal)
            if (screen) {
              return {
                sx: screen.sx + width / 2,
                sy: screen.sy + height / 2
              }
            }
            return null
          }).filter(p => p !== null)

          drawTrail(ctx, projectedTrail, b.color)
        }

        // Velocity vectors
        if (showVelocity) {
          const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz)
          drawVelocityVector(ctx, proj.screen.sx, proj.screen.sy, b.vx, b.vy, speed, 0.5)
        }

        ctx.globalAlpha = 1.0
      }

      // Center of mass
      if (showCOM && sim.bodies.length > 0) {
        const com = computeCenterOfMass(sim.bodies)
        const rotated = rotatePoint3D(com.x, com.y, com.z, sim.cameraAzimuth, sim.cameraElevation)
        const screen = projectToScreen(rotated.x, rotated.y, rotated.z, effectiveFocal)
        if (screen) {
          drawCenterOfMass(ctx, {
            sx: screen.sx + width / 2,
            sy: screen.sy + height / 2
          }, pulseAmount)
        }
      }

      // Update and render explosions
      for (let ei = sim.explosions.length - 1; ei >= 0; ei--) {
        const exp = sim.explosions[ei]
        let activeParticles = 0
        for (let pi = 0; pi < exp.particles.length; pi++) {
          const p = exp.particles[pi]
          if (p.life > 0) {
            p.life -= 1 / 30
            p.x += p.vx * 0.01
            p.y += p.vy * 0.01
            p.z += p.vz * 0.01

            const rotated = rotatePoint3D(p.x, p.y, p.z, sim.cameraAzimuth, sim.cameraElevation)
            const screen = projectToScreen(rotated.x, rotated.y, rotated.z, effectiveFocal)

            if (screen) {
              ctx.fillStyle = `rgba(255, 200, 100, ${p.life * 0.8})`
              ctx.beginPath()
              ctx.arc(screen.sx + width / 2, screen.sy + height / 2, 2, 0, Math.PI * 2)
              ctx.fill()
            }
            activeParticles++
          }
        }
        if (activeParticles === 0) {
          sim.explosions.splice(ei, 1)
        }
      }

      // Render selected planet's forces
      if (selectedPlanet !== null && selectedPlanet < sim.bodies.length) {
        const selectedBody = sim.bodies[selectedPlanet]
        for (let i = 0; i < sim.bodies.length; i++) {
          if (i === selectedPlanet) continue
          const b2 = sim.bodies[i]
          const dx = b2.x - selectedBody.x
          const dy = b2.y - selectedBody.y
          const dz = b2.z - selectedBody.z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist > 0.1) {
            const rotated1 = rotatePoint3D(selectedBody.x, selectedBody.y, selectedBody.z, sim.cameraAzimuth, sim.cameraElevation)
            const rotated2 = rotatePoint3D(b2.x, b2.y, b2.z, sim.cameraAzimuth, sim.cameraElevation)

            const screen1 = projectToScreen(rotated1.x, rotated1.y, rotated1.z, effectiveFocal)
            const screen2 = projectToScreen(rotated2.x, rotated2.y, rotated2.z, effectiveFocal)

            if (screen1 && screen2) {
              ctx.strokeStyle = 'rgba(100, 255, 100, 0.4)'
              ctx.lineWidth = 2
              ctx.beginPath()
              ctx.moveTo(screen1.sx + width / 2, screen1.sy + height / 2)
              ctx.lineTo(screen2.sx + width / 2, screen2.sy + height / 2)
              ctx.stroke()
            }
          }
        }
      }

      // Status overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(10, height - 85, 200, 80)

      ctx.fillStyle = '#ffffff'
      ctx.font = '11px "Inter", sans-serif'
      ctx.fillText(`Planets: ${sim.bodies.length}`, 20, height - 65)
      ctx.fillText(`Ticks: ${sim.tickCount}`, 20, height - 50)
      ctx.fillText(`Time: ${(sim.timeElapsed).toFixed(2)}s`, 20, height - 35)
      ctx.fillText(`Mergers: ${sim.mergerCount}`, 20, height - 20)

      // Legend overlay (bottom-right)
      if (showVelocity || showForces || showCOM || showTrails) {
        const legendX = width - 150
        const legendY = height - 130
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(legendX - 10, legendY - 10, 150, 130)

        ctx.fillStyle = '#cccccc'
        ctx.font = 'bold 11px "Inter", sans-serif'
        ctx.fillText('Legend', legendX, legendY + 5)

        let legendLine = legendY + 20
        const lineHeight = 18

        if (showVelocity) {
          ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(legendX, legendLine - 4)
          ctx.lineTo(legendX + 8, legendLine - 4)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(legendX + 8, legendLine - 4)
          ctx.lineTo(legendX + 6, legendLine - 7)
          ctx.lineTo(legendX + 5, legendLine - 2)
          ctx.fill()
          ctx.fillStyle = '#aaaaaa'
          ctx.font = '10px "Inter", sans-serif'
          ctx.fillText('Velocity', legendX + 15, legendLine)
          legendLine += lineHeight
        }

        if (showForces) {
          ctx.strokeStyle = 'rgba(220, 140, 60, 0.8)'
          ctx.lineWidth = 2
          ctx.setLineDash([2, 4])
          ctx.beginPath()
          ctx.moveTo(legendX, legendLine - 4)
          ctx.lineTo(legendX + 12, legendLine - 4)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = '#aaaaaa'
          ctx.font = '10px "Inter", sans-serif'
          ctx.fillText('Forces', legendX + 15, legendLine)
          legendLine += lineHeight
        }

        if (showCOM) {
          ctx.fillStyle = 'rgba(255, 200, 50, 0.8)'
          ctx.beginPath()
          ctx.moveTo(legendX + 6, legendLine - 8)
          ctx.lineTo(legendX + 12, legendLine - 2)
          ctx.lineTo(legendX + 6, legendLine + 4)
          ctx.lineTo(legendX, legendLine - 2)
          ctx.closePath()
          ctx.fill()
          ctx.fillStyle = '#aaaaaa'
          ctx.font = '10px "Inter", sans-serif'
          ctx.fillText('Center of Mass', legendX + 15, legendLine)
          legendLine += lineHeight
        }

        if (showTrails) {
          ctx.fillStyle = 'rgba(100, 150, 255, 0.8)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(legendX, legendLine - 2)
          ctx.lineTo(legendX + 12, legendLine - 2)
          ctx.stroke()
          ctx.fillStyle = '#aaaaaa'
          ctx.font = '10px "Inter", sans-serif'
          ctx.fillText('Trails', legendX + 15, legendLine)
        }
      }

      // Edit mode indicator
      if (isEditMode) {
        ctx.strokeStyle = '#ff0000'
        ctx.lineWidth = 3
        ctx.strokeRect(5, 5, width - 10, height - 10)
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationId)
  }, [isRunning, timeScale, G, showTrails, showVelocity, showForces, showCOM, showEnergy, selectedPlanet, zoom])

  // ========================================================================
  // INTERACTION HANDLERS
  // ========================================================================

  const handleCanvasMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Store click position for both edit and inspector modes
    simulationRef.current.clickStart = { x, y }

    if (!isEditMode) {
      // Drag to rotate camera
      simulationRef.current.dragStart = { x, y }
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (!simulationRef.current.dragStart) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const dx = x - simulationRef.current.dragStart.x
    const dy = y - simulationRef.current.dragStart.y

    simulationRef.current.cameraAzimuth += dx * 0.01
    simulationRef.current.cameraElevation += dy * 0.01

    // Clamp elevation
    simulationRef.current.cameraElevation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, simulationRef.current.cameraElevation))

    setAzimuth(simulationRef.current.cameraAzimuth)
    setElevation(simulationRef.current.cameraElevation)

    simulationRef.current.dragStart = { x, y }
  }

  const handleCanvasWheel = (e) => {
    e.preventDefault()
    const sim = simulationRef.current
    const delta = e.deltaY > 0 ? 1.05 : 0.95
    const newZoom = Math.max(0.3, Math.min(5.0, sim.zoom * delta))
    sim.zoom = newZoom
    setZoom(newZoom)
  }

  const handleCanvasMouseUp = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const sim = simulationRef.current

    // Check if it was a click (not a drag)
    const clickStart = sim.clickStart
    const wasClick = clickStart && Math.abs(x - clickStart.x) < 5 && Math.abs(y - clickStart.y) < 5

    if (isEditMode && wasClick) {
      // Add new body in edit mode
      const width = canvasRef.current.width
      const height = canvasRef.current.height
      const screenX = clickStart.x - width / 2
      const screenY = clickStart.y - height / 2
      const focalLength = 300 * sim.zoom
      const depth = focalLength
      const worldX = (screenX * depth) / focalLength
      const worldY = (screenY * depth) / focalLength

      const mass = randomRange(minSize, maxSize)
      const radius = randomRange(4, 8)
      const color = randomColor()
      let name
      do {
        name = PLANET_NAMES[Math.floor(Math.random() * PLANET_NAMES.length)]
      } while (sim.bodies.some(b => b.name === name))

      const newBody = createBody(worldX, worldY, 0, mass, radius, color, name, false)
      sim.bodies.push(newBody)
      setBodies([...sim.bodies])
    } else if (!isEditMode && wasClick) {
      // Planet inspector in normal mode
      const width = canvasRef.current.width
      const height = canvasRef.current.height
      const focalLength = 300 * sim.zoom

      let closestIdx = -1
      let closestDist = 999999

      for (let i = 0; i < sim.bodies.length; i++) {
        const b = sim.bodies[i]
        const rotated = rotatePoint3D(b.x, b.y, b.z, sim.cameraAzimuth, sim.cameraElevation)
        const screen = projectToScreen(rotated.x, rotated.y, rotated.z, focalLength)

        if (screen) {
          const sx = screen.sx + width / 2
          const sy = screen.sy + height / 2
          const dx = sx - clickStart.x
          const dy = sy - clickStart.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist <= b.radius + 3 && dist < closestDist) {
            closestIdx = i
            closestDist = dist
          }
        }
      }

      if (closestIdx >= 0) {
        const selectedBody = sim.bodies[closestIdx]
        const influences = []

        for (let i = 0; i < sim.bodies.length; i++) {
          if (i === closestIdx) continue
          const b2 = sim.bodies[i]
          const dx = b2.x - selectedBody.x
          const dy = b2.y - selectedBody.y
          const dz = b2.z - selectedBody.z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist > 0.1) {
            const force = (G * selectedBody.mass * b2.mass) / (dist * dist)
            influences.push({
              name: b2.name,
              force,
              distance: dist
            })
          }
        }

        influences.sort((a, b) => b.force - a.force)

        setSelectedPlanet(closestIdx)
        setInspectorData({
          name: selectedBody.name,
          mass: selectedBody.mass,
          radius: selectedBody.radius,
          velocity: Math.sqrt(selectedBody.vx ** 2 + selectedBody.vy ** 2 + selectedBody.vz ** 2),
          influences: influences.slice(0, 4),
          screenX: width / 2 + (Math.random() * 200 - 100),
          screenY: height / 2 + (Math.random() * 200 - 100)
        })
      } else {
        setSelectedPlanet(null)
        setInspectorData(null)
      }
    }

    simulationRef.current.dragStart = null
    simulationRef.current.clickStart = null
  }

  // ========================================================================
  // UI STYLES
  // ========================================================================

  const btnSm = {
    padding: '5px 12px',
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid #C9C0B0',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#F0EDE5',
    color: '#5C4E3A',
    fontFamily: "'Inter', sans-serif",
  }

  const btnAccSm = (bg, fg) => ({ ...btnSm, background: bg, color: fg, borderColor: bg })

  const panelStyle = {
    background: '#F8F6F0',
    border: '1px solid #D9D3C7',
    borderRadius: 10,
    padding: 12,
    fontSize: 11,
    fontFamily: "'Inter', sans-serif",
  }

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontSize: 10,
    fontWeight: 600,
    color: '#3A3020',
    textTransform: 'uppercase',
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  const container = containerRef.current
  const containerWidth = container?.clientWidth || 800

  let canvasWidth, canvasHeight, panelWidth, panelHeight, panelBottom

  if (layoutMode === 'wide') {
    canvasWidth = Math.floor(containerWidth * 0.63)
    canvasHeight = availHeight
    panelWidth = containerWidth - canvasWidth
    panelHeight = availHeight
  } else {
    canvasWidth = containerWidth
    canvasHeight = Math.floor(availHeight * 0.55)
    panelWidth = containerWidth
    panelHeight = availHeight - canvasHeight
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: availHeight,
        display: 'flex',
        flexDirection: layoutMode === 'wide' ? 'row' : 'column',
        background: '#1a1a1a',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
      }}
    >
      {/* Canvas */}
      <div
        style={{
          position: 'relative',
          flex: layoutMode === 'wide' ? '0 0 auto' : '1 0 auto',
          width: layoutMode === 'wide' ? canvasWidth : '100%',
          height: layoutMode === 'wide' ? '100%' : canvasHeight,
          backgroundColor: '#000',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleCanvasWheel}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />

        {/* Control buttons (top-left) */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            display: 'flex',
            gap: 6,
            zIndex: 100,
          }}
        >
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={btnAccSm(isRunning ? '#ff6b6b' : '#4CAF50', '#fff')}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={generateNewSpace}
            style={btnSm}
          >
            Generate New
          </button>
        </div>

        {/* Edit button (top-right) */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 100,
          }}
        >
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            style={btnAccSm(isEditMode ? '#ff6b6b' : '#2196F3', '#fff')}
          >
            {isEditMode ? 'Done' : 'Edit'}
          </button>
        </div>

        {/* Planet Inspector Popup */}
        {inspectorData && (
          <div
            style={{
              position: 'absolute',
              left: inspectorData.screenX,
              top: inspectorData.screenY,
              background: '#F8F6F0',
              border: '1px solid #D9D3C7',
              borderRadius: 8,
              padding: 12,
              minWidth: 220,
              zIndex: 200,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#3A3020' }}>
                {inspectorData.name}
              </div>
              <button
                onClick={() => {
                  setInspectorData(null)
                  setSelectedPlanet(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: '#888',
                  padding: 0,
                  width: 20,
                  height: 20,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: 10, marginBottom: 8, color: '#3A3020' }}>
              <div style={{ marginBottom: 4 }}>
                <strong>Mass:</strong> {inspectorData.mass.toFixed(2)}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Radius:</strong> {inspectorData.radius.toFixed(2)}
              </div>
              <div>
                <strong>Velocity:</strong> {inspectorData.velocity.toFixed(2)}
              </div>
            </div>

            {inspectorData.influences.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#5C4E3A', marginBottom: 6, textTransform: 'uppercase' }}>
                  Top Forces
                </div>
                {inspectorData.influences.map((inf, idx) => (
                  <div key={idx} style={{ fontSize: 9, color: '#3A3020', marginBottom: 3 }}>
                    {inf.name}: {inf.force.toFixed(2)} (d: {inf.distance.toFixed(1)})
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div
        style={{
          flex: layoutMode === 'wide' ? '1 0 auto' : '0 0 auto',
          width: layoutMode === 'wide' ? panelWidth : '100%',
          height: layoutMode === 'wide' ? '100%' : panelHeight,
          background: '#F8F6F0',
          borderLeft: layoutMode === 'wide' ? '1px solid #D9D3C7' : 'none',
          borderTop: layoutMode === 'tall' ? '1px solid #D9D3C7' : 'none',
          overflowY: layoutMode === 'wide' ? 'auto' : 'hidden',
          display: 'flex',
          flexDirection: layoutMode === 'wide' ? 'column' : 'column',
          padding: 10,
          gap: 10,
        }}
      >
        {/* Tab buttons (tall mode) */}
        {layoutMode === 'tall' && (
          <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #D9D3C7', paddingBottom: 8 }}>
            {['controls', 'math', 'stats'].map(tab => (
              <button
                key={tab}
                onClick={() => setControlTab(tab)}
                style={{
                  ...btnSm,
                  background: controlTab === tab ? '#E8E0D5' : '#F0EDE5',
                  fontWeight: controlTab === tab ? 700 : 600,
                  color: '#3A3020',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Controls Section */}
        {(layoutMode === 'wide' || controlTab === 'controls') && (
          <div style={panelStyle}>
            <div style={labelStyle}>Physics Controls</div>

            <label style={{ display: 'block', marginBottom: 10 }}>
              <div style={{ ...labelStyle, marginBottom: 3 }}>Planets: {numPlanets}</div>
              <input
                type="range"
                min="2"
                max="50"
                value={numPlanets}
                onChange={(e) => setNumPlanets(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 10 }}>
              <div style={{ ...labelStyle, marginBottom: 3 }}>Time Scale: {timeScale.toFixed(1)}x</div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={timeScale}
                onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 10 }}>
              <div style={{ ...labelStyle, marginBottom: 3 }}>Min Size: {minSize}</div>
              <input
                type="range"
                min="4"
                max="20"
                value={minSize}
                onChange={(e) => setMinSize(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 10 }}>
              <div style={{ ...labelStyle, marginBottom: 3 }}>Max Size: {maxSize}</div>
              <input
                type="range"
                min="12"
                max="40"
                value={maxSize}
                onChange={(e) => setMaxSize(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 10 }}>
              <div style={{ ...labelStyle, marginBottom: 3 }}>G Multiplier: {gMultiplier.toFixed(1)}x</div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={gMultiplier}
                onChange={(e) => setGMultiplier(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>

            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Startup Mode</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#3A3020' }}>
                  <input
                    type="radio"
                    checked={orbitalMode}
                    onChange={() => setOrbitalMode(true)}
                  />
                  Orbital
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#3A3020' }}>
                  <input
                    type="radio"
                    checked={!orbitalMode}
                    onChange={() => setOrbitalMode(false)}
                  />
                  Chaotic
                </label>
              </div>
            </div>

            <div style={labelStyle}>Visualization</div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: '#3A3020' }}>
              <input
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
              />
              Trails
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: '#3A3020' }}>
              <input
                type="checkbox"
                checked={showVelocity}
                onChange={(e) => setShowVelocity(e.target.checked)}
              />
              Velocity Vectors
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: '#3A3020' }}>
              <input
                type="checkbox"
                checked={showForces}
                onChange={(e) => setShowForces(e.target.checked)}
              />
              Gravitational Forces
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: '#3A3020' }}>
              <input
                type="checkbox"
                checked={showCOM}
                onChange={(e) => setShowCOM(e.target.checked)}
              />
              Center of Mass
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#3A3020' }}>
              <input
                type="checkbox"
                checked={showEnergy}
                onChange={(e) => setShowEnergy(e.target.checked)}
              />
              Energy Display
            </label>
          </div>
        )}

        {/* Math Section */}
        {(layoutMode === 'wide' || controlTab === 'math') && (
          <div style={panelStyle}>
            <div style={labelStyle}>Newton's Law of Gravitation</div>
            <div style={{ fontSize: 10, color: '#5C4E3A', marginBottom: 10, fontFamily: 'monospace' }}>
              F = G × m₁ × m₂ / r²
            </div>

            <div style={{ fontSize: 10, marginBottom: 4, color: '#3A3020' }}>
              <strong>G (current):</strong> {(G).toFixed(2)}
            </div>

            <div style={{ fontSize: 10, marginBottom: 4, color: '#3A3020' }}>
              <strong>Integration:</strong> Velocity Verlet
            </div>

            <div style={{ fontSize: 10, marginBottom: 4, color: '#3A3020' }}>
              <strong>Softening:</strong> {SOFTENING} units
            </div>

            <div style={{ fontSize: 10, marginBottom: 4, color: '#3A3020' }}>
              <strong>Time Step:</strong> {DT} s
            </div>

            {bodies.length > 0 && (
              <>
                <div style={{ marginTop: 12, fontSize: 10, color: '#3A3020' }}>
                  <strong>Total Pairs:</strong> {(bodies.length * (bodies.length - 1)) / 2}
                </div>
              </>
            )}
          </div>
        )}

        {/* Stats Section */}
        {(layoutMode === 'wide' || controlTab === 'stats') && (
          <div style={panelStyle}>
            <div style={labelStyle}>System Statistics</div>

            <div style={{ fontSize: 10, marginBottom: 6, color: '#3A3020' }}>
              <strong>Total Mass:</strong> {bodies.reduce((sum, b) => sum + b.mass, 0).toFixed(2)}
            </div>

            <div style={{ fontSize: 10, marginBottom: 6, color: '#3A3020' }}>
              <strong>Mergers:</strong> {mergerCount}
            </div>

            {bodies.length > 0 && (
              <>
                <div style={{ fontSize: 10, marginBottom: 6, color: '#3A3020' }}>
                  <strong>Avg Velocity:</strong>{' '}
                  {(
                    bodies.reduce((sum, b) => sum + Math.sqrt(b.vx ** 2 + b.vy ** 2 + b.vz ** 2), 0) / bodies.length
                  ).toFixed(2)}
                </div>

                <div style={{ fontSize: 10, marginBottom: 6, color: '#3A3020' }}>
                  <strong>Max Mass:</strong>{' '}
                  {Math.max(...bodies.map(b => b.mass)).toFixed(2)}
                </div>
              </>
            )}

            {showEnergy && (
              <>
                <div style={{ marginTop: 12, fontSize: 10, color: '#3A3020' }}>
                  <div style={{ marginBottom: 3 }}>
                    <strong>KE:</strong> {energy.ke.toFixed(2)}
                  </div>
                  <div style={{ marginBottom: 3 }}>
                    <strong>PE:</strong> {energy.pe.toFixed(2)}
                  </div>
                  <div>
                    <strong>Total:</strong> {energy.total.toFixed(2)}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
