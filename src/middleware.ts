import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/browse') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/trips') ||   // needed by browse page
    pathname.startsWith('/api/users') ||   // /api/users/me for nav
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'

  const userId = request.cookies.get('userId')?.value

  if (!userId && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
