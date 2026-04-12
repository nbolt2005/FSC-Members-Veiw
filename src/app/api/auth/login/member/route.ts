import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login/member
 * Body: { email: string; phone?: string; isDriver?: boolean }
 *
 * Step 1 (email only)  → returns user preview (slackName, missing fields)
 * Step 2 (+ phone/driver) → saves data and sets cookie
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email: string
    phone?: string
    isDriver?: boolean
    confirm?: boolean
  }

  const normalized = body.email?.trim().toLowerCase()
  if (!normalized) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: {
      id: true, fullName: true, slackName: true, email: true,
      role: true, phone: true, isDriver: true,
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'No account found with that email. Make sure you use the email you registered with FSC.' },
      { status: 404 }
    )
  }

  // Step 1: just return preview so the client can confirm identity + collect missing info
  if (!body.confirm) {
    return NextResponse.json({
      preview: {
        fullName:  user.fullName,
        slackName: user.slackName,
        hasPhone:  !!user.phone,
        isDriver:  user.isDriver,
      },
    })
  }

  // Step 2: save phone + driver, then log in
  const updates: Record<string, any> = {}
  if (body.phone?.trim())            updates.phone    = body.phone.trim()
  if (body.isDriver !== undefined)   updates.isDriver = body.isDriver

  const updated = Object.keys(updates).length > 0
    ? await prisma.user.update({ where: { id: user.id }, data: updates, select: { id: true, fullName: true, email: true, role: true } })
    : user

  const response = NextResponse.json({
    user: { id: updated.id, fullName: updated.fullName, email: updated.email, role: updated.role },
  })
  response.cookies.set('userId', updated.id, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return response
}
