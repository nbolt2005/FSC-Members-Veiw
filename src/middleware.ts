import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth middleware — redirects unauthenticated users to /login.
 * The userId cookie is set by POST /api/auth/login (or /api/auth/select for demo).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Paths that are always accessible without a userId cookie
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/users') || // needed by login demo-user list
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'

  const userId = request.cookies.get('userId')?.value

  if (!userId && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the intended destination so we can redirect back after login
    if (pathname !== '/') loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
