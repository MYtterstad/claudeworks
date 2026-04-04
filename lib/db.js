import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

// Lazy database connection — avoids crashing at import time on Vercel
// where better-sqlite3 native module can't load during build
let _db = null

function getDb() {
  if (_db) return _db
  // Dynamic require — only loads better-sqlite3 when actually needed at runtime
  const Database = require('better-sqlite3')
  const dbPath = path.join(process.cwd(), 'data', 'claudeworks.db')
  // Ensure the data directory exists
  const dataDir = path.dirname(dbPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initializeDb()
  return _db
}

// Proxy that lazily initializes the database on first property access
export const db = new Proxy({}, {
  get(_, prop) {
    const instance = getDb()
    const val = instance[prop]
    // Bind methods to the db instance so they work correctly
    return typeof val === 'function' ? val.bind(instance) : val
  }
})

// Initialize database schema
export function initializeDb() {
  // Check if we need to migrate the audit_log from old schema
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name)

  if (tables.includes('audit_log')) {
    // Check if audit_log has old schema (project_id column instead of entity_type)
    const auditCols = db.prepare("PRAGMA table_info(audit_log)").all()
    const hasOldSchema = auditCols.some(c => c.name === 'project_id') && !auditCols.some(c => c.name === 'entity_type')
    if (hasOldSchema) {
      db.exec('DROP TABLE audit_log')
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Projects exist independently of portfolios (portfolio_id kept for backwards compat but unused)
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

    -- Portfolios are collections of projects (many-to-many)
    CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id INTEGER,
      discount_rate REAL DEFAULT 0.1,
      tax_rate REAL DEFAULT 0.1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Junction table: which projects belong to which portfolios
    CREATE TABLE IF NOT EXISTS portfolio_projects (
      portfolio_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      added_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (portfolio_id, project_id),
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Audit log for all changes (new schema with entity_type/entity_id)
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

    -- Named snapshots for projects
    CREATE TABLE IF NOT EXISTS project_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      snapshot_name TEXT NOT NULL,
      snapshot_data TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Named snapshots for portfolios
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      portfolio_id TEXT NOT NULL,
      snapshot_name TEXT NOT NULL,
      snapshot_data TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
    );
  `)

  // Migration: if projects table still has the old portfolio_id column, migrate and drop it
  const cols = db.prepare("PRAGMA table_info(projects)").all()
  const hasPortfolioId = cols.some(c => c.name === 'portfolio_id')
  if (hasPortfolioId) {
    // Copy existing project-portfolio links to junction table
    try {
      db.exec(`
        INSERT OR IGNORE INTO portfolio_projects (portfolio_id, project_id)
        SELECT portfolio_id, id FROM projects WHERE portfolio_id IS NOT NULL
      `)
    } catch (e) { /* junction table might not exist yet during first migration */ }
    // Drop the old column (SQLite 3.35+)
    try {
      db.exec('ALTER TABLE projects DROP COLUMN portfolio_id')
    } catch (e) {
      // If DROP COLUMN fails (old SQLite), recreate the table without portfolio_id
      console.warn('DROP COLUMN not supported, recreating projects table:', e.message)
      db.exec(`
        CREATE TABLE IF NOT EXISTS projects_new (
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
        INSERT INTO projects_new SELECT id, name, current_phase, process_start_date,
          peak_year_sales, time_to_peak_years, cogs_rate, ms_rate, loe_year,
          sales_after_loe, cannibalization_factor, ta, modality, source, indication,
          mode_of_action, created_at, updated_at FROM projects;
        DROP TABLE projects;
        ALTER TABLE projects_new RENAME TO projects;
      `)
    }
  }

  // Add actual_date and actual_cost columns to project_phases if missing
  const phaseCols = db.prepare("PRAGMA table_info(project_phases)").all()
  if (!phaseCols.some(c => c.name === 'actual_date')) {
    try { db.exec('ALTER TABLE project_phases ADD COLUMN actual_date TEXT') } catch(e) {}
  }
  if (!phaseCols.some(c => c.name === 'actual_cost')) {
    try { db.exec('ALTER TABLE project_phases ADD COLUMN actual_cost REAL') } catch(e) {}
  }
}

// Note: initializeDb() is called lazily inside getDb() on first database access

// ============================================================================
// User Functions
// ============================================================================

export function createUser(email, password, name) {
  const passwordHash = bcrypt.hashSync(password, 10)
  const now = new Date().toISOString()
  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = stmt.run(email, passwordHash, name, now, now)
  return { id: result.lastInsertRowid, email, name, created_at: now }
}

export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null
}

export function getUserById(id) {
  return db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(id) || null
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash)
}

// ============================================================================
// Audit Log
// ============================================================================

export function logAudit(entityType, entityId, action, field, oldValue, newValue, details, userId) {
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO audit_log (entity_type, entity_id, action, field, old_value, new_value, details, changed_by, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(entityType, entityId, action, field,
    oldValue != null ? String(oldValue) : null,
    newValue != null ? String(newValue) : null,
    details, userId, now)
}

export function getAuditLog(entityType, entityId, limit = 100) {
  return db.prepare(`
    SELECT * FROM audit_log
    WHERE entity_type = ? AND entity_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(entityType, entityId, limit)
}

export function getProjectAuditLog(projectId, limit = 100) {
  return getAuditLog('project', projectId, limit)
}

export function getPortfolioAuditLog(portfolioId, limit = 100) {
  return db.prepare(`
    SELECT * FROM audit_log
    WHERE (entity_type = 'portfolio' AND entity_id = ?)
       OR (entity_type = 'portfolio_membership' AND entity_id = ?)
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(portfolioId, portfolioId, limit)
}

// ============================================================================
// Project Functions
// ============================================================================

export function getProject(projectId) {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId)
  if (!project) return null
  const phases = db.prepare('SELECT * FROM project_phases WHERE project_id = ? ORDER BY ROWID').all(projectId)
  return { ...project, phases }
}

export function getAllProjects() {
  const projects = db.prepare(`
    SELECT p.*,
           (SELECT COALESCE(SUM(internal_cost + external_cost), 0) FROM project_phases WHERE project_id = p.id) as total_cost
    FROM projects p
    ORDER BY p.name
  `).all()
  return projects.map(p => ({
    ...p,
    phases: db.prepare('SELECT * FROM project_phases WHERE project_id = ? ORDER BY ROWID').all(p.id)
  }))
}

export function createProject(data) {
  const {
    id, name, currentPhase, processStartDate,
    peakYearSales, timeToPeakYears, cogsRate, msRate, loeYear,
    salesAfterLoe = 0, cannibalizationFactor = 0,
    ta, modality, source, indication, modeOfAction,
    phases
  } = data

  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO projects
    (id, name, current_phase, process_start_date, peak_year_sales,
     time_to_peak_years, cogs_rate, ms_rate, loe_year, sales_after_loe,
     cannibalization_factor, ta, modality, source, indication, mode_of_action,
     created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, name, currentPhase, processStartDate,
    peakYearSales, timeToPeakYears, cogsRate, msRate, loeYear,
    salesAfterLoe, cannibalizationFactor,
    ta, modality, source, indication, modeOfAction,
    now, now
  )

  // Create phases if provided
  if (phases && Array.isArray(phases)) {
    for (const ph of phases) {
      addPhase(id, ph.phase, ph.duration_months, ph.pos,
        ph.internal_cost || 0, ph.external_cost || 0, ph.is_actual || 0)
    }
  }

  logAudit('project', id, 'created', null, null, null, `Project "${name}" created`, null)
  return getProject(id)
}

export function updateProjectField(projectId, field, value, userId = null) {
  const project = getProject(projectId)
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
  db.prepare(`UPDATE projects SET ${dbField} = ?, updated_at = ? WHERE id = ?`).run(value, now, projectId)
  logAudit('project', projectId, 'updated', field, oldValue, value, null, userId)

  return getProject(projectId)
}

export function deleteProject(projectId) {
  const project = getProject(projectId)
  if (!project) return

  // Remove from all portfolios
  db.prepare('DELETE FROM portfolio_projects WHERE project_id = ?').run(projectId)
  db.prepare('DELETE FROM project_phases WHERE project_id = ?').run(projectId)
  db.prepare('DELETE FROM project_snapshots WHERE project_id = ?').run(projectId)
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId)
  logAudit('project', projectId, 'deleted', null, null, null, `Project "${project.name}" deleted`, null)
}

// ============================================================================
// Phase Functions
// ============================================================================

export function addPhase(projectId, phase, durationMonths, pos, internalCost, externalCost, isActual = 0) {
  const stmt = db.prepare(`
    INSERT INTO project_phases
    (project_id, phase, duration_months, pos, internal_cost, external_cost, is_actual)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(projectId, phase, durationMonths, pos, internalCost, externalCost, isActual)
}

export function updatePhaseField(phaseId, field, value, userId = null) {
  const phase = db.prepare('SELECT * FROM project_phases WHERE id = ?').get(phaseId)
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
  db.prepare(`UPDATE project_phases SET ${dbField} = ? WHERE id = ?`).run(value, phaseId)
  logAudit('project', phase.project_id, 'phase_updated', `phase.${phase.phase}.${field}`, oldValue, value, null, userId)

  return db.prepare('SELECT * FROM project_phases WHERE id = ?').get(phaseId)
}

export function getPhasesForProject(projectId) {
  return db.prepare('SELECT * FROM project_phases WHERE project_id = ? ORDER BY ROWID').all(projectId)
}

/**
 * Advance a project to the next phase
 */
export function advanceProjectPhase(projectId, actualDate, actualCost, userId = null) {
  const project = getProject(projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const PHASE_ORDER = ['PC', 'PH1', 'PH2', 'PH3', 'REG', 'MARKET']
  const currentIdx = PHASE_ORDER.indexOf(project.current_phase)
  if (currentIdx === -1 || currentIdx >= PHASE_ORDER.length - 1) {
    throw new Error(`Cannot advance from ${project.current_phase}`)
  }

  const nextPhase = PHASE_ORDER[currentIdx + 1]
  const now = new Date().toISOString()

  // Mark current phase as actual with the provided date and cost
  const currentPhaseRow = project.phases.find(p => p.phase === project.current_phase)
  if (currentPhaseRow) {
    db.prepare(`UPDATE project_phases SET is_actual = 1, actual_date = ?, actual_cost = ? WHERE id = ?`)
      .run(actualDate, actualCost, currentPhaseRow.id)
  }

  // Update project's current phase
  db.prepare(`UPDATE projects SET current_phase = ?, updated_at = ? WHERE id = ?`)
    .run(nextPhase, now, projectId)

  logAudit('project', projectId, 'phase_advanced',
    'current_phase', project.current_phase, nextPhase,
    `Advanced from ${project.current_phase} to ${nextPhase}. Actual date: ${actualDate}, Actual cost: ${actualCost}`,
    userId)

  return getProject(projectId)
}

// ============================================================================
// Portfolio Functions
// ============================================================================

export function getPortfolios() {
  const portfolios = db.prepare('SELECT * FROM portfolios ORDER BY name').all()
  return portfolios.map(p => {
    const projectCount = db.prepare('SELECT COUNT(*) as cnt FROM portfolio_projects WHERE portfolio_id = ?').get(p.id)
    return { ...p, project_count: projectCount.cnt }
  })
}

export function getPortfolio(id) {
  const portfolio = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(id)
  if (!portfolio) return null

  const projects = db.prepare(`
    SELECT p.*,
           (SELECT COALESCE(SUM(internal_cost + external_cost), 0) FROM project_phases WHERE project_id = p.id) as total_cost
    FROM projects p
    INNER JOIN portfolio_projects pp ON pp.project_id = p.id
    WHERE pp.portfolio_id = ?
    ORDER BY p.name
  `).all(id)

  const projectsWithPhases = projects.map(project => ({
    ...project,
    phases: db.prepare('SELECT * FROM project_phases WHERE project_id = ? ORDER BY ROWID').all(project.id)
  }))

  return { ...portfolio, projects: projectsWithPhases }
}

export function createPortfolio(id, name, ownerId, discountRate = 0.1, taxRate = 0.1) {
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO portfolios (id, name, owner_id, discount_rate, tax_rate, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, ownerId, discountRate, taxRate, now, now)
  logAudit('portfolio', id, 'created', null, null, null, `Portfolio "${name}" created`, null)
  return getPortfolio(id)
}

export function updatePortfolio(id, fields, userId = null) {
  const portfolio = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(id)
  if (!portfolio) throw new Error(`Portfolio ${id} not found`)

  const now = new Date().toISOString()
  const allowed = { name: 'name', discountRate: 'discount_rate', taxRate: 'tax_rate' }

  for (const [key, value] of Object.entries(fields)) {
    const dbField = allowed[key]
    if (!dbField) continue
    const oldVal = portfolio[dbField]
    db.prepare(`UPDATE portfolios SET ${dbField} = ?, updated_at = ? WHERE id = ?`).run(value, now, id)
    logAudit('portfolio', id, 'updated', key, oldVal, value, null, userId)
  }

  return getPortfolio(id)
}

export function deletePortfolio(id) {
  const portfolio = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(id)
  if (!portfolio) return
  db.prepare('DELETE FROM portfolio_projects WHERE portfolio_id = ?').run(id)
  db.prepare('DELETE FROM portfolio_snapshots WHERE portfolio_id = ?').run(id)
  db.prepare('DELETE FROM portfolios WHERE id = ?').run(id)
  logAudit('portfolio', id, 'deleted', null, null, null, `Portfolio "${portfolio.name}" deleted`, null)
}

export function addProjectToPortfolio(portfolioId, projectId, userId = null) {
  const now = new Date().toISOString()
  try {
    db.prepare('INSERT INTO portfolio_projects (portfolio_id, project_id, added_at) VALUES (?, ?, ?)')
      .run(portfolioId, projectId, now)
  } catch (e) {
    if (e.message.includes('UNIQUE constraint')) return // already in portfolio
    throw e
  }

  const project = db.prepare('SELECT name, current_phase FROM projects WHERE id = ?').get(projectId)
  logAudit('portfolio_membership', portfolioId, 'project_added', null, null, projectId,
    `Added project "${project?.name}" (${project?.current_phase})`, userId)
}

export function removeProjectFromPortfolio(portfolioId, projectId, userId = null) {
  const project = db.prepare('SELECT name, current_phase FROM projects WHERE id = ?').get(projectId)
  db.prepare('DELETE FROM portfolio_projects WHERE portfolio_id = ? AND project_id = ?')
    .run(portfolioId, projectId)
  logAudit('portfolio_membership', portfolioId, 'project_removed', null, projectId, null,
    `Removed project "${project?.name}" (${project?.current_phase})`, userId)
}

export function getProjectsForPortfolio(portfolioId) {
  return db.prepare(`
    SELECT p.*,
           (SELECT COALESCE(SUM(internal_cost + external_cost), 0) FROM project_phases WHERE project_id = p.id) as total_cost
    FROM projects p
    INNER JOIN portfolio_projects pp ON pp.project_id = p.id
    WHERE pp.portfolio_id = ?
    ORDER BY p.name
  `).all(portfolioId)
}

// ============================================================================
// Snapshot Functions
// ============================================================================

export function createProjectSnapshot(projectId, snapshotName, userId = null) {
  const project = getProject(projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const now = new Date().toISOString()
  const snapshotData = JSON.stringify(project)

  const result = db.prepare(`
    INSERT INTO project_snapshots (project_id, snapshot_name, snapshot_data, created_at)
    VALUES (?, ?, ?, ?)
  `).run(projectId, snapshotName, snapshotData, now)

  logAudit('project', projectId, 'snapshot_created', null, null, snapshotName,
    `Snapshot "${snapshotName}" created`, userId)

  return { id: result.lastInsertRowid, project_id: projectId, snapshot_name: snapshotName, created_at: now }
}

export function getProjectSnapshots(projectId) {
  return db.prepare('SELECT id, project_id, snapshot_name, created_at FROM project_snapshots WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId)
}

export function getProjectSnapshot(snapshotId) {
  const row = db.prepare('SELECT * FROM project_snapshots WHERE id = ?').get(snapshotId)
  if (!row) return null
  return { ...row, snapshot_data: JSON.parse(row.snapshot_data) }
}

export function createPortfolioSnapshot(portfolioId, snapshotName, userId = null) {
  const portfolio = getPortfolio(portfolioId)
  if (!portfolio) throw new Error(`Portfolio ${portfolioId} not found`)

  const now = new Date().toISOString()
  // Snapshot stores full portfolio state including all projects and their phases
  const snapshotData = JSON.stringify(portfolio)

  const result = db.prepare(`
    INSERT INTO portfolio_snapshots (portfolio_id, snapshot_name, snapshot_data, created_at)
    VALUES (?, ?, ?, ?)
  `).run(portfolioId, snapshotName, snapshotData, now)

  logAudit('portfolio', portfolioId, 'snapshot_created', null, null, snapshotName,
    `Snapshot "${snapshotName}" created`, userId)

  return { id: result.lastInsertRowid, portfolio_id: portfolioId, snapshot_name: snapshotName, created_at: now }
}

export function getPortfolioSnapshots(portfolioId) {
  return db.prepare('SELECT id, portfolio_id, snapshot_name, created_at FROM portfolio_snapshots WHERE portfolio_id = ? ORDER BY created_at DESC')
    .all(portfolioId)
}

export function getPortfolioSnapshot(snapshotId) {
  const row = db.prepare('SELECT * FROM portfolio_snapshots WHERE id = ?').get(snapshotId)
  if (!row) return null
  return { ...row, snapshot_data: JSON.parse(row.snapshot_data) }
}

// ============================================================================
// Seed Helpers
// ============================================================================

export function clearAllData() {
  db.exec(`
    DELETE FROM portfolio_projects;
    DELETE FROM project_phases;
    DELETE FROM project_snapshots;
    DELETE FROM portfolio_snapshots;
    DELETE FROM audit_log;
    DELETE FROM projects;
    DELETE FROM portfolios;
  `)
}
