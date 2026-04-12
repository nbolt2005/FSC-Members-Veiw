import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/login
 * Body: { email: string }
 *
 * Looks up a user by email and sets the userId cookie.
 * Returns 404 if no account exists (client can prompt to register).
 */
export async function POST(request: NextRequest) {
  const { email } = (await request.json()) as { email: string }

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, fullName: true, email: true, role: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'No account found with that email' }, { status: 404 })
  }

  const response = NextResponse.json({ user })
  response.cookies.set('userId', user.id, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return response
}
