import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TripStatus } from '@prisma/client'
import { formatDateRange, formatPrice, statusBadgeClass, difficultyBarClass, difficultyBadgeClass } from '@/lib/utils'
import CalendarView, { type CalendarTrip } from '@/app/calendar/CalendarView'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Browse Trips — FSC' }

export default async function BrowsePage() {
  const now = new Date()

  const trips = await prisma.trip.findMany({
    where:   { status: { not: TripStatus.DRAFT } },
    orderBy: { startAt: 'asc' },
    include: {
      _count:   { select: { signups: true, waitlist: true } },
      tripLead: { select: { fullName: true } },
    },
  })

  const upcoming = trips.filter((t) => new Date(t.endAt) >= now)
  const past     = trips.filter((t) => new Date(t.endAt) < now)

  const calendarTrips: CalendarTrip[] = trips.map((t) => ({
    id:         t.id,
    title:      t.title,
    location:   t.location,
    startAt:    t.startAt.toISOString(),
    endAt:      t.endAt.toISOString(),
    status:     t.status as string,
    priceCents: t.priceCents,
    difficulty: t.difficulty,
  }))

  const openCount = upcoming.filter((t) => t.status === TripStatus.OPEN).length

  return (
    <div>
      {/* Hero header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upcoming Trips</h1>
            <p className="text-gray-500 mt-1">
              {openCount} open for signup · {upcoming.length} total scheduled
            </p>
          </div>
          <Link
            href="/login"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            Sign In to Register
          </Link>
        </div>
      </div>

      {/* Upcoming trips grid */}
      {upcoming.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center mb-10">
          <p className="text-gray-400">No upcoming trips — check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {upcoming.map((trip) => {
            const spotsLeft = trip.capacity - trip._count.signups
            return (
              <div key={trip.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-md hover:border-gray-300 transition-all duration-200">
                <div className={`h-1.5 flex-shrink-0 ${difficultyBarClass(trip.difficulty)}`} />
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 leading-snug">{trip.title}</h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusBadgeClass(trip.status)}`}>
                      {trip.status === 'OPEN' ? 'Open' : trip.status === 'FULL' ? 'Full' : 'Closed'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{trip.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDateRange(trip.startAt, trip.endAt)}</span>
                  </div>

                  {trip.tripLead && (
                    <p className="text-xs text-gray-400 mb-3">Lead: {trip.tripLead.fullName}</p>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {trip.difficulty && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${difficultyBadgeClass(trip.difficulty)}`}>
                          {trip.difficulty}
                        </span>
                      )}
                      {trip.mileage != null && (
                        <span className="text-[11px] text-gray-400">{trip.mileage} mi</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{formatPrice(trip.priceCents)}</div>
                      {spotsLeft > 0 ? (
                        <div className="text-[11px] text-green-600 font-medium">{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</div>
                      ) : (
                        <div className="text-[11px] text-red-500">
                          {trip._count.waitlist > 0 ? `${trip._count.waitlist} waitlisted` : 'Full'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sign up CTA */}
                  {trip.status === TripStatus.OPEN && spotsLeft > 0 && (
                    <Link
                      href="/login/member"
                      className="mt-3 block text-center text-sm font-medium text-green-700 border border-green-200 rounded-xl py-2 hover:bg-green-50 transition-colors"
                    >
                      Sign in to register
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Calendar */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Calendar of Events</h2>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
          <CalendarView trips={calendarTrips} />
        </div>
      </div>

      {/* Past trips (collapsed summary) */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-3">Past Trips ({past.length})</h2>
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
            {past.slice(0, 8).map((trip) => (
              <div key={trip.id} className="px-5 py-3 flex items-center justify-between gap-4 opacity-60">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{trip.title}</p>
                  <p className="text-xs text-gray-400">{trip.location}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{formatDateRange(trip.startAt, trip.endAt)}</p>
              </div>
            ))}
            {past.length > 8 && (
              <div className="px-5 py-3 text-center text-xs text-gray-400">
                + {past.length - 8} more past trips
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
