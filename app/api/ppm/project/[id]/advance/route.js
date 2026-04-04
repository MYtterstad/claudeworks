import { NextResponse } from 'next/server'
import { advanceProjectPhase } from '@/lib/db'

// POST advance project to next phase
export async function POST(req, { params }) {
  try {
    const { id } = params
    const { actualDate, actualCost } = await req.json()

    if (!actualDate) {
      return NextResponse.json({ error: 'Missing actualDate' }, { status: 400 })
    }

    const updated = advanceProjectPhase(id, actualDate, actualCost || 0)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
