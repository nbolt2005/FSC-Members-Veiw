import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDateRange, formatPrice, statusBadgeClass, difficultyBadgeClass } from '@/lib/utils'
import SignupButton from './SignupButton'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const trip = await prisma.trip.findUnique({ where: { id }, select: { title: true } })
  return { title: trip?.title ?? 'Trip' }
}

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      _count:   { select: { signups: true, waitlist: true } },
      gearList: { orderBy: [{ provided: 'asc' }, { name: 'asc' }] },
      tripLead: { select: { fullName: true, email: true, role: true } },
    },
  })

  if (!trip) notFound()

  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  type UserStatus = 'SIGNED_UP' | 'WAITLISTED' | null
  let userStatus: UserStatus = null
  let waitlistPosition: number | null = null

  if (userId) {
    const [signup, waitlistEntry] = await Promise.all([
      prisma.tripSignup.findUnique({ where: { userId_tripId: { userId, tripId: id } } }),
      prisma.waitlistEntry.findUnique({ where: { userId_tripId: { userId, tripId: id } } }),
    ])
    if (signup) userStatus = 'SIGNED_UP'
    else if (waitlistEntry) {
      userStatus = 'WAITLISTED'
      waitlistPosition = waitlistEntry.position
    }
  }

  const spotsLeft = trip.capacity - trip._count.signups
  const canSignup  = trip.status === 'OPEN' || trip.status === 'FULL'

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link href="/trips" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All trips
      </Link>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadgeClass(trip.status)}`}>
          {trip.status}
        </span>
        {trip.difficulty && (
          <span className={`text-xs px-2.5 py-1 rounded-full ${difficultyBadgeClass(trip.difficulty)}`}>
            {trip.difficulty}
          </span>
        )}
        {trip.foodProvided === true && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">Food provided</span>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">{trip.title}</h1>

      <div className="flex items-center gap-1.5 text-gray-600 mb-6">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm">{trip.location}</span>
      </div>

      {/* Info tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <InfoTile label="Date"  value={formatDateRange(trip.startAt, trip.endAt)} />
        <InfoTile label="Cost"  value={formatPrice(trip.priceCents)} />
        <InfoTile
          label="Spots"
          value={`${trip._count.signups} / ${trip.capacity}`}
          sub={spotsLeft > 0 ? `${spotsLeft} left` : undefined}
          subColor="text-green-600"
        />
        {trip.mileage != null && (
          <InfoTile label="Mileage" value={`${trip.mileage} mi`} />
        )}
      </div>

      {/* Trip Lead */}
      {trip.tripLead && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {trip.tripLead.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Trip Lead</div>
            <div className="text-sm font-semibold text-gray-900">{trip.tripLead.fullName}</div>
            <div className="text-xs text-gray-500">{trip.tripLead.email}</div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-2">About this trip</h2>
        <p className="text-gray-600 leading-relaxed text-sm">{trip.description}</p>
        {trip.foodProvided === false && (
          <p className="text-xs text-gray-400 mt-2">Food not provided — bring your own meals.</p>
        )}
      </div>

      {/* Gear list */}
      {trip.gearList.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
          <details>
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
              <span className="font-semibold text-gray-900 text-sm">
                Gear List
                <span className="text-gray-400 font-normal ml-1">({trip.gearList.length} items)</span>
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-4 border-t border-gray-100">
              <div className="pt-3 space-y-2">
                {trip.gearList.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 text-sm">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.provided ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-gray-700">{item.name}</span>
                    {item.provided && (
                      <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full">
                        provided
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-3">
                Green dot = club provides this item from the gear shed.
              </p>
            </div>
          </details>
        </div>
      )}

      {/* Waitlist notice */}
      {trip._count.waitlist > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
          {trip._count.waitlist} member{trip._count.waitlist !== 1 ? 's' : ''} currently on the waitlist.
        </div>
      )}

      {/* Venmo note */}
      {trip.venmoHandle && (trip.status === 'OPEN' || trip.status === 'FULL') && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700">
          Payment via Venmo: <span className="font-semibold">{trip.venmoHandle}</span>
          {trip.priceCents > 0 && ` — ${formatPrice(trip.priceCents)}`}
        </div>
      )}

      {/* Signup section */}
      {!userId ? (
        <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-500 text-center">
          Select a user from the top menu to sign up.
        </div>
      ) : userStatus === 'SIGNED_UP' ? (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <div className="text-green-700 font-semibold mb-0.5">You&apos;re signed up!</div>
            <div className="text-green-600 text-sm">See you on the trail.</div>
          </div>
          {/* Slack link — only show to confirmed members */}
          {trip.slackChannelUrl && (
            <a
              href={trip.slackChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Join Trip Slack Channel
            </a>
          )}
        </div>
      ) : userStatus === 'WAITLISTED' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
          <div className="text-amber-800 font-semibold mb-0.5">You&apos;re on the waitlist</div>
          <div className="text-amber-700 text-sm">
            Position <span className="font-bold">#{waitlistPosition}</span> — we&apos;ll notify you if a spot opens.
          </div>
        </div>
      ) : canSignup ? (
        <SignupButton tripId={trip.id} isFull={trip.status === 'FULL'} />
      ) : (
        <div className="bg-gray-100 rounded-xl p-4 text-center text-sm text-gray-500">
          This trip is not accepting signups.
        </div>
      )}
    </div>
  )
}

function InfoTile({ label, value, sub, subColor = 'text-gray-400' }: {
  label: string; value: string; sub?: string; subColor?: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
      <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900 leading-snug">{value}</div>
      {sub && <div className={`text-[11px] mt-0.5 ${subColor}`}>{sub}</div>}
    </div>
  )
}
