'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import styles from './PpmApp.module.css'

// ============================================================================
// Constants & Utility Functions
// ============================================================================

const APP_VERSION = '0.4.0'

function getTodayDecimal() {
  const now = new Date()
  const year = now.getFullYear()
  const start = new Date(year, 0, 1)
  const dayOfYear = Math.floor((now - start) / 86400000)
  return year + dayOfYear / 365.25
}
const TODAY_DECIMAL = getTodayDecimal()
const BUILD_DATE = new Date().toISOString()

const PHASE_ORDER = ['PC', 'PH1', 'PH2', 'PH3', 'REG', 'MARKET']
const PHASE_LABELS = { PC: 'Preclinical', PH1: 'Phase 1', PH2: 'Phase 2', PH3: 'Phase 3', REG: 'Registration', MARKET: 'Market' }
const PHASE_COLORS = {
  PC: '#6366f1', PH1: '#3b82f6', PH2: '#06b6d4',
  PH3: '#10b981', REG: '#f59e0b', MARKET: '#ef4444'
}
const PHASE_BADGE_STYLES = {
  PC:  { bg: '#1e3a5f', color: '#60a5fa' },
  PH1: { bg: '#1e3a5f', color: '#60a5fa' },
  PH2: { bg: '#2d1f5e', color: '#a78bfa' },
  PH3: { bg: '#3b1f3f', color: '#f472b6' },
  REG: { bg: '#1f3d2e', color: '#34d399' },
  MARKET: { bg: '#3d3b1f', color: '#fbbf24' }
}
const TA_COLORS = {
  'Oncology': '#ef4444', 'CNS': '#8b5cf6', 'Immunology': '#06b6d4',
  'Rare Disease': '#f59e0b', 'Cardiovascular': '#ec4899', 'Metabolic': '#10b981'
}
const MODALITY_COLORS = {
  'Small molecule': '#6366f1', 'Antibody': '#3b82f6', 'ADC': '#06b6d4',
  'Gene therapy': '#10b981', 'RNA therapeutic': '#f59e0b', 'Cell therapy': '#ef4444',
  'Bispecific antibody': '#a78bfa'
}
const SOURCE_COLORS = {
  'In-house': '#6366f1', 'Licensed': '#06b6d4', 'Partnership': '#10b981',
  'Acquired': '#f59e0b'
}

// Project palette for stacked charts
const PROJECT_PALETTE = ['#6c8cff', '#34d399', '#f472b6', '#fbbf24', '#fb923c', '#22d3ee', '#a78bfa', '#f87171', '#818cf8', '#4ade80', '#e879f9']

// Titan names for random project generation
const TITAN_NAMES = [
  'Helios', 'Selene', 'Eos', 'Astraeus', 'Pallas', 'Perses',
  'Lelantos', 'Asteria', 'Dione', 'Metis', 'Styx', 'Clymene',
  'Eurybia', 'Epimetheus', 'Menoetius', 'Hecate', 'Leto', 'Aura'
]

const TAS = ['Oncology', 'CNS', 'Immunology', 'Rare Disease', 'Cardiovascular', 'Metabolic']
const MODALITIES = ['Small molecule', 'Antibody', 'ADC', 'Gene therapy', 'RNA therapeutic', 'Cell therapy', 'Bispecific antibody']
const SOURCES = ['In-house', 'Licensed', 'Partnership', 'Acquired']


// Design system colors (dark and light modes)
const COLORS_DARK = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surface2: '#242836',
  border: '#2e3345',
  gridLine: '#1e2130',
  text: '#e4e8f1',
  textDim: '#8b92a8',
  textMuted: '#5a6178',
  accent: '#6c8cff',
  green: '#34d399',
  red: '#f87171',
  yellow: '#fbbf24',
  orange: '#fb923c',
  purple: '#a78bfa',
  cyan: '#22d3ee',
  pink: '#f472b6'
}

const COLORS_LIGHT = {
  bg: '#f8f9fc',
  surface: '#ffffff',
  surface2: '#eef0f5',
  border: '#e2e5ef',
  gridLine: '#e2e5ef',
  text: '#1a1d27',
  textDim: '#4a5068',
  textMuted: '#6b7394',
  accent: '#4a6cf7',
  green: '#059669',
  red: '#dc2626',
  yellow: '#d97706',
  orange: '#ea580c',
  purple: '#7c3aed',
  cyan: '#0891b2',
  pink: '#db2777'
}

function getColors(theme) {
  return theme === 'light' ? COLORS_LIGHT : COLORS_DARK
}

function decimalYearToDate(decimalYear) {
  if (!decimalYear) return 'N/A'
  const year = Math.floor(decimalYear)
  const dayOfYear = Math.round((decimalYear - year) * 365.25)
  const date = new Date(year, 0, 1)
  date.setDate(date.getDate() + dayOfYear)
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
}

function decimalYearToShortDate(decimalYear) {
  if (!decimalYear) return ''
  const year = Math.floor(decimalYear)
  const dayOfYear = Math.round((decimalYear - year) * 365.25)
  const date = new Date(year, 0, 1)
  date.setDate(date.getDate() + dayOfYear)
  return date.toLocaleDateString('en-GB', { year: '2-digit', month: 'short' })
}

