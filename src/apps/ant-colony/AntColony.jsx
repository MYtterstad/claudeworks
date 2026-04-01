import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/* ════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════ */
const CELL = 4
const NEST_RADIUS = 14         // visual radius
const NEST_DROP = 5            // ants must get this close to drop food
const FOOD_RADIUS = 6
const FOOD_DETECT = 30
const FOOD_QUANTITY = 400
const PHEROMONE_MAX = 255
const PHEROMONE_DEPOSIT = 40
const DIR8 = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]
const DIR_LABELS = ['NW','N','NE','W','E','SW','S','SE']

/* ── helpers ── */
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v }
function dist(ax, ay, bx, by) { return Math.sqrt((ax-bx)**2 + (ay-by)**2) }
function seededRng(seed) {
  let s = seed | 0 || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return ((s >>> 0) / 4294967296) }
}

/* ── Ant names ── */
const ANT_PREFIXES = ['Ant','Fern','Mand','Cara','Sergeant','Captain','Little','Big','Old','Quick','Scout','Brave','Tiny','Major']
const ANT_SUFFIXES = ['onio','onia','ible','mel','pax','sworth','kins','etta','mund','igo','wick','berry','ridge','wood']
function generateAntName(rng) {
  return ANT_PREFIXES[Math.floor(rng() * ANT_PREFIXES.length)] +
         ANT_SUFFIXES[Math.floor(rng() * ANT_SUFFIXES.length)]
}

/* ════════════════════════════════════════════
   GROUND TEXTURE
   ════════════════════════════════════════════ */
function generateGroundTexture(w, h, seed) {
  const rng = seededRng(seed)
  const img = new ImageData(w, h)
  const d = img.data
  const palette = [
    [168,190,130],[182,200,145],[155,175,120],[192,180,150],
    [175,165,135],[200,195,165],[160,185,140],[188,175,148],
  ]
  for (let by = 0; by < h; by += 4) {
    for (let bx = 0; bx < w; bx += 4) {
      const base = palette[Math.floor(rng() * palette.length)]
      for (let py = by; py < by + 4 && py < h; py++) {
        for (let px = bx; px < bx + 4 && px < w; px++) {
          const i = (py * w + px) * 4
          const j = (rng() - 0.5) * 20
          d[i] = clamp(base[0]+j, 0, 255)
          d[i+1] = clamp(base[1]+j+(rng()-0.5)*10, 0, 255)
          d[i+2] = clamp(base[2]+j-(rng()-0.5)*10, 0, 255)
          d[i+3] = 255
        }
      }
    }
  }
  for (let i = 0; i < 80; i++) {
    const cx = Math.floor(rng()*w), cy = Math.floor(rng()*h), r = 8+Math.floor(rng()*24)
    const bright = rng() > 0.5 ? 15 : -15
    for (let py = cy-r; py < cy+r; py++) for (let px = cx-r; px < cx+r; px++) {
      if (px<0||py<0||px>=w||py>=h) continue
      const dd = dist(px,py,cx,cy); if (dd>r) continue
      const fade = 1-dd/r, idx = (py*w+px)*4
      d[idx]=clamp(d[idx]+bright*fade,0,255)
      d[idx+1]=clamp(d[idx+1]+bright*fade,0,255)
      d[idx+2]=clamp(d[idx+2]+bright*fade*0.7,0,255)
    }
  }
  return img
}

/* ════════════════════════════════════════════
   CANVAS ART
   ════════════════════════════════════════════ */
function drawNest(ctx, px, py) {
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(px, py+4, 32, 20, 0, Math.PI, 0)
  const grad = ctx.createRadialGradient(px, py-4, 4, px, py+4, 30)
  grad.addColorStop(0, '#8B6914'); grad.addColorStop(0.6, '#6B4E0A'); grad.addColorStop(1, '#4A3508')
  ctx.fillStyle = grad; ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  for (const [dx,dy] of [[0,-8],[8,-4],[-10,-2],[5,2],[-6,4],[12,0],[-14,-6],[3,-12],[-4,6],[10,4]]) {
    ctx.beginPath(); ctx.arc(px+dx, py+dy, 1.5, 0, Math.PI*2); ctx.fill()
  }
  ctx.beginPath(); ctx.ellipse(px, py+2, 8, 6, 0, 0, Math.PI*2)
  ctx.fillStyle = '#1a0f00'; ctx.fill()
  ctx.beginPath(); ctx.ellipse(px, py-10, 18, 5, 0, Math.PI+0.3, -0.3)
  ctx.strokeStyle = 'rgba(255,255,200,0.2)'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.fillStyle = '#4A3508'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('Nest', px, py-26)
  ctx.restore()
}

function drawCookie(ctx, px, py, ratio) {
  if (ratio <= 0) return
  const r = 10 + 14 * ratio
  ctx.save()
  ctx.beginPath()
  for (let a = 0; a < Math.PI*2; a += 0.15) {
    const bump = r + Math.sin(a*7)*2 + Math.cos(a*11)*1.5
    const x = px + Math.cos(a)*bump, y = py + Math.sin(a)*bump
    a === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)
  }
  ctx.closePath()
  const grad = ctx.createRadialGradient(px-3, py-3, 2, px, py, r)
  grad.addColorStop(0, '#E8C96A'); grad.addColorStop(0.5, '#D4A535'); grad.addColorStop(1, '#B8862D')
  ctx.fillStyle = grad; ctx.fill()
  ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1; ctx.stroke()
  ctx.fillStyle = '#4A2810'
  for (const [cx,cy] of [[-4,-3],[5,-1],[-2,4],[3,5],[-6,1],[1,-6],[6,3]]) {
    if (Math.sqrt(cx*cx+cy*cy) > r*0.7) continue
    ctx.beginPath(); ctx.ellipse(px+cx*ratio, py+cy*ratio, 2.5*ratio, 2*ratio, cx*0.3, 0, Math.PI*2); ctx.fill()
  }
  ctx.fillStyle = '#5C3D1A'; ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(Math.ceil(ratio * FOOD_QUANTITY), px, py - r - 5)
  ctx.restore()
}

