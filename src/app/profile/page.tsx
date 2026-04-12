import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import EditProfileForm from './EditProfileForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My Profile' }

const ROLE_BADGE: Record<string, string> = {
  ADMIN:     'bg-purple-100 text-purple-700',
  TRIP_LEAD: 'bg-blue-100 text-blue-700',
  MEMBER:    'bg-gray-100 text-gray-600',
}

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) notFound()

  const [user, signupCount, gearCount, pastTrips, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, fullName: true, email: true, phone: true,
        emergencyName: true, emergencyPhone: true,
        fieldStudiesId: true, bio: true, role: true, createdAt: true,
      },
    }),
    prisma.tripSignup.count({ where: { userId } }),
    prisma.gearCheckout.count({ where: { userId } }),
    prisma.tripSignup.findMany({
      where: { userId, trip: { endAt: { lt: new Date() } } },
      include: { trip: { select: { id: true, title: true, location: true, endAt: true } } },
      orderBy: { trip: { endAt: 'desc' } },
      take: 5,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ])

  if (!user) notFound()

  return (
    <div className="max-w-lg">
      {/* Avatar + name + role */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_BADGE[user.role]}`}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
            {user.fieldStudiesId && (
              <div className="text-xs text-gray-400 mt-1">ID: {user.fieldStudiesId}</div>
            )}
            {user.bio && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{user.bio}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <EditProfileForm
            profile={{
              fullName: user.fullName,
              phone: user.phone,
              emergencyName: user.emergencyName,
              emergencyPhone: user.emergencyPhone,
              bio: user.bio,
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatTile href="/my-trips"    value={signupCount} label="Trips" />
        <StatTile href="/gear"        value={gearCount}   label="Checkouts" />
        <StatTile href="/notifications" value={unreadCount} label="Unread" />
      </div>

      {/* Contact info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Contact Info</h2>
        <InfoRow label="Email"  value={user.email} />
        <InfoRow label="Phone"  value={user.phone ?? '—'} />
        <InfoRow label="Member since" value={formatDate(user.createdAt)} />
      </div>

      {/* Emergency contact */}
      <div className={`border rounded-2xl p-5 mb-4 ${
        !user.emergencyName ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
      }`}>
        <h2 className="font-semibold text-gray-900 mb-2">Emergency Contact</h2>
        {user.emergencyName ? (
          <>
            <InfoRow label="Name"  value={user.emergencyName} />
            <InfoRow label="Phone" value={user.emergencyPhone ?? '—'} />
          </>
        ) : (
          <p className="text-sm text-amber-700">
            Please add an emergency contact — required before participating in trips.
          </p>
        )}
      </div>

      {/* Past trips */}
      {pastTrips.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Past Trips</h2>
            <Link href="/my-trips" className="text-xs text-green-700 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {pastTrips.map((s) => (
              <Link key={s.id} href={`/trips/${s.tripId}`} className="flex items-center justify-between group">
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-green-700 transition-colors">
                    {s.trip.title}
                  </div>
                  <div className="text-xs text-gray-400">{s.trip.location}</div>
                </div>
                <div className="text-xs text-gray-400">{formatDate(s.trip.endAt)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Settings quick links */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {[
          { href: '/notifications', label: 'Notification Center' },
          { href: '/trips',         label: 'Submit a Trip Idea' },
          { href: '/about',         label: 'FAQ & Contact' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 text-sm text-gray-700"
          >
            {label}
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
        <LogoutButton />
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-gray-400 w-24 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}

function StatTile({ href, value, label }: { href: string; value: number; label: string }) {
  return (
    <Link href={href} className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-center hover:bg-gray-100 transition-colors">
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </Link>
  )
}

// Small client component for logout
import LogoutButtonClient from './LogoutButton'
const LogoutButton = LogoutButtonClient
