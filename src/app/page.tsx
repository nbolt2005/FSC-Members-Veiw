import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import TripCard from '@/components/TripCard'
import { TripStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Home' }

export default async function HomePage() {
  const now = new Date()

  const [upcomingTrips, totalOpen] = await Promise.all([
    prisma.trip.findMany({
      where: { status: TripStatus.OPEN, startAt: { gte: now } },
      orderBy: { startAt: 'asc' },
      take: 3,
      include: { _count: { select: { signups: true, waitlist: true } } },
    }),
    prisma.trip.count({ where: { status: TripStatus.OPEN } }),
  ])

  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {totalOpen} trip{totalOpen !== 1 ? 's' : ''} open
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 leading-tight">
          Field Studies Club
        </h1>
        <p className="text-gray-500 text-lg max-w-lg">
          Explore trails, sign up for trips, and borrow gear from the club library.
        </p>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { href: '/trips',    icon: '🏔️', label: 'Browse Trips',  sub: `${totalOpen} open` },
          { href: '/my-trips', icon: '📋', label: 'My Trips',       sub: 'Your signups' },
          { href: '/gear',     icon: '🎒', label: 'Gear Library',   sub: 'Borrow items' },
          { href: '/trips',    icon: '📍', label: 'Explore',        sub: 'Find adventures' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-white border border-gray-200 rounded-2xl p-4 text-center hover:shadow-md hover:border-gray-300 transition-all duration-200 group"
          >
            <div className="text-2xl mb-1.5">{item.icon}</div>
            <div className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
              {item.label}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{item.sub}</div>
          </Link>
        ))}
      </div>

      {/* Upcoming trips */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
        <Link href="/trips" className="text-sm text-green-700 hover:text-green-800 font-medium">
          View all →
        </Link>
      </div>

      {upcomingTrips.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-gray-400">No upcoming trips right now — check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}
