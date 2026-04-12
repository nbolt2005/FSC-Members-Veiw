import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { TripStatus } from '@prisma/client'
import CalendarView, { type CalendarTrip } from './CalendarView'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Calendar' }

export default async function CalendarPage() {
  const trips = await prisma.trip.findMany({
    where: { status: { not: TripStatus.DRAFT } },
    orderBy: { startAt: 'asc' },
    select: {
      id: true, title: true, location: true,
      startAt: true, endAt: true, status: true,
      priceCents: true, difficulty: true,
    },
  })

  // Serialize dates to ISO strings for the client component
  const serialized: CalendarTrip[] = trips.map((t) => ({
    ...t,
    status: t.status as string,
    startAt: t.startAt.toISOString(),
    endAt:   t.endAt.toISOString(),
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Calendar</h1>
      <p className="text-gray-500 text-sm mb-6">
        Upcoming trips — tap a date to see what&apos;s scheduled
      </p>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
        <CalendarView trips={serialized} />
      </div>
    </div>
  )
}
