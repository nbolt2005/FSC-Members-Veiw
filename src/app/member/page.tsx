import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TripStatus } from '@prisma/client'
import { formatDateRange, formatPrice, statusBadgeClass } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My Dashboard' }

export default async function MemberPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) redirect('/login/member')

  const now = new Date()

  const [user, signups, waitlistEntries, upcomingOpen] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, fullName: true, slackName: true, email: true, role: true, phone: true, isDriver: true, emergencyName: true },
    }),
    prisma.tripSignup.findMany({
      where:   { userId },
      include: {
        trip: {
          include: {
            _count:   { select: { signups: true, waitlist: true } },
            tripLead: { select: { fullName: true } },
          },
        },
      },
      orderBy: { trip: { startAt: 'asc' } },
    }),
    prisma.waitlistEntry.findMany({
      where:   { userId },
      include: {
        trip: { include: { _count: { select: { signups: true, waitlist: true } } } },
      },
      orderBy: { position: 'asc' },
    }),
    // All upcoming open trips (for discovery)
    prisma.trip.findMany({
      where:   { status: TripStatus.OPEN, startAt: { gte: now } },
      orderBy: { startAt: 'asc' },
      include: { _count: { select: { signups: true } } },
    }),
  ])

  if (!user) redirect('/login/member')

  const myUpcoming = signups.filter((s) => new Date(s.trip.endAt) >= now)
  const myPast     = signups.filter((s) => new Date(s.trip.endAt) < now)

  // Filter out trips I'm already signed up for
  const signedUpIds = new Set(signups.map((s) => s.tripId))
  const discoverTrips = upcomingOpen.filter((t) => !signedUpIds.has(t.id))

  return (
    <div className="max-w-2xl">
      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hey, {user.slackName?.split(' ')[0] || user.fullName.split(' ')[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
        </div>
        <div className="flex-shrink-0 flex gap-2">
          {user.isDriver && (
            <span className="text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full">
              Driver
            </span>
          )}
          <Link
            href="/profile"
            className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            Profile
          </Link>
        </div>
      </div>

      {/* Missing info banner */}
      {(!user.phone || !user.emergencyName) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Complete your profile</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {!user.phone && 'Phone number'}{!user.phone && !user.emergencyName && ' and '}{!user.emergencyName && 'emergency contact'} required before joining trips.
            </p>
            <Link href="/profile" className="text-xs font-semibold text-amber-700 hover:text-amber-800 mt-1 inline-block">
              Update now →
            </Link>
          </div>
        </div>
      )}

      {/* ── My Upcoming Trips ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          My Upcoming Trips ({myUpcoming.length})
        </h2>
        {myUpcoming.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm">No upcoming trips yet.</p>
            <Link href="/browse" className="text-sm font-medium text-green-700 hover:text-green-800 mt-2 inline-block">
              Browse available trips →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myUpcoming.map((s) => {
              const spotsLeft = s.trip.capacity - s.trip._count.signups
              return (
                <Link key={s.id} href={`/trips/${s.tripId}`} className="block">
                  <div className="bg-white border border-green-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{s.trip.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{s.trip.location}</p>
                        <p className="text-sm text-gray-400 mt-1">{formatDateRange(s.trip.startAt, s.trip.endAt)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                          Confirmed
                        </span>
                        <div className="text-sm font-semibold text-gray-900 mt-2">{formatPrice(s.trip.priceCents)}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {s.trip._count.signups}/{s.trip.capacity} spots filled
                        {spotsLeft > 0 ? ` · ${spotsLeft} left` : ' · Full'}
                      </span>
                      {s.trip.tripLead && (
                        <span className="text-xs text-gray-400">Lead: {s.trip.tripLead.fullName}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Waitlisted ── */}
      {waitlistEntries.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Waitlisted ({waitlistEntries.length})
          </h2>
          <div className="space-y-3">
            {waitlistEntries.map((entry) => (
              <Link key={entry.id} href={`/trips/${entry.tripId}`} className="block">
                <div className="bg-white border border-amber-200 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{entry.trip.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{formatDateRange(entry.trip.startAt, entry.trip.endAt)}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex-shrink-0">
                      #{entry.position} on waitlist
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Discover More Trips ── */}
      {discoverTrips.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Open for Signup ({discoverTrips.length})
            </h2>
            <Link href="/browse" className="text-xs text-green-700 font-medium hover:text-green-800">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {discoverTrips.slice(0, 5).map((trip) => {
              const spotsLeft = trip.capacity - trip._count.signups
              return (
                <Link key={trip.id} href={`/trips/${trip.id}`} className="block">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-4 hover:border-green-300 hover:shadow-sm transition-all">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{trip.title}</p>
                      <p className="text-xs text-gray-400">{formatDateRange(trip.startAt, trip.endAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-900">{formatPrice(trip.priceCents)}</div>
                      <div className="text-xs text-green-600 font-medium">{spotsLeft} left</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Past Trips ── */}
      {myPast.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Past Trips ({myPast.length})
          </h2>
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
            {myPast.map((s) => (
              <Link key={s.id} href={`/trips/${s.tripId}`} className="block">
                <div className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors opacity-70">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.trip.title}</p>
                    <p className="text-xs text-gray-400">{s.trip.location}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">{formatDateRange(s.trip.startAt, s.trip.endAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
