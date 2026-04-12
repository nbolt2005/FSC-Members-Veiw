import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import TripCard from '@/components/TripCard'
import { TripStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Browse Trips' }

export default async function TripsPage() {
  const trips = await prisma.trip.findMany({
    where: { status: { not: TripStatus.DRAFT } },
    orderBy: { startAt: 'asc' },
    include: { _count: { select: { signups: true, waitlist: true } } },
  })

  const openCount = trips.filter((t) => t.status === TripStatus.OPEN).length
  const fullCount  = trips.filter((t) => t.status === TripStatus.FULL).length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Trips</h1>
        <p className="text-gray-500 text-sm">
          {openCount} open · {fullCount} full
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
          <p className="text-gray-400">No trips available right now.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}
