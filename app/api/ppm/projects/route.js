export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAllProjects, createProject } from '@/lib/db'

// GET all projects (independent of portfolios)
export async function GET() {
  try {
    const projects = await getAllProjects()
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create a new project
export async function POST(req) {
  try {
    const data = await req.json()
    if (!data.id || !data.name || !data.currentPhase) {
      return NextResponse.json({ error: 'Missing required fields: id, name, currentPhase' }, { status: 400 })
    }
    const project = await createProject(data)
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
