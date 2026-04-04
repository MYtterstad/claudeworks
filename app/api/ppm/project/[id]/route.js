import { NextResponse } from 'next/server'
import { getProject, updateProjectField, deleteProject } from '@/lib/db'

export async function GET(req, { params }) {
  try {
    const { id } = params
    const project = getProject(id)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const { field, value, userId } = await req.json()

    if (!field || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: field, value' },
        { status: 400 }
      )
    }

    const updated = updateProjectField(id, field, value, userId)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params
    deleteProject(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
