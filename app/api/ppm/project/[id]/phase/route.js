export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { updatePhaseField } from '@/lib/db'

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const { phaseId, field, value, userId } = await req.json()

    if (!phaseId || !field || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: phaseId, field, value' },
        { status: 400 }
      )
    }

    const updated = await updatePhaseField(phaseId, field, value, userId)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
