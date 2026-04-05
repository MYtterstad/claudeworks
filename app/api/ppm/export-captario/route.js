export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getPortfolio } from '@/lib/db'

// Helper to convert decimal year to date
function decimalYearToISODate(decimalYear) {
  const year = Math.floor(decimalYear)
  const dayOfYear = Math.round((decimalYear - year) * 365.25)
  const date = new Date(year, 0, 1)
  date.setDate(date.getDate() + dayOfYear)
  return date.toISOString().split('T')[0]
}

// Note: Captario export is deferred until SUM model is finalized.
// This endpoint is kept for future use but the template path needs updating.

export async function POST(req) {
  try {
    const { portfolioId } = await req.json()

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Missing required field: portfolioId' },
        { status: 400 }
      )
    }

    const portfolio = await getPortfolio(portfolioId)
    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    // Placeholder until SUM model is finalized
    return NextResponse.json({
      success: false,
      message: 'Captario export is temporarily disabled — waiting for updated SUM model',
      portfolioId,
      portfolioName: portfolio.name,
      projectCount: portfolio.projects?.length || 0
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