function drawStone(ctx, px, py, w, h) {
  ctx.save()
  const cx = px+w/2, cy = py+h/2, rx = w/2, ry = h/2
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2)
  const grad = ctx.createRadialGradient(cx-rx*0.3, cy-ry*0.3, 2, cx, cy, Math.max(rx,ry))
  grad.addColorStop(0, '#B0A898'); grad.addColorStop(0.5, '#908478'); grad.addColorStop(1, '#6B6058')
  ctx.fillStyle = grad; ctx.fill()
  ctx.strokeStyle = '#5A524A'; ctx.lineWidth = 1; ctx.stroke()
  ctx.beginPath(); ctx.ellipse(cx-rx*0.2, cy-ry*0.3, rx*0.4, ry*0.25, -0.3, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(255,255,240,0.15)'; ctx.fill()
  ctx.restore()
}

function drawLog(ctx, px, py, w, h) {
  ctx.save()
  const r = Math.min(w, h) / 2
  const isHoriz = w >= h
  ctx.beginPath()
  if (isHoriz) {
    ctx.moveTo(px+r, py); ctx.lineTo(px+w-r, py)
    ctx.arc(px+w-r, py+r, r, -Math.PI/2, Math.PI/2)
    ctx.lineTo(px+r, py+h); ctx.arc(px+r, py+r, r, Math.PI/2, -Math.PI/2)
  } else {
    ctx.moveTo(px, py+r); ctx.lineTo(px, py+h-r)
    ctx.arc(px+r, py+h-r, r, Math.PI, 0, true)
    ctx.lineTo(px+w, py+r); ctx.arc(px+r, py+r, r, 0, Math.PI, true)
  }
  ctx.closePath()
  const grad = isHoriz
    ? ctx.createLinearGradient(px, py, px, py+h)
    : ctx.createLinearGradient(px, py, px+w, py)
  grad.addColorStop(0, '#8B6E4E'); grad.addColorStop(0.3, '#7A5C3A')
  grad.addColorStop(0.7, '#6B4E30'); grad.addColorStop(1, '#5A4028')
  ctx.fillStyle = grad; ctx.fill()
  ctx.strokeStyle = '#4A3520'; ctx.lineWidth = 1; ctx.stroke()
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.5
  if (isHoriz) {
    for (let lx = px+r+4; lx < px+w-r; lx += 6) { ctx.beginPath(); ctx.moveTo(lx, py+2); ctx.lineTo(lx+1, py+h-2); ctx.stroke() }
  } else {
    for (let ly = py+r+4; ly < py+h-r; ly += 6) { ctx.beginPath(); ctx.moveTo(px+2, ly); ctx.lineTo(px+w-2, ly+1); ctx.stroke() }
  }
  ctx.restore()
}

