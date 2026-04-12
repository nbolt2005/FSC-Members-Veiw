import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TripStatus } from '@prisma/client'
import { formatDateRange, formatPrice, statusBadgeClass } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Trip Lead Dashboard' }

const STATUS_LABELS: Record<string, string> = {
  DRAFT:  'Draft',
  OPEN:   'Open',
  FULL:   'Full',
  CLOSED: 'Closed',
}

export default async function LeadDashboardPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) redirect('/login/lead')

  const now = new Date()

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, fullName: true, email: true, role: true },
  })

  if (!user || (user.role !== 'TRIP_LEAD' && user.role !== 'ADMIN')) {
    redirect('/login/lead')
  }

  const ledTrips = await prisma.trip.findMany({
    where:   { tripLeadId: userId },
    orderBy: { startAt: 'asc' },
    include: {
      _count:   { select: { signups: true, waitlist: true } },
      signups:  { include: { user: { select: { fullName: true, email: true, phone: true, isDriver: true } } } },
    },
  })

  const upcomingTrips = ledTrips.filter((t) => new Date(t.endAt) >= now)
  const pastTrips     = ledTrips.filter((t) => new Date(t.endAt) < now)

  // Overall driver count across all upcoming trips' signups
  const totalDrivers = upcomingTrips.reduce((acc, t) =>
    acc + t.signups.filter((s) => s.user.isDriver).length, 0)

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full mb-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Trip Lead
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-gray-900">{ledTrips.length}</div>
          <div className="text-xs text-gray-400">total trips</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard value={upcomingTrips.length} label="Upcoming" color="blue" />
        <StatCard
          value={upcomingTrips.reduce((a, t) => a + t._count.signups, 0)}
          label="Total Signups"
          color="green"
        />
        <StatCard value={totalDrivers} label="Drivers" color="gray" />
      </div>

      {/* ── Upcoming Trips ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Your Upcoming Trips ({upcomingTrips.length})
        </h2>

        {upcomingTrips.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-gray-400 text-sm">No upcoming trips assigned to you yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingTrips.map((trip) => {
              const spotsLeft   = trip.capacity - trip._count.signups
              const drivers     = trip.signups.filter((s) => s.user.isDriver).length
              const fullPct     = Math.min(100, Math.round((trip._count.signups / trip.capacity) * 100))

              return (
                <div key={trip.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                  {/* Trip header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{trip.location}</p>
                      <p className="text-sm text-gray-400 mt-1">{formatDateRange(trip.startAt, trip.endAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadgeClass(trip.status)}`}>
                        {STATUS_LABELS[trip.status] ?? trip.status}
                      </span>
                      <div className="text-sm font-semibold text-gray-900 mt-2">{formatPrice(trip.priceCents)}</div>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>{trip._count.signups} / {trip.capacity} signed up</span>
                      <span className="flex items-center gap-1">
                        {spotsLeft > 0
                          ? <span className="text-green-600 font-medium">{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
                          : <span className="text-red-500 font-medium">Full</span>
                        }
                        {trip._count.waitlist > 0 && (
                          <span className="text-amber-600">· {trip._count.waitlist} waitlisted</span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${fullPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Driver count */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>
                      <span className="font-medium text-blue-600">{drivers}</span> driver{drivers !== 1 ? 's' : ''} signed up
                    </span>
                    {trip.venmoHandle && (
                      <span className="text-gray-400">Venmo: {trip.venmoHandle}</span>
                    )}
                  </div>

                  {/* Roster list (collapsed) */}
                  {trip.signups.length > 0 && (
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors list-none flex items-center gap-1">
                        <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        View roster ({trip.signups.length})
                      </summary>
                      <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                        {trip.signups.map((s) => (
                          <div key={s.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium text-gray-800">{s.user.fullName}</span>
                              <span className="text-gray-400 ml-2 text-xs">{s.user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {s.user.phone && (
                                <span className="text-xs text-gray-400">{s.user.phone}</span>
                              )}
                              {s.user.isDriver && (
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                  Driver
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Past Trips ── */}
      {pastTrips.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Past Trips ({pastTrips.length})
          </h2>
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
            {pastTrips.map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="block">
                <div className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors opacity-60">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{trip.title}</p>
                    <p className="text-xs text-gray-400">{formatDateRange(trip.startAt, trip.endAt)}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {trip._count.signups} attended
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: 'blue' | 'green' | 'gray' }) {
  const colorMap = {
    blue:  'text-blue-700',
    green: 'text-green-700',
    gray:  'text-gray-700',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
      <div className={`text-2xl font-bold ${colorMap[color]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
