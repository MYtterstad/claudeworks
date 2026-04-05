export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    database_url_set: !!process.env.DATABASE_URL,
    database_url_prefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET',
    anthropic_key_set: !!process.env.ANTHROPIC_API_KEY,
    ppm_password_set: !!process.env.PPM_PASSWORD,
    node_env: process.env.NODE_ENV,
  }

  // Try database connection
  try {
    if (process.env.DATABASE_URL) {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL)
      const result = await sql('SELECT 1 as ok')
      checks.database_connected = true
      checks.database_result = result
    } else {
      checks.database_connected = false
      checks.database_error = 'DATABASE_URL not set — will use SQLite locally'
    }
  } catch (error) {
    checks.database_connected = false
    checks.database_error = error.message
  }

  // Try listing tables
  try {
    if (process.env.DATABASE_URL) {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL)
      const tables = await sql("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
      checks.tables = tables.map(t => t.table_name)
    }
  } catch (error) {
    checks.tables_error = error.message
  }

  return NextResponse.json(checks)
}
