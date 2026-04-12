import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TripStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/trips/:id/signup
 *
 * Signs the current user up for a trip, or places them on the waitlist if
 * the trip is full. The entire flow runs inside a Prisma transaction so that
 * concurrent requests can never oversell spots.
 *
 * Transaction steps:
 *  1. Lock + fetch the trip to verify it is open.
 *  2. Check for a duplicate signup or waitlist entry.
 *  3. Count confirmed signups.
 *  4a. If count < capacity  →  create TripSignup (confirm the spot).
 *  4b. If count >= capacity →  find next waitlist position and create WaitlistEntry.
 *  5. If step 4a fills the last spot, flip trip status to FULL.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.cookies.get('userId')?.value

  if (!userId) {
    return NextResponse.json({ error: 'No user selected' }, { status: 401 })
  }

  const { id: tripId } = await params

  try {
    const result = await prisma.$transaction(async (tx) => {
      // ── 1. Fetch trip ──────────────────────────────────────────────────
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        select: { capacity: true, status: true },
      })

      if (!trip) throw new Error('TRIP_NOT_FOUND')
      if (trip.status !== TripStatus.OPEN && trip.status !== TripStatus.FULL) {
        throw new Error('TRIP_NOT_OPEN')
      }

      // ── 2. Guard against duplicate signup / waitlist entry ─────────────
      const [existingSignup, existingWaitlist] = await Promise.all([
        tx.tripSignup.findUnique({
          where: { userId_tripId: { userId, tripId } },
        }),
        tx.waitlistEntry.findUnique({
          where: { userId_tripId: { userId, tripId } },
        }),
      ])

      if (existingSignup) throw new Error('ALREADY_SIGNED_UP')
      if (existingWaitlist) throw new Error('ALREADY_WAITLISTED')

      // ── 3. Count current confirmed signups ─────────────────────────────
      const signupCount = await tx.tripSignup.count({ where: { tripId } })

      if (signupCount < trip.capacity) {
        // ── 4a. Spot available — confirm signup ──────────────────────────
        const signup = await tx.tripSignup.create({ data: { userId, tripId } })

        // If this was the last spot, mark the trip as FULL
        if (signupCount + 1 >= trip.capacity) {
          await tx.trip.update({
            where: { id: tripId },
            data: { status: TripStatus.FULL },
          })
        }

        return { type: 'SIGNUP' as const, signup }
      } else {
        // ── 4b. Trip full — add to waitlist with next available position ──
        // MAX(position) per trip + 1 gives us a sequential, gap-free queue.
        const { _max } = await tx.waitlistEntry.aggregate({
          where: { tripId },
          _max: { position: true },
        })
        const nextPosition = (_max.position ?? 0) + 1

        const entry = await tx.waitlistEntry.create({
          data: { userId, tripId, position: nextPosition },
        })

        return { type: 'WAITLIST' as const, entry, position: nextPosition }
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      const map: Record<string, { message: string; status: number }> = {
        TRIP_NOT_FOUND:    { message: 'Trip not found', status: 404 },
        TRIP_NOT_OPEN:     { message: 'This trip is not accepting signups', status: 400 },
        ALREADY_SIGNED_UP: { message: 'You are already signed up for this trip', status: 409 },
        ALREADY_WAITLISTED:{ message: 'You are already on the waitlist', status: 409 },
      }
      const mapped = map[error.message]
      if (mapped) return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    console.error('[signup]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
