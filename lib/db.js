/**
 * Dual-mode database layer
 * - Local dev: SQLite via better-sqlite3 (zero setup, file-based)
 * - Production (Vercel): Neon Serverless Postgres via @neondatabase/serverless
 *
 * Detects mode via DATABASE_URL env var:
 *   - If set → Postgres
 *   - If missing → SQLite
 *
 * All exports are async functions. API routes must await them.
 */

const IS_POSTGRES = !!process.env.DATABASE_URL

// ============================================================================
// Backend-specific helpers
// ============================================================================

// SQLite helper — uses dynamic import() so Vercel's bundler never touches better-sqlite3.
// The import() is only evaluated at runtime when the function is actually called,
// which only happens when IS_POSTGRES is false (local dev).
let _sqliteDb = null
async function getSqliteDb() {
  if (_sqliteDb) return _sqliteDb
  const { getSqliteDb: initSqlite } = await import('./db-sqlite.js')
  _sqliteDb = initSqlite()
  return _sqliteDb
}

// Postgres query helper
async function pgQuery(text, params = []) {
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)
  // neon() returns a tagged template function, but we need parameterized queries
  // Use the query interface
  return sql(text, params)
}

// Convenience: run a query and return rows
async function pgAll(text, params = []) {
  return pgQuery(text, params)
}

async function pgGet(text, params = []) {
  const rows = await pgQuery(text, params)
  return rows[0] || null
}

async function pgRun(text, params = []) {
  return pgQuery(text, params)
}

// ============================================================================
// Schema initialization
// ============================================================================

