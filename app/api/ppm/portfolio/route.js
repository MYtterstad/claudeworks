export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getPortfolios, createPortfolio } from '@/lib/db'

export async function GET() {
  try {
    const portfolios = await getPortfolios()
    return NextResponse.json(portfolios)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { id, name, discountRate = 0.1, taxRate = 0.1 } = await req.json()
    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required fields: id, name' }, { status: 400 })
    }
    const portfolio = await createPortfolio(id, name, null, discountRate, taxRate)
    return NextResponse.json(portfolio, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
