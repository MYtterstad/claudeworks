/**
 * SQLite backend — only imported in local dev (no DATABASE_URL)
 * Separated into its own file so Vercel's bundler never touches better-sqlite3
 */

let _db = null

export function getSqliteDb() {
  if (_db) return _db
  const path = require('path')
  const fs = require('fs')
  const Database = require('better-sqlite3')
  const dbPath = path.join(process.cwd(), 'data', 'claudeworks.db')
  const dataDir = path.dirname(dbPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  return _db
}
