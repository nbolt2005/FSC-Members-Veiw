import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login/lead
 * Body: { email: string }
 *
 * Trip leads authenticate with a @fieldstudiesclub.org email.
 * Creates account on first login with TRIP_LEAD role.
 */
export async function POST(request: NextRequest) {
  const { email } = (await request.json()) as { email: string }
  const normalized = email?.trim().toLowerCase()

  if (!normalized) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  if (!normalized.endsWith('@fieldstudiesclub.org')) {
    return NextResponse.json(
      { error: 'Trip lead login requires a @fieldstudiesclub.org email address' },
      { status: 403 }
    )
  }

  // Upsert: create on first login, promote existing member to TRIP_LEAD
  let user = await prisma.user.findUnique({ where: { email: normalized } })

  if (!user) {
    // Derive a display name from the email prefix (e.g. "noah.bolt" → "Noah Bolt")
    const prefix = normalized.split('@')[0]
    const fullName = prefix
      .split(/[._-]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')

    user = await prisma.user.create({
      data: { email: normalized, fullName, role: 'TRIP_LEAD' },
    })
  } else if (user.role === 'MEMBER') {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'TRIP_LEAD' },
    })
  }

  const response = NextResponse.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  })
  response.cookies.set('userId', user.id, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return response
}
