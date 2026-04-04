export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getPortfolioAuditLog } from '@/lib/db'

export async function GET(req, { params }) {
  try {
    const { id } = params
    const log = getPortfolioAuditLog(id)
    return NextResponse.json(log)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