const POSTGRES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    current_phase TEXT NOT NULL,
    process_start_date DOUBLE PRECISION,
    peak_year_sales DOUBLE PRECISION,
    time_to_peak_years DOUBLE PRECISION,
    cogs_rate DOUBLE PRECISION DEFAULT 0.05,
    ms_rate DOUBLE PRECISION DEFAULT 0.12,
    loe_year DOUBLE PRECISION,
    sales_after_loe DOUBLE PRECISION DEFAULT 0,
    cannibalization_factor DOUBLE PRECISION DEFAULT 0,
    ta TEXT,
    modality TEXT,
    source TEXT,
    indication TEXT,
    mode_of_action TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_phases (
    id SERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase TEXT NOT NULL,
    duration_months DOUBLE PRECISION,
    pos DOUBLE PRECISION,
    internal_cost DOUBLE PRECISION DEFAULT 0,
    external_cost DOUBLE PRECISION DEFAULT 0,
    is_actual INTEGER DEFAULT 0,
    actual_date TEXT,
    actual_cost DOUBLE PRECISION,
    start_delay_months DOUBLE PRECISION DEFAULT 0,
    milestone_payable DOUBLE PRECISION DEFAULT 0,
    milestone_receivable DOUBLE PRECISION DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id INTEGER,
    discount_rate DOUBLE PRECISION DEFAULT 0.1,
    tax_rate DOUBLE PRECISION DEFAULT 0.1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolio_projects (
    portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (portfolio_id, project_id)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    field TEXT,
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    changed_by INTEGER,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_snapshots (
    id SERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    snapshot_name TEXT NOT NULL,
    snapshot_data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id SERIAL PRIMARY KEY,
    portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    snapshot_name TEXT NOT NULL,
    snapshot_data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`

const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    current_phase TEXT NOT NULL,
    process_start_date REAL,
    peak_year_sales REAL,
    time_to_peak_years REAL,
    cogs_rate REAL DEFAULT 0.05,
    ms_rate REAL DEFAULT 0.12,
    loe_year REAL,
    sales_after_loe REAL DEFAULT 0,
    cannibalization_factor REAL DEFAULT 0,
    ta TEXT,
    modality TEXT,
    source TEXT,
    indication TEXT,
    mode_of_action TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    duration_months REAL,
    pos REAL,
    internal_cost REAL DEFAULT 0,
    external_cost REAL DEFAULT 0,
    is_actual INTEGER DEFAULT 0,
    actual_date TEXT,
    actual_cost REAL,
    start_delay_months REAL DEFAULT 0,
    milestone_payable REAL DEFAULT 0,
    milestone_receivable REAL DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id INTEGER,
    discount_rate REAL DEFAULT 0.1,
    tax_rate REAL DEFAULT 0.1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolio_projects (
    portfolio_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (portfolio_id, project_id),
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    field TEXT,
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    changed_by INTEGER,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    snapshot_name TEXT NOT NULL,
    snapshot_data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    snapshot_name TEXT NOT NULL,
    snapshot_data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
  );
`

let _sqliteInitialized = false
let _pgInitialized = false

export async function initializeDb() {
  if (IS_POSTGRES) {
    if (_pgInitialized) return
    _pgInitialized = true
    // Split schema into individual statements for Postgres
    const statements = POSTGRES_SCHEMA
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    for (const stmt of statements) {
      await pgRun(stmt)
    }
  } else {
    if (_sqliteInitialized) return
    _sqliteInitialized = true
    const db = (await getSqliteDb())
    db.exec(SQLITE_SCHEMA)

    // SQLite migrations for backwards compatibility
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name)

    if (tables.includes('audit_log')) {
      const auditCols = db.prepare("PRAGMA table_info(audit_log)").all()
      const hasOldSchema = auditCols.some(c => c.name === 'project_id') && !auditCols.some(c => c.name === 'entity_type')
      if (hasOldSchema) {
        db.exec('DROP TABLE audit_log')
        db.exec(SQLITE_SCHEMA.split(';').find(s => s.includes('audit_log')))
      }
    }

    // Migration: drop old portfolio_id column from projects
    const cols = db.prepare("PRAGMA table_info(projects)").all()
    if (cols.some(c => c.name === 'portfolio_id')) {
      try {
        db.exec(`INSERT OR IGNORE INTO portfolio_projects (portfolio_id, project_id) SELECT portfolio_id, id FROM projects WHERE portfolio_id IS NOT NULL`)
      } catch (e) { /* ok */ }
      try { db.exec('ALTER TABLE projects DROP COLUMN portfolio_id') } catch (e) { /* ok */ }
    }

    // Add missing columns
    const phaseCols = db.prepare("PRAGMA table_info(project_phases)").all()
    if (!phaseCols.some(c => c.name === 'actual_date')) {
      try { db.exec('ALTER TABLE project_phases ADD COLUMN actual_date TEXT') } catch (e) { /* ok */ }
    }
    if (!phaseCols.some(c => c.name === 'actual_cost')) {
      try { db.exec('ALTER TABLE project_phases ADD COLUMN actual_cost REAL') } catch (e) { /* ok */ }
    }
  }
}

// Ensure db is initialized before any operation
async function ensureDb() {
  await initializeDb()
}

// ============================================================================
// Audit Log
// ============================================================================

export async function logAudit(entityType, entityId, action, field, oldValue, newValue, details, userId) {
  await ensureDb()
  const now = new Date().toISOString()
  const ov = oldValue != null ? String(oldValue) : null
  const nv = newValue != null ? String(newValue) : null

  if (IS_POSTGRES) {
    await pgRun(
      `INSERT INTO audit_log (entity_type, entity_id, action, field, old_value, new_value, details, changed_by, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [entityType, entityId, action, field, ov, nv, details, userId, now]
    )
  } else {
    (await getSqliteDb()).prepare(
      `INSERT INTO audit_log (entity_type, entity_id, action, field, old_value, new_value, details, changed_by, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(entityType, entityId, action, field, ov, nv, details, userId, now)
  }
}

export async function getAuditLog(entityType, entityId, limit = 100) {
  await ensureDb()
  if (IS_POSTGRES) {
    return pgAll(
      `SELECT * FROM audit_log WHERE entity_type = $1 AND entity_id = $2 ORDER BY timestamp DESC LIMIT $3`,
      [entityType, entityId, limit]
    )
  } else {
    return (await getSqliteDb()).prepare(
      `SELECT * FROM audit_log WHERE entity_type = ? AND entity_id = ? ORDER BY timestamp DESC LIMIT ?`
    ).all(entityType, entityId, limit)
  }
}

export async function getProjectAuditLog(projectId, limit = 100) {
  return getAuditLog('project', projectId, limit)
}

export async function getPortfolioAuditLog(portfolioId, limit = 100) {
  await ensureDb()
  if (IS_POSTGRES) {
    return pgAll(
      `SELECT * FROM audit_log
       WHERE (entity_type = 'portfolio' AND entity_id = $1)
          OR (entity_type = 'portfolio_membership' AND entity_id = $2)
       ORDER BY timestamp DESC LIMIT $3`,
      [portfolioId, portfolioId, limit]
    )
  } else {
    return (await getSqliteDb()).prepare(
      `SELECT * FROM audit_log
       WHERE (entity_type = 'portfolio' AND entity_id = ?)
          OR (entity_type = 'portfolio_membership' AND entity_id = ?)
       ORDER BY timestamp DESC LIMIT ?`
    ).all(portfolioId, portfolioId, limit)
  }
}

// ============================================================================
// Project Functions
// ============================================================================

export async function getProject(projectId) {
  await ensureDb()
  let project, phases

  if (IS_POSTGRES) {
    project = await pgGet(`SELECT * FROM projects WHERE id = $1`, [projectId])
    if (!project) return null
    phases = await pgAll(`SELECT * FROM project_phases WHERE project_id = $1 ORDER BY id`, [projectId])
  } else {
    project = (await getSqliteDb()).prepare('SELECT * FROM projects WHERE id = ?').get(projectId)
    if (!project) return null
    phases = (await getSqliteDb()).prepare('SELECT * FROM project_phases WHERE project_id = ? ORDER BY ROWID').all(projectId)
  }

  return { ...project, phases }
}

export async function getAllProjects() {
  await ensureDb()
  let projects

  if (IS_POSTGRES) {
    projects = await pgAll(`
      SELECT p.*,
             (SELECT COALESCE(SUM(internal_cost + external_cost), 0) FROM project_phases WHERE project_id = p.id) as total_cost
      FROM projects p
      ORDER BY p.name
    `)
    // Attach phases to each project
    for (const p of projects) {
      p.phases = await pgAll(`SELECT * FROM project_phases WHERE project_id = $1 ORDER BY id`, [p.id])
    }
  } else {
    projects = (await getSqliteDb()).prepare(`
      SELECT p.*,
             (SELECT COALESCE(SUM(internal_cost + external_cost), 0) FROM project_phases WHERE project_id = p.id) as total_cost
      FROM projects p
      ORDER BY p.name
    `).all()
    projects = projects.map(p => ({
      ...p,
      phases: (await getSqliteDb()).prepare('SELECT * FROM project_phases WHERE project_id = ? ORDER BY ROWID').all(p.id)
    }))
  }

  return projects
}

export async function createProject(data) {
  await ensureDb()
  const {
    id, name, currentPhase, processStartDate,
    peakYearSales, timeToPeakYears, cogsRate, msRate, loeYear,
    salesAfterLoe = 0, cannibalizationFactor = 0,
    ta, modality, source, indication, modeOfAction,
    phases
  } = data

  const now = new Date().toISOString()

  if (IS_POSTGRES) {
    await pgRun(
      `INSERT INTO projects
       (id, name, current_phase, process_start_date, peak_year_sales,
        time_to_peak_years, cogs_rate, ms_rate, loe_year, sales_after_loe,
        cannibalization_factor, ta, modality, source, indication, mode_of_action,
        created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [id, name, currentPhase, processStartDate,
       peakYearSales, timeToPeakYears, cogsRate, msRate, loeYear,
       salesAfterLoe, cannibalizationFactor,
       ta, modality, source, indication, modeOfAction,
       now, now]
    )
  } else {
    (await getSqliteDb()).prepare(
      `INSERT INTO projects
       (id, name, current_phase, process_start_date, peak_year_sales,
        time_to_peak_years, cogs_rate, ms_rate, loe_year, sales_after_loe,
        cannibalization_factor, ta, modality, source, indication, mode_of_action,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, currentPhase, processStartDate,
      peakYearSales, timeToPeakYears, cogsRate, msRate, loeYear,
      salesAfterLoe, cannibalizationFactor,
      ta, modality, source, indication, modeOfAction,
      now, now)
  }

  // Create phases if provided
  if (phases && Array.isArray(phases)) {
    for (const ph of phases) {
      await addPhase(id, ph.phase, ph.duration_months, ph.pos,
        ph.internal_cost || 0, ph.external_cost || 0, ph.is_actual || 0)
    }
  }

  await logAudit('project', id, 'created', null, null, null, `Project "${name}" created`, null)
  return getProject(id)
}

export async function updateProjectField(projectId, field, value, userId = null) {
  await ensureDb()
  const project = await getProject(projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const now = new Date().toISOString()

  const fieldMap = {
    name: 'name', currentPhase: 'current_phase', processStartDate: 'process_start_date',
    peakYearSales: 'peak_year_sales', timeToPeakYears: 'time_to_peak_years',
    cogsRate: 'cogs_rate', msRate: 'ms_rate', loeYear: 'loe_year',
    salesAfterLoe: 'sales_after_loe', cannibalizationFactor: 'cannibalization_factor',
    ta: 'ta', modality: 'modality', source: 'source',
    indication: 'indication', modeOfAction: 'mode_of_action'
  }

  const dbField = fieldMap[field]
  if (!dbField) throw new Error(`Unknown field: ${field}`)

  const oldValue = project[dbField]

  if (IS_POSTGRES) {
    await pgRun(`UPDATE projects SET ${dbField} = $1, updated_at = $2 WHERE id = $3`, [value, now, projectId])
  } else {
    (await getSqliteDb()).prepare(`UPDATE projects SET ${dbField} = ?, updated_at = ? WHERE id = ?`).run(value, now, projectId)
  }

  await logAudit('project', projectId, 'updated', field, oldValue, value, null, userId)
  return getProject(projectId)
}

export async function deleteProject(projectId) {
  await ensureDb()
  const project = await getProject(projectId)
  if (!project) return

  if (IS_POSTGRES) {
    await pgRun(`DELETE FROM portfolio_projects WHERE project_id = $1`, [projectId])
    await pgRun(`DELETE FROM project_phases WHERE project_id = $1`, [projectId])
    await pgRun(`DELETE FROM project_snapshots WHERE project_id = $1`, [projectId])
    await pgRun(`DELETE FROM projects WHERE id = $1`, [projectId])
  } else {
    const db = (await getSqliteDb())
    db.prepare('DELETE FROM portfolio_projects WHERE project_id = ?').run(projectId)
    db.prepare('DELETE FROM project_phases WHERE project_id = ?').run(projectId)
    db.prepare('DELETE FROM project_snapshots WHERE project_id = ?').run(projectId)
    db.prepare('DELETE FROM projects WHERE id = ?').run(projectId)
  }

  await logAudit('project', projectId, 'deleted', null, null, null, `Project "${project.name}" deleted`, null)
}

// ============================================================================
// Phase Functions
// ============================================================================

export async function addPhase(projectId, phase, durationMonths, pos, internalCost, externalCost, isActual = 0) {
  await ensureDb()
  if (IS_POSTGRES) {
    await pgRun(
      `INSERT INTO project_phases (project_id, phase, duration_months, pos, internal_cost, external_cost, is_actual)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [projectId, phase, durationMonths, pos, internalCost, externalCost, isActual]
    )
  } else {
    (await getSqliteDb()).prepare(
      `INSERT INTO project_phases (project_id, phase, duration_months, pos, internal_cost, external_cost, is_actual)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(projectId, phase, durationMonths, pos, internalCost, externalCost, isActual)
  }
}

export async function updatePhaseField(phaseId, field, value, userId = null) {
  await ensureDb()
  let phase

  if (IS_POSTGRES) {
    phase = await pgGet(`SELECT * FROM project_phases WHERE id = $1`, [phaseId])
  } else {
    phase = (await getSqliteDb()).prepare('SELECT * FROM project_phases WHERE id = ?').get(phaseId)
  }
  if (!phase) throw new Error(`Phase ${phaseId} not found`)

  const fieldMap = {
    durationMonths: 'duration_months', pos: 'pos',
    internalCost: 'internal_cost', externalCost: 'external_cost',
    isActual: 'is_actual', startDelayMonths: 'start_delay_months',
    milestonePayable: 'milestone_payable', milestoneReceivable: 'milestone_receivable',
    actualDate: 'actual_date', actualCost: 'actual_cost'
  }

  const dbField = fieldMap[field]
  if (!dbField) throw new Error(`Unknown field: ${field}`)

  const oldValue = phase[dbField]

  if (IS_POSTGRES) {
    await pgRun(`UPDATE project_phases SET ${dbField} = $1 WHERE id = $2`, [value, phaseId])
  } else {
    (await getSqliteDb()).prepare(`UPDATE project_phases SET ${dbField} = ? WHERE id = ?`).run(value, phaseId)
  }

  await logAudit('project', phase.project_id, 'phase_updated', `phase.${phase.phase}.${field}`, oldValue, value, null, userId)

  if (IS_POSTGRES) {
    return pgGet(`SELECT * FROM project_phases WHERE id = $1`, [phaseId])
  } else {
    return (await getSqliteDb()).prepare('SELECT * FROM project_phases WHERE id = ?').get(phaseId)
  }
}

export async function getPhasesForProject(projectId) {
  await ensureDb()
  if (IS_POSTGRES) {
    return pgAll(`SELECT * FROM project_phases WHERE project_id = $1 ORDER BY id`, [projectId])
  } else {
    return (await getSqliteDb()).prepare('SELECT * FROM project_phases WHERE project_id = ? ORDER BY ROWID').all(projectId)
  }
}

export async function advanceProjectPhase(projectId, actualDate, actualCost, userId = null) {
  await ensureDb()
  const project = await getProject(projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const PHASE_ORDER = ['PC', 'PH1', 'PH2', 'PH3', 'REG', 'MARKET']
  const currentIdx = PHASE_ORDER.indexOf(project.current_phase)
  if (currentIdx === -1 || currentIdx >= PHASE_ORDER.length - 1) {
    throw new Error(`Cannot advance from ${project.current_phase}`)
  }

  const nextPhase = PHASE_ORDER[currentIdx + 1]
  const now = new Date().toISOString()

  const currentPhaseRow = project.phases.find(p => p.phase === project.current_phase)
  if (currentPhaseRow) {
    if (IS_POSTGRES) {
      await pgRun(
        `UPDATE project_phases SET is_actual = 1, actual_date = $1, actual_cost = $2 WHERE id = $3`,
        [actualDate, actualCost, currentPhaseRow.id]
      )
    } else {
      (await getSqliteDb()).prepare(`UPDATE project_phases SET is_actual = 1, actual_date = ?, actual_cost = ? WHERE id = ?`)
        .run(actualDate, actualCost, currentPhaseRow.id)
    }
  }

  if (IS_POSTGRES) {
    await pgRun(`UPDATE projects SET current_phase = $1, updated_at = $2 WHERE id = $3`, [nextPhase, now, projectId])
  } else {
    (await getSqliteDb()).prepare(`UPDATE projects SET current_phase = ?, updated_at = ? WHERE id = ?`)
      .run(nextPhase, now, projectId)
  }

  await logAudit('project', projectId, 'phase_advanced',
    'current_phase', project.current_phase, nextPhase,
    `Advanced from ${project.current_phase} to ${nextPhase}. Actual date: ${actualDate}, Actual cost: ${actualCost}`,
    userId)

  return getProject(projectId)
}

// ============================================================================
// Portfolio Functions
// ============================================================================

export async function getPortfolios() {
  await ensureDb()
  if (IS_POSTGRES) {
    const portfolios = await pgAll(`SELECT * FROM portfolios ORDER BY name`)
    for (const p of portfolios) {
      const cnt = await pgGet(`SELECT COUNT(*) as cnt FROM portfolio_projects WHERE portfolio_id = $1`, [p.id])
      p.project_count = parseInt(cnt?.cnt || 0)
    }
    return portfolios
  } else {
    const portfolios = (await getSqliteDb()).prepare('SELECT * FROM portfolios ORDER BY name').all()
    return portfolios.map(p => {
      const projectCount = (await getSqliteDb()).prepare('SELECT COUNT(*) as cnt FROM portfolio_projects WHERE portfolio_id = ?').get(p.id)
      return { ...p, project_count: projectCount.cnt }
    })
  }
}

export async function getPortfolio(id) {
  await ensureDb()
  let portfolio, projects

  if (IS_POSTGRES) {
    portfolio = await pgGet(`SELECT * FROM portfolios WHERE id = $1`, [id])
    if (!portfolio) return null

    projects = await pgAll(`
      SELECT p.*,
             (SELECT COALESCE(SUM(internal_cost + external_cost), 0) FROM project_phases WHERE project_id = p.id) as total_cost
      FROM projects p
      INNER JOIN portfolio_projects pp ON pp.project_id = p.id
      WHERE pp.portfolio_id = $1
      ORDER BY p.name
    `, [id])

    for (const project of projects) {
      project.phases = await pgAll(`SELECT * FROM project_phases WHERE project_id = $1 ORDER BY id`, [project.id])
    }
  } else {
    portfolio = (await getSqliteDb()).prepare('SELECT * FROM portfolios WHERE id = ?').get(id)
    if (!portfolio) return null

    projects = (await getSqliteDb()).prepare(`
      SELECT p.*,
             (SELECT COALESCE(SUM(internal_cost + external_cost), 0) FROM project_phases WHERE project_id = p.id) as total_cost
      FROM projects p
      INNER JOIN portfolio_projects pp ON pp.project_id = p.id
      WHERE pp.portfolio_id = ?
      ORDER BY p.name
    `).all(id)

    projects = projects.map(project => ({
      ...project,
      phases: (await getSqliteDb()).prepare('SELECT * FROM project_phases WHERE project_id = ? ORDER BY ROWID').all(project.id)
    }))
  }

  return { ...portfolio, projects }
}

export async function createPortfolio(id, name, ownerId, discountRate = 0.1, taxRate = 0.1) {
  await ensureDb()
  const now = new Date().toISOString()

  if (IS_POSTGRES) {
    await pgRun(
      `INSERT INTO portfolios (id, name, owner_id, discount_rate, tax_rate, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name, ownerId, discountRate, taxRate, now, now]
    )
  } else {
    (await getSqliteDb()).prepare(
      `INSERT INTO portfolios (id, name, owner_id, discount_rate, tax_rate, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, ownerId, discountRate, taxRate, now, now)
  }

  await logAudit('portfolio', id, 'created', null, null, null, `Portfolio "${name}" created`, null)
  return getPortfolio(id)
}

export async function updatePortfolio(id, fields, userId = null) {
  await ensureDb()
  let portfolio

  if (IS_POSTGRES) {
    portfolio = await pgGet(`SELECT * FROM portfolios WHERE id = $1`, [id])
  } else {
    portfolio = (await getSqliteDb()).prepare('SELECT * FROM portfolios WHERE id = ?').get(id)
  }
  if (!portfolio) throw new Error(`Portfolio ${id} not found`)

  const now = new Date().toISOString()
  const allowed = { name: 'name', discountRate: 'discount_rate', taxRate: 'tax_rate' }

  for (const [key, value] of Object.entries(fields)) {
    const dbField = allowed[key]
    if (!dbField) continue
    const oldVal = portfolio[dbField]

    if (IS_POSTGRES) {
      await pgRun(`UPDATE portfolios SET ${dbField} = $1, updated_at = $2 WHERE id = $3`, [value, now, id])
    } else {
      (await getSqliteDb()).prepare(`UPDATE portfolios SET ${dbField} = ?, updated_at = ? WHERE id = ?`).run(value, now, id)
    }
    await logAudit('portfolio', id, 'updated', key, oldVal, value, null, userId)
  }

  return getPortfolio(id)
}

export async function deletePortfolio(id) {
  await ensureDb()
  let portfolio

  if (IS_POSTGRES) {
    portfolio = await pgGet(`SELECT * FROM portfolios WHERE id = $1`, [id])
    if (!portfolio) return
    await pgRun(`DELETE FROM portfolio_projects WHERE portfolio_id = $1`, [id])
    await pgRun(`DELETE FROM portfolio_snapshots WHERE portfolio_id = $1`, [id])
    await pgRun(`DELETE FROM portfolios WHERE id = $1`, [id])
  } else {
    portfolio = (await getSqliteDb()).prepare('SELECT * FROM portfolios WHERE id = ?').get(id)
    if (!portfolio) return
    (await getSqliteDb()).prepare('DELETE FROM portfolio_projects WHERE portfolio_id = ?').run(id)
    (await getSqliteDb()).prepare('DELETE FROM portfolio_snapshots WHERE portfolio_id = ?').run(id)
    (await getSqliteDb()).prepare('DELETE FROM portfolios WHERE id = ?').run(id)
  }

  await logAudit('portfolio', id, 'deleted', null, null, null, `Portfolio "${portfolio.name}" deleted`, null)
}

export async function addProjectToPortfolio(portfolioId, projectId, userId = null) {
  await ensureDb()
  const now = new Date().toISOString()

  try {
    if (IS_POSTGRES) {
      await pgRun(
        `INSERT INTO portfolio_projects (portfolio_id, project_id, added_at) VALUES ($1, $2, $3)
         ON CONFLICT (portfolio_id, project_id) DO NOTHING`,
        [portfolioId, projectId, now]
      )
    } else {
      (await getSqliteDb()).prepare('INSERT INTO portfolio_projects (portfolio_id, project_id, added_at) VALUES (?, ?, ?)')
        .run(portfolioId, projectId, now)
    }
  } catch (e) {
    if (e.message?.includes('UNIQUE constraint')) return
    throw e
  }

  let project
  if (IS_POSTGRES) {
    project = await pgGet(`SELECT name, current_phase FROM projects WHERE id = $1`, [projectId])
  } else {
    project = (await getSqliteDb()).prepare('SELECT name, current_phase FROM projects WHERE id = ?').get(projectId)
  }

  await logAudit('portfolio_membership', portfolioId, 'project_added', null, null, projectId,
    `Added project "${project?.name}" (${project?.current_phase})`, userId)
}

export async function removeProjectFromPortfolio(portfolioId, projectId, userId = null) {
  await ensureDb()
  let project

  if (IS_POSTGRES) {
    project = await pgGet(`SELECT name, current_phase FROM projects WHERE id = $1`, [projectId])
    await pgRun(`DELETE FROM portfolio_projects WHERE portfolio_id = $1 AND project_id = $2`, [portfolioId, projectId])
  } else {
    project = (await getSqliteDb()).prepare('SELECT name, current_phase FROM projects WHERE id = ?').get(projectId)
    (await getSqliteDb()).prepare('DELETE FROM portfolio_projects WHERE portfolio_id = ? AND project_id = ?').run(portfolioId, projectId)
  }

  await logAudit('portfolio_membership', portfolioId, 'project_removed', null, projectId, null,
    `Removed project "${project?.name}" (${project?.current_phase})`, userId)
}

export async function getProjectsForPortfolio(portfolioId) {
  await ensureDb()
  if (IS_POSTGRES) {
    return pgAll(`
      SELECT p.*,
             (SELECT COALESCE(SUM(internal_cost + external_cost), 0) FROM project_phases WHERE project_id = p.id) as total_cost
      FROM projects p
      INNER JOIN portfolio_projects pp ON pp.project_id = p.id
      WHERE pp.portfolio_id = $1
      ORDER BY p.name
    `, [portfolioId])
  } else {
    return (await getSqliteDb()).prepare(`
      SELECT p.*,
             (SELECT COALESCE(SUM(internal_cost + external_cost), 0) FROM project_phases WHERE project_id = p.id) as total_cost
      FROM projects p
      INNER JOIN portfolio_projects pp ON pp.project_id = p.id
      WHERE pp.portfolio_id = ?
      ORDER BY p.name
    `).all(portfolioId)
  }
}

// ============================================================================
// Snapshot Functions
// ============================================================================

export async function createProjectSnapshot(projectId, snapshotName, userId = null) {
  await ensureDb()
  const project = await getProject(projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const now = new Date().toISOString()
  const snapshotData = JSON.stringify(project)
  let id

  if (IS_POSTGRES) {
    const result = await pgGet(
      `INSERT INTO project_snapshots (project_id, snapshot_name, snapshot_data, created_at)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [projectId, snapshotName, snapshotData, now]
    )
    id = result.id
  } else {
    const result = (await getSqliteDb()).prepare(
      `INSERT INTO project_snapshots (project_id, snapshot_name, snapshot_data, created_at) VALUES (?, ?, ?, ?)`
    ).run(projectId, snapshotName, snapshotData, now)
    id = result.lastInsertRowid
  }

  await logAudit('project', projectId, 'snapshot_created', null, null, snapshotName,
    `Snapshot "${snapshotName}" created`, userId)

  return { id, project_id: projectId, snapshot_name: snapshotName, created_at: now }
}

export async function getProjectSnapshots(projectId) {
  await ensureDb()
  if (IS_POSTGRES) {
    return pgAll(
      `SELECT id, project_id, snapshot_name, created_at FROM project_snapshots WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    )
  } else {
    return (await getSqliteDb()).prepare(
      'SELECT id, project_id, snapshot_name, created_at FROM project_snapshots WHERE project_id = ? ORDER BY created_at DESC'
    ).all(projectId)
  }
}

export async function getProjectSnapshot(snapshotId) {
  await ensureDb()
  let row

  if (IS_POSTGRES) {
    row = await pgGet(`SELECT * FROM project_snapshots WHERE id = $1`, [snapshotId])
  } else {
    row = (await getSqliteDb()).prepare('SELECT * FROM project_snapshots WHERE id = ?').get(snapshotId)
  }

  if (!row) return null
  return { ...row, snapshot_data: JSON.parse(row.snapshot_data) }
}

export async function createPortfolioSnapshot(portfolioId, snapshotName, userId = null) {
  await ensureDb()
  const portfolio = await getPortfolio(portfolioId)
  if (!portfolio) throw new Error(`Portfolio ${portfolioId} not found`)

  const now = new Date().toISOString()
  const snapshotData = JSON.stringify(portfolio)
  let id

  if (IS_POSTGRES) {
    const result = await pgGet(
      `INSERT INTO portfolio_snapshots (portfolio_id, snapshot_name, snapshot_data, created_at)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [portfolioId, snapshotName, snapshotData, now]
    )
    id = result.id
  } else {
    const result = (await getSqliteDb()).prepare(
      `INSERT INTO portfolio_snapshots (portfolio_id, snapshot_name, snapshot_data, created_at) VALUES (?, ?, ?, ?)`
    ).run(portfolioId, snapshotName, snapshotData, now)
    id = result.lastInsertRowid
  }

  await logAudit('portfolio', portfolioId, 'snapshot_created', null, null, snapshotName,
    `Snapshot "${snapshotName}" created`, userId)

  return { id, portfolio_id: portfolioId, snapshot_name: snapshotName, created_at: now }
}

export async function getPortfolioSnapshots(portfolioId) {
  await ensureDb()
  if (IS_POSTGRES) {
    return pgAll(
      `SELECT id, portfolio_id, snapshot_name, created_at FROM portfolio_snapshots WHERE portfolio_id = $1 ORDER BY created_at DESC`,
      [portfolioId]
    )
  } else {
    return (await getSqliteDb()).prepare(
      'SELECT id, portfolio_id, snapshot_name, created_at FROM portfolio_snapshots WHERE portfolio_id = ? ORDER BY created_at DESC'
    ).all(portfolioId)
  }
}

export async function getPortfolioSnapshot(snapshotId) {
  await ensureDb()
  let row

  if (IS_POSTGRES) {
    row = await pgGet(`SELECT * FROM portfolio_snapshots WHERE id = $1`, [snapshotId])
  } else {
    row = (await getSqliteDb()).prepare('SELECT * FROM portfolio_snapshots WHERE id = ?').get(snapshotId)
  }

  if (!row) return null
  return { ...row, snapshot_data: JSON.parse(row.snapshot_data) }
}

// ============================================================================
// Seed Helpers
// ============================================================================

export async function clearAllData() {
  await ensureDb()
  if (IS_POSTGRES) {
    await pgRun('DELETE FROM portfolio_projects')
    await pgRun('DELETE FROM project_phases')
    await pgRun('DELETE FROM project_snapshots')
    await pgRun('DELETE FROM portfolio_snapshots')
    await pgRun('DELETE FROM audit_log')
    await pgRun('DELETE FROM projects')
    await pgRun('DELETE FROM portfolios')
  } else {
    (await getSqliteDb()).exec(`
      DELETE FROM portfolio_projects;
      DELETE FROM project_phases;
      DELETE FROM project_snapshots;
      DELETE FROM portfolio_snapshots;
      DELETE FROM audit_log;
      DELETE FROM projects;
      DELETE FROM portfolios;
    `)
  }
}

// ============================================================================
// User Functions (kept for future use)
// ============================================================================

export async function createUser(email, password, name) {
  await ensureDb()
  const bcrypt = require('bcryptjs')
  const passwordHash = bcrypt.hashSync(password, 10)
  const now = new Date().toISOString()
  let id

  if (IS_POSTGRES) {
    const result = await pgGet(
      `INSERT INTO users (email, password_hash, name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [email, passwordHash, name, now, now]
    )
    id = result.id
  } else {
    const result = (await getSqliteDb()).prepare(
      `INSERT INTO users (email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
    ).run(email, passwordHash, name, now, now)
    id = result.lastInsertRowid
  }

  return { id, email, name, created_at: now }
}

export async function getUserByEmail(email) {
  await ensureDb()
  if (IS_POSTGRES) {
    return pgGet(`SELECT * FROM users WHERE email = $1`, [email])
  } else {
    return (await getSqliteDb()).prepare('SELECT * FROM users WHERE email = ?').get(email) || null
  }
}

export async function getUserById(id) {
  await ensureDb()
  if (IS_POSTGRES) {
    return pgGet(`SELECT id, email, name, created_at FROM users WHERE id = $1`, [id])
  } else {
    return (await getSqliteDb()).prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(id) || null
  }
}

export function verifyPassword(password, hash) {
  const bcrypt = require('bcryptjs')
  return bcrypt.compareSync(password, hash)
}