function drawAnt(ctx, px, py, dx, dy, carrying) {
  ctx.save(); ctx.translate(px, py)
  let angle = 0
  if (dx !== 0 || dy !== 0) angle = Math.atan2(dy, dx)
  ctx.rotate(angle)
  const s = 1.2
  ctx.strokeStyle = carrying ? '#5A3E1A' : '#2A1A0A'; ctx.lineWidth = 0.8*s
  const legWiggle = Math.sin(Date.now() * 0.015 + px*3 + py*7) * 0.3
  for (let side = -1; side <= 1; side += 2) {
    for (let li = -1; li <= 1; li++) {
      const bx = li*2.5*s, by = side*2*s
      const tx = bx + (li*2 + Math.sin(legWiggle+li*1.5)*1.5)*s, ty = by + side*4*s
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke()
    }
  }
  ctx.fillStyle = carrying ? '#5C3D1A' : '#1A0F0A'
  ctx.beginPath(); ctx.ellipse(-4*s, 0, 3.5*s, 2.5*s, 0, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(0, 0, 2.5*s, 2*s, 0, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(3.5*s, 0, 2*s, 1.8*s, 0, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = carrying ? '#5A3E1A' : '#2A1A0A'; ctx.lineWidth = 0.6*s
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath(); ctx.moveTo(5*s, side*0.5*s)
    ctx.quadraticCurveTo(7*s, side*2*s, 8*s, side*3*s); ctx.stroke()
  }
  if (carrying) {
    ctx.fillStyle = '#D4A535'; ctx.beginPath(); ctx.arc(5.5*s, 0, 1.5*s, 0, Math.PI*2); ctx.fill()
  }
  ctx.restore()
}

/* ════════════════════════════════════════════
   GRID + PHEROMONE
   ════════════════════════════════════════════ */
function createGrid(cols, rows) {
  return {
    cols, rows,
    walkable: new Uint8Array(cols * rows).fill(1),
    foodPheromone: new Float32Array(cols * rows),
    homePheromone: new Float32Array(cols * rows),
  }
}
function gIdx(g, x, y) { return y * g.cols + x }
function inBounds(g, x, y) { return x >= 0 && y >= 0 && x < g.cols && y < g.rows }
function isWalkable(g, x, y) { return inBounds(g, x, y) && g.walkable[gIdx(g, x, y)] }

function placeObstacleOnGrid(grid, ox, oy, w, h, shape) {
  if (shape === 'stone') {
    const cx = ox + w/2, cy = oy + h/2
    const rx = w/2 + 0.5, ry = h/2 + 0.5
    for (let y = Math.max(0, oy-1); y <= oy+h && y < grid.rows; y++)
      for (let x = Math.max(0, ox-1); x <= ox+w && x < grid.cols; x++)
        if (((x-cx)/rx)**2 + ((y-cy)/ry)**2 <= 1)
          grid.walkable[gIdx(grid, x, y)] = 0
  } else {
    for (let y = oy; y < oy+h && y < grid.rows; y++)
      for (let x = ox; x < ox+w && x < grid.cols; x++)
        if (x >= 0 && y >= 0) grid.walkable[gIdx(grid, x, y)] = 0
  }
}

function clearObstacleOnGrid(grid, ox, oy, w, h, shape) {
  if (shape === 'stone') {
    for (let y = Math.max(0, oy-1); y <= oy+h && y < grid.rows; y++)
      for (let x = Math.max(0, ox-1); x <= ox+w && x < grid.cols; x++)
        grid.walkable[gIdx(grid, x, y)] = 1
  } else {
    for (let y = oy; y < oy+h && y < grid.rows; y++)
      for (let x = ox; x < ox+w && x < grid.cols; x++)
        if (x >= 0 && y >= 0) grid.walkable[gIdx(grid, x, y)] = 1
  }
}

function evaporatePheromone(grid, rho) {
  const decay = 1 - rho
  const fp = grid.foodPheromone, hp = grid.homePheromone
  for (let i = 0, n = fp.length; i < n; i++) {
    fp[i] *= decay; hp[i] *= decay
    if (fp[i] < 0.1) fp[i] = 0; if (hp[i] < 0.1) hp[i] = 0
  }
}

/* ════════════════════════════════════════════
   ANT STATE MACHINE
   ════════════════════════════════════════════ */
function createAnt(nestX, nestY, rng) {
  return {
    x: nestX, y: nestY, state: 'foraging', prevDx: 0, prevDy: 0,
    name: generateAntName(rng), trips: 0, steps: 0, stateSteps: 0,
  }
}

function computeAntScores(ant, grid, foods, nestX, nestY, params) {
  const { alpha, beta } = params
  const pherLayer = ant.state === 'foraging' ? grid.foodPheromone : grid.homePheromone
  let targetX, targetY, hasTarget = false

  if (ant.state === 'foraging') {
    let closestDist = Infinity, closestFood = null
    for (const f of foods) {
      if (f.quantity <= 0) continue
      const d = dist(ant.x, ant.y, f.x, f.y)
      if (d < FOOD_DETECT && d < closestDist) { closestDist = d; closestFood = f }
    }
    if (closestFood) { targetX = closestFood.x; targetY = closestFood.y; hasTarget = true }
  } else {
    targetX = nestX; targetY = nestY; hasTarget = true
  }

  const scores = []
  for (let di = 0; di < DIR8.length; di++) {
    const [dx, dy] = DIR8[di]
    const nx = ant.x + dx, ny = ant.y + dy
    const walkable = isWalkable(grid, nx, ny)
    if (!walkable) { scores.push({ dx, dy, label: DIR_LABELS[di], walkable: false, tau: 0, eta: 0, mom: 0, score: 0 }); continue }
    const pher = pherLayer[gIdx(grid, nx, ny)]
    const tauPow = Math.pow(pher + 0.001, alpha)
    let etaPow = 1
    if (hasTarget) {
      const tdx = targetX - ant.x, tdy = targetY - ant.y
      const tLen = Math.sqrt(tdx*tdx + tdy*tdy) || 1
      const dot = (dx*tdx + dy*tdy) / (Math.SQRT2 * tLen)
      etaPow = Math.pow(clamp((dot+1)/2, 0.01, 1), beta)
    }
    let momentum = 1
    if (ant.prevDx !== 0 || ant.prevDy !== 0) {
      const mdot = dx*ant.prevDx + dy*ant.prevDy
      momentum = mdot > 0 ? 1.5 : mdot === 0 ? 0.8 : 0.3
    }
    const score = tauPow * etaPow * momentum
    scores.push({ dx, dy, label: DIR_LABELS[di], walkable: true, tau: tauPow, eta: etaPow, mom: momentum, score })
  }
  // Add proportional exploration floor: 2% of the max score, so it's always a small nudge
  const maxScore = scores.reduce((m, s) => s.walkable && s.score > m ? s.score : m, 0)
  const floor = Math.max(maxScore * 0.02, 0.001)
  for (const s of scores) { if (s.walkable) s.score += floor }
  return scores
}

function stepAnt(ant, grid, foods, nestX, nestY, params, rng) {
  const scores = computeAntScores(ant, grid, foods, nestX, nestY, params)
  const walkable = scores.filter(s => s.walkable)
  if (walkable.length === 0) {
    ant.x = nestX; ant.y = nestY; ant.state = 'foraging'
    ant.prevDx = 0; ant.prevDy = 0; return
  }

  // Stagnation escape: if stuck too long, pick a random direction occasionally
  const STAGNATION_THRESHOLD = 300
  const isStagnant = ant.stateSteps > STAGNATION_THRESHOLD
  if (isStagnant && rng() < 0.3) {
    // 30% chance of fully random move when stagnant
    const pick = walkable[Math.floor(rng() * walkable.length)]
    ant.x += pick.dx; ant.y += pick.dy
    ant.prevDx = pick.dx; ant.prevDy = pick.dy
    ant.steps++; ant.stateSteps++
    const idx = gIdx(grid, ant.x, ant.y)
    if (ant.state === 'foraging') {
      grid.homePheromone[idx] = Math.min(PHEROMONE_MAX, grid.homePheromone[idx] + PHEROMONE_DEPOSIT * 0.3)
    } else {
      grid.foodPheromone[idx] = Math.min(PHEROMONE_MAX, grid.foodPheromone[idx] + PHEROMONE_DEPOSIT)
    }
    // Check for food/nest after random move
    if (ant.state === 'foraging') {
      for (const f of foods) {
        if (f.quantity <= 0) continue
        if (dist(ant.x, ant.y, f.x, f.y) < FOOD_RADIUS) {
          f.quantity--; ant.state = 'returning'; ant.stateSteps = 0
          ant.prevDx = -ant.prevDx; ant.prevDy = -ant.prevDy; break
        }
      }
    } else {
      if (dist(ant.x, ant.y, nestX, nestY) < NEST_DROP) {
        ant.state = 'foraging'; ant.trips++; ant.stateSteps = 0
        ant.prevDx = -ant.prevDx; ant.prevDy = -ant.prevDy
      }
    }
    return
  }

  const jittered = walkable.map(s => ({ ...s, jscore: s.score * (0.5 + rng()) }))
  let best = jittered[0]
  for (let i = 1; i < jittered.length; i++) if (jittered[i].jscore > best.jscore) best = jittered[i]

  ant.x += best.dx; ant.y += best.dy
  ant.prevDx = best.dx; ant.prevDy = best.dy
  ant.steps++; ant.stateSteps++

  const i = gIdx(grid, ant.x, ant.y)
  if (ant.state === 'foraging') {
    grid.homePheromone[i] = Math.min(PHEROMONE_MAX, grid.homePheromone[i] + PHEROMONE_DEPOSIT * 0.3)
  } else {
    grid.foodPheromone[i] = Math.min(PHEROMONE_MAX, grid.foodPheromone[i] + PHEROMONE_DEPOSIT)
  }

  if (ant.state === 'foraging') {
    for (const f of foods) {
      if (f.quantity <= 0) continue
      if (dist(ant.x, ant.y, f.x, f.y) < FOOD_RADIUS) {
        f.quantity--; ant.state = 'returning'; ant.stateSteps = 0
        ant.prevDx = -ant.prevDx; ant.prevDy = -ant.prevDy; break
      }
    }
  } else {
    if (dist(ant.x, ant.y, nestX, nestY) < NEST_DROP) {
      ant.state = 'foraging'; ant.trips++; ant.stateSteps = 0
      ant.prevDx = -ant.prevDx; ant.prevDy = -ant.prevDy
    }
  }
}

/* ════════════════════════════════════════════
   MAP GENERATION
   ════════════════════════════════════════════ */
function generateMap(cols, rows, seed) {
  const rng = seededRng(seed)
  const grid = createGrid(cols, rows)
  const nestX = Math.floor(cols * 0.15), nestY = Math.floor(rows * 0.5)

  const foods = []
  const numFoods = 1 + Math.floor(rng() * 2)
  for (let i = 0; i < numFoods; i++) {
    let fx, fy, attempts = 0
    do {
      fx = Math.floor(cols*0.35 + rng()*cols*0.55)
      fy = Math.floor(rows*0.12 + rng()*rows*0.76)
      attempts++
    } while (dist(fx, fy, nestX, nestY) < cols*0.25 && attempts < 50)
    foods.push({ x: fx, y: fy, quantity: FOOD_QUANTITY, maxQuantity: FOOD_QUANTITY, id: Date.now() + i })
  }

  const obstacles = []
  const numObs = 3 + Math.floor(rng() * 4)
  for (let i = 0; i < numObs; i++) {
    const isLog = rng() > 0.5
    let ox, oy, ow, oh, valid, attempts = 0
    const vertical = rng() > 0.5
    if (isLog) {
      const len = 15 + Math.floor(rng()*25), thick = 4 + Math.floor(rng()*3)
      ow = vertical ? thick : len; oh = vertical ? len : thick
    } else {
      const sz = 8 + Math.floor(rng()*12); ow = sz + Math.floor(rng()*6); oh = sz + Math.floor(rng()*4)
    }
    do {
      ox = Math.floor(rng()*(cols - ow - 4)) + 2; oy = Math.floor(rng()*(rows - oh - 4)) + 2
      valid = true
      if (dist(ox+ow/2, oy+oh/2, nestX, nestY) < NEST_RADIUS + Math.max(ow,oh)) valid = false
      for (const f of foods) if (dist(ox+ow/2, oy+oh/2, f.x, f.y) < FOOD_RADIUS*2 + Math.max(ow,oh)) valid = false
      attempts++
    } while (!valid && attempts < 30)
    if (valid) {
      const shape = isLog ? 'log' : 'stone'
      placeObstacleOnGrid(grid, ox, oy, ow, oh, shape)
      obstacles.push({ x: ox, y: oy, w: ow, h: oh, shape, id: Date.now() + 100 + i })
    }
  }
  return { grid, nestX, nestY, foods, obstacles }
}

/* ════════════════════════════════════════════
   IN-CANVAS UI BUTTONS
   ════════════════════════════════════════════ */
function drawCanvasButton(ctx, x, y, w, h, label, active, color) {
  ctx.save()
  const r = 6
  ctx.beginPath()
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arc(x+w-r, y+r, r, -Math.PI/2, 0)
  ctx.lineTo(x+w, y+h-r); ctx.arc(x+w-r, y+h-r, r, 0, Math.PI/2)
  ctx.lineTo(x+r, y+h); ctx.arc(x+r, y+h-r, r, Math.PI/2, Math.PI)
  ctx.lineTo(x, y+r); ctx.arc(x+r, y+r, r, Math.PI, -Math.PI/2)
  ctx.closePath()
  ctx.fillStyle = active ? color : 'rgba(255,255,245,0.92)'
  ctx.fill()
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.fillStyle = active ? '#fff' : color
  ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(label, x + w/2, y + h/2)
  ctx.restore()
}

function getEditButtons() {
  const bw = 70, bh = 26, gap = 6, startX = 8, startY = 8
  return [
    { x: startX, y: startY, w: bw, h: bh, id: 'food' },
    { x: startX + bw + gap, y: startY, w: bw, h: bh, id: 'stone' },
    { x: startX + 2*(bw+gap), y: startY, w: bw, h: bh, id: 'hlog' },
    { x: startX + 3*(bw+gap), y: startY, w: bw, h: bh, id: 'vlog' },
  ]
}

function getDeleteButton(canvasW) {
  return { x: canvasW - 78, y: 8, w: 70, h: 26, id: 'delete' }
}

/* ════════════════════════════════════════════
   FULL CANVAS RENDER
   ════════════════════════════════════════════ */
function renderCanvas(ctx, canvas, groundImg, grid, ants, foods, nestX, nestY, obstacles,
                      editMode, selectedId, placingType, selectedAnt) {
  const w = canvas.width, h = canvas.height
  ctx.putImageData(groundImg, 0, 0)

  // Pheromone overlay
  for (let gy = 0; gy < grid.rows; gy++) {
    for (let gx = 0; gx < grid.cols; gx++) {
      const i = gIdx(grid, gx, gy)
      const fp = grid.foodPheromone[i], hp = grid.homePheromone[i]
      if (fp > 1 || hp > 1) {
        const px = gx*CELL, py = gy*CELL
        const r = clamp(Math.floor(fp*1.2 + hp*0.3), 0, 180)
        const g = clamp(Math.floor(fp*0.8 + hp*0.5), 0, 160)
        const b = clamp(Math.floor(hp*1.5), 0, 180)
        const a = clamp(fp*2 + hp*1.5, 10, 180) / 255
        ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(2)})`
        ctx.fillRect(px, py, CELL, CELL)
      }
    }
  }

  for (const ob of obstacles) {
    const px = ob.x*CELL, py = ob.y*CELL, pw = ob.w*CELL, ph = ob.h*CELL
    if (ob.shape === 'stone') drawStone(ctx, px, py, pw, ph)
    else drawLog(ctx, px, py, pw, ph)
    if (editMode && ob.id === selectedId) {
      ctx.strokeStyle = '#E85D75'; ctx.lineWidth = 2; ctx.setLineDash([4,4])
      ctx.strokeRect(px-3, py-3, pw+6, ph+6); ctx.setLineDash([])
    }
  }

  drawNest(ctx, nestX*CELL, nestY*CELL)

  for (const f of foods) {
    const ratio = f.quantity / f.maxQuantity
    if (ratio > 0) drawCookie(ctx, f.x*CELL, f.y*CELL, ratio)
  }

  for (const ant of ants) {
    drawAnt(ctx, ant.x*CELL, ant.y*CELL, ant.prevDx, ant.prevDy, ant.state === 'returning')
  }

  if (selectedAnt) {
    ctx.strokeStyle = '#E85D75'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(selectedAnt.x*CELL, selectedAnt.y*CELL, 12, 0, Math.PI*2); ctx.stroke()
  }

  // Edit mode overlay
  if (editMode) {
    ctx.fillStyle = 'rgba(255,255,245,0.75)'
    ctx.fillRect(0, 0, w, 42)
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, 42); ctx.lineTo(w, 42); ctx.stroke()
    const buttons = getEditButtons()
    const labels = ['+ Cookie', '+ Stone', 'H-Log', 'V-Log']
    const colors = ['#4A8C5C', '#7A6E62', '#6B4E30', '#6B4E30']
    buttons.forEach((btn, i) => {
      drawCanvasButton(ctx, btn.x, btn.y, btn.w, btn.h, labels[i], placingType === btn.id, colors[i])
    })
    if (selectedId !== null) {
      const del = getDeleteButton(w)
      drawCanvasButton(ctx, del.x, del.y, del.w, del.h, 'Delete', false, '#C94040')
    }
    if (placingType) {
      const hints = { food: 'Tap to place cookie', stone: 'Tap to place stone', hlog: 'Tap to place horizontal log', vlog: 'Tap to place vertical log' }
      const label = hints[placingType] || ''
      ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'center'
      const tw = ctx.measureText(label).width + 20
      ctx.fillStyle = 'rgba(255,255,245,0.85)'
      ctx.fillRect(w/2 - tw/2, h - 32, tw, 24)
      ctx.fillStyle = '#5C3D1A'; ctx.fillText(label, w/2, h-16)
    }
  }

  // Stats overlay removed — now rendered as HTML below map
}

/* ════════════════════════════════════════════
   ANT INSPECTOR POPUP
   ════════════════════════════════════════════ */
function AntInspector({ ant, grid, foods, nestX, nestY, params, onClose }) {
  if (!ant) return null
  const scores = computeAntScores(ant, grid, foods, nestX, nestY, params)
  const totalScore = scores.filter(s => s.walkable).reduce((sum, s) => sum + s.score, 0)

  const cellSt = { padding: '3px 8px', fontSize: 12, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }
  const headSt = { ...cellSt, fontWeight: 700, color: '#5C3D1A', textAlign: 'center', fontSize: 11 }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      background: '#FDFBF5', border: '2px solid #C9C0B0', borderRadius: 14,
      padding: 20, minWidth: 320, maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      zIndex: 10, fontFamily: "'Inter', sans-serif",
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 8, right: 10, background: 'none', border: 'none',
        fontSize: 18, color: '#8B7E6E', cursor: 'pointer',
      }}>×</button>

      <div style={{ fontSize: 16, fontWeight: 700, color: '#4A3508', marginBottom: 4 }}>{ant.name}</div>
      <div style={{ fontSize: 12, color: '#8B7E6E', marginBottom: 12 }}>
        {ant.state === 'foraging' ? 'Searching for food' : 'Carrying cookie piece home'} · {ant.trips} trip{ant.trips !== 1 ? 's' : ''} · {ant.steps} steps walked
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: '#5C3D1A', marginBottom: 6 }}>
        Decision scores from current position
      </div>
      <div style={{ fontSize: 11, color: '#8B7E6E', marginBottom: 8 }}>
        Score = τ<sup>α</sup> × η<sup>β</sup> × momentum → probability
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E8E2D8' }}>
            <th style={{ ...headSt, textAlign: 'left' }}>Dir</th>
            <th style={headSt}>τ<sup>α</sup></th>
            <th style={headSt}>η<sup>β</sup></th>
            <th style={headSt}>Mom</th>
            <th style={headSt}>Score</th>
            <th style={headSt}>Prob</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => (
            <tr key={i} style={{
              borderBottom: '1px solid #F0EBE2',
              background: !s.walkable ? '#F5F0EA' : i % 2 === 0 ? '#FDFBF5' : '#FAF7F0',
              opacity: s.walkable ? 1 : 0.4,
            }}>
              <td style={{ ...cellSt, textAlign: 'left', fontWeight: 600, color: '#5C3D1A' }}>{s.label}</td>
              <td style={cellSt}>{s.walkable ? s.tau.toFixed(2) : '—'}</td>
              <td style={cellSt}>{s.walkable ? s.eta.toFixed(2) : '—'}</td>
              <td style={cellSt}>{s.walkable ? s.mom.toFixed(1) : '—'}</td>
              <td style={{ ...cellSt, fontWeight: 600 }}>{s.walkable ? s.score.toFixed(2) : 'wall'}</td>
              <td style={{ ...cellSt, color: '#4A8C5C', fontWeight: 600 }}>
                {s.walkable && totalScore > 0 ? (s.score / totalScore * 100).toFixed(1) + '%' : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ════════════════════════════════════════════
   MATH / STATS PANEL
   ════════════════════════════════════════════ */
function MathPanel({ grid, ants, foods, alpha, beta, rho, tick }) {
  const totalFoodPher = useMemo(() => {
    if (!grid) return 0; let s = 0; for (let i = 0; i < grid.foodPheromone.length; i++) s += grid.foodPheromone[i]; return s
  }, [grid, tick])

  const totalHomePher = useMemo(() => {
    if (!grid) return 0; let s = 0; for (let i = 0; i < grid.homePheromone.length; i++) s += grid.homePheromone[i]; return s
  }, [grid, tick])

  const maxPher = useMemo(() => {
    if (!grid) return 0; let m = 0; for (let i = 0; i < grid.foodPheromone.length; i++) m = Math.max(m, grid.foodPheromone[i]); return m
  }, [grid, tick])

  const tripStats = useMemo(() => {
    if (!ants || ants.length === 0) return { total: 0, avg: 0, best: 0 }
    const total = ants.reduce((s, a) => s + a.trips, 0)
    const best = Math.max(...ants.map(a => a.trips))
    return { total, avg: (total / ants.length).toFixed(1), best }
  }, [ants, tick])

  const collected = foods ? foods.reduce((s, f) => s + (f.maxQuantity - f.quantity), 0) : 0
  const rate = tick > 0 ? (collected / tick * 60).toFixed(1) : '0.0'

  const pSt = { background: '#F8F6F0', border: '1px solid #D9D3C7', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#5C4E3A' }
  const fSt = { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#3A3020', background: '#F0EDE5', padding: '8px 12px', borderRadius: 8, marginBottom: 8, border: '1px solid #E8E2D8' }

  const panelMobile = typeof window !== 'undefined' && window.innerWidth < 640

  return (
    <div style={{ display: 'grid', gridTemplateColumns: panelMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
      <div style={pSt}>
        <div style={{ fontWeight: 700, color: '#4A8C5C', marginBottom: 8, fontSize: 13 }}>Transition Formula</div>
        <div style={fSt}>
          P(i→j) = τ<sub>ij</sub><sup>{alpha.toFixed(1)}</sup> × η<sub>ij</sub><sup>{beta.toFixed(1)}</sup> / Σ
        </div>
        <div style={{ lineHeight: 1.6 }}>
          <span style={{ color: '#8B7E6E' }}>τ</span> = pheromone · <span style={{ color: '#8B7E6E' }}>η</span> = direction toward target<br/>
          <span style={{ color: '#8B7E6E' }}>α={alpha.toFixed(1)}</span> → {alpha < 1 ? 'low trail reliance' : alpha < 2 ? 'balanced trail use' : 'strong trail following'}<br/>
          <span style={{ color: '#8B7E6E' }}>β={beta.toFixed(1)}</span> → {beta < 1.5 ? 'weak direction bias' : beta < 4 ? 'moderate direction bias' : 'strong greedy behavior'}<br/>
          <span style={{ color: '#8B7E6E' }}>ρ={rho.toFixed(3)}</span> → half-life ≈ {Math.round(Math.log(0.5)/Math.log(1-rho))} ticks
        </div>
      </div>
      <div style={pSt}>
        <div style={{ fontWeight: 700, color: '#B8862D', marginBottom: 8, fontSize: 13 }}>Colony Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', lineHeight: 1.7 }}>
          <span style={{ color: '#8B7E6E' }}>Food collected</span><span style={{ fontWeight: 600 }}>{collected}</span>
          <span style={{ color: '#8B7E6E' }}>Collection rate</span><span style={{ fontWeight: 600 }}>{rate}/min</span>
          <span style={{ color: '#8B7E6E' }}>Total trips</span><span style={{ fontWeight: 600 }}>{tripStats.total}</span>
          <span style={{ color: '#8B7E6E' }}>Avg trips/ant</span><span style={{ fontWeight: 600 }}>{tripStats.avg}</span>
          <span style={{ color: '#8B7E6E' }}>Best forager</span><span style={{ fontWeight: 600 }}>{tripStats.best} trips</span>
          <span style={{ color: '#8B7E6E' }}>Peak trail τ</span><span style={{ fontWeight: 600 }}>{maxPher.toFixed(1)}</span>
          <span style={{ color: '#8B7E6E' }}>Food trail Σ</span><span style={{ fontWeight: 600 }}>{totalFoodPher.toFixed(0)}</span>
          <span style={{ color: '#8B7E6E' }}>Home trail Σ</span><span style={{ fontWeight: 600 }}>{totalHomePher.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function AntColony() {
  const canvasRef = useRef(null)
  const simRef = useRef(null)
  const groundRef = useRef(null)
  const tickAccRef = useRef(0)

  const [antCount, setAntCount] = useState(80)
  const [alpha, setAlpha] = useState(1.0)
  const [beta, setBeta] = useState(2.5)
  const [rho, setRho] = useState(0.02)
  const [speed, setSpeed] = useState(0.3)
  const [running, setRunning] = useState(false)
  const [mapSeed, setMapSeed] = useState(42)
  const [editMode, setEditMode] = useState(false)
  const [placingType, setPlacingType] = useState(null)
  const [selectedObstacle, setSelectedObstacle] = useState(null)
  const [selectedAnt, setSelectedAnt] = useState(null)
  const [tick, setTick] = useState(0)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 500 })

  const cols = useMemo(() => Math.floor(canvasSize.w / CELL), [canvasSize.w])
  const rows = useMemo(() => Math.floor(canvasSize.h / CELL), [canvasSize.h])

  const initSim = useCallback((seed) => {
    const map = generateMap(cols, rows, seed)
    const rng = seededRng(seed + 999)
    const ants = []
    for (let i = 0; i < antCount; i++) ants.push(createAnt(map.nestX, map.nestY, rng))
    simRef.current = { ...map, ants, rng, tickCount: 0 }
    groundRef.current = generateGroundTexture(canvasSize.w, canvasSize.h, seed + 7777)
    tickAccRef.current = 0
    setTick(0); setRunning(false); setSelectedObstacle(null); setPlacingType(null); setSelectedAnt(null)
  }, [cols, rows, antCount, canvasSize])

  useEffect(() => {
    const handleResize = () => {
      const maxW = Math.min(window.innerWidth - 32, 1000)
      const maxH = Math.min(window.innerHeight * 0.55, 600)
      const isMobile = window.innerWidth < 640
      const aspect = isMobile ? 1.1 : 1.6
      let w = maxW, h = Math.floor(w / aspect)
      if (h > maxH) { h = maxH; w = Math.floor(h * aspect) }
      w = Math.floor(w/CELL)*CELL; h = Math.floor(h/CELL)*CELL
      setCanvasSize({ w, h })
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => { initSim(mapSeed) }, [cols, rows]) // eslint-disable-line

  useEffect(() => {
    if (!running || !simRef.current) return
    const sim = simRef.current; let frameId
    const frame = () => {
      const params = { alpha, beta }
      tickAccRef.current += speed
      while (tickAccRef.current >= 1) {
        for (const ant of sim.ants) stepAnt(ant, sim.grid, sim.foods, sim.nestX, sim.nestY, params, sim.rng)
        evaporatePheromone(sim.grid, rho)
        sim.tickCount++; tickAccRef.current -= 1
      }
      sim.foods = sim.foods.filter(f => f.quantity > 0)
      setTick(sim.tickCount)
      const canvas = canvasRef.current
      if (canvas && groundRef.current) {
        const ctx = canvas.getContext('2d')
        renderCanvas(ctx, canvas, groundRef.current, sim.grid, sim.ants, sim.foods, sim.nestX, sim.nestY,
          sim.obstacles, editMode, selectedObstacle, placingType, selectedAnt)
      }
      frameId = requestAnimationFrame(frame)
    }
    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [running, alpha, beta, rho, speed, editMode, selectedObstacle, placingType, selectedAnt])

  useEffect(() => {
    if (running) return
    const canvas = canvasRef.current; const sim = simRef.current
    if (!canvas || !sim || !groundRef.current) return
    const ctx = canvas.getContext('2d')
    renderCanvas(ctx, canvas, groundRef.current, sim.grid, sim.ants, sim.foods, sim.nestX, sim.nestY,
      sim.obstacles, editMode, selectedObstacle, placingType, selectedAnt)
  }, [running, editMode, selectedObstacle, placingType, tick, canvasSize, selectedAnt])

  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current; const sim = simRef.current
    if (!canvas || !sim) return
    const rect = canvas.getBoundingClientRect()
    const clickPx = e.clientX - rect.left, clickPy = e.clientY - rect.top
    const cx = Math.floor(clickPx / CELL), cy = Math.floor(clickPy / CELL)

    if (editMode) {
      const buttons = getEditButtons()
      for (const btn of buttons) {
        if (clickPx >= btn.x && clickPx <= btn.x+btn.w && clickPy >= btn.y && clickPy <= btn.y+btn.h) {
          setPlacingType(placingType === btn.id ? null : btn.id); return
        }
      }
      if (selectedObstacle !== null) {
        const del = getDeleteButton(canvas.width)
        if (clickPx >= del.x && clickPx <= del.x+del.w && clickPy >= del.y && clickPy <= del.y+del.h) {
          const ob = sim.obstacles.find(o => o.id === selectedObstacle)
          if (ob) { clearObstacleOnGrid(sim.grid, ob.x, ob.y, ob.w, ob.h, ob.shape); sim.obstacles = sim.obstacles.filter(o => o.id !== selectedObstacle) }
          setSelectedObstacle(null); setTick(t => t + 1); return
        }
      }
      if (placingType === 'food') {
        sim.foods.push({ x: cx, y: cy, quantity: FOOD_QUANTITY, maxQuantity: FOOD_QUANTITY, id: Date.now() })
        setPlacingType(null); setTick(t => t + 1); return
      }
      if (placingType === 'stone') {
        const ow = 10+Math.floor(Math.random()*6), oh = 8+Math.floor(Math.random()*5)
        const ox = cx - Math.floor(ow/2), oy = cy - Math.floor(oh/2)
        placeObstacleOnGrid(sim.grid, ox, oy, ow, oh, 'stone')
        sim.obstacles.push({ x: ox, y: oy, w: ow, h: oh, shape: 'stone', id: Date.now() })
        setPlacingType(null); setTick(t => t + 1); return
      }
      if (placingType === 'hlog') {
        const ow = 20+Math.floor(Math.random()*12), oh = 4+Math.floor(Math.random()*2)
        const ox = cx - Math.floor(ow/2), oy = cy - Math.floor(oh/2)
        placeObstacleOnGrid(sim.grid, ox, oy, ow, oh, 'log')
        sim.obstacles.push({ x: ox, y: oy, w: ow, h: oh, shape: 'log', id: Date.now() })
        setPlacingType(null); setTick(t => t + 1); return
      }
      if (placingType === 'vlog') {
        const ow = 4+Math.floor(Math.random()*2), oh = 20+Math.floor(Math.random()*12)
        const ox = cx - Math.floor(ow/2), oy = cy - Math.floor(oh/2)
        placeObstacleOnGrid(sim.grid, ox, oy, ow, oh, 'log')
        sim.obstacles.push({ x: ox, y: oy, w: ow, h: oh, shape: 'log', id: Date.now() })
        setPlacingType(null); setTick(t => t + 1); return
      }
      for (const ob of sim.obstacles) {
        if (cx >= ob.x && cx < ob.x+ob.w && cy >= ob.y && cy < ob.y+ob.h) {
          setSelectedObstacle(ob.id === selectedObstacle ? null : ob.id); return
        }
      }
      setSelectedObstacle(null); return
    }

    if (!running) {
      let closest = null, closestD = 8
      for (const ant of sim.ants) {
        const d = dist(cx, cy, ant.x, ant.y)
        if (d < closestD) { closestD = d; closest = ant }
      }
      setSelectedAnt(closest)
    }
  }, [editMode, placingType, selectedObstacle, running])

  const dragRef = useRef(null)
  const handlePointerDown = useCallback((e) => {
    if (!editMode || placingType) return
    const canvas = canvasRef.current; const sim = simRef.current
    if (!canvas || !sim) return
    const rect = canvas.getBoundingClientRect()
    const clickPy = e.clientY - rect.top
    if (clickPy < 42) return
    const cx = Math.floor((e.clientX - rect.left) / CELL), cy = Math.floor(clickPy / CELL)
    for (const ob of sim.obstacles) {
      if (cx >= ob.x && cx < ob.x+ob.w && cy >= ob.y && cy < ob.y+ob.h) {
        dragRef.current = { id: ob.id, offsetX: cx-ob.x, offsetY: cy-ob.y }
        setSelectedObstacle(ob.id); e.preventDefault(); return
      }
    }
  }, [editMode, placingType])

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return
    const canvas = canvasRef.current; const sim = simRef.current
    if (!canvas || !sim) return
    const rect = canvas.getBoundingClientRect()
    const cx = Math.floor((e.clientX - rect.left) / CELL), cy = Math.floor((e.clientY - rect.top) / CELL)
    const ob = sim.obstacles.find(o => o.id === dragRef.current.id)
    if (!ob) return
    clearObstacleOnGrid(sim.grid, ob.x, ob.y, ob.w, ob.h, ob.shape)
    ob.x = clamp(cx - dragRef.current.offsetX, 0, sim.grid.cols - ob.w)
    ob.y = clamp(cy - dragRef.current.offsetY, 0, sim.grid.rows - ob.h)
    placeObstacleOnGrid(sim.grid, ob.x, ob.y, ob.w, ob.h, ob.shape)
    setTick(t => t + 1); e.preventDefault()
  }, [])

  const handlePointerUp = useCallback(() => { dragRef.current = null }, [])

  const handleNewMap = () => { const s = Date.now(); setMapSeed(s); initSim(s) }
  const handleReset = () => initSim(mapSeed)
  const handleStartStop = () => { setRunning(r => !r); setSelectedAnt(null) }

  const handleAntCountChange = (n) => {
    setAntCount(n)
    const sim = simRef.current; if (!sim) return
    const rng = sim.rng
    if (n > sim.ants.length) { for (let i = sim.ants.length; i < n; i++) sim.ants.push(createAnt(sim.nestX, sim.nestY, rng)) }
    else sim.ants.length = n
  }

  const btnBase = {
    padding: '8px 16px', fontSize: 13, fontWeight: 600,
    border: '1px solid #C9C0B0', borderRadius: 8, cursor: 'pointer',
    background: '#F0EDE5', color: '#5C4E3A', fontFamily: "'Inter', sans-serif",
    transition: 'all 0.15s',
  }
  const btnAccent = (bg, fg) => ({ ...btnBase, background: bg, color: fg, borderColor: bg })
  const panelStyle = { background: '#F8F6F0', border: '1px solid #D9D3C7', borderRadius: 12, padding: 16 }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#6B5E4E', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
  const valStyle = { color: '#3A3020', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }
  const sliderStyle = { width: '100%', accentColor: '#8B7355', cursor: 'pointer' }
  const isMobile = canvasSize.w < 580
  const sim = simRef.current

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#3A3020', maxWidth: 1040, margin: '0 auto' }}>
      {/* Canvas + overlays */}
      <div style={{ position: 'relative', marginBottom: 12, display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.w} height={canvasSize.h}
          style={{
            width: canvasSize.w, height: canvasSize.h, borderRadius: 12,
            border: editMode ? '2px solid #E85D75' : '1px solid #C9C0B0',
            cursor: editMode ? 'crosshair' : (!running ? 'pointer' : 'default'),
            touchAction: editMode ? 'none' : 'auto',
            display: 'block', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
          onClick={handleCanvasClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        <button
          onClick={() => { setEditMode(m => !m); setPlacingType(null); setSelectedObstacle(null); setSelectedAnt(null) }}
          style={{
            position: 'absolute', top: editMode ? 'auto' : 8, bottom: editMode ? 8 : 'auto', right: 8,
            ...btnBase, fontSize: 12, padding: '5px 12px',
            background: editMode ? '#E85D75' : 'rgba(255,255,245,0.9)',
            color: editMode ? '#fff' : '#5C4E3A', borderColor: editMode ? '#E85D75' : '#C9C0B0',
          }}
        >
          {editMode ? 'Done' : 'Edit Map'}
        </button>

        {!editMode && (
          <span style={{
            position: 'absolute', bottom: 8, left: 8,
            fontSize: 11, color: '#5C4E3A', fontFamily: "'JetBrains Mono', monospace",
            background: 'rgba(255,255,245,0.85)', padding: '3px 8px', borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.08)',
          }}>
            tick {tick}
          </span>
        )}

        {selectedAnt && !running && sim && (
          <AntInspector
            ant={selectedAnt} grid={sim.grid} foods={sim.foods}
            nestX={sim.nestX} nestY={sim.nestY} params={{ alpha, beta }}
            onClose={() => setSelectedAnt(null)}
          />
        )}

        {!running && !editMode && !selectedAnt && tick > 0 && (
          <span style={{
            position: 'absolute', bottom: 8, right: 80,
            fontSize: 11, color: '#8B7E6E',
            background: 'rgba(255,255,245,0.85)', padding: '3px 8px', borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.08)',
          }}>
            Click an ant to inspect
          </span>
        )}
      </div>

      {/* Transport + Legend row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={handleStartStop} style={running ? btnAccent('#C94040', '#fff') : btnAccent('#4A8C5C', '#fff')}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={handleReset} style={btnBase}>Reset</button>
        <button onClick={handleNewMap} style={btnBase}>New Map</button>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#8B7E6E', marginLeft: 8, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#1A0F0A', borderRadius: 5 }} />Foraging{sim ? `: ${sim.ants.filter(a => a.state === 'foraging').length}` : ''}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#5C3D1A', borderRadius: 5 }} />Carrying{sim ? `: ${sim.ants.filter(a => a.state !== 'foraging').length}` : ''}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(180,140,50,0.5)', borderRadius: 2 }} />Food trail
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(80,80,180,0.4)', borderRadius: 2 }} />Home trail
          </span>
          {sim && <span style={{ color: '#6B4E30', fontWeight: 600 }}>Collected: {sim.foods.reduce((s, f) => s + (f.maxQuantity - f.quantity), 0)}</span>}
        </div>
      </div>

      {/* Controls — collapsible */}
      <button onClick={() => setControlsOpen(c => !c)} style={{ ...btnBase, width: '100%', marginBottom: controlsOpen ? 12 : 0, textAlign: 'center' }}>
        {controlsOpen ? 'Hide Controls' : 'Show Controls'}
      </button>

      {controlsOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12, marginBottom: 12, marginTop: 12 }}>
          <div style={panelStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6B4E30', marginBottom: 12 }}>Colony</div>
            <div style={labelStyle}><span>Ants</span><span style={valStyle}>{antCount}</span></div>
            <input type="range" min={10} max={200} step={5} value={antCount} onChange={e => handleAntCountChange(+e.target.value)} style={sliderStyle} />
            <div style={{ ...labelStyle, marginTop: 12 }}><span>Speed</span><span style={valStyle}>{speed.toFixed(2)}</span></div>
            <input type="range" min={0.02} max={1} step={0.02} value={speed} onChange={e => setSpeed(+e.target.value)} style={sliderStyle} />
          </div>
          <div style={panelStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4A8C5C', marginBottom: 12 }}>Pheromone</div>
            <div style={labelStyle}><span>α (trail importance)</span><span style={valStyle}>{alpha.toFixed(1)}</span></div>
            <input type="range" min={0} max={5} step={0.1} value={alpha} onChange={e => setAlpha(+e.target.value)} style={sliderStyle} />
            <div style={{ ...labelStyle, marginTop: 12 }}><span>β (direction weight)</span><span style={valStyle}>{beta.toFixed(1)}</span></div>
            <input type="range" min={0} max={8} step={0.1} value={beta} onChange={e => setBeta(+e.target.value)} style={sliderStyle} />
          </div>
          <div style={panelStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#B8862D', marginBottom: 12 }}>Evaporation</div>
            <div style={labelStyle}><span>ρ (decay rate)</span><span style={valStyle}>{rho.toFixed(3)}</span></div>
            <input type="range" min={0.001} max={0.1} step={0.001} value={rho} onChange={e => setRho(+e.target.value)} style={sliderStyle} />
          </div>
        </div>
      )}

      {/* Math & Stats — always visible */}
      {sim && (
        <div style={{ marginTop: 12 }}>
          <MathPanel grid={sim.grid} ants={sim.ants} foods={sim.foods} alpha={alpha} beta={beta} rho={rho} tick={tick} />
        </div>
      )}
    </div>
  )
}
