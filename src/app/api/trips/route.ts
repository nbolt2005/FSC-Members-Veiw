import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TripStatus } from '@prisma/client'

/** GET /api/trips — returns all non-DRAFT trips ordered by start date */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const includeDraft = searchParams.get('includeDraft') === 'true'

  const trips = await prisma.trip.findMany({
    where: includeDraft ? undefined : { status: { not: TripStatus.DRAFT } },
    orderBy: { startAt: 'asc' },
    include: { _count: { select: { signups: true, waitlist: true } } },
  })

  return NextResponse.json(trips)
}
