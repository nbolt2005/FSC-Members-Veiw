import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** POST /api/auth/logout — clears the userId cookie */
export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('userId', '', { maxAge: 0, path: '/' })
  return response
}
