export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getPortfolio, updatePortfolio, deletePortfolio } from '@/lib/db'

export async function GET(req, { params }) {
  try {
    const { id } = params
    const portfolio = await getPortfolio(id)
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }
    return NextResponse.json(portfolio)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const fields = await req.json()
    const updated = await updatePortfolio(id, fields)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params
    await deletePortfolio(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
