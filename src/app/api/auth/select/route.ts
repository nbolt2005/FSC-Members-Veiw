import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/select
 * Sets the demo `userId` cookie so server components know which user is active.
 * This is demo-only auth — not a production auth system.
 */
export async function POST(request: NextRequest) {
  const { userId } = (await request.json()) as { userId: string }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('userId', userId, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return response
}
