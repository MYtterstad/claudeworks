// PPM Simulation API endpoint
// POST /api/simulate — runs Monte Carlo simulation on a portfolio
//
// Future: This will call the Python simulation engine.
// For now, returns a placeholder response.
// Options for the Python engine:
//   1. Vercel Python serverless function (simple, 60s timeout on Pro)
//   2. Captario SUM simulation engine (external API call)
//   3. Dedicated Python service on Railway/Fly.io

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()

    // Placeholder: return a mock response
    return NextResponse.json({
      status: 'ok',
      message: 'Simulation API ready — engine not yet connected',
      portfolio: body.portfolioId || 'unknown',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoints: {
      'POST /api/simulate': 'Run Monte Carlo simulation on a portfolio definition',
    },
  })
}