function decimalYearToInputDate(decimalYear) {
  if (!decimalYear) return ''
  const year = Math.floor(decimalYear)
  const dayOfYear = Math.round((decimalYear - year) * 365.25)
  const date = new Date(year, 0, 1)
  date.setDate(date.getDate() + dayOfYear)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

function inputDateToDecimalYear(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T00:00:00Z')
  const year = date.getUTCFullYear()
  const start = new Date(Date.UTC(year, 0, 1))
  const dayOfYear = Math.floor((date - start) / 86400000)
  return year + dayOfYear / 365.25
}

function calculatePhaseStartDate(processStartDate, phases, phaseIndex) {
  if (!processStartDate) return null
  let accumulatedYears = 0
  for (let i = 0; i < phaseIndex; i++) {
    accumulatedYears += ((phases[i]?.duration_months) || 0) / 12
  }
  return processStartDate + accumulatedYears
}

function getCumulativePos(phases) {
  let pos = 1
  for (const p of phases) {
    if (p.is_actual) continue
    pos *= (p.pos || 1)
  }
  return pos
}

function getLaunchDate(project) {
  if (!project.process_start_date || !project.phases) return null
  let total = 0
  for (const p of project.phases) total += (p.duration_months || 0) / 12
  return project.process_start_date + total
}

function getTotalRemainingCost(project) {
  if (!project.phases) return 0
  return project.phases.filter(p => !p.is_actual).reduce((sum, p) => sum + (p.internal_cost || 0) + (p.external_cost || 0), 0)
}

function getTotalCost(project) {
  if (!project.phases) return 0
  return project.phases.reduce((sum, p) => sum + (p.internal_cost || 0) + (p.external_cost || 0), 0)
}

function calculateSimpleEnpv(project, discountRate = 0.1) {
  const launch = getLaunchDate(project)
  if (!launch) return { enpv: 0, revenueSeries: [], costSeries: [] }
  const cumPos = getCumulativePos(project.phases)
  const peak = project.peak_year_sales || 0
  const timeToPeak = project.time_to_peak_years || 3
  const loe = project.loe_year || (launch + 10)
  const cogsRate = project.cogs_rate || 0.05
  const msRate = project.ms_rate || 0.08
  const startYear = Math.floor(project.process_start_date || 2026)
  const endYear = Math.ceil(loe) + 3
  const baseYear = startYear
  let npv = 0
  const revenueSeries = [], costSeries = []
  for (let yr = startYear; yr <= endYear; yr++) {
    const t = yr - baseYear
    const discount = Math.pow(1 + discountRate, t)
    let grossRevenue = 0
    if (yr >= Math.floor(launch)) {
      const yearsPostLaunch = yr - Math.floor(launch)
      if (yr <= loe) {
        grossRevenue = yearsPostLaunch < timeToPeak ? peak * (yearsPostLaunch / timeToPeak) : peak
      } else {
        grossRevenue = peak * Math.pow(0.8, yr - loe)
      }
    }
    const netRevenue = grossRevenue * (1 - cogsRate - msRate)
    let cost = 0
    let accYears = 0
    for (const phase of (project.phases || [])) {
      const dur = (phase.duration_months || 0) / 12
      const phaseStart = (project.process_start_date || startYear) + accYears
      const phaseEnd = phaseStart + dur
      if (yr >= Math.floor(phaseStart) && yr < Math.ceil(phaseEnd)) {
        const phaseCost = (phase.internal_cost || 0) + (phase.external_cost || 0)
        cost += dur > 0 ? phaseCost / dur : phaseCost
      }
      accYears += dur
    }
    const raNpvContrib = (netRevenue * cumPos - cost) / discount
    npv += raNpvContrib
    revenueSeries.push({ year: yr, revenue: grossRevenue, netRevenue, raRevenue: netRevenue * cumPos })
    costSeries.push({ year: yr, cost })
  }
  return { enpv: npv, revenueSeries, costSeries, cumPos, launch }
}

function getColorForAttribute(project, colorBy) {
  switch (colorBy) {
    case 'ta': return TA_COLORS[project.ta] || '#6b7280'
    case 'modality': return MODALITY_COLORS[project.modality] || '#6b7280'
    case 'source': return SOURCE_COLORS[project.source] || '#6b7280'
    default: return PHASE_COLORS[project.current_phase] || '#6b7280'
  }
}

function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randomBetween(min, max) { return Math.round((min + Math.random() * (max - min)) * 10) / 10 }

// ============================================================================
// Editable Input — buffers value locally, commits on Enter or blur
// ============================================================================

function EditableInput({ value, onCommit, type = 'text', step, min, max, style, className, placeholder }) {
  const [localValue, setLocalValue] = useState(value)
  const [editing, setEditing] = useState(false)

  useEffect(() => { if (!editing) setLocalValue(value) }, [value, editing])

  const commit = () => {
    setEditing(false)
    const parsed = type === 'number' ? parseFloat(localValue) : localValue
    if (parsed !== value && !Number.isNaN(parsed)) {
      onCommit(parsed)
    }
  }

  return (
    <input
      type={type} step={step} min={min} max={max}
      value={localValue ?? ''} placeholder={placeholder}
      className={className} style={style}
      onFocus={() => setEditing(true)}
      onChange={e => { setEditing(true); setLocalValue(e.target.value) }}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
    />
  )
}

function generateRandomProject(startPhase = 'PC') {
  const name = TITAN_NAMES[Math.floor(Math.random() * TITAN_NAMES.length)] + '-' + Math.floor(Math.random() * 1000)
  const id = 'proj-' + name.toLowerCase()
  const phaseIdx = PHASE_ORDER.indexOf(startPhase)
  const phases = PHASE_ORDER.slice(0, 5).map((ph, i) => ({
    phase: ph,
    duration_months: randomBetween(10, 36),
    pos: i < phaseIdx ? 1.0 : randomBetween(0.3, 0.9),
    internal_cost: randomBetween(5, 100),
    external_cost: randomBetween(5, 150),
    is_actual: i < phaseIdx ? 1 : 0
  }))
  return {
    id, name,
    currentPhase: startPhase,
    processStartDate: randomBetween(2023, 2026),
    peakYearSales: randomBetween(200, 2000),
    timeToPeakYears: randomBetween(1, 5),
    cogsRate: 0.05, msRate: 0.08,
    loeYear: randomBetween(2035, 2045),
    ta: randomPick(TAS),
    modality: randomPick(MODALITIES),
    source: randomPick(SOURCES),
    indication: 'Randomized indication',
    modeOfAction: 'Randomized MoA',
    phases
  }
}


// ============================================================================
// Bricks Tab — Phase Columns
// ============================================================================

function BricksTab({ projects, onSelectProject }) {
  const [colorBy, setColorBy] = useState('phase')

  const enriched = useMemo(() => projects.map(p => ({
    ...p,
    enpvData: calculateSimpleEnpv(p),
    cumPos: getCumulativePos(p.phases || [])
  })), [projects])

  // Group by current phase (phase columns)
  const columns = useMemo(() => {
    const grouped = {}
    for (const ph of PHASE_ORDER) grouped[ph] = []
    for (const p of enriched) {
      if (grouped[p.current_phase]) grouped[p.current_phase].push(p)
    }
    return grouped
  }, [enriched])

  const colorOptions = [['phase', 'Phase'], ['ta', 'TA'], ['modality', 'Modality'], ['source', 'Source']]

  // Build legend based on current colorBy
  const legend = useMemo(() => {
    const colorMap = { phase: PHASE_COLORS, ta: TA_COLORS, modality: MODALITY_COLORS, source: SOURCE_COLORS }
    const map = colorMap[colorBy] || PHASE_COLORS
    // Only show values that exist in the current projects
    const seen = new Set()
    for (const p of enriched) {
      if (colorBy === 'phase') seen.add(p.current_phase)
      else if (colorBy === 'ta') seen.add(p.ta)
      else if (colorBy === 'modality') seen.add(p.modality)
      else if (colorBy === 'source') seen.add(p.source)
    }
    return Object.entries(map).filter(([key]) => seen.has(key))
  }, [enriched, colorBy])

  return (
    <div>
      {/* Controls + Legend */}
      <div className={styles.controlsRow}>
        <span className={styles.controlLabel}>Color:</span>
        {colorOptions.map(([val, label]) => (
          <button key={val}
            className={`${styles.controlBtn} ${colorBy === val ? styles.controlBtnActive : ''}`}
            onClick={() => setColorBy(val)}>{label}</button>
        ))}
        <span style={{ width: '1px', height: '1.25rem', background: 'var(--border)', margin: '0 0.25rem' }} />
        {legend.map(([key, color]) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-dim)' }}>{colorBy === 'phase' ? (PHASE_LABELS[key] || key) : key}</span>
          </span>
        ))}
      </div>

      {/* Phase Columns — each column scrolls independently */}
      <div className={styles.bricksColumns}>
        {PHASE_ORDER.map(phase => {
          const badge = PHASE_BADGE_STYLES[phase] || { bg: '#2e3345', color: '#8b92a8' }
          return (
            <div key={phase} className={styles.phaseColumn}>
              {/* Fixed header — never scrolls */}
              <div className={styles.phaseColumnHeader}
                style={{ background: badge.bg, color: badge.color, flexShrink: 0 }}>
                {PHASE_LABELS[phase]} ({columns[phase]?.length || 0})
              </div>
              {/* Scrollable brick list */}
              <div className={styles.phaseColumnScroll}>
                {columns[phase]?.map(p => {
                  const color = getColorForAttribute(p, colorBy)
                  return (
                    <div key={p.id} className={styles.brick} onClick={() => onSelectProject(p)}>
                      <div className={styles.brickColorBar} style={{ background: color }} />
                      <div className={styles.brickName}>{p.name}</div>
                      <div className={styles.brickDetail}>{p.ta} · {p.modality}</div>
                      <div className={styles.brickStat}>
                        <span>
                          <span className={styles.brickStatLabel}>Peak </span>
                          <span className={styles.brickStatValue}>${(p.peak_year_sales || 0).toFixed(0)}M</span>
                        </span>
                        <span>
                          <span className={styles.brickStatLabel}>eNPV </span>
                          <span className={styles.brickStatValue} style={{ color: p.enpvData.enpv >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            ${p.enpvData.enpv.toFixed(0)}M
                          </span>
                        </span>
                      </div>
                      <div className={styles.brickStat}>
                        <span>
                          <span className={styles.brickStatLabel}>PoS </span>
                          <span className={styles.brickStatValue}>{(p.cumPos * 100).toFixed(0)}%</span>
                        </span>
                        <span>
                          <span className={styles.brickStatLabel}>{p.source}</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
                {(!columns[phase] || columns[phase].length === 0) && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    No projects
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ============================================================================
// Timeline Tab — Canvas Gantt with Today line
// ============================================================================

function TimelineTab({ projects, theme, onSelectProject }) {
  const canvasRef = useRef(null)
  const scrollRef = useRef(null)
  const colors = getColors(theme)

  const ROW_H = 36
  const HEADER_H = 32
  const LABEL_W = 140
  const PAD_R = 40

  // Compute year range
  const { minYear, maxYear } = useMemo(() => {
    let mn = 9999, mx = 0
    for (const p of projects) {
      if (!p.process_start_date) continue
      const start = p.process_start_date
      const end = getLaunchDate(p) || start + 5
      if (start < mn) mn = start
      if (end > mx) mx = end
    }
    return { minYear: Math.floor(mn) - 1, maxYear: Math.ceil(mx) + 1 }
  }, [projects])

  const yearRange = maxYear - minYear
  const years = useMemo(() => {
    const arr = []
    for (let y = minYear; y <= maxYear; y++) arr.push(y)
    return arr
  }, [minYear, maxYear])

  // Draw the canvas bars (no header, no labels — those are DOM)
  useEffect(() => {
    const canvas = canvasRef.current
    const scrollEl = scrollRef.current
    if (!canvas || !scrollEl || !projects.length) return

    const dpr = window.devicePixelRatio || 1
    // Chart area is wide enough for years, min 800px
    const chartW = Math.max(yearRange * 80, 800)
    const totalW = chartW
    const H = projects.length * ROW_H

    canvas.width = totalW * dpr
    canvas.height = H * dpr
    canvas.style.width = totalW + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const yearToX = (y) => ((y - minYear) / yearRange) * chartW

    // Background
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, totalW, H)

    // Year grid lines
    ctx.strokeStyle = colors.gridLine
    ctx.lineWidth = 1
    for (let yr = minYear; yr <= maxYear; yr++) {
      const x = yearToX(yr)
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }

    // TODAY vertical line
    const nowX = yearToX(TODAY_DECIMAL)
    ctx.strokeStyle = colors.red
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(nowX, 0)
    ctx.lineTo(nowX, H)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw project bars
    projects.forEach((p, idx) => {
      const y = idx * ROW_H
      const midY = y + ROW_H / 2

      // Alternating row bg
      if (idx % 2 === 0) {
        ctx.fillStyle = colors.surface2
        ctx.fillRect(0, y, totalW, ROW_H)
      }

      if (!p.process_start_date || !p.phases) return

      let accYears = 0
      for (const phase of p.phases) {
        const dur = (phase.duration_months || 0) / 12
        const phStart = p.process_start_date + accYears
        const phEnd = phStart + dur
        const x1 = yearToX(phStart)
        const x2 = yearToX(phEnd)
        const barH = 20
        const barY = midY - barH / 2
        const color = PHASE_COLORS[phase.phase] || '#6b7280'

        ctx.fillStyle = phase.is_actual ? color : color + '88'
        ctx.beginPath()
        ctx.roundRect(x1, barY, Math.max(x2 - x1, 2), barH, 3)
        ctx.fill()

        if (x2 - x1 > 30) {
          ctx.fillStyle = '#fff'
          ctx.textAlign = 'center'
          ctx.font = 'bold 9px -apple-system, sans-serif'
          ctx.fillText(phase.phase, (x1 + x2) / 2, midY + 3)
        }
        accYears += dur
      }

      // Launch diamond
      const launch = getLaunchDate(p)
      if (launch) {
        const lx = yearToX(launch)
        ctx.fillStyle = colors.yellow
        ctx.beginPath()
        ctx.moveTo(lx, midY - 6)
        ctx.lineTo(lx + 6, midY)
        ctx.lineTo(lx, midY + 6)
        ctx.lineTo(lx - 6, midY)
        ctx.closePath()
        ctx.fill()
      }
    })
  }, [projects, theme, colors, minYear, maxYear, yearRange])

  const chartW = Math.max(yearRange * 80, 800)
  const yearToPercent = (y) => ((y - minYear) / yearRange) * 100

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Container with frozen left column and scrollable chart */}
      <div style={{ display: 'flex', overflow: 'hidden', border: `1px solid var(--border)`, borderRadius: '0.5rem', background: 'var(--bg)', maxHeight: 'calc(100vh - 20rem)' }}>
        {/* Frozen left column: header corner + project names */}
        <div style={{ flex: '0 0 auto', width: LABEL_W, zIndex: 2, background: 'var(--bg)', borderRight: `1px solid var(--border)`, overflowY: 'auto' }}>
          {/* Corner cell */}
          <div style={{ height: HEADER_H, borderBottom: `1px solid var(--border)`, display: 'flex', alignItems: 'center', padding: '0 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Project
          </div>
          {/* Project names */}
          {projects.map((p, idx) => (
            <div key={p.id} style={{
              height: ROW_H, display: 'flex', alignItems: 'center', padding: '0 0.75rem',
              fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)',
              background: idx % 2 === 0 ? 'var(--surface2)' : 'transparent',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              borderBottom: idx < projects.length - 1 ? '1px solid transparent' : 'none',
              cursor: onSelectProject ? 'pointer' : 'default'
            }}
              onClick={() => onSelectProject && onSelectProject(p)}
            >
              {p.name}
            </div>
          ))}
        </div>

        {/* Scrollable chart area */}
        <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
          {/* Frozen year header */}
          <div style={{ position: 'sticky', top: 0, zIndex: 1, height: HEADER_H, display: 'flex', borderBottom: `1px solid var(--border)`, background: 'var(--bg)', minWidth: chartW }}>
            {years.map(yr => (
              <div key={yr} style={{
                position: 'absolute', left: `${yearToPercent(yr)}%`,
                transform: 'translateX(-50%)', fontSize: '0.7rem', fontWeight: 600,
                color: yr === Math.floor(TODAY_DECIMAL) ? colors.red : 'var(--text-dim)',
                lineHeight: `${HEADER_H}px`, whiteSpace: 'nowrap'
              }}>
                {yr}
              </div>
            ))}
            {/* TODAY marker in header */}
            <div style={{ position: 'absolute', left: `${yearToPercent(TODAY_DECIMAL)}%`, bottom: 0, transform: 'translateX(-50%)', fontSize: '0.6rem', fontWeight: 700, color: colors.red }}>
              ▼
            </div>
          </div>

          {/* Canvas for bars */}
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.entries(PHASE_COLORS).filter(([k]) => k !== 'MARKET').map(([phase, color]) => (
          <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: color }} />
            <span style={{ color: 'var(--text-dim)' }}>{PHASE_LABELS[phase]}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
          <div style={{ width: 10, height: 10, background: colors.yellow, transform: 'rotate(45deg)' }} />
          <span style={{ color: 'var(--text-dim)' }}>Launch</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
          <div style={{ width: 16, height: 0, borderTop: `1.5px dashed ${colors.red}` }} />
          <span style={{ color: 'var(--text-dim)' }}>Today</span>
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// Cash Flow & Revenue Tab
// ============================================================================

function CashFlowRevenueTab({ projects, discountRate, theme, onSelectProject }) {
  const [hiddenProjects, setHiddenProjects] = useState(new Set())

  // Canvas refs
  const waterfallRef = useRef(null)
  const waterfallContainerRef = useRef(null)
  const revenueRef = useRef(null)
  const revenueContainerRef = useRef(null)
  const costRef = useRef(null)
  const costContainerRef = useRef(null)
  const enpvRef = useRef(null)
  const enpvContainerRef = useRef(null)

  const colors = getColors(theme)
  const enriched = useMemo(() =>
    projects.map(p => ({ ...p, ...calculateSimpleEnpv(p, discountRate) })).sort((a, b) => b.enpv - a.enpv),
    [projects, discountRate]
  )
  const totalEnpv = enriched.reduce((s, p) => s + p.enpv, 0)
  const visibleProjects = enriched.filter(p => !hiddenProjects.has(p.id))

  const toggleProject = (projectId) => {
    setHiddenProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  // Portfolio Cash Flow Waterfall (Revenue - Dev Costs with Net overlay)
  useEffect(() => {
    const canvas = waterfallRef.current
    const container = waterfallContainerRef.current
    if (!canvas || !container || !visibleProjects.length) return

    const dpr = window.devicePixelRatio || 1
    const W = container.clientWidth
    const H = 320
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, W, H)

    const padL = 60, padR = 20, padT = 30, padB = 50
    const chartW = W - padL - padR, chartH = H - padT - padB

    // Collect year range and revenue/cost data
    let minYear = 9999, maxYear = 0
    for (const p of visibleProjects) {
      for (const d of p.revenueSeries) {
        if (d.year < minYear) minYear = d.year
        if (d.year > maxYear) maxYear = d.year
      }
    }
    if (minYear > maxYear) { minYear = 2026; maxYear = 2040 }
    maxYear = Math.min(maxYear, minYear + 20)

    const years = []
    for (let y = minYear; y <= maxYear; y++) years.push(y)

    // Calculate stacks and net cash flow
    let maxVal = 0
    const stacks = years.map(yr => {
      let revenue = 0, cost = 0
      for (const p of visibleProjects) {
        const rev = p.revenueSeries.find(s => s.year === yr)
        const cst = p.costSeries.find(s => s.year === yr)
        if (rev) revenue += rev.raRevenue
        if (cst) cost += cst.cost
      }
      const net = revenue - cost
      maxVal = Math.max(maxVal, revenue, net)
      return { year: yr, revenue, cost, net }
    })
    maxVal *= 1.15

    const yearToX = (yr) => padL + ((yr - minYear) / (maxYear - minYear || 1)) * chartW
    const valToY = (v) => padT + chartH * (1 - v / maxVal)
    const barW = Math.max(chartW / years.length * 0.5, 4)

    // Y-axis labels and grid
    ctx.fillStyle = colors.textDim
    ctx.font = '10px -apple-system, sans-serif'
    ctx.textAlign = 'right'
    const yStep = Math.pow(10, Math.floor(Math.log10(maxVal / 4 || 1)))
    for (let v = 0; v <= maxVal; v += yStep) {
      const y = valToY(v)
      ctx.fillText(`$${v.toFixed(0)}M`, padL - 8, y + 3)
      ctx.strokeStyle = colors.gridLine
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
    }

    // X-axis labels (years)
    ctx.fillStyle = colors.textDim
    ctx.textAlign = 'center'
    for (const yr of years) {
      if (yr % 2 === 0) ctx.fillText(yr.toString(), yearToX(yr), H - padB + 18)
    }

    // Draw stacked bars (revenue in green, cost in red)
    stacks.forEach(stack => {
      const x = yearToX(stack.year) - barW / 2

      // Revenue bar (green, bottom)
      if (stack.revenue > 0) {
        const h = (stack.revenue / maxVal) * chartH
        const y = valToY(stack.revenue)
        ctx.fillStyle = colors.green
        ctx.fillRect(x, y, barW, h)
      }

      // Cost bar (red, negative, on top of revenue)
      if (stack.cost > 0) {
        const h = (stack.cost / maxVal) * chartH
        const y = valToY(stack.cost)
        ctx.fillStyle = colors.red
        ctx.fillRect(x, y, barW, h)
      }
    })

    // Net Cash Flow line
    ctx.strokeStyle = colors.accent
    ctx.lineWidth = 2.5
    ctx.beginPath()
    let firstPoint = true
    stacks.forEach(stack => {
      const x = yearToX(stack.year)
      const y = valToY(stack.net)
      if (firstPoint) {
        ctx.moveTo(x, y)
        firstPoint = false
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Title
    ctx.fillStyle = colors.text
    ctx.font = 'bold 13px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Portfolio Cash Flow Waterfall ($M)', padL, 18)
  }, [visibleProjects, colors])

  // Revenue by Project (stacked area/bar)
  useEffect(() => {
    const canvas = revenueRef.current
    const container = revenueContainerRef.current
    if (!canvas || !container || !visibleProjects.length) return

    const dpr = window.devicePixelRatio || 1
    const W = container.clientWidth, H = 320
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, W, H)

    const padL = 60, padR = 20, padT = 30, padB = 50
    const chartW = W - padL - padR, chartH = H - padT - padB

    // Year range
    let minYear = 9999, maxYear = 0
    for (const p of visibleProjects) {
      for (const d of p.revenueSeries) {
        if (d.raRevenue > 0) {
          if (d.year < minYear) minYear = d.year
          if (d.year > maxYear) maxYear = d.year
        }
      }
    }
    if (minYear > maxYear) { minYear = 2026; maxYear = 2040 }
    maxYear = Math.min(maxYear, minYear + 20)
    const years = []
    for (let y = minYear; y <= maxYear; y++) years.push(y)

    let maxStack = 0
    const stacks = years.map(yr => {
      let total = 0
      const parts = visibleProjects.map(p => {
        const d = p.revenueSeries.find(s => s.year === yr)
        const val = d ? d.raRevenue : 0
        total += val
        return val
      })
      if (total > maxStack) maxStack = total
      return { year: yr, parts, total }
    })
    maxStack *= 1.1

    const yearToX = (yr) => padL + ((yr - minYear) / (maxYear - minYear || 1)) * chartW
    const valToY = (v) => padT + chartH * (1 - v / (maxStack || 1))
    const barW = Math.max(chartW / years.length * 0.75, 4)

    // Y-axis
    ctx.fillStyle = colors.textDim
    ctx.font = '10px -apple-system, sans-serif'
    ctx.textAlign = 'right'
    const yStep = Math.pow(10, Math.floor(Math.log10(maxStack / 4 || 1)))
    for (let v = 0; v <= maxStack; v += yStep) {
      const y = valToY(v)
      ctx.fillText(`$${v.toFixed(0)}M`, padL - 8, y + 3)
      ctx.strokeStyle = colors.gridLine
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
    }

    // X-axis labels
    ctx.fillStyle = colors.textDim
    ctx.textAlign = 'center'
    for (const yr of years) {
      if (yr % 2 === 0) ctx.fillText(yr.toString(), yearToX(yr), H - padB + 18)
    }

    // Stacked bars
    stacks.forEach((stack, stackIdx) => {
      const x = yearToX(stack.year) - barW / 2
      let runY = valToY(0)
      stack.parts.forEach((val, pi) => {
        if (val <= 0) return
        const h = (val / (maxStack || 1)) * chartH
        const y = runY - h
        ctx.fillStyle = PROJECT_PALETTE[enriched.indexOf(enriched[pi]) % PROJECT_PALETTE.length]
        ctx.fillRect(x, y, barW, h)
        runY = y
      })
    })

    // Title
    ctx.fillStyle = colors.text
    ctx.font = 'bold 13px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Revenue by Project ($M)', padL, 18)
  }, [visibleProjects, enriched, colors])

  // Development Cost by Project
  useEffect(() => {
    const canvas = costRef.current
    const container = costContainerRef.current
    if (!canvas || !container || !visibleProjects.length) return

    const dpr = window.devicePixelRatio || 1
    const W = container.clientWidth, H = 320
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, W, H)

    const padL = 60, padR = 20, padT = 30, padB = 50
    const chartW = W - padL - padR, chartH = H - padT - padB

    // Year range
    let minYear = 9999, maxYear = 0
    for (const p of visibleProjects) {
      for (const d of p.costSeries) {
        if (d.cost > 0) {
          if (d.year < minYear) minYear = d.year
          if (d.year > maxYear) maxYear = d.year
        }
      }
    }
    if (minYear > maxYear) { minYear = 2026; maxYear = 2040 }
    maxYear = Math.min(maxYear, minYear + 20)
    const years = []
    for (let y = minYear; y <= maxYear; y++) years.push(y)

    let maxStack = 0
    const stacks = years.map(yr => {
      let total = 0
      const parts = visibleProjects.map(p => {
        const d = p.costSeries.find(s => s.year === yr)
        const val = d ? d.cost : 0
        total += val
        return val
      })
      if (total > maxStack) maxStack = total
      return { year: yr, parts, total }
    })
    maxStack *= 1.1

    const yearToX = (yr) => padL + ((yr - minYear) / (maxYear - minYear || 1)) * chartW
    const valToY = (v) => padT + chartH * (1 - v / (maxStack || 1))
    const barW = Math.max(chartW / years.length * 0.75, 4)

    // Y-axis
    ctx.fillStyle = colors.textDim
    ctx.font = '10px -apple-system, sans-serif'
    ctx.textAlign = 'right'
    const yStep = Math.pow(10, Math.floor(Math.log10(maxStack / 4 || 1)))
    for (let v = 0; v <= maxStack; v += yStep) {
      const y = valToY(v)
      ctx.fillText(`$${v.toFixed(0)}M`, padL - 8, y + 3)
      ctx.strokeStyle = colors.gridLine
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
    }

    // X-axis labels
    ctx.fillStyle = colors.textDim
    ctx.textAlign = 'center'
    for (const yr of years) {
      if (yr % 2 === 0) ctx.fillText(yr.toString(), yearToX(yr), H - padB + 18)
    }

    // Stacked bars
    stacks.forEach((stack, stackIdx) => {
      const x = yearToX(stack.year) - barW / 2
      let runY = valToY(0)
      stack.parts.forEach((val, pi) => {
        if (val <= 0) return
        const h = (val / (maxStack || 1)) * chartH
        const y = runY - h
        ctx.fillStyle = PROJECT_PALETTE[enriched.indexOf(enriched[pi]) % PROJECT_PALETTE.length]
        ctx.fillRect(x, y, barW, h)
        runY = y
      })
    })

    // Title
    ctx.fillStyle = colors.text
    ctx.font = 'bold 13px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Development Cost by Project ($M)', padL, 18)
  }, [visibleProjects, enriched, colors])

  // eNPV Waterfall
  useEffect(() => {
    const canvas = enpvRef.current
    const container = enpvContainerRef.current
    if (!canvas || !container || !enriched.length) return

    const dpr = window.devicePixelRatio || 1
    const W = container.clientWidth
    const H = 320
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, W, H)

    const padL = 60, padR = 20, padT = 30, padB = 80
    const chartW = W - padL - padR, chartH = H - padT - padB
    const n = visibleProjects.length + 1
    const barW = Math.min(chartW / n * 0.7, 50)
    const gap = (chartW - barW * n) / (n + 1)

    let maxVal = 0, minVal = 0, running = 0
    const visibleEnpv = visibleProjects.reduce((s, p) => s + p.enpv, 0)
    for (const p of visibleProjects) {
      running += p.enpv
      if (running > maxVal) maxVal = running
      if (running < minVal) minVal = running
      if (p.enpv < minVal) minVal = p.enpv
    }
    maxVal = Math.max(maxVal, visibleEnpv) * 1.15
    minVal = Math.min(minVal, 0) * 1.15
    const range = maxVal - minVal || 1
    const valToY = (v) => padT + chartH * (1 - (v - minVal) / range)

    // Zero line
    ctx.strokeStyle = colors.border
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padL, valToY(0))
    ctx.lineTo(W - padR, valToY(0))
    ctx.stroke()

    // Y-axis
    ctx.fillStyle = colors.textDim
    ctx.font = '10px -apple-system, sans-serif'
    ctx.textAlign = 'right'
    const yStep = Math.pow(10, Math.floor(Math.log10(range / 4)))
    for (let v = Math.ceil(minVal / yStep) * yStep; v <= maxVal; v += yStep) {
      const y = valToY(v)
      ctx.fillText(`$${v.toFixed(0)}M`, padL - 8, y + 3)
      ctx.strokeStyle = colors.gridLine
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
    }

    // Bars
    running = 0
    visibleProjects.forEach((p, i) => {
      const x = padL + gap + i * (barW + gap)
      const prev = running
      running += p.enpv
      const y1 = valToY(Math.max(prev, running))
      const y2 = valToY(Math.min(prev, running))
      ctx.fillStyle = p.enpv >= 0 ? colors.green : colors.red
      ctx.beginPath()
      ctx.roundRect(x, y1, barW, y2 - y1, 3)
      ctx.fill()

      if (i < visibleProjects.length - 1) {
        ctx.strokeStyle = colors.textMuted
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(x + barW, valToY(running))
        ctx.lineTo(padL + gap + (i + 1) * (barW + gap), valToY(running))
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.fillStyle = colors.text
      ctx.textAlign = 'center'
      ctx.font = '10px -apple-system, sans-serif'
      ctx.save()
      ctx.translate(x + barW / 2, H - padB + 12)
      ctx.rotate(-Math.PI / 4)
      ctx.fillText(p.name, 0, 0)
      ctx.restore()

      ctx.fillStyle = p.enpv >= 0 ? colors.green : colors.red
      ctx.font = 'bold 10px -apple-system, sans-serif'
      ctx.fillText(`$${p.enpv.toFixed(0)}M`, x + barW / 2, y1 - 6)
    })

    // Total bar
    const totalX = padL + gap + visibleProjects.length * (barW + gap)
    const totalY1 = valToY(Math.max(0, visibleEnpv))
    const totalY2 = valToY(Math.min(0, visibleEnpv))
    ctx.fillStyle = visibleEnpv >= 0 ? colors.accent : colors.red
    ctx.beginPath()
    ctx.roundRect(totalX, totalY1, barW, totalY2 - totalY1, 3)
    ctx.fill()

    ctx.fillStyle = colors.text
    ctx.font = 'bold 11px -apple-system, sans-serif'
    ctx.fillText(`$${visibleEnpv.toFixed(0)}M`, totalX + barW / 2, totalY1 - 8)
    ctx.save()
    ctx.translate(totalX + barW / 2, H - padB + 12)
    ctx.rotate(-Math.PI / 4)
    ctx.fillText('TOTAL', 0, 0)
    ctx.restore()

    ctx.fillStyle = colors.text
    ctx.font = 'bold 13px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('eNPV Waterfall ($M)', padL, 18)
  }, [visibleProjects, enriched, colors])

  return (
    <div>
      {/* Four Charts in 2x2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div ref={waterfallContainerRef} className={styles.section} style={{ padding: '1rem', overflow: 'hidden' }}>
          <canvas ref={waterfallRef} />
        </div>
        <div ref={revenueContainerRef} className={styles.section} style={{ padding: '1rem', overflow: 'hidden' }}>
          <canvas ref={revenueRef} />
        </div>
        <div ref={costContainerRef} className={styles.section} style={{ padding: '1rem', overflow: 'hidden' }}>
          <canvas ref={costRef} />
        </div>
        <div ref={enpvContainerRef} className={styles.section} style={{ padding: '1rem', overflow: 'hidden' }}>
          <canvas ref={enpvRef} />
        </div>
      </div>

      {/* Project Toggle Legend */}
      <div className={styles.section} style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
          Toggle Projects
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {enriched.map((p, i) => {
            const isHidden = hiddenProjects.has(p.id)
            return (
              <button key={p.id}
                onClick={() => toggleProject(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontSize: '0.8rem',
                  opacity: isHidden ? 0.5 : 1,
                  textDecoration: isHidden ? 'line-through' : 'none',
                  color: isHidden ? 'var(--text-muted)' : 'var(--text)'
                }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: PROJECT_PALETTE[i % PROJECT_PALETTE.length],
                  opacity: isHidden ? 0.4 : 1
                }} />
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Project</th><th style={{ textAlign: 'right' }}>Peak Sales</th><th style={{ textAlign: 'right' }}>PoS</th>
              <th style={{ textAlign: 'right' }}>Launch</th><th style={{ textAlign: 'right' }}>Total Cost</th><th style={{ textAlign: 'right' }}>eNPV</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((p, idx) => (
              <tr key={p.id} className={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td className={styles.nameCell} style={{ cursor: 'pointer' }} onClick={() => onSelectProject && onSelectProject(p)}>{p.name}</td>
                <td style={{ textAlign: 'right' }}>${(p.peak_year_sales || 0).toFixed(0)}M</td>
                <td style={{ textAlign: 'right' }}>{(p.cumPos * 100).toFixed(0)}%</td>
                <td style={{ textAlign: 'right' }} className={styles.dateCell}>{p.launch ? decimalYearToShortDate(p.launch) : 'N/A'}</td>
                <td style={{ textAlign: 'right' }}>${getTotalCost(p).toFixed(0)}M</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: p.enpv >= 0 ? 'var(--green)' : 'var(--red)' }}>${p.enpv.toFixed(0)}M</td>
              </tr>
            ))}
            <tr className={styles.rowOdd}>
              <td style={{ fontWeight: 700 }} colSpan={5}>Portfolio Total</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: totalEnpv >= 0 ? 'var(--green)' : 'var(--red)' }}>${totalEnpv.toFixed(0)}M</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
        Simple deterministic analysis. Revenue: ramp to peak, flat to LoE, then 20%/yr decay. Risk-adjusted by cumulative remaining PoS. Discounted at {(discountRate * 100).toFixed(0)}%.
      </p>
    </div>
  )
}


// ============================================================================
// History Tab — Visual Timeline
// ============================================================================

function HistoryTab({ entityType, entityId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = entityType === 'portfolio'
      ? `/api/ppm/portfolio/${entityId}/audit`
      : `/api/ppm/project/${entityId}/audit`
    fetch(url).then(r => r.json()).then(data => { setEntries(data); setLoading(false) }).catch(() => setLoading(false))
  }, [entityType, entityId])

  if (loading) return <p style={{ color: 'var(--text-dim)' }}>Loading...</p>

  // Group by date
  const grouped = {}
  entries.forEach(e => {
    const date = new Date(e.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(e)
  })
  const dates = Object.keys(grouped).sort().reverse()

  return (
    <div className={styles.historyTimeline}>
      {!dates.length && <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No history yet.</p>}
      {dates.map(date => (
        <div key={date}>
          <div className={styles.historyDate}>{date}</div>
          {grouped[date].map((e, i) => (
            <div key={i} className={styles.historyEvent}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  {e.action}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {e.field && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border)' }}>
                  <strong>{e.field}:</strong> <span style={{ color: 'var(--red)' }}>"{e.old_value ?? '(empty)'}"</span> → <span style={{ color: 'var(--green)' }}>"{e.new_value ?? '(empty)'}"</span>
                </div>
              )}
              {e.details && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '0.5rem', marginTop: '0.25rem' }}>
                  {e.details}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}


// ============================================================================
// Decision Tree Tab
// ============================================================================

// ============================================================================
// Spreadsheet View — All projects × all fields with sub-tabs
// ============================================================================

const SPREADSHEET_TABS = [
  { id: 'attributes', label: 'Attributes' },
  { id: 'dates', label: 'Phase Start Dates' },
  { id: 'durations', label: 'Phase Durations' },
  { id: 'probabilities', label: 'Phase Probabilities' },
  { id: 'costs', label: 'Phase Costs' },
  { id: 'commercial', label: 'Commercial' },
]

function SpreadsheetView({ projects, onUpdateProjectField, onUpdateProjectPhaseField, onSelectProject }) {
  const [subTab, setSubTab] = useState('attributes')
  const [confirmEdit, setConfirmEdit] = useState(null) // { projectId, field, value, label }

  const PHASES = ['PC', 'PH1', 'PH2', 'PH3', 'REG']

  const getPhase = (project, phaseName) => (project.phases || []).find(p => p.phase === phaseName)
  const isPhaseActual = (project, phaseName) => getPhase(project, phaseName)?.is_actual || false

  // All phases are editable, but actuals and process start dates need confirmation
  const isEditable = () => true

  // Wrap onCommit with confirmation for actuals or process start dates
  const withConfirmation = (projectId, field, label, onCommit) => (newValue) => {
    setConfirmEdit({ projectId, field, value: newValue, label, onCommit: () => onCommit(newValue) })
  }

  const cellStyle = (editable) => ({
    textAlign: 'right',
    fontSize: '0.8rem',
    color: editable ? 'var(--text)' : 'var(--text-dim)',
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    minWidth: 90,
  })

  const headerCellStyle = {
    padding: '0.75rem 0.75rem',
    textAlign: 'right',
    background: 'var(--surface2)',
    color: 'var(--text-dim)',
    fontWeight: 600,
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 3,
    whiteSpace: 'nowrap',
    minWidth: 90,
  }

  const frozenNameStyle = {
    position: 'sticky',
    left: 0,
    zIndex: 4,
    background: 'var(--surface)',
    padding: '0.5rem 0.75rem',
    fontWeight: 600,
    fontSize: '0.8rem',
    color: 'var(--accent)',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    minWidth: 120,
  }

  const frozenNameHeader = {
    ...headerCellStyle,
    position: 'sticky',
    left: 0,
    zIndex: 5,
    textAlign: 'left',
    minWidth: 120,
    borderRight: '1px solid var(--border)',
  }

  const renderEditableCell = (value, onCommit, type = 'number', step = '1', editable = true, align = 'right') => {
    if (!editable) {
      return <span style={{ color: 'var(--text-dim)', display: 'block', textAlign: align }}>{type === 'number' ? (typeof value === 'number' ? value : '—') : (value || '—')}</span>
    }
    return (
      <EditableInput
        type={type}
        step={step}
        value={value ?? ''}
        style={{ width: '100%', maxWidth: align === 'left' ? 200 : 90, textAlign: align, background: 'transparent', border: '1px solid transparent', borderRadius: 4, padding: '0.2rem 0.4rem', color: 'var(--text)', fontSize: '0.8rem' }}
        onCommit={onCommit}
      />
    )
  }

  return (
    <div>
      {/* Sub-tab bar */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {SPREADSHEET_TABS.map(tab => (
          <button key={tab.id}
            onClick={() => setSubTab(tab.id)}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: subTab === tab.id ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              background: subTab === tab.id ? 'rgba(108,140,255,0.12)' : 'var(--surface)',
              color: subTab === tab.id ? 'var(--accent)' : 'var(--text-dim)',
              transition: 'all 0.15s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable table */}
      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 22rem)', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--surface)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>

          {/* ── Attributes sub-tab ── */}
          {subTab === 'attributes' && (
            <>
              <thead>
                <tr>
                  <th style={frozenNameHeader}>Project</th>
                  <th style={headerCellStyle}>Phase</th>
                  <th style={{ ...headerCellStyle, textAlign: 'left' }}>TA</th>
                  <th style={{ ...headerCellStyle, textAlign: 'left' }}>Modality</th>
                  <th style={{ ...headerCellStyle, textAlign: 'left' }}>Source</th>
                  <th style={{ ...headerCellStyle, textAlign: 'left', minWidth: 200 }}>Indication</th>
                  <th style={{ ...headerCellStyle, textAlign: 'left', minWidth: 200 }}>MoA</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, idx) => (
                  <tr key={p.id} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--bg)' }}>
                    <td style={frozenNameStyle} onClick={() => onSelectProject(p)}>{p.name}</td>
                    <td style={{ ...cellStyle(false), textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.25rem',
                        background: (PHASE_BADGE_STYLES[p.current_phase] || {}).bg,
                        color: (PHASE_BADGE_STYLES[p.current_phase] || {}).color
                      }}>{p.current_phase}</span>
                    </td>
                    <td style={{ ...cellStyle(true), textAlign: 'left' }}>
                      {renderEditableCell(p.ta || '', v => onUpdateProjectField(p.id, 'ta', v), 'text', undefined, true, 'left')}
                    </td>
                    <td style={{ ...cellStyle(true), textAlign: 'left' }}>
                      {renderEditableCell(p.modality || '', v => onUpdateProjectField(p.id, 'modality', v), 'text', undefined, true, 'left')}
                    </td>
                    <td style={{ ...cellStyle(true), textAlign: 'left' }}>
                      {renderEditableCell(p.source || '', v => onUpdateProjectField(p.id, 'source', v), 'text', undefined, true, 'left')}
                    </td>
                    <td style={{ ...cellStyle(true), textAlign: 'left', minWidth: 200 }}>
                      {renderEditableCell(p.indication || '', v => onUpdateProjectField(p.id, 'indication', v), 'text', undefined, true, 'left')}
                    </td>
                    <td style={{ ...cellStyle(true), textAlign: 'left', minWidth: 200 }}>
                      {renderEditableCell(p.mode_of_action || '', v => onUpdateProjectField(p.id, 'modeOfAction', v), 'text', undefined, true, 'left')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {/* ── Phase Start Dates sub-tab ── */}
          {subTab === 'dates' && (
            <>
              <thead>
                <tr>
                  <th style={frozenNameHeader}>Project</th>
                  <th style={headerCellStyle}>Process Start</th>
                  {PHASES.map(ph => (
                    <th key={ph} style={headerCellStyle}>{PHASE_LABELS[ph]} Start</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p, idx) => (
                  <tr key={p.id} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--bg)' }}>
                    <td style={frozenNameStyle} onClick={() => onSelectProject(p)}>{p.name}</td>
                    <td style={cellStyle(true)}>
                      <input
                        type="date"
                        value={p.process_start_date ? decimalYearToInputDate(p.process_start_date) : ''}
                        onChange={e => {
                          const dec = inputDateToDecimalYear(e.target.value)
                          if (dec) withConfirmation(p.id, 'processStartDate', `Change process start date for ${p.name}?`, v => onUpdateProjectField(p.id, 'processStartDate', v))(dec)
                        }}
                        style={{ background: 'transparent', border: '1px solid transparent', borderRadius: 4, padding: '0.2rem 0.4rem', color: 'var(--text)', fontSize: '0.8rem', width: '100%', maxWidth: 130 }}
                      />
                    </td>
                    {PHASES.map(ph => {
                      const phIdx = PHASE_ORDER.indexOf(ph)
                      const startDate = calculatePhaseStartDate(p.process_start_date, p.phases, phIdx)
                      const isActual = isPhaseActual(p, ph)
                      return (
                        <td key={ph} style={cellStyle(true)}>
                          {phIdx === 0 ? (
                            <span style={{ color: isActual ? 'var(--green)' : 'var(--text-dim)' }}>
                              {startDate ? decimalYearToDate(startDate) : '—'}
                            </span>
                          ) : (
                            <input
                              type="date"
                              value={startDate ? decimalYearToInputDate(startDate) : ''}
                              onChange={e => {
                                const newDecimal = inputDateToDecimalYear(e.target.value)
                                if (!newDecimal || !p.process_start_date) return
                                // Calculate what the previous phase duration should be
                                const prevPhIdx = phIdx - 1
                                let accBefore = 0
                                for (let i = 0; i < prevPhIdx; i++) {
                                  accBefore += ((p.phases[i]?.duration_months) || 0) / 12
                                }
                                const prevPhaseStart = p.process_start_date + accBefore
                                const newDurationMonths = Math.round((newDecimal - prevPhaseStart) * 12)
                                if (newDurationMonths < 0) return
                                const prevPhase = p.phases[prevPhIdx]
                                if (!prevPhase) return
                                const commitFn = () => onUpdateProjectPhaseField(p.id, prevPhase.id, 'durationMonths', newDurationMonths)
                                if (isActual) {
                                  withConfirmation(p.id, 'phaseDate', `Change ${PHASE_LABELS[ph]} start date (adjusts ${PHASE_LABELS[p.phases[prevPhIdx].phase]} duration to ${newDurationMonths}mo)?`, commitFn)(newDurationMonths)
                                } else {
                                  commitFn()
                                }
                              }}
                              style={{ background: 'transparent', border: '1px solid transparent', borderRadius: 4, padding: '0.2rem 0.4rem', color: isActual ? 'var(--green)' : 'var(--text)', fontSize: '0.8rem', width: '100%', maxWidth: 130 }}
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {/* ── Phase Durations sub-tab ── */}
          {subTab === 'durations' && (
            <>
              <thead>
                <tr>
                  <th style={frozenNameHeader}>Project</th>
                  {PHASES.map(ph => (
                    <th key={ph} style={headerCellStyle}>{PHASE_LABELS[ph]} (mo)</th>
                  ))}
                  <th style={{ ...headerCellStyle, fontWeight: 700 }}>Total (mo)</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, idx) => (
                  <tr key={p.id} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--bg)' }}>
                    <td style={frozenNameStyle} onClick={() => onSelectProject(p)}>{p.name}</td>
                    {PHASES.map(ph => {
                      const phase = getPhase(p, ph)
                      const isActual = isPhaseActual(p, ph)
                      const editable = !!phase
                      const commitFn = v => onUpdateProjectPhaseField(p.id, phase.id, 'durationMonths', parseInt(v))
                      return (
                        <td key={ph} style={cellStyle(editable)}>
                          {phase ? renderEditableCell(
                            phase.duration_months || 0,
                            isActual ? withConfirmation(p.id, 'duration', `Edit actual duration for ${PHASE_LABELS[ph]}?`, commitFn) : commitFn,
                            'number', '1', editable
                          ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      )
                    })}
                    <td style={{ ...cellStyle(false), fontWeight: 700, color: 'var(--accent)' }}>
                      {(p.phases || []).reduce((s, ph) => s + (ph.duration_months || 0), 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {/* ── Phase Probabilities sub-tab ── */}
          {subTab === 'probabilities' && (
            <>
              <thead>
                <tr>
                  <th style={frozenNameHeader}>Project</th>
                  {PHASES.map(ph => (
                    <th key={ph} style={headerCellStyle}>{PHASE_LABELS[ph]} PoS</th>
                  ))}
                  <th style={{ ...headerCellStyle, fontWeight: 700 }}>Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, idx) => {
                  const cumPos = getCumulativePos(p.phases || [])
                  return (
                    <tr key={p.id} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--bg)' }}>
                      <td style={frozenNameStyle} onClick={() => onSelectProject(p)}>{p.name}</td>
                      {PHASES.map(ph => {
                        const phase = getPhase(p, ph)
                        const isActual = isPhaseActual(p, ph)
                        const editable = !!phase
                        const commitFn = v => onUpdateProjectPhaseField(p.id, phase.id, 'pos', parseFloat(v))
                        return (
                          <td key={ph} style={cellStyle(editable)}>
                            {phase ? renderEditableCell(
                              phase.pos ?? 0.5,
                              isActual ? withConfirmation(p.id, 'pos', `Edit actual PoS for ${PHASE_LABELS[ph]}?`, commitFn) : commitFn,
                              'number', '0.01', editable
                            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        )
                      })}
                      <td style={{ ...cellStyle(false), fontWeight: 700, color: cumPos > 0.3 ? 'var(--green)' : cumPos > 0.1 ? 'var(--yellow)' : 'var(--red)' }}>
                        {(cumPos * 100).toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </>
          )}

          {/* ── Phase Costs sub-tab ── */}
          {subTab === 'costs' && (
            <>
              <thead>
                <tr>
                  <th style={frozenNameHeader}>Project</th>
                  {PHASES.map(ph => (
                    <th key={ph} style={headerCellStyle}>{PHASE_LABELS[ph]} ($M)</th>
                  ))}
                  <th style={{ ...headerCellStyle, fontWeight: 700 }}>Total ($M)</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, idx) => (
                  <tr key={p.id} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--bg)' }}>
                    <td style={frozenNameStyle} onClick={() => onSelectProject(p)}>{p.name}</td>
                    {PHASES.map(ph => {
                      const phase = getPhase(p, ph)
                      const isActual = isPhaseActual(p, ph)
                      const editable = !!phase
                      const totalCost = phase ? (phase.internal_cost || 0) + (phase.external_cost || 0) : 0
                      const costCommitFn = v => {
                        const val = parseFloat(v)
                        const ratio = phase.internal_cost ? phase.internal_cost / (totalCost || 1) : 0.5
                        onUpdateProjectPhaseField(p.id, phase.id, 'internalCost', parseFloat((val * ratio).toFixed(1)))
                        setTimeout(() => onUpdateProjectPhaseField(p.id, phase.id, 'externalCost', parseFloat((val * (1 - ratio)).toFixed(1))), 100)
                      }
                      return (
                        <td key={ph} style={cellStyle(editable)}>
                          {phase ? renderEditableCell(
                            totalCost,
                            isActual ? withConfirmation(p.id, 'cost', `Edit actual cost for ${PHASE_LABELS[ph]}?`, costCommitFn) : costCommitFn,
                            'number', '0.1', editable
                          ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      )
                    })}
                    <td style={{ ...cellStyle(false), fontWeight: 700, color: 'var(--accent)' }}>
                      {getTotalCost(p).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {/* ── Commercial sub-tab ── */}
          {subTab === 'commercial' && (
            <>
              <thead>
                <tr>
                  <th style={frozenNameHeader}>Project</th>
                  <th style={headerCellStyle}>Peak Sales ($M)</th>
                  <th style={headerCellStyle}>Time to Peak (yr)</th>
                  <th style={headerCellStyle}>COGS %</th>
                  <th style={headerCellStyle}>M&S %</th>
                  <th style={headerCellStyle}>LoE Year</th>
                  <th style={{ ...headerCellStyle, fontWeight: 700 }}>eNPV ($M)</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, idx) => {
                  const enpv = calculateSimpleEnpv(p).enpv
                  return (
                    <tr key={p.id} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--bg)' }}>
                      <td style={frozenNameStyle} onClick={() => onSelectProject(p)}>{p.name}</td>
                      <td style={cellStyle(true)}>
                        {renderEditableCell(p.peak_year_sales || 0, v => onUpdateProjectField(p.id, 'peakYearSales', parseFloat(v)), 'number', '1')}
                      </td>
                      <td style={cellStyle(true)}>
                        {renderEditableCell(p.time_to_peak_years || 0, v => onUpdateProjectField(p.id, 'timeToPeakYears', parseFloat(v)), 'number', '0.5')}
                      </td>
                      <td style={cellStyle(true)}>
                        {renderEditableCell(((p.cogs_rate || 0) * 100).toFixed(0), v => onUpdateProjectField(p.id, 'cogsRate', parseFloat(v) / 100), 'number', '1')}
                      </td>
                      <td style={cellStyle(true)}>
                        {renderEditableCell(((p.ms_rate || 0) * 100).toFixed(0), v => onUpdateProjectField(p.id, 'msRate', parseFloat(v) / 100), 'number', '1')}
                      </td>
                      <td style={cellStyle(true)}>
                        {renderEditableCell(p.loe_year || 0, v => onUpdateProjectField(p.id, 'loeYear', parseInt(v)), 'number', '1')}
                      </td>
                      <td style={{ ...cellStyle(false), fontWeight: 700, color: enpv >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {enpv.toFixed(0)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </>
          )}

        </table>
      </div>

      {/* Confirmation dialog for editing actuals / process start dates */}
      {confirmEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirmEdit(null)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.5rem 2rem', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--yellow)' }}>⚠ Confirm Edit</h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
              {confirmEdit.label}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmEdit(null)}
                style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '0.375rem', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem' }}>
                Cancel
              </button>
              <button onClick={() => { confirmEdit.onCommit(); setConfirmEdit(null) }}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ============================================================================
// Compute detailed project financials (cash flow, P&L, decision tree data)
// ============================================================================

function computeProjectFinancials(project, discountRate = 0.1) {
  if (!project || !project.phases) return null
  const launch = getLaunchDate(project)
  if (!launch) return null

  const cumPos = getCumulativePos(project.phases)
  const peak = project.peak_year_sales || 0
  const timeToPeak = project.time_to_peak_years || 3
  const loe = project.loe_year || (launch + 10)
  const cogsRate = project.cogs_rate || 0.05
  const msRate = project.ms_rate || 0.08
  const startYear = Math.floor(project.process_start_date || 2026)
  const endYear = Math.ceil(loe) + 3

  const years = []
  const data = []

  for (let yr = startYear; yr <= endYear; yr++) {
    years.push(yr)
    const t = yr - startYear
    const discount = Math.pow(1 + discountRate, t)

    // Revenue model — ramp to peak, hold until LoE, decline after
    let grossRevenue = 0
    if (yr >= Math.floor(launch)) {
      const yearsPostLaunch = yr - Math.floor(launch)
      if (yr <= loe) {
        grossRevenue = yearsPostLaunch < timeToPeak ? peak * (yearsPostLaunch / timeToPeak) : peak
      } else {
        grossRevenue = peak * Math.pow(0.8, yr - loe)
      }
    }

    const cogs = grossRevenue * cogsRate
    const ms = grossRevenue * msRate
    const netRevenue = grossRevenue - cogs - ms

    // Dev costs — spread phase cost evenly across the phase duration
    let devCosts = 0
    let accYears = 0
    for (const phase of (project.phases || [])) {
      const dur = (phase.duration_months || 0) / 12
      const phaseStart = (project.process_start_date || startYear) + accYears
      const phaseEnd = phaseStart + dur
      if (yr >= Math.floor(phaseStart) && yr < Math.ceil(phaseEnd)) {
        const phaseCost = (phase.internal_cost || 0) + (phase.external_cost || 0)
        devCosts += dur > 0 ? phaseCost / Math.ceil(dur) : phaseCost
      }
      accYears += dur
    }

    // Risk-adjusted values
    const raRevenue = grossRevenue * cumPos
    const raCogs = cogs * cumPos
    const raMs = ms * cumPos
    const raNetRevenue = netRevenue * cumPos
    const netCF = raNetRevenue - devCosts

    data.push({
      year: yr, grossRevenue, cogs, ms, netRevenue, devCosts,
      raRevenue, raCogs, raMs, raNetRevenue, netCF,
      discountedNetCF: netCF / discount,
      // P&L rows
      grossProfit: raRevenue - raCogs,
      ebit: raRevenue - raCogs - raMs - devCosts
    })
  }

  // Cumulative cash flow
  let cumCF = 0
  data.forEach(d => { cumCF += d.netCF; d.cumulativeCF = cumCF })

  // NPV
  const npv = data.reduce((s, d) => s + d.discountedNetCF, 0)

  // Decision tree nodes (backward induction)
  const phases = project.phases || []
  const totalCost = phases.reduce((s, p) => s + (p.internal_cost || 0) + (p.external_cost || 0), 0)

  // Compute launch NPV (NPV if all remaining phases succeed)
  const launchNPV = data.reduce((s, d) => {
    const t = d.year - startYear
    const disc = Math.pow(1 + discountRate, t)
    return s + ((d.grossRevenue * (1 - cogsRate - msRate)) - d.devCosts) / disc
  }, 0)

  // Find current phase index (first non-actual phase, or 0 if all actual)
  const currentPhaseIdx = phases.findIndex(p => !p.is_actual)
  const effectiveCurrentIdx = currentPhaseIdx === -1 ? phases.length : currentPhaseIdx

  // Backward induction through phases
  const treeNodes = phases.map((phase, idx) => {
    const pos = phase.pos || 0.5
    const cost = (phase.internal_cost || 0) + (phase.external_cost || 0)
    let cumDevCost = 0
    for (let i = 0; i <= idx; i++) {
      cumDevCost += (phases[i].internal_cost || 0) + (phases[i].external_cost || 0)
    }
    // cumProb from start (used internally)
    let cumProb = 1
    for (let i = 0; i <= idx; i++) {
      cumProb *= (phases[i].pos || 0.5)
    }
    // forwardCumProb: probability of reaching this phase from current phase
    let forwardCumProb = 1
    for (let i = effectiveCurrentIdx; i <= idx; i++) {
      forwardCumProb *= (phases[i].pos || 0.5)
    }
    // forwardReachProb: probability of reaching (entering) this phase from current phase
    let forwardReachProb = 1
    for (let i = effectiveCurrentIdx; i < idx; i++) {
      forwardReachProb *= (phases[i].pos || 0.5)
    }
    return { phase: phase.phase, pos, cost, cumDevCost, cumProb, forwardCumProb, forwardReachProb, isActual: phase.is_actual }
  })

  // Backward induction: compute eNPV at each node
  for (let i = treeNodes.length - 1; i >= 0; i--) {
    const node = treeNodes[i]
    const successValue = i === treeNodes.length - 1 ? launchNPV : treeNodes[i + 1].enpv
    const failValue = -node.cumDevCost
    node.enpv = node.pos * successValue + (1 - node.pos) * failValue
    node.successValue = successValue
    node.failValue = failValue
  }

  return { years, data, npv, cumPos, launch, launchNPV, treeNodes, startYear, endYear, peak, loe }
}


// ============================================================================
// Project Expected Cash Flow Tab
// ============================================================================

function ProjectCashFlowTab({ project, discountRate }) {
  const fin = useMemo(() => computeProjectFinancials(project, discountRate), [project, discountRate])

  if (!fin) return <p style={{ color: 'var(--text-dim)' }}>Insufficient data — set process start date and phases.</p>

  // Filter to active years (any non-zero value)
  const activeData = fin.data.filter(d => d.raRevenue > 0.1 || d.devCosts > 0.1 || Math.abs(d.netCF) > 0.1)
  if (!activeData.length) return <p style={{ color: 'var(--text-dim)' }}>No cash flow data to display.</p>

  const maxVal = Math.max(...activeData.map(d => Math.max(d.raRevenue, d.devCosts, Math.abs(d.netCF), Math.abs(d.cumulativeCF))))
  const chartH = 280
  const barW = Math.max(12, Math.min(40, 600 / activeData.length))
  const chartW = Math.max(600, activeData.length * (barW * 4 + 16) + 80)

  return (
    <div className={styles.section}>
      <h2 style={{ marginBottom: '1rem' }}>Expected Cash Flow <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', fontWeight: 400 }}>(risk-adjusted)</span></h2>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
        {[
          { color: 'var(--green)', label: 'Revenue (RA)' },
          { color: 'var(--red)', label: 'Dev Costs' },
          { color: 'var(--orange)', label: 'COGS (RA)' },
          { color: 'var(--yellow)', label: 'M&S (RA)' },
          { color: 'var(--accent)', label: 'Net CF' },
          { color: 'var(--cyan)', label: 'Cumulative CF', dash: true },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 14, height: 3, background: l.color, borderRadius: 2, borderBottom: l.dash ? '2px dashed ' + l.color : 'none' }} />
            <span style={{ color: 'var(--text-dim)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <div style={{ overflowX: 'auto' }}>
        <svg width={chartW} height={chartH + 60} style={{ display: 'block' }}>
          {/* Zero line */}
          <line x1={50} y1={chartH / 2 + 20} x2={chartW - 10} y2={chartH / 2 + 20}
            stroke="var(--border)" strokeWidth={1} />

          {activeData.map((d, i) => {
            const x = 60 + i * (barW * 4 + 16)
            const zeroY = chartH / 2 + 20
            const scale = maxVal > 0 ? (chartH / 2 - 10) / maxVal : 1

            // Bars going up (revenue) and down (costs)
            const revH = d.raRevenue * scale
            const devH = d.devCosts * scale
            const cogsH = d.raCogs * scale
            const msH = d.raMs * scale

            return (
              <g key={d.year}>
                {/* Revenue bar (up) */}
                <rect x={x} y={zeroY - revH} width={barW} height={Math.max(revH, 0.5)}
                  fill="var(--green)" opacity={0.8} rx={2} />
                {/* Dev cost bar (down) */}
                <rect x={x + barW + 2} y={zeroY} width={barW} height={Math.max(devH, 0.5)}
                  fill="var(--red)" opacity={0.8} rx={2} />
                {/* COGS bar (down, stacked after dev) */}
                <rect x={x + barW * 2 + 4} y={zeroY} width={barW} height={Math.max(cogsH, 0.5)}
                  fill="var(--orange)" opacity={0.7} rx={2} />
                {/* M&S bar (down) */}
                <rect x={x + barW * 3 + 6} y={zeroY} width={barW} height={Math.max(msH, 0.5)}
                  fill="var(--yellow)" opacity={0.7} rx={2} />
                {/* Year label */}
                <text x={x + barW * 2} y={chartH + 55} textAnchor="middle"
                  fill="var(--text-muted)" fontSize={10}>{d.year}</text>
              </g>
            )
          })}

          {/* Net CF line */}
          <polyline fill="none" stroke="var(--accent)" strokeWidth={2}
            points={activeData.map((d, i) => {
              const x = 60 + i * (barW * 4 + 16) + barW * 2
              const zeroY = chartH / 2 + 20
              const scale = maxVal > 0 ? (chartH / 2 - 10) / maxVal : 1
              return `${x},${zeroY - d.netCF * scale}`
            }).join(' ')} />

          {/* Cumulative CF line (dashed) */}
          <polyline fill="none" stroke="var(--cyan)" strokeWidth={2} strokeDasharray="6,3"
            points={activeData.map((d, i) => {
              const x = 60 + i * (barW * 4 + 16) + barW * 2
              const zeroY = chartH / 2 + 20
              const scale = maxVal > 0 ? (chartH / 2 - 10) / maxVal : 1
              return `${x},${zeroY - d.cumulativeCF * scale}`
            }).join(' ')} />

          {/* Dots on Net CF */}
          {activeData.map((d, i) => {
            const x = 60 + i * (barW * 4 + 16) + barW * 2
            const zeroY = chartH / 2 + 20
            const scale = maxVal > 0 ? (chartH / 2 - 10) / maxVal : 1
            return <circle key={i} cx={x} cy={zeroY - d.netCF * scale} r={3} fill="var(--accent)" />
          })}
        </svg>
      </div>

      {/* Summary table */}
      <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
        <table className={styles.table} style={{ fontSize: '0.75rem' }}>
          <thead>
            <tr>
              <th>Year</th>
              <th style={{ textAlign: 'right' }}>Revenue (RA)</th>
              <th style={{ textAlign: 'right' }}>Dev Costs</th>
              <th style={{ textAlign: 'right' }}>COGS (RA)</th>
              <th style={{ textAlign: 'right' }}>M&S (RA)</th>
              <th style={{ textAlign: 'right' }}>Net CF</th>
              <th style={{ textAlign: 'right' }}>Cumulative CF</th>
            </tr>
          </thead>
          <tbody>
            {activeData.map((d, i) => (
              <tr key={d.year} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td>{d.year}</td>
                <td style={{ textAlign: 'right', color: 'var(--green)' }}>${d.raRevenue.toFixed(1)}M</td>
                <td style={{ textAlign: 'right', color: 'var(--red)' }}>${d.devCosts.toFixed(1)}M</td>
                <td style={{ textAlign: 'right', color: 'var(--orange)' }}>${d.raCogs.toFixed(1)}M</td>
                <td style={{ textAlign: 'right', color: 'var(--yellow)' }}>${d.raMs.toFixed(1)}M</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: d.netCF >= 0 ? 'var(--green)' : 'var(--red)' }}>${d.netCF.toFixed(1)}M</td>
                <td style={{ textAlign: 'right', color: d.cumulativeCF >= 0 ? 'var(--green)' : 'var(--red)' }}>${d.cumulativeCF.toFixed(1)}M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


// ============================================================================
// Project P&L Statement Tab
// ============================================================================

function ProjectPLTab({ project, discountRate }) {
  const fin = useMemo(() => computeProjectFinancials(project, discountRate), [project, discountRate])

  if (!fin) return <p style={{ color: 'var(--text-dim)' }}>Insufficient data — set process start date and phases.</p>

  const activeData = fin.data.filter(d => d.raRevenue > 0.1 || d.devCosts > 0.1)
  if (!activeData.length) return <p style={{ color: 'var(--text-dim)' }}>No P&L data to display.</p>

  // Totals
  const totals = activeData.reduce((acc, d) => ({
    raRevenue: acc.raRevenue + d.raRevenue,
    raCogs: acc.raCogs + d.raCogs,
    grossProfit: acc.grossProfit + d.grossProfit,
    raMs: acc.raMs + d.raMs,
    devCosts: acc.devCosts + d.devCosts,
    ebit: acc.ebit + d.ebit,
  }), { raRevenue: 0, raCogs: 0, grossProfit: 0, raMs: 0, devCosts: 0, ebit: 0 })

  const rows = [
    { label: 'Revenue', key: 'raRevenue', bold: false, color: null, sign: 1 },
    { label: 'COGS', key: 'raCogs', bold: false, color: null, sign: -1 },
    { label: 'Gross Profit', key: 'grossProfit', bold: true, color: null, sign: 1 },
    { label: 'Marketing & Sales', key: 'raMs', bold: false, color: null, sign: -1 },
    { label: 'Development Costs', key: 'devCosts', bold: false, color: null, sign: -1 },
    { label: 'EBIT', key: 'ebit', bold: true, color: 'conditional', sign: 1 },
  ]

  const fmtCell = (val, row) => {
    const display = row.sign === -1 && val > 0 ? `(${val.toFixed(1)})` : val.toFixed(1)
    let color = 'var(--text)'
    if (row.color === 'conditional') color = val >= 0 ? 'var(--green)' : 'var(--red)'
    else if (row.sign === -1 && val > 0) color = 'var(--red)'
    return { display, color }
  }

  return (
    <div className={styles.section}>
      <h2 style={{ marginBottom: '1rem' }}>P&L Statement <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', fontWeight: 400 }}>(risk-adjusted, $M)</span></h2>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table} style={{ fontSize: '0.75rem', minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 140, position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>$M</th>
              {activeData.map(d => (
                <th key={d.year} style={{ textAlign: 'right', minWidth: 60 }}>{d.year}</th>
              ))}
              <th style={{ textAlign: 'right', minWidth: 70, borderLeft: '2px solid var(--border)' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const isGrossProfit = row.key === 'grossProfit'
              const isEbit = row.key === 'ebit'
              return (
                <tr key={row.key} style={{
                  borderTop: (isGrossProfit || isEbit) ? '2px solid var(--border)' : undefined,
                }}>
                  <td style={{
                    fontWeight: row.bold ? 700 : 400,
                    position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1,
                    paddingLeft: row.bold ? '0.5rem' : '1.5rem',
                    color: 'var(--text)'
                  }}>{row.label}</td>
                  {activeData.map(d => {
                    const val = d[row.key]
                    const { display, color } = fmtCell(val, row)
                    return (
                      <td key={d.year} style={{ textAlign: 'right', fontWeight: row.bold ? 700 : 400, color }}>
                        {display}
                      </td>
                    )
                  })}
                  <td style={{
                    textAlign: 'right', fontWeight: row.bold ? 700 : 400,
                    borderLeft: '2px solid var(--border)',
                    color: fmtCell(totals[row.key], row).color
                  }}>
                    {fmtCell(totals[row.key], row).display}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        NPV (@ {(discountRate * 100).toFixed(0)}% discount): <strong style={{ color: fin.npv >= 0 ? 'var(--green)' : 'var(--red)' }}>${fin.npv.toFixed(1)}M</strong>
        &nbsp;·&nbsp;P(Launch): <strong>{(fin.cumPos * 100).toFixed(0)}%</strong>
        &nbsp;·&nbsp;Expected launch: <strong>{fin.launch ? decimalYearToDate(fin.launch) : 'N/A'}</strong>
      </div>
    </div>
  )
}


// ============================================================================
// Decision Tree Tab — backward induction
// ============================================================================

function DecisionTreeTab({ project, discountRate = 0.1 }) {
  const fin = useMemo(() => computeProjectFinancials(project, discountRate), [project, discountRate])

  if (!fin || !fin.treeNodes.length) return <p style={{ color: 'var(--text-dim)' }}>No phases available.</p>

  const { treeNodes, cumPos, launch, launchNPV } = fin
  const expectedLaunchDate = launch ? decimalYearToDate(launch) : 'N/A'

  const nodeW = 150
  const nodeH = 100
  const gapX = 30
  const failH = 68
  const failGap = 30
  const rowH = nodeH + failH + failGap + 20

  const totalW = (treeNodes.length + 2) * (nodeW + gapX) + 80
  const totalH = rowH + 40

  // Colors for phase nodes
  const phaseNodeColors = {
    PC: '#60a5fa', PH1: '#6c8cff', PH2: '#a78bfa',
    PH3: '#f472b6', REG: '#34d399', MARKET: '#fbbf24'
  }

  return (
    <div className={styles.section} style={{ overflow: 'auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Decision Tree <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', fontWeight: 400 }}>(backward induction)</span></h2>
      <svg width={totalW} height={totalH} style={{ display: 'block', minWidth: totalW }}>
        {/* START node */}
        <g transform={`translate(20, 20)`}>
          <rect x={0} y={0} width={nodeW} height={nodeH} rx={8}
            fill="var(--surface2)" stroke="var(--accent)" strokeWidth={2} />
          <text x={nodeW / 2} y={22} textAnchor="middle" fill="var(--accent)" fontSize={13} fontWeight={700}>START</text>
          <text x={nodeW / 2} y={42} textAnchor="middle" fill="var(--text-dim)" fontSize={11}>P = 100%</text>
          <text x={nodeW / 2} y={60} textAnchor="middle" fill="var(--text)" fontSize={12} fontWeight={600}>
            eNPV: ${treeNodes[0]?.enpv?.toFixed(0) || 0}M
          </text>
          <text x={nodeW / 2} y={78} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>
            Cost: ${treeNodes.reduce((s, n) => s + n.cost, 0).toFixed(0)}M
          </text>
        </g>

        {/* Phase nodes */}
        {treeNodes.map((node, i) => {
          const x = 20 + (i + 1) * (nodeW + gapX)
          const y = 20
          const color = phaseNodeColors[node.phase] || 'var(--accent)'
          const prevX = 20 + i * (nodeW + gapX) + nodeW
          const isActual = node.isActual

          return (
            <g key={i}>
              {/* Connector line from previous node */}
              <line x1={prevX} y1={y + nodeH / 2} x2={x} y2={y + nodeH / 2}
                stroke="var(--border)" strokeWidth={1.5} />
              {/* Success probability on connector */}
              <text x={(prevX + x) / 2} y={y + nodeH / 2 - 6}
                textAnchor="middle" fill="var(--green)" fontSize={10} fontWeight={600}>
                {(node.pos * 100).toFixed(0)}%
              </text>

              {/* Phase node box */}
              <rect x={x} y={y} width={nodeW} height={nodeH} rx={8}
                fill={isActual ? 'rgba(52,211,153,0.08)' : 'var(--surface)'}
                stroke={color} strokeWidth={2}
                strokeDasharray={isActual ? '' : ''}
              />
              <text x={x + nodeW / 2} y={y + 20} textAnchor="middle" fill={color} fontSize={12} fontWeight={700}>
                {PHASE_LABELS[node.phase] || node.phase}
              </text>
              {isActual && (
                <text x={x + nodeW / 2} y={y + 34} textAnchor="middle" fill="var(--green)" fontSize={9} fontWeight={600}>ACTUAL</text>
              )}
              <text x={x + nodeW / 2} y={y + (isActual ? 50 : 42)} textAnchor="middle" fill="var(--text-dim)" fontSize={10}>
                Cost: ${node.cost.toFixed(0)}M · {(node.pos * 100).toFixed(0)}% PoS
              </text>
              <text x={x + nodeW / 2} y={y + (isActual ? 66 : 58)} textAnchor="middle" fill="var(--text)" fontSize={11} fontWeight={600}>
                P(reach): {(node.forwardReachProb * 100).toFixed(1)}%
              </text>
              <text x={x + nodeW / 2} y={y + (isActual ? 82 : 76)} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>
                eNPV: ${node.enpv.toFixed(0)}M
              </text>

              {/* Failure branch */}
              <line x1={x + nodeW / 2} y1={y + nodeH} x2={x + nodeW / 2} y2={y + nodeH + failGap}
                stroke="var(--red)" strokeWidth={1} strokeDasharray="4,3" />
              {/* Failure probability on vertical connector */}
              <text x={x + nodeW / 2 + 8} y={y + nodeH + failGap / 2 + 3}
                textAnchor="start" fill="var(--red)" fontSize={9} fontWeight={600}>
                {((1 - node.pos) * 100).toFixed(0)}%
              </text>
              <rect x={x + 10} y={y + nodeH + failGap} width={nodeW - 20} height={failH} rx={6}
                fill="rgba(248,113,113,0.08)" stroke="var(--red)" strokeWidth={1} />
              <text x={x + nodeW / 2} y={y + nodeH + failGap + 20} textAnchor="middle"
                fill="var(--red)" fontSize={10} fontWeight={600}>
                FAIL
              </text>
              <text x={x + nodeW / 2} y={y + nodeH + failGap + 36} textAnchor="middle"
                fill="var(--text-muted)" fontSize={9}>
                P: {(node.forwardReachProb * (1 - node.pos) * 100).toFixed(1)}%
              </text>
              <text x={x + nodeW / 2} y={y + nodeH + failGap + 50} textAnchor="middle"
                fill="var(--text-muted)" fontSize={9}>
                NPV: ${node.failValue.toFixed(0)}M
              </text>
            </g>
          )
        })}

        {/* LAUNCH node */}
        {(() => {
          const x = 20 + (treeNodes.length + 1) * (nodeW + gapX)
          const y = 20
          const prevX = 20 + treeNodes.length * (nodeW + gapX) + nodeW
          return (
            <g>
              <line x1={prevX} y1={y + nodeH / 2} x2={x} y2={y + nodeH / 2}
                stroke="var(--green)" strokeWidth={2} />
              <rect x={x} y={y} width={nodeW} height={nodeH} rx={8}
                fill="rgba(52,211,153,0.1)" stroke="var(--green)" strokeWidth={2} />
              <text x={x + nodeW / 2} y={y + 22} textAnchor="middle" fill="var(--green)" fontSize={13} fontWeight={700}>
                LAUNCH
              </text>
              <text x={x + nodeW / 2} y={y + 42} textAnchor="middle" fill="var(--text-dim)" fontSize={11}>
                P(Launch): {(cumPos * 100).toFixed(1)}%
              </text>
              <text x={x + nodeW / 2} y={y + 60} textAnchor="middle" fill="var(--text)" fontSize={11}>
                {expectedLaunchDate}
              </text>
              <text x={x + nodeW / 2} y={y + 78} textAnchor="middle" fill="var(--green)" fontSize={12} fontWeight={600}>
                NPV: ${launchNPV.toFixed(0)}M
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}


// ============================================================================
// Snapshot Diff Tab
// ============================================================================

function SnapshotDiffTab({ project }) {
  const [snapshots, setSnapshots] = useState([])
  const [selectedSnapshots, setSelectedSnapshots] = useState([null, null])
  const [loading, setLoading] = useState(true)
  const [diffRows, setDiffRows] = useState(null)
  const [includeNow, setIncludeNow] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/ppm/project/${project.id}/snapshot`)
      .then(r => r.json())
      .then(data => { setSnapshots(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [project.id])

  // Pretty-print field labels
  const labelMap = {
    name: 'Name', ta: 'TA', modality: 'Modality', source: 'Source', indication: 'Indication',
    mode_of_action: 'Mode of Action', current_phase: 'Phase', process_start_date: 'Process Start',
    peak_year_sales: 'Peak Sales ($M)', time_to_peak_years: 'Time to Peak (yr)',
    cogs_rate: 'COGS Rate', ms_rate: 'M&S Rate', loe_year: 'LoE Year',
  }

  const formatVal = (v) => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'boolean') return v ? 'Yes' : 'No'
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2)
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }

  const buildDiff = (d1, d2) => {
    const rows = []
    const skipKeys = new Set(['id', 'portfolio_id', 'created_at', 'updated_at', 'phases'])

    // Top-level fields
    const allKeys = new Set([...Object.keys(d1 || {}), ...Object.keys(d2 || {})])
    for (const key of allKeys) {
      if (skipKeys.has(key)) continue
      const v1 = d1?.[key]
      const v2 = d2?.[key]
      if (JSON.stringify(v1) !== JSON.stringify(v2)) {
        rows.push({ section: 'Project', field: labelMap[key] || key, from: formatVal(v1), to: formatVal(v2) })
      }
    }

    // Phase-level comparison
    const phases1 = d1?.phases || []
    const phases2 = d2?.phases || []
    const allPhases = new Set([...phases1.map(p => p.phase), ...phases2.map(p => p.phase)])
    for (const phName of allPhases) {
      const p1 = phases1.find(p => p.phase === phName)
      const p2 = phases2.find(p => p.phase === phName)
      const phaseSkip = new Set(['id', 'project_id', 'phase'])
      const phFields = new Set([...Object.keys(p1 || {}), ...Object.keys(p2 || {})])
      for (const f of phFields) {
        if (phaseSkip.has(f)) continue
        const v1 = p1?.[f]
        const v2 = p2?.[f]
        if (JSON.stringify(v1) !== JSON.stringify(v2)) {
          const fLabel = f === 'duration_months' ? 'Duration (mo)' : f === 'pos' ? 'PoS'
            : f === 'internal_cost' ? 'Internal Cost' : f === 'external_cost' ? 'External Cost'
            : f === 'is_actual' ? 'Actual' : f === 'actual_date' ? 'Actual Date' : f === 'actual_cost' ? 'Actual Cost' : f
          rows.push({ section: PHASE_LABELS[phName] || phName, field: fLabel, from: formatVal(v1), to: formatVal(v2) })
        }
      }
    }

    return rows
  }

  const loadDiff = async (snap1, snap2) => {
    if (!snap1 || !snap2) return
    try {
      let d1, d2
      if (snap1 === 'current') {
        d1 = project
      } else if (snap1) {
        const r1 = await fetch(`/api/ppm/project/${project.id}/snapshot?snapshotId=${snap1.id}`)
        d1 = r1.ok ? await r1.json() : snap1
      }
      if (snap2 === 'current') {
        d2 = project
      } else if (snap2) {
        const r2 = await fetch(`/api/ppm/project/${project.id}/snapshot?snapshotId=${snap2.id}`)
        d2 = r2.ok ? await r2.json() : snap2
      }
      if (d1 && d2) setDiffRows(buildDiff(d1, d2))
    } catch (e) {
      console.error('Diff load failed:', e)
    }
  }

  const selectStyle = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid var(--border)',
    borderRadius: '0.375rem',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '0.85rem'
  }

  const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }

  if (loading) return <p style={{ color: 'var(--text-dim)' }}>Loading snapshots...</p>

  return (
    <div>
      {/* Selector row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={labelStyle}>From</label>
          <select
            value={selectedSnapshots[0]?.id || (selectedSnapshots[0] === 'current' ? '__current__' : '')}
            onChange={e => {
              const val = e.target.value
              const s = val === '__current__' ? 'current' : snapshots.find(x => x.id === val) || null
              setSelectedSnapshots([s, selectedSnapshots[1]])
              loadDiff(s, selectedSnapshots[1])
            }}
            style={selectStyle}>
            <option value="">Select snapshot...</option>
            <option value="__current__">Current state</option>
            {snapshots.map(s => (
              <option key={s.id} value={s.id}>
                {s.snapshot_name} ({new Date(s.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>To</label>
          <select
            value={selectedSnapshots[1]?.id || (selectedSnapshots[1] === 'current' ? '__current__' : '')}
            onChange={e => {
              const val = e.target.value
              const s = val === '__current__' ? 'current' : snapshots.find(x => x.id === val) || null
              setSelectedSnapshots([selectedSnapshots[0], s])
              loadDiff(selectedSnapshots[0], s)
            }}
            style={selectStyle}>
            <option value="">Select snapshot...</option>
            <option value="__current__">Current state</option>
            {snapshots.map(s => (
              <option key={s.id} value={s.id}>
                {s.snapshot_name} ({new Date(s.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!snapshots.length && (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No snapshots available. Create snapshots to compare.</p>
      )}

      {/* Diff table */}
      {diffRows && diffRows.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--green)', fontSize: '0.9rem', fontWeight: 600 }}>
          No differences found — snapshots are identical.
        </div>
      )}

      {diffRows && diffRows.length > 0 && (
        <div className={styles.tableContainer} style={{ maxHeight: '50vh' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Section</th>
                <th>Field</th>
                <th style={{ color: 'var(--red)' }}>From</th>
                <th style={{ color: 'var(--green)' }}>To</th>
              </tr>
            </thead>
            <tbody>
              {diffRows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{row.section}</td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{row.field}</td>
                  <td style={{ color: 'var(--red)', fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>{row.from}</td>
                  <td style={{ color: 'var(--green)', fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>{row.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {diffRows && diffRows.length > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {diffRows.length} change{diffRows.length !== 1 ? 's' : ''} found across {new Set(diffRows.map(r => r.section)).size} section{new Set(diffRows.map(r => r.section)).size !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}


// ============================================================================
// Chat Panel
// ============================================================================

function ChatPanel({ isOpen, onToggle, onDataChanged }) {
  const [messages, setMessages] = useState([
    { type: 'assistant', text: 'Ask me about your portfolio. Try:\n• "Give me a summary of the Titan portfolio"\n• "What\'s the eNPV of Kronos?"\n• "Which projects have the highest risk?"\n• "Advance Phoebe to MARKET with date 2026-03-15"' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const messagesRef = useRef(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { type: 'user', text: userMsg }])
    setLoading(true)

    // Build message history for the API
    const newHistory = [...conversationHistory, { role: 'user', content: userMsg }]

    try {
      const res = await fetch('/api/ppm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory })
      })
      const data = await res.json()

      if (data.error) {
        setMessages(prev => [...prev, {
          type: 'assistant',
          text: data.error === 'ANTHROPIC_API_KEY not configured'
            ? 'API key not configured yet. Add ANTHROPIC_API_KEY to your Vercel environment variables to enable the assistant.'
            : `Error: ${data.error}`
        }])
      } else {
        const assistantText = data.response || 'No response received.'
        setMessages(prev => [...prev, { type: 'assistant', text: assistantText }])
        setConversationHistory([...newHistory, { role: 'assistant', content: assistantText }])

        // If the assistant used tools that modify data, refresh the UI
        if (data.iterations > 1 && onDataChanged) {
          onDataChanged()
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        type: 'assistant',
        text: `Connection error: ${err.message}. Make sure the server is running.`
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([{ type: 'assistant', text: 'Chat cleared. How can I help with your portfolio?' }])
    setConversationHistory([])
  }

  return (
    <>
      <button
        className={styles.chatToggle}
        onClick={onToggle}
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          background: 'var(--surface)',
          color: 'var(--text-dim)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}>
        {loading ? '⏳' : '💬'} Chat
      </button>

      <div className={`${styles.chatPanel} ${!isOpen ? styles.chatPanelHidden : ''}`}>
        <div className={styles.chatHeader}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Portfolio Assistant</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleClearChat}
              title="Clear chat"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                opacity: 0.6,
                padding: '0.2rem 0.4rem',
                borderRadius: '0.25rem',
              }}>
              Clear
            </button>
            <button
              onClick={onToggle}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}>
              ✕
            </button>
          </div>
        </div>

        <div className={styles.chatMessages} ref={messagesRef}>
          {messages.map((msg, i) => (
            <div key={i} className={msg.type === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant}
              style={{ whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className={styles.chatBubbleAssistant} style={{ opacity: 0.6, fontStyle: 'italic' }}>
              Thinking...
            </div>
          )}
        </div>

        <div className={styles.chatInputArea}>
          <input
            type="text"
            className={styles.chatInput}
            placeholder={loading ? 'Waiting for response...' : 'Ask about your portfolio...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !loading) handleSend() }}
            disabled={loading}
          />
          <button
            className={styles.chatSendBtn}
            onClick={handleSend}
            disabled={!input.trim() || loading}>
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </>
  )
}


// ============================================================================
// Audit Trail Tab
// ============================================================================

function AuditTrailTab({ entityType, entityId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [filterAction, setFilterAction] = useState('all')

  useEffect(() => {
    setLoading(true)
    const url = entityType === 'portfolio'
      ? `/api/ppm/portfolio/${entityId}/audit`
      : `/api/ppm/project/${entityId}/audit`
    fetch(url).then(r => r.json()).then(data => { setEntries(data); setLoading(false) }).catch(() => setLoading(false))
  }, [entityType, entityId, refreshKey])

  if (loading) return <p style={{ color: 'var(--text-dim)' }}>Loading...</p>

  // Get unique actions for filter
  const actions = [...new Set(entries.map(e => e.action))]
  const filtered = filterAction === 'all' ? entries : entries.filter(e => e.action === filterAction)

  // Action color mapping
  const actionColors = {
    created: 'var(--green)', updated: 'var(--accent)', deleted: 'var(--red)',
    phase_updated: 'var(--cyan)', phase_advanced: 'var(--yellow)',
    snapshot_created: 'var(--purple)', project_added: 'var(--green)',
    project_removed: 'var(--orange)'
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className={styles.btn} onClick={() => setRefreshKey(k => k + 1)}
          style={{ fontSize: '0.8rem' }}>
          ↻ Refresh
        </button>
        <select
          value={filterAction} onChange={e => setFilterAction(e.target.value)}
          style={{
            padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: '1px solid var(--border)',
            borderRadius: '0.375rem', background: 'var(--surface)', color: 'var(--text)'
          }}>
          <option value="all">All actions ({entries.length})</option>
          {actions.map(a => (
            <option key={a} value={a}>{a} ({entries.filter(e => e.action === a).length})</option>
          ))}
        </select>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {entries.length} entries
        </span>
      </div>
      {!filtered.length && <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No audit entries{filterAction !== 'all' ? ' for this filter' : ' yet'}.</p>}
      <div className={styles.auditList}>
        {filtered.map((e, i) => (
          <div key={i} className={styles.auditEntry}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <span style={{
                display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '0.25rem',
                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em',
                background: `color-mix(in srgb, ${actionColors[e.action] || 'var(--accent)'} 15%, transparent)`,
                color: actionColors[e.action] || 'var(--accent)'
              }}>{e.action}</span>
              <span className={styles.auditTimestamp}>{new Date(e.timestamp).toLocaleString()}</span>
            </div>
            {e.field && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border)' }}>
                <strong style={{ color: 'var(--text)' }}>{e.field}</strong>:&nbsp;
                <span style={{ color: 'var(--red)', textDecoration: 'line-through' }}>{e.old_value ?? '(empty)'}</span>
                &nbsp;→&nbsp;
                <span style={{ color: 'var(--green)' }}>{e.new_value ?? '(empty)'}</span>
              </div>
            )}
            {e.details && <div className={styles.auditDetails}>{e.details}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}


// ============================================================================
// Project Detail View Tabs
// ============================================================================

function ProjectDetailTabs({ project, onTabChange, currentTab }) {
  const tabs = [
    { id: 'detail', label: 'Input Form' },
    { id: 'cashflow', label: 'Expected Cash Flow' },
    { id: 'pnl', label: 'P&L Statement' },
    { id: 'tree', label: 'Decision Tree' },
    { id: 'snapshots', label: 'Snapshots' },
    { id: 'history', label: 'History' },
    { id: 'audit', label: 'Audit Trail' }
  ]

  return (
    <div className={styles.tabBar}>
      {tabs.map(tab => (
        <button key={tab.id}
          className={`${styles.tab} ${currentTab === tab.id ? styles.tabActive : ''}`}
          onClick={() => onTabChange(tab.id)}>{tab.label}</button>
      ))}
    </div>
  )
}


// ============================================================================
// Advance Phase Modal
// ============================================================================

// ============================================================================
// Project Input Form — with lock/unlock for actual phases
// ============================================================================

function ProjectInputForm({ project, canAdvance, onAdvance, onUpdateField, onUpdatePhaseField }) {
  const [actualsUnlocked, setActualsUnlocked] = useState(false)

  return (
    <>
      {/* General Info */}
      <div className={styles.section}>
        <h2>General Information</h2>
        <div className={styles.paramsGrid}>
          <div className={styles.param}>
            <label>Name</label>
            <EditableInput type="text" value={project.name || ''} onCommit={v => onUpdateField('name', v)} />
          </div>
          <div className={styles.param}>
            <label>Therapeutic Area</label>
            <EditableInput type="text" value={project.ta || ''} onCommit={v => onUpdateField('ta', v)} />
          </div>
          <div className={styles.param}>
            <label>Modality</label>
            <EditableInput type="text" value={project.modality || ''} onCommit={v => onUpdateField('modality', v)} />
          </div>
          <div className={styles.param}>
            <label>Source</label>
            <EditableInput type="text" value={project.source || ''} onCommit={v => onUpdateField('source', v)} />
          </div>
          <div className={styles.param}>
            <label>Indication</label>
            <EditableInput type="text" value={project.indication || ''} onCommit={v => onUpdateField('indication', v)} />
          </div>
          <div className={styles.param}>
            <label>Mode of Action</label>
            <EditableInput type="text" value={project.mode_of_action || ''} onCommit={v => onUpdateField('modeOfAction', v)} />
          </div>
        </div>
      </div>

      {/* Commercial Parameters */}
      <div className={styles.section}>
        <h2>Commercial Parameters</h2>
        <div className={styles.paramsGrid}>
          <div className={styles.param}>
            <label>Process Start Date</label>
            <input type="date"
              value={project.process_start_date ? decimalYearToInputDate(project.process_start_date) : ''}
              onChange={e => {
                const dec = inputDateToDecimalYear(e.target.value)
                if (dec) onUpdateField('processStartDate', dec)
              }}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'SF Mono', 'Monaco', 'Menlo', monospace", fontSize: '0.85rem' }}
            />
          </div>
          <div className={styles.param}>
            <label>Peak Year Sales ($M)</label>
            <EditableInput type="number" step="1" value={project.peak_year_sales || 0}
              onCommit={v => onUpdateField('peakYearSales', v)} />
          </div>
          <div className={styles.param}>
            <label>Time to Peak (years)</label>
            <EditableInput type="number" step="0.5" value={project.time_to_peak_years || 0}
              onCommit={v => onUpdateField('timeToPeakYears', v)} />
          </div>
          <div className={styles.param}>
            <label>LoE Year</label>
            <EditableInput type="number" value={project.loe_year || 0}
              onCommit={v => onUpdateField('loeYear', v)} />
          </div>
          <div className={styles.param}>
            <label>COGS Rate</label>
            <EditableInput type="number" step="0.01" value={project.cogs_rate || 0}
              onCommit={v => onUpdateField('cogsRate', v)} />
          </div>
          <div className={styles.param}>
            <label>M&S Rate</label>
            <EditableInput type="number" step="0.01" value={project.ms_rate || 0}
              onCommit={v => onUpdateField('msRate', v)} />
          </div>
        </div>
      </div>

      {/* Development Phases */}
      <div className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Development Phases</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {canAdvance && (
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onAdvance}>
                Advance Phase
              </button>
            )}
            {project.phases?.some(p => p.is_actual) && (
              <button
                className={styles.btn}
                onClick={() => setActualsUnlocked(!actualsUnlocked)}
                style={{
                  fontSize: '0.75rem',
                  color: actualsUnlocked ? 'var(--yellow)' : 'var(--text-dim)',
                  borderColor: actualsUnlocked ? 'var(--yellow)' : undefined
                }}
              >
                {actualsUnlocked ? '🔓 Lock Actuals' : '🔒 Unlock Actuals'}
              </button>
            )}
          </div>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Phase</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Start Date</th>
                <th style={{ textAlign: 'right' }}>Duration (mo)</th>
                <th style={{ textAlign: 'right' }}>PoS</th>
                <th style={{ textAlign: 'right' }}>Internal Cost ($M)</th>
                <th style={{ textAlign: 'right' }}>External Cost ($M)</th>
                <th style={{ textAlign: 'right' }}>Total Cost ($M)</th>
              </tr>
            </thead>
            <tbody>
              {project.phases?.map((phase, idx) => {
                const isLocked = phase.is_actual && !actualsUnlocked
                const totalCost = (phase.internal_cost || 0) + (phase.external_cost || 0)
                const phaseStartDecimal = calculatePhaseStartDate(project.process_start_date, project.phases, idx)
                return (
                  <tr key={phase.id} className={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}
                    style={{ opacity: isLocked ? 0.7 : 1 }}>
                    <td className={styles.nameCell}>
                      <span className={styles.badge} style={{
                        background: (PHASE_BADGE_STYLES[phase.phase] || {}).bg,
                        color: (PHASE_BADGE_STYLES[phase.phase] || {}).color
                      }}>{PHASE_LABELS[phase.phase]}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.25rem',
                        background: phase.is_actual ? 'rgba(52,211,153,0.15)' : 'rgba(108,140,255,0.15)',
                        color: phase.is_actual ? 'var(--green)' : 'var(--accent)'
                      }}>
                        {phase.is_actual ? 'ACTUAL' : 'PLANNED'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {phase.is_actual ? (
                        <span style={{ color: 'var(--green)', fontSize: '0.8rem' }}>{phaseStartDecimal ? decimalYearToDate(phaseStartDecimal) : '—'}</span>
                      ) : (
                        <input type="date"
                          value={phaseStartDecimal ? decimalYearToInputDate(phaseStartDecimal) : ''}
                          onChange={e => {
                            if (idx === 0) {
                              // Changing first phase start = changing process start date
                              const dec = inputDateToDecimalYear(e.target.value)
                              if (dec) onUpdateField('processStartDate', dec)
                            } else {
                              // Changing phase N start = changing phase N-1 duration
                              const newDecimal = inputDateToDecimalYear(e.target.value)
                              if (!newDecimal || !project.process_start_date) return
                              let accBefore = 0
                              for (let i = 0; i < idx - 1; i++) {
                                accBefore += ((project.phases[i]?.duration_months) || 0) / 12
                              }
                              const prevPhaseStart = project.process_start_date + accBefore
                              const newDurationMonths = Math.round((newDecimal - prevPhaseStart) * 12)
                              if (newDurationMonths >= 0) {
                                onUpdatePhaseField(project.phases[idx - 1].id, 'durationMonths', newDurationMonths)
                              }
                            }
                          }}
                          style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', color: 'var(--text)', fontSize: '0.8rem', textAlign: 'right', width: 130 }}
                        />
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isLocked
                        ? <span style={{ color: 'var(--text-dim)', display: 'block', textAlign: 'right' }}>{phase.duration_months || 0}</span>
                        : <EditableInput type="number" step="1" value={phase.duration_months || 0} className={styles.cellInput} style={{ width: '80px', textAlign: 'right' }}
                            onCommit={v => onUpdatePhaseField(phase.id, 'durationMonths', parseInt(v))} />
                      }
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isLocked
                        ? <span style={{ color: 'var(--text-dim)', display: 'block', textAlign: 'right' }}>{((phase.pos || 0.5) * 100).toFixed(0)}%</span>
                        : <EditableInput type="number" step="0.01" min="0" max="1" value={phase.pos || 0.5} className={styles.cellInput} style={{ width: '70px', textAlign: 'right' }}
                            onCommit={v => onUpdatePhaseField(phase.id, 'pos', parseFloat(v))} />
                      }
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isLocked
                        ? <span style={{ color: 'var(--text-dim)', display: 'block', textAlign: 'right' }}>{(phase.internal_cost || 0).toFixed(1)}</span>
                        : <EditableInput type="number" step="0.1" value={phase.internal_cost || 0} className={styles.cellInput} style={{ width: '90px', textAlign: 'right' }}
                            onCommit={v => onUpdatePhaseField(phase.id, 'internalCost', parseFloat(v))} />
                      }
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isLocked
                        ? <span style={{ color: 'var(--text-dim)', display: 'block', textAlign: 'right' }}>{(phase.external_cost || 0).toFixed(1)}</span>
                        : <EditableInput type="number" step="0.1" value={phase.external_cost || 0} className={styles.cellInput} style={{ width: '90px', textAlign: 'right' }}
                            onCommit={v => onUpdatePhaseField(phase.id, 'externalCost', parseFloat(v))} />
                      }
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>
                      {totalCost.toFixed(1)}
                    </td>
                  </tr>
                )
              })}
              {/* Total row */}
              <tr style={{ borderTop: '2px solid var(--border)' }}>
                <td colSpan={4} style={{ fontWeight: 700, textAlign: 'right', paddingRight: '1rem' }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  {project.phases?.reduce((s, p) => s + (p.internal_cost || 0), 0).toFixed(1)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  {project.phases?.reduce((s, p) => s + (p.external_cost || 0), 0).toFixed(1)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>
                  ${getTotalCost(project).toFixed(1)}M
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}


// ============================================================================
// Advance Phase Modal
// ============================================================================

function AdvancePhaseModal({ project, onClose, onAdvanced }) {
  const [actualDate, setActualDate] = useState(decimalYearToInputDate(getLaunchDate(project) || TODAY_DECIMAL))
  const [actualCost, setActualCost] = useState('')
  const [loading, setLoading] = useState(false)

  const nextPhaseIdx = PHASE_ORDER.indexOf(project.current_phase) + 1
  const nextPhase = PHASE_ORDER[nextPhaseIdx]
  const plannedCost = project.phases?.find(p => p.phase === project.current_phase)
    ? (project.phases.find(p => p.phase === project.current_phase).internal_cost || 0) +
      (project.phases.find(p => p.phase === project.current_phase).external_cost || 0)
    : 0

  const handleAdvance = async () => {
    if (!actualDate) {
      alert('Please enter transition date')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/ppm/project/${project.id}/advance-phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPhase: nextPhase,
          actualDate: inputDateToDecimalYear(actualDate),
          actualCost: actualCost ? parseFloat(actualCost) : plannedCost
        })
      })
      if (!res.ok) throw new Error('Advance failed')
      const updated = await res.json()
      onAdvanced(updated)
      onClose()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>Advance Phase — {project.name}</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
          Moving from <strong style={{ color: PHASE_COLORS[project.current_phase] }}>{PHASE_LABELS[project.current_phase]}</strong> to <strong style={{ color: PHASE_COLORS[nextPhase] }}>{PHASE_LABELS[nextPhase]}</strong>
        </p>
        <div className={styles.paramsGrid}>
          <div className={styles.param}>
            <label>Actual transition date</label>
            <input type="date" value={actualDate} onChange={e => setActualDate(e.target.value)} />
          </div>
          <div className={styles.param}>
            <label>Actual cost ($M) — planned: ${plannedCost.toFixed(1)}M</label>
            <input type="number" step="0.1" value={actualCost} placeholder={plannedCost.toFixed(1)}
              onChange={e => setActualCost(e.target.value)} />
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btn} onClick={onClose}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAdvance} disabled={loading}>
            {loading ? 'Advancing...' : `Advance to ${PHASE_LABELS[nextPhase]}`}
          </button>
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// Create Project Modal
// ============================================================================

function CreateProjectModal({ onClose, onCreated, hasPortfolio = false, portfolioName = '' }) {
  const [mode, setMode] = useState('random') // 'empty' or 'random'
  const [name, setName] = useState('')
  const [startPhase, setStartPhase] = useState('PC')
  const [addToPortfolio, setAddToPortfolio] = useState(hasPortfolio)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      let data
      if (mode === 'random') {
        data = generateRandomProject(startPhase)
        if (name.trim()) data.name = name.trim()
      } else {
        const id = 'proj-' + (name.trim() || 'new').toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
        data = {
          id, name: name.trim() || 'New Project',
          currentPhase: startPhase,
          processStartDate: TODAY_DECIMAL,
          peakYearSales: 0, timeToPeakYears: 3,
          cogsRate: 0.05, msRate: 0.08, loeYear: 2040,
          ta: '', modality: '', source: '', indication: '', modeOfAction: '',
          phases: PHASE_ORDER.slice(0, 5).map((ph, i) => ({
            phase: ph, duration_months: 12, pos: 0.5,
            internal_cost: 0, external_cost: 0,
            is_actual: PHASE_ORDER.indexOf(startPhase) > i ? 1 : 0
          }))
        }
      }

      // Create the project (phases are created server-side from data.phases)
      const res = await fetch('/api/ppm/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Create failed (${res.status})`)
      }
      const created = await res.json()

      onCreated(created, addToPortfolio)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>Create New Project</h2>

        <div className={styles.controlsRow} style={{ marginBottom: '1rem' }}>
          <span className={styles.controlLabel}>Type:</span>
          <button className={`${styles.controlBtn} ${mode === 'random' ? styles.controlBtnActive : ''}`}
            onClick={() => setMode('random')}>Randomized (demo)</button>
          <button className={`${styles.controlBtn} ${mode === 'empty' ? styles.controlBtnActive : ''}`}
            onClick={() => setMode('empty')}>Empty (manual)</button>
        </div>

        <div className={styles.paramsGrid}>
          <div className={styles.param}>
            <label>Project name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Titan-123" />
          </div>
          <div className={styles.param}>
            <label>Starting phase</label>
            <select value={startPhase} onChange={e => setStartPhase(e.target.value)}>
              {PHASE_ORDER.map(ph => (
                <option key={ph} value={ph}>{PHASE_LABELS[ph]}</option>
              ))}
            </select>
          </div>
        </div>

        {hasPortfolio && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text)', cursor: 'pointer' }}>
            <input type="checkbox" checked={addToPortfolio} onChange={e => setAddToPortfolio(e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
            Add to current portfolio{portfolioName ? ` (${portfolioName})` : ''}
          </label>
        )}

        <div className={styles.modalActions}>
          <button className={styles.btn} onClick={onClose}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// Create Portfolio Modal
// ============================================================================

function CreatePortfolioModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter portfolio name')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/ppm/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'portfolio-' + name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
          name: name.trim(),
          discount_rate: 0.1
        })
      })
      if (!res.ok) throw new Error('Create failed')
      const created = await res.json()
      onCreated(created)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>Create New Portfolio</h2>
        <div className={styles.param} style={{ marginBottom: '1.25rem' }}>
          <label>Portfolio name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q1 2026 Pipeline"
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }} />
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btn} onClick={onClose}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// Manage Projects Modal
// ============================================================================

function ManageProjectsModal({ portfolio, allProjects, onClose, onChanged }) {
  const [loading, setLoading] = useState(false)
  // Track membership locally for optimistic updates
  const [memberIds, setMemberIds] = useState(
    () => new Set(portfolio.projects?.map(p => p.id) || [])
  )

  const handleToggleProject = async (projectId, adding) => {
    setLoading(true)
    // Optimistic update
    setMemberIds(prev => {
      const next = new Set(prev)
      if (adding) next.add(projectId)
      else next.delete(projectId)
      return next
    })
    try {
      const endpoint = `/api/ppm/portfolio/${portfolio.id}/projects`
      const method = adding ? 'POST' : 'DELETE'
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      if (!res.ok) throw new Error('Update failed')
      await onChanged()
    } catch (err) {
      // Revert optimistic update on error
      setMemberIds(prev => {
        const next = new Set(prev)
        if (adding) next.delete(projectId)
        else next.add(projectId)
        return next
      })
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inPortfolio = allProjects.filter(p => memberIds.has(p.id))
  const notInPortfolio = allProjects.filter(p => !memberIds.has(p.id))

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>Manage Projects — {portfolio.name}</h2>

        {inPortfolio.length > 0 && (
          <>
            <h3 style={{ marginTop: '1.25rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
              In Portfolio ({inPortfolio.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {inPortfolio.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: '0.375rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{p.name}</span>
                  <button className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                    onClick={() => handleToggleProject(p.id, false)} disabled={loading}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {notInPortfolio.length > 0 && (
          <>
            <h3 style={{ marginTop: '1.25rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
              Available ({notInPortfolio.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {notInPortfolio.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: '0.375rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{p.name}</span>
                  <button className={`${styles.btn} ${styles.btnSmall} ${styles.btnPrimary}`}
                    onClick={() => handleToggleProject(p.id, true)} disabled={loading}>
                    Add
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.modalActions}>
          <button className={styles.btn} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// Snapshot Modal
// ============================================================================

function SnapshotPanel({ entityType, entityId, entityName, inline = false, onClose }) {
  const [snapshots, setSnapshots] = useState([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const url = entityType === 'portfolio'
      ? `/api/ppm/portfolio/${entityId}/snapshot`
      : `/api/ppm/project/${entityId}/snapshot`
    fetch(url).then(r => r.json()).then(data => { setSnapshots(Array.isArray(data) ? data : []); setLoading(false) }).catch(() => setLoading(false))
  }, [entityType, entityId])

  const createSnapshot = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const endpoint = entityType === 'portfolio'
        ? `/api/ppm/portfolio/${entityId}/snapshot`
        : `/api/ppm/project/${entityId}/snapshot`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      })
      if (!res.ok) throw new Error('Create failed')
      const created = await res.json()
      setSnapshots([created, ...snapshots])
      setNewName('')
    } catch (err) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  const content = (
    <>
      {!inline && <h2>Snapshots — {entityName}</h2>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
          placeholder="Snapshot name (e.g. Q1 2026 baseline)"
          onKeyDown={e => { if (e.key === 'Enter') createSnapshot() }}
          style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.375rem', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem' }} />
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={createSnapshot} disabled={creating || !newName.trim()}>
          {creating ? '...' : 'Create'}
        </button>
      </div>

      {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading...</p> :
        snapshots.length === 0 ? <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No snapshots yet.</p> :
          <div className={styles.snapshotList}>
            {snapshots.map(s => (
              <div key={s.id} className={styles.snapshotEntry}>
                <span className={styles.snapshotName}>{s.snapshot_name}</span>
                <span className={styles.snapshotDate}>{new Date(s.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
      }

      {!inline && (
        <div className={styles.modalActions}>
          <button className={styles.btn} onClick={onClose}>Close</button>
        </div>
      )}
    </>
  )

  // Inline mode: render directly without modal overlay
  if (inline) return <div>{content}</div>

  // Modal mode: render with overlay
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {content}
      </div>
    </div>
  )
}


// ============================================================================
// Main PPM App Component
// ============================================================================

export default function PpmApp() {
  const [theme, setTheme] = useState('dark')
  const [view, setView] = useState('portfolio') // 'portfolio', 'project', 'settings'
  const [activeTab, setActiveTab] = useState('table')
  const [projectTab, setProjectTab] = useState('detail') // 'detail', 'audit', 'snapshots'
  const [settingsTabState, setSettingsTabState] = useState('general')

  // Data
  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [allProjects, setAllProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)

  // UI state
  const [editingCell, setEditingCell] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false)
  const [showManageProjects, setShowManageProjects] = useState(false)
  const [showAdvancePhase, setShowAdvancePhase] = useState(false)
  const [showSnapshot, setShowSnapshot] = useState(null) // { type, id, name }
  const [chatOpen, setChatOpen] = useState(false)
  const [sortCol, setSortCol] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [kpiCollapsed, setKpiCollapsed] = useState(false)

  // ── Data Loading ──
  const loadPortfolios = async () => {
    try {
      const res = await fetch('/api/ppm/portfolio')
      if (res.ok) {
        const data = await res.json()
        setPortfolios(data)
        return data
      }
    } catch (e) { /* ignore */ }
    return []
  }

  const loadPortfolio = async (id) => {
    try {
      const res = await fetch(`/api/ppm/portfolio/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPortfolio(data)
        return data
      }
    } catch (e) { /* ignore */ }
    return null
  }

  const loadAllProjects = async () => {
    try {
      const res = await fetch('/api/ppm/projects')
      if (res.ok) {
        const data = await res.json()
        setAllProjects(data)
        return data
      }
    } catch (e) { /* ignore */ }
    return []
  }

  // Initial load
  useEffect(() => {
    const init = async () => {
      const [pfs] = await Promise.all([loadPortfolios(), loadAllProjects()])
      if (pfs.length > 0) {
        setSelectedPortfolioId(pfs[0].id)
        await loadPortfolio(pfs[0].id)
      }
      setLoading(false)
    }
    init()
  }, [])

  // Reload portfolio when selection changes
  useEffect(() => {
    if (selectedPortfolioId) loadPortfolio(selectedPortfolioId)
  }, [selectedPortfolioId])

  // ── Actions ──
  const seedData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/ppm/seed', { method: 'POST' })
      if (!res.ok) throw new Error('Seed failed')
      await Promise.all([loadPortfolios(), loadAllProjects()])
      setSelectedPortfolioId('titan-portfolio')
      await loadPortfolio('titan-portfolio')
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportCaptario = async () => {
    if (!portfolio) return
    try {
      setLoading(true)
      const res = await fetch('/api/ppm/export-captario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: portfolio.id })
      })
      if (!res.ok) throw new Error('Export failed')
      const data = await res.json()
      for (const file of data.files) {
        const json = JSON.stringify(file.data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${file.projectId}-captario.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateField = async (field, value) => {
    try {
      const res = await fetch(`/api/ppm/project/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value })
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      setSelectedProject(updated)
      if (portfolio) {
        setPortfolio(prev => ({ ...prev, projects: prev.projects.map(p => p.id === updated.id ? updated : p) }))
      }
      setEditingCell(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const updatePhaseField = async (phaseId, field, value) => {
    try {
      const res = await fetch(`/api/ppm/project/${selectedProject.id}/phase`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId, field, value })
      })
      if (!res.ok) throw new Error('Phase update failed')
      const res2 = await fetch(`/api/ppm/project/${selectedProject.id}`)
      if (!res2.ok) throw new Error('Reload failed')
      const updated = await res2.json()
      setSelectedProject(updated)
      if (portfolio) {
        setPortfolio(prev => ({ ...prev, projects: prev.projects.map(p => p.id === updated.id ? updated : p) }))
      }
      setEditingCell(null)
    } catch (err) {
      setError(err.message)
    }
  }

  // Per-project update functions for spreadsheet view
  const updateProjectField = async (projectId, field, value) => {
    try {
      const res = await fetch(`/api/ppm/project/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value })
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      if (portfolio) {
        setPortfolio(prev => ({ ...prev, projects: prev.projects.map(p => p.id === updated.id ? updated : p) }))
      }
      if (selectedProject?.id === projectId) setSelectedProject(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  const updateProjectPhaseField = async (projectId, phaseId, field, value) => {
    try {
      const res = await fetch(`/api/ppm/project/${projectId}/phase`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId, field, value })
      })
      if (!res.ok) throw new Error('Phase update failed')
      const res2 = await fetch(`/api/ppm/project/${projectId}`)
      if (!res2.ok) throw new Error('Reload failed')
      const updated = await res2.json()
      if (portfolio) {
        setPortfolio(prev => ({ ...prev, projects: prev.projects.map(p => p.id === updated.id ? updated : p) }))
      }
      if (selectedProject?.id === projectId) setSelectedProject(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSelectProject = (project) => {
    setSelectedProject(project)
    setProjectTab('detail')
    setView('project')
  }

  const handleBack = async () => {
    setView('portfolio')
    setSelectedProject(null)
    if (selectedPortfolioId) await loadPortfolio(selectedPortfolioId)
    await loadAllProjects()
  }

  const canAdvance = selectedProject && PHASE_ORDER.indexOf(selectedProject.current_phase) < PHASE_ORDER.length - 1

  // Portfolio tabs and sorted projects (must be before conditional returns for hooks rules)
  const portfolioTabs = [
    { id: 'table', label: 'Projects' },
    { id: 'data', label: 'Input Data' },
    { id: 'bricks', label: 'Bricks' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'cash-flow', label: 'Cash Flow & Revenue' },
    { id: 'history', label: 'History' },
    { id: 'audit', label: 'Audit Trail' },
  ]

  const sortedProjects = useMemo(() => {
    if (!portfolio?.projects) return []
    const sorted = [...portfolio.projects]
    sorted.sort((a, b) => {
      let aVal, bVal
      switch (sortCol) {
        case 'name': aVal = a.name; bVal = b.name; break
        case 'phase': aVal = PHASE_ORDER.indexOf(a.current_phase); bVal = PHASE_ORDER.indexOf(b.current_phase); break
        case 'pos': aVal = getCumulativePos(a.phases || []); bVal = getCumulativePos(b.phases || []); break
        case 'enpv': aVal = calculateSimpleEnpv(a, portfolio.discount_rate || 0.1).enpv; bVal = calculateSimpleEnpv(b, portfolio.discount_rate || 0.1).enpv; break
        case 'pLaunch': aVal = getCumulativePos(a.phases || []); bVal = getCumulativePos(b.phases || []); break
        default: aVal = a[sortCol]; bVal = b[sortCol];
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [portfolio?.projects, sortCol, sortDir, portfolio?.discount_rate])

  // ── Loading State ──
  if (loading && !portfolio && portfolios.length === 0) {
    return <div className={`${styles.container} ${theme === 'light' ? styles.light : ''}`}><p style={{ color: 'var(--text-dim)' }}>Loading...</p></div>
  }

  // ── Settings View ──
  if (view === 'settings') {
    const [settingsTab, setSettingsTab] = [settingsTabState, setSettingsTabState]

    return (
      <div className={`${styles.container} ${theme === 'light' ? styles.light : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1>Settings</h1>
            <p>Application configuration and data management</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.themeToggle} onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button className={styles.backBtn} onClick={() => setView('portfolio')}>← Back</button>
          </div>
        </div>

        {/* Settings tabs */}
        <div className={styles.tabBar} style={{ marginBottom: '1.5rem' }}>
          {[
            { id: 'general', label: 'General' },
            { id: 'portfolio', label: 'Portfolio' },
            { id: 'danger', label: 'Danger Zone' },
            { id: 'about', label: 'About' },
          ].map(tab => (
            <button key={tab.id}
              className={`${styles.tab} ${settingsTab === tab.id ? styles.tabActive : ''}`}
              style={tab.id === 'danger' ? { color: settingsTab === 'danger' ? 'var(--red)' : 'var(--text-muted)' } : {}}
              onClick={() => setSettingsTabState(tab.id)}>{tab.label}</button>
          ))}
        </div>

        {/* General */}
        {settingsTab === 'general' && (
          <div className={styles.section}>
            <h2>Appearance</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', minWidth: 80 }}>Theme</span>
              <button
                className={`${styles.btn} ${theme === 'dark' ? styles.btnPrimary : ''}`}
                onClick={() => setTheme('dark')}
                style={{ fontSize: '0.8rem' }}>
                🌙 Dark
              </button>
              <button
                className={`${styles.btn} ${theme === 'light' ? styles.btnPrimary : ''}`}
                onClick={() => setTheme('light')}
                style={{ fontSize: '0.8rem' }}>
                ☀️ Light
              </button>
            </div>
            <h2 style={{ marginTop: '2rem' }}>Discount Rate</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Used for eNPV calculations across the portfolio. Default is 10%.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Rate:</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
                {((portfolio?.discount_rate || 0.1) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* Portfolio */}
        {settingsTab === 'portfolio' && (
          <div className={styles.section}>
            <h2>Export</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Export the current portfolio to Captario JSON format for simulation.
            </p>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={exportCaptario}
              disabled={loading || !portfolio?.projects?.length}>
              Export Portfolio to Captario
            </button>

            <h2 style={{ marginTop: '2rem' }}>Portfolio Info</h2>
            {portfolio ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Name</span>
                <span style={{ color: 'var(--text)' }}>{portfolio.name}</span>
                <span style={{ color: 'var(--text-dim)' }}>Projects</span>
                <span style={{ color: 'var(--text)' }}>{portfolio.projects?.length || 0}</span>
                <span style={{ color: 'var(--text-dim)' }}>Discount rate</span>
                <span style={{ color: 'var(--text)' }}>{((portfolio.discount_rate || 0.1) * 100).toFixed(0)}%</span>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No portfolio selected</p>
            )}
          </div>
        )}

        {/* Danger Zone */}
        {settingsTab === 'danger' && (
          <div className={styles.section} style={{ border: '1px solid var(--red)', borderRadius: '0.625rem', padding: '1.5rem' }}>
            <h2 style={{ color: 'var(--red)', marginBottom: '0.5rem' }}>Danger Zone</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              These actions are <strong>destructive and irreversible</strong>. They will wipe all existing data including projects, portfolios, audit logs, and snapshots, and replace with fresh seed data.
            </p>
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => {
              if (window.confirm('This will DELETE all data and reseed with the Titan portfolio. Are you sure?')) {
                seedData()
              }
            }} disabled={loading}>
              {loading ? 'Seeding...' : 'Reset & Seed Titan Data'}
            </button>
          </div>
        )}

        {/* About */}
        {settingsTab === 'about' && (
          <div className={styles.section}>
            <h2>Application</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Name</span>
              <span style={{ color: 'var(--text)' }}>Portfolio Manager (PPM)</span>
              <span style={{ color: 'var(--text-dim)' }}>Version</span>
              <span style={{ color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}>{APP_VERSION}</span>
              <span style={{ color: 'var(--text-dim)' }}>Built</span>
              <span style={{ color: 'var(--text)' }}>{new Date(BUILD_DATE).toLocaleString()}</span>
              <span style={{ color: 'var(--text-dim)' }}>Environment</span>
              <span style={{ color: 'var(--text)' }}>{typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'Development (localhost)' : 'Production'}</span>
              <span style={{ color: 'var(--text-dim)' }}>Database</span>
              <span style={{ color: 'var(--text)' }}>SQLite (local)</span>
            </div>

            <h2 style={{ marginTop: '2rem' }}>Powered by</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Next.js 14 · React 18 · SQLite · Captario SUM integration
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
              Built with Claude · Claudeworks
            </p>
          </div>
        )}
      </div>
    )
  }

  // ── Project Detail View ──
  if (view === 'project' && selectedProject) {
    const projFinancials = computeProjectFinancials(selectedProject, portfolio?.discount_rate || 0.1)
    const projEnpv = projFinancials ? projFinancials.npv : 0
    const projCumPos = projFinancials ? projFinancials.cumPos : getCumulativePos(selectedProject.phases || [])
    const projLaunch = projFinancials ? projFinancials.launch : getLaunchDate(selectedProject)
    const projEnpvPos = projFinancials ? projFinancials.launchNPV : 0
    const projRemCost = getTotalRemainingCost(selectedProject)

    return (
      <div className={`${styles.container} ${theme === 'light' ? styles.light : ''}`}>
        {/* Sticky: header + KPI metrics + tab bar */}
        <div className={styles.stickyTop}>
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <h1>{selectedProject.name}
                <span className={styles.badge} style={{
                  background: (PHASE_BADGE_STYLES[selectedProject.current_phase] || {}).bg,
                  color: (PHASE_BADGE_STYLES[selectedProject.current_phase] || {}).color,
                  marginLeft: '0.75rem', verticalAlign: 'middle'
                }}>{selectedProject.current_phase}</span>
              </h1>
              <p>{selectedProject.ta} · {selectedProject.modality} · {selectedProject.source} · {selectedProject.indication || ''}</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.themeToggle} onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              <button className={styles.backBtn} onClick={handleBack}>← Back</button>
            </div>
          </div>

          {/* KPI Metrics Row */}
          <div className={styles.summaryGrid} style={{ marginBottom: 0 }}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue} style={{ color: projEnpv >= 0 ? 'var(--green)' : 'var(--red)' }}>${projEnpv.toFixed(0)}M</div>
              <div className={styles.summaryLabel}>eNPV</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue} style={{ color: 'var(--green)' }}>${projEnpvPos.toFixed(0)}M</div>
              <div className={styles.summaryLabel}>eNPV+</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue} style={{ color: 'var(--red)' }}>-${projRemCost.toFixed(0)}M</div>
              <div className={styles.summaryLabel}>eNPV−</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue} style={{ color: 'var(--accent)' }}>{(projCumPos * 100).toFixed(1)}%</div>
              <div className={styles.summaryLabel}>P(Launch)</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue} style={{ color: 'var(--cyan)' }}>{projLaunch ? Math.floor(projLaunch) : 'N/A'}</div>
              <div className={styles.summaryLabel}>Exp. Launch</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue} style={{ color: 'var(--yellow)' }}>${(selectedProject.peak_year_sales || 0).toFixed(0)}M</div>
              <div className={styles.summaryLabel}>Peak Revenue</div>
            </div>
          </div>

          <ProjectDetailTabs project={selectedProject} onTabChange={setProjectTab} currentTab={projectTab} />
        </div>{/* end stickyTop */}

        {projectTab === 'detail' && (
          <ProjectInputForm
            project={selectedProject}
            canAdvance={canAdvance}
            onAdvance={() => setShowAdvancePhase(true)}
            onUpdateField={updateField}
            onUpdatePhaseField={updatePhaseField}
          />
        )}

        {projectTab === 'cashflow' && (
          <ProjectCashFlowTab project={selectedProject} discountRate={portfolio?.discount_rate || 0.1} />
        )}

        {projectTab === 'pnl' && (
          <ProjectPLTab project={selectedProject} discountRate={portfolio?.discount_rate || 0.1} />
        )}

        {projectTab === 'tree' && (
          <DecisionTreeTab project={selectedProject} discountRate={portfolio?.discount_rate || 0.1} />
        )}

        {projectTab === 'snapshots' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>Create & Manage Snapshots</h3>
              <SnapshotPanel entityType="project" entityId={selectedProject.id} entityName={selectedProject.name}
                inline />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>Compare Snapshots</h3>
              <SnapshotDiffTab project={selectedProject} />
            </div>
          </div>
        )}

        {projectTab === 'history' && (
          <HistoryTab entityType="project" entityId={selectedProject.id} />
        )}

        {projectTab === 'audit' && (
          <AuditTrailTab entityType="project" entityId={selectedProject.id} />
        )}

        {/* Modals */}
        {showAdvancePhase && (
          <AdvancePhaseModal project={selectedProject}
            onClose={() => setShowAdvancePhase(false)}
            onAdvanced={async (updated) => {
              setSelectedProject(updated)
              if (portfolio) {
                setPortfolio(prev => ({ ...prev, projects: prev.projects.map(p => p.id === updated.id ? updated : p) }))
              }
            }} />
        )}

        {showSnapshot && (
          <SnapshotPanel entityType={showSnapshot.type} entityId={showSnapshot.id} entityName={showSnapshot.name}
            onClose={() => setShowSnapshot(null)} />
        )}

        {error && <div className={styles.error}>{error}</div>}
      </div>
    )
  }

  // ── Portfolio View ──
  return (
    <div className={`${styles.container} ${theme === 'light' ? styles.light : ''}`}>
      {/* Single sticky section: header + selector + (when portfolio: KPIs + tabs) */}
      <div className={styles.stickyTop}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1>Portfolio Manager <span style={{ fontSize: '0.6em', fontWeight: 400, color: 'var(--text-muted)' }}>v{APP_VERSION}</span></h1>
            <p>{allProjects.length} projects · {portfolios.length} portfolios</p>
          </div>
          <div className={styles.headerActions}>
            <ChatPanel
              isOpen={chatOpen}
              onToggle={() => setChatOpen(!chatOpen)}
              onDataChanged={async () => {
                await Promise.all([loadPortfolios(), loadAllProjects()])
                if (selectedPortfolioId) await loadPortfolio(selectedPortfolioId)
              }}
            />
            <button className={styles.themeToggle} onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button className={styles.btn} onClick={() => setView('settings')}>⚙ Settings</button>
            <button className={styles.btn} onClick={() => {
              const el = document.documentElement
              if (document.fullscreenElement) document.exitFullscreen?.()
              else el.requestFullscreen?.()
            }} title="Toggle fullscreen" style={{ fontSize: '1.1rem', padding: '0.4rem 0.6rem' }}>⛶</button>
          </div>
        </div>

        {/* Portfolio Selector */}
        <div className={styles.portfolioSelector}>
          <select value={selectedPortfolioId || ''} onChange={e => setSelectedPortfolioId(e.target.value)}>
            <option value="" disabled>Select portfolio...</option>
            {portfolios.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.project_count} projects)</option>
            ))}
          </select>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowCreatePortfolio(true)}>+ New Portfolio</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowCreateProject(true)}>+ New Project</button>
          {portfolio && <button className={styles.btn} onClick={() => setShowManageProjects(true)}>Manage Projects</button>}
          {portfolio && (
            <button className={styles.btn} onClick={() => setShowSnapshot({ type: 'portfolio', id: portfolio.id, name: portfolio.name })}>
              📸 Snapshot
            </button>
          )}
          {portfolio && (
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={exportCaptario} disabled={loading || !portfolio.projects?.length}>
              Export to Captario
            </button>
          )}
        </div>

        {/* KPI + Tab Bar (only when portfolio is loaded) */}
        {portfolio && (
          <>
            {/* Collapsible Summary Cards */}
            <div className={styles.kpiSection}>
              <button className={styles.kpiToggle} onClick={() => setKpiCollapsed(!kpiCollapsed)}
                title={kpiCollapsed ? 'Show KPIs' : 'Hide KPIs'}>
                {kpiCollapsed ? '▸ Show KPIs' : '▾ KPIs'}
              </button>
              {!kpiCollapsed && (
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: 'var(--green)' }}>{portfolio.projects?.length || 0}</div>
                    <div className={styles.summaryLabel}>Projects</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: 'var(--accent)' }}>
                      ${(portfolio.projects || []).reduce((s, p) => s + calculateSimpleEnpv(p, portfolio.discount_rate || 0.1).enpv, 0).toFixed(0)}M
                    </div>
                    <div className={styles.summaryLabel}>Portfolio eNPV</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: 'var(--yellow)' }}>
                      ${(portfolio.projects || []).reduce((s, p) => s + getTotalRemainingCost(p), 0).toFixed(0)}M
                    </div>
                    <div className={styles.summaryLabel}>Remaining Cost</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: 'var(--cyan)' }}>
                      {portfolio.projects?.length > 0
                        ? ((portfolio.projects.reduce((s, p) => s + getCumulativePos(p.phases || []), 0) / portfolio.projects.length) * 100).toFixed(0)
                        : 0}%
                    </div>
                    <div className={styles.summaryLabel}>Avg PoS to Launch</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: 'var(--green)' }}>
                      {(portfolio.projects || []).filter(p => getCumulativePos(p.phases || []) > 0.5).length}
                    </div>
                    <div className={styles.summaryLabel}>Expected Launches</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: 'var(--orange)' }}>
                      ${(portfolio.projects || []).reduce((s, p) => s + (p.peak_year_sales || 0), 0).toFixed(0)}M
                    </div>
                    <div className={styles.summaryLabel}>Total Peak Revenue</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: 'var(--accent)' }}>
                      ${portfolio.projects?.length > 0
                        ? ((portfolio.projects || []).reduce((s, p) => s + calculateSimpleEnpv(p, portfolio.discount_rate || 0.1).enpv, 0) / (portfolio.projects.length || 1)).toFixed(0)
                        : 0}M
                    </div>
                    <div className={styles.summaryLabel}>Avg eNPV per Project</div>
                  </div>
                </div>
              )}
            </div>

            {/* Tab Bar */}
            <div className={styles.tabBar}>
              {portfolioTabs.map(tab => (
                <button key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
              ))}
            </div>
          </>
        )}
      </div>{/* end stickyTop */}

      {/* No portfolio yet */}
      {!portfolio && portfolios.length === 0 && (
        <div className={styles.emptyState}>
          <h3>No portfolios yet</h3>
          <p>Create your first portfolio to get started.</p>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowCreatePortfolio(true)} style={{ marginTop: '1rem' }}>
            + New Portfolio
          </button>
        </div>
      )}

      {/* Portfolio content */}
      {portfolio && (
        <>

          {/* Tab Content */}
          {activeTab === 'table' && (
            <div className={styles.tableContainer}>
              <table className={styles.projectTable}>
                <thead>
                  <tr>
                    <th className={styles.sortable} onClick={() => {
                      if (sortCol === 'name') setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                      else { setSortCol('name'); setSortDir('asc') }
                    }}>
                      Name {sortCol === 'name' && <span className={styles.sortArrow}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                    <th className={styles.sortable} onClick={() => {
                      if (sortCol === 'phase') setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                      else { setSortCol('phase'); setSortDir('asc') }
                    }}>
                      Phase {sortCol === 'phase' && <span className={styles.sortArrow}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                    <th className={styles.sortable} onClick={() => {
                      if (sortCol === 'pos') setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                      else { setSortCol('pos'); setSortDir('asc') }
                    }}>
                      PoS {sortCol === 'pos' && <span className={styles.sortArrow}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                    <th>Process Start</th>
                    <th>Peak Sales ($M)</th>
                    <th className={styles.sortable} onClick={() => {
                      if (sortCol === 'enpv') setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                      else { setSortCol('enpv'); setSortDir('asc') }
                    }}>
                      eNPV ($M) {sortCol === 'enpv' && <span className={styles.sortArrow}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                    <th className={styles.sortable} onClick={() => {
                      if (sortCol === 'pLaunch') setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                      else { setSortCol('pLaunch'); setSortDir('asc') }
                    }}>
                      P(Launch) {sortCol === 'pLaunch' && <span className={styles.sortArrow}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                    <th>TA</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProjects.map((project, idx) => {
                    const cumPos = getCumulativePos(project.phases || [])
                    const enpv = calculateSimpleEnpv(project, portfolio.discount_rate || 0.1).enpv
                    return (
                      <tr key={project.id}
                        className={`${styles.projectRow} ${idx % 2 === 0 ? styles.rowEven : styles.rowOdd}`}
                        onClick={() => handleSelectProject(project)}>
                        <td className={styles.nameCell}>{project.name}</td>
                        <td>
                          <span className={styles.badge} style={{
                            background: (PHASE_BADGE_STYLES[project.current_phase] || {}).bg,
                            color: (PHASE_BADGE_STYLES[project.current_phase] || {}).color
                          }}>{project.current_phase}</span>
                        </td>
                        <td>{(cumPos * 100).toFixed(0)}%</td>
                        <td className={styles.dateCell}>{project.process_start_date ? decimalYearToDate(project.process_start_date) : 'N/A'}</td>
                        <td>{(project.peak_year_sales || 0).toFixed(0)}</td>
                        <td style={{ fontWeight: 700, color: enpv >= 0 ? 'var(--green)' : 'var(--red)' }}>${enpv.toFixed(0)}</td>
                        <td>
                          <div className={styles.probBar}>
                            <div className={styles.probBarTrack}>
                              <div className={styles.probBarFill} style={{ width: (cumPos * 100) + '%' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', minWidth: '2.5rem' }}>{(cumPos * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td>{project.ta || 'N/A'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'data' && portfolio.projects && (
            <SpreadsheetView
              projects={sortedProjects}
              onUpdateProjectField={updateProjectField}
              onUpdateProjectPhaseField={updateProjectPhaseField}
              onSelectProject={handleSelectProject}
            />
          )}

          {activeTab === 'bricks' && portfolio.projects && (
            <BricksTab projects={portfolio.projects} onSelectProject={handleSelectProject} />
          )}

          {activeTab === 'timeline' && portfolio.projects && (
            <TimelineTab projects={portfolio.projects} theme={theme} onSelectProject={handleSelectProject} />
          )}

          {activeTab === 'cash-flow' && portfolio.projects && (
            <CashFlowRevenueTab projects={portfolio.projects} discountRate={portfolio.discount_rate || 0.1} theme={theme} onSelectProject={handleSelectProject} />
          )}

          {activeTab === 'history' && portfolio && (
            <HistoryTab entityType="portfolio" entityId={portfolio.id} />
          )}

          {activeTab === 'audit' && portfolio && (
            <AuditTrailTab entityType="portfolio" entityId={portfolio.id} />
          )}
        </>
      )}

      {/* Modals */}
      {showCreateProject && (
        <CreateProjectModal onClose={() => setShowCreateProject(false)}
          hasPortfolio={!!portfolio}
          portfolioName={portfolio?.name || ''}
          onCreated={async (created, shouldAddToPortfolio) => {
            setShowCreateProject(false)
            await loadAllProjects()
            if (shouldAddToPortfolio && portfolio) {
              await fetch(`/api/ppm/portfolio/${portfolio.id}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: created.id })
              })
              await loadPortfolio(portfolio.id)
            }
          }} />
      )}

      {showCreatePortfolio && (
        <CreatePortfolioModal onClose={() => setShowCreatePortfolio(false)}
          onCreated={async (created) => {
            setShowCreatePortfolio(false)
            await loadPortfolios()
            setSelectedPortfolioId(created.id)
          }} />
      )}

      {showManageProjects && portfolio && (
        <ManageProjectsModal portfolio={portfolio} allProjects={allProjects}
          onClose={() => setShowManageProjects(false)}
          onChanged={async () => {
            await Promise.all([loadPortfolio(portfolio.id), loadAllProjects()])
          }} />
      )}

      {showSnapshot && (
        <SnapshotPanel entityType={showSnapshot.type} entityId={showSnapshot.id} entityName={showSnapshot.name}
          onClose={() => setShowSnapshot(null)} />
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}
