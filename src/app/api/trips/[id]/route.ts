import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/trips/:id — returns a single trip with signup/waitlist counts */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { _count: { select: { signups: true, waitlist: true } } },
  })

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  return NextResponse.json(trip)
}
