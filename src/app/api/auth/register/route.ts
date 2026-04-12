import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/register
 * Body: { email: string; fullName: string }
 *
 * Creates a new MEMBER account and sets the userId cookie.
 */
export async function POST(request: NextRequest) {
  const { email, fullName } = (await request.json()) as {
    email: string
    fullName: string
  }

  if (!email?.trim() || !fullName?.trim()) {
    return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 })
  }

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
    },
    select: { id: true, fullName: true, email: true, role: true },
  })

  const response = NextResponse.json({ user }, { status: 201 })
  response.cookies.set('userId', user.id, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return response
}
