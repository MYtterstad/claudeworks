import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PPM_PASSWORD = process.env.PPM_PASSWORD || 'a8f3b2c1-9d4e-4f7b'
const COOKIE_NAME = 'ppm_session'
const SESSION_TOKEN = 'ppm-authenticated-2026'

export async function POST(request) {
  try {
    const { password } = await request.json()

    if (password === PPM_PASSWORD) {
      const response = NextResponse.json({ success: true })
      response.cookies.set(COOKIE_NAME, SESSION_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
      return response
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 })
  } catch {
    return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 })
  }
}
