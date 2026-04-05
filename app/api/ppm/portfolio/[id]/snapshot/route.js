export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createPortfolioSnapshot, getPortfolioSnapshots, getPortfolioSnapshot } from '@/lib/db'

// GET list snapshots for a portfolio
export async function GET(req, { params }) {
  try {
    const { id } = params
    const url = new URL(req.url)
    const snapshotId = url.searchParams.get('snapshotId')

    if (snapshotId) {
      const snapshot = await getPortfolioSnapshot(parseInt(snapshotId))
      if (!snapshot) return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
      return NextResponse.json(snapshot)
    }

    const snapshots = await getPortfolioSnapshots(id)
    return NextResponse.json(snapshots)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create a snapshot
export async function POST(req, { params }) {
  try {
    const { id } = params
    const { name } = await req.json()
    if (!name) {
      return NextResponse.json({ error: 'Missing snapshot name' }, { status: 400 })
    }
    const snapshot = await createPortfolioSnapshot(id, name)
    return NextResponse.json(snapshot, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
