export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { addProjectToPortfolio, removeProjectFromPortfolio, getProjectsForPortfolio } from '@/lib/db'

// GET projects in a portfolio
export async function GET(req, { params }) {
  try {
    const { id } = params
    const projects = await getProjectsForPortfolio(id)
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST add a project to portfolio
export async function POST(req, { params }) {
  try {
    const { id } = params
    const { projectId } = await req.json()
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }
    await addProjectToPortfolio(id, projectId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE remove a project from portfolio
export async function DELETE(req, { params }) {
  try {
    const { id } = params
    const { projectId } = await req.json()
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }
    await removeProjectFromPortfolio(id, projectId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
