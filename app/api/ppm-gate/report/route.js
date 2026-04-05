import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

const COOKIE_NAME = 'ppm_session'
const SESSION_TOKEN = 'ppm-authenticated-2026'

export async function GET(request) {
  // Verify session cookie
  const session = request.cookies.get(COOKIE_NAME)
  if (session?.value !== SESSION_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const reportPath = join(process.cwd(), 'data', 'Titan Portfolio Report.html')
    const html = await readFile(reportPath, 'utf-8')
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }
}
