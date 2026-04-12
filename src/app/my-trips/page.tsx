import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { formatDateRange, formatPrice, statusBadgeClass } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My Trips' }

export default async function MyTripsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-2">No user selected.</p>
        <p className="text-sm text-gray-400">Use the menu at the top to switch demo users.</p>
      </div>
    )
  }

  const now = new Date()

  const [signups, waitlistEntries] = await Promise.all([
    prisma.tripSignup.findMany({
      where: { userId },
      include: {
        trip: {
          include: {
            _count: { select: { signups: true, waitlist: true } },
            tripLead: { select: { fullName: true } },
          },
        },
      },
      orderBy: { trip: { startAt: 'asc' } },
    }),
    prisma.waitlistEntry.findMany({
      where: { userId },
      include: {
        trip: {
          include: { _count: { select: { signups: true, waitlist: true } } },
        },
      },
      orderBy: { position: 'asc' },
    }),
  ])

  const upcomingSignups = signups.filter((s) => new Date(s.trip.endAt) >= now)
  const pastSignups     = signups.filter((s) => new Date(s.trip.endAt) < now)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Trips</h1>

      {/* ── Upcoming ── */}
      <Section
        title="Upcoming"
        count={upcomingSignups.length}
        emptyText="No upcoming trips."
        emptyLink={{ href: '/trips', label: 'Browse available trips →' }}
      >
        {upcomingSignups.map((s) => (
          <TripRow
            key={s.id}
            href={`/trips/${s.tripId}`}
            title={s.trip.title}
            location={s.trip.location}
            dateRange={formatDateRange(s.trip.startAt, s.trip.endAt)}
            status={s.trip.status}
            price={formatPrice(s.trip.priceCents)}
            meta={`${s.trip._count.signups}/${s.trip.capacity} spots · ${s.trip.tripLead ? `Lead: ${s.trip.tripLead.fullName}` : 'No lead assigned'}`}
            badge={<span className="text-xs font-medium text-green-600">Confirmed</span>}
            slackHref={s.trip.slackChannelUrl ?? undefined}
          />
        ))}
      </Section>

      {/* ── Waitlisted ── */}
      <Section
        title="Waitlisted"
        count={waitlistEntries.length}
        emptyText="Not on any waitlists."
      >
        {waitlistEntries.map((entry) => (
          <TripRow
            key={entry.id}
            href={`/trips/${entry.tripId}`}
            title={entry.trip.title}
            location={entry.trip.location}
            dateRange={formatDateRange(entry.trip.startAt, entry.trip.endAt)}
            status={entry.trip.status}
            price={formatPrice(entry.trip.priceCents)}
            meta={`${entry.trip._count.signups}/${entry.trip.capacity} spots filled`}
            badge={
              <span className="text-xs font-medium text-amber-600">
                #{entry.position} on waitlist
              </span>
            }
            borderColor="border-amber-200"
          />
        ))}
      </Section>

      {/* ── Past ── */}
      {pastSignups.length > 0 && (
        <Section title="Past" count={pastSignups.length}>
          {pastSignups.map((s) => (
            <TripRow
              key={s.id}
              href={`/trips/${s.tripId}`}
              title={s.trip.title}
              location={s.trip.location}
              dateRange={formatDateRange(s.trip.startAt, s.trip.endAt)}
              status={s.trip.status}
              price={formatPrice(s.trip.priceCents)}
              meta={`${s.trip._count.signups} attended`}
              badge={<span className="text-xs font-medium text-gray-400">Completed</span>}
              dim
            />
          ))}
        </Section>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title, count, children, emptyText, emptyLink,
}: {
  title: string
  count: number
  children?: React.ReactNode
  emptyText?: string
  emptyLink?: { href: string; label: string }
}) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title} ({count})
      </h2>
      {count === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-6 text-center">
          <p className="text-gray-400 text-sm">{emptyText}</p>
          {emptyLink && (
            <Link href={emptyLink.href} className="text-sm font-medium text-green-700 hover:text-green-800 mt-2 inline-block">
              {emptyLink.label}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  )
}

function TripRow({
  href, title, location, dateRange, status, price, meta, badge,
  borderColor = 'border-gray-200', slackHref, dim,
}: {
  href: string
  title: string
  location: string
  dateRange: string
  status: string
  price: string
  meta: string
  badge: React.ReactNode
  borderColor?: string
  slackHref?: string
  dim?: boolean
}) {
  return (
    <div className={`bg-white border ${borderColor} rounded-2xl p-4 ${dim ? 'opacity-75' : ''}`}>
      <Link href={href} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{location}</p>
            <p className="text-sm text-gray-400 mt-1">{dateRange}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadgeClass(status)}`}>
              {status}
            </span>
            <div className="text-sm font-semibold text-gray-900 mt-2">{price}</div>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
          {badge}
          <span className="text-[11px] text-gray-400 truncate ml-2">{meta}</span>
        </div>
      </Link>

      {/* Slack quick link — outside the main Link so it's a separate tap target */}
      {slackHref && (
        <a
          href={slackHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1.5 text-xs text-green-700 hover:underline"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Open Slack channel
        </a>
      )}
    </div>
  )
}
