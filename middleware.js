import { NextResponse } from 'next/server'

const PPM_BASE = '/p/a8f3b2c1-9d4e'
const COOKIE_NAME = 'ppm_session'
const SESSION_TOKEN = 'ppm-authenticated-2026'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Only gate routes under the PPM base path
  if (!pathname.startsWith(PPM_BASE)) {
    return NextResponse.next()
  }

  // Allow the login page and auth API through
  if (pathname === `${PPM_BASE}/login` || pathname.startsWith('/api/ppm-gate')) {
    return NextResponse.next()
  }

  // Check for valid session cookie
  const session = request.cookies.get(COOKIE_NAME)
  if (session?.value === SESSION_TOKEN) {
    return NextResponse.next()
  }

  // Redirect to login, preserving the intended destination
  const loginUrl = new URL(`${PPM_BASE}/login`, request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/p/:path*', '/api/ppm-gate/:path*'],
}
