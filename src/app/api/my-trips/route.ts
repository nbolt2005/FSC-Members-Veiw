import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/my-trips — returns the current user's signups and waitlist entries */
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value

  if (!userId) {
    return NextResponse.json({ signups: [], waitlist: [] })
  }

  const [signups, waitlist] = await Promise.all([
    prisma.tripSignup.findMany({
      where: { userId },
      include: {
        trip: { include: { _count: { select: { signups: true, waitlist: true } } } },
      },
      orderBy: { trip: { startAt: 'asc' } },
    }),
    prisma.waitlistEntry.findMany({
      where: { userId },
      include: {
        trip: { include: { _count: { select: { signups: true, waitlist: true } } } },
      },
      orderBy: { position: 'asc' },
    }),
  ])

  return NextResponse.json({ signups, waitlist })
}
