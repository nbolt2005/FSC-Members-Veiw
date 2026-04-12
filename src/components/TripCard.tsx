import Link from 'next/link'
import {
  formatDateRange,
  formatPrice,
  statusBadgeClass,
  difficultyBadgeClass,
  difficultyBarClass,
} from '@/lib/utils'

type TripCardProps = {
  trip: {
    id: string
    title: string
    location: string
    startAt: Date | string
    endAt: Date | string
    capacity: number
    priceCents: number
    status: string
    difficulty: string | null
    mileage: number | null
    _count: { signups: number; waitlist: number }
  }
}

export default function TripCard({ trip }: TripCardProps) {
  const spotsLeft = trip.capacity - trip._count.signups

  return (
    <Link href={`/trips/${trip.id}`} className="group block h-full">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-full flex flex-col hover:shadow-md hover:border-gray-300 transition-all duration-200">

        {/* Top colour bar — encodes difficulty at a glance */}
        <div className={`h-1.5 flex-shrink-0 ${difficultyBarClass(trip.difficulty)}`} />

        <div className="p-4 flex flex-col flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors leading-snug">
              {trip.title}
            </h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusBadgeClass(trip.status)}`}>
              {trip.status === 'OPEN' ? 'Open'
                : trip.status === 'FULL' ? 'Full'
                : trip.status === 'CLOSED' ? 'Closed'
                : 'Draft'}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{trip.location}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDateRange(trip.startAt, trip.endAt)}</span>
          </div>

          {/* Footer */}
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
              {spotsLeft > 0 && (
                <div className="text-[11px] text-gray-400">{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</div>
              )}
              {spotsLeft <= 0 && trip._count.waitlist > 0 && (
                <div className="text-[11px] text-red-500">{trip._count.waitlist} on waitlist</div>
              )}
              {spotsLeft <= 0 && trip._count.waitlist === 0 && (
                <div className="text-[11px] text-red-400">Full</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
