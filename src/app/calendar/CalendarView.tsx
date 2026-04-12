'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

export type CalendarTrip = {
  id: string
  title: string
  location: string
  startAt: string // ISO string (serialized from server)
  endAt: string
  status: string
  priceCents: number
  difficulty: string | null
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function statusDotClass(status: string) {
  switch (status) {
    case 'OPEN':   return 'bg-green-500'
    case 'FULL':   return 'bg-red-400'
    case 'CLOSED': return 'bg-gray-300'
    default:       return 'bg-blue-400'
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'OPEN':   return 'bg-green-100 text-green-700'
    case 'FULL':   return 'bg-red-100 text-red-600'
    case 'CLOSED': return 'bg-gray-100 text-gray-500'
    default:       return 'bg-gray-100 text-gray-500'
  }
}

export default function CalendarView({ trips }: { trips: CalendarTrip[] }) {
  const today = new Date()
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())

  // Build grid cells (null = empty leading/trailing cell)
  const firstDow  = new Date(viewYear, viewMonth, 1).getDay()
  const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function tripsStartingOn(day: number): CalendarTrip[] {
    return trips.filter((t) => {
      const s = new Date(t.startAt)
      return s.getFullYear() === viewYear && s.getMonth() === viewMonth && s.getDate() === day
    })
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
    setSelectedDay(null)
  }

  const selectedTrips = selectedDay !== null ? tripsStartingOn(selectedDay) : []

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-gray-900">
          {MONTHS[viewMonth]} {viewYear}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const dayTrips = tripsStartingOn(day)
          const isToday =
            today.getFullYear() === viewYear &&
            today.getMonth() === viewMonth &&
            today.getDate() === day
          const isSelected = selectedDay === day

          return (
            <button
              key={idx}
              onClick={() => setSelectedDay(day === selectedDay ? null : day)}
              className="flex flex-col items-center py-1.5 rounded-xl hover:bg-gray-100 transition-colors min-h-[48px]"
            >
              <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium transition-colors ${
                isSelected
                  ? 'bg-green-600 text-white'
                  : isToday
                  ? 'text-green-700 font-bold'
                  : 'text-gray-700'
              }`}>
                {day}
              </span>
              {/* Trip dots — max 3 */}
              {dayTrips.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayTrips.slice(0, 3).map((t, i) => (
                    <span key={i} className={`w-1 h-1 rounded-full ${statusDotClass(t.status)}`} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        {[['Open', 'bg-green-500'], ['Full', 'bg-red-400'], ['Closed', 'bg-gray-300']].map(([label, cls]) => (
          <div key={label} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            <span className="text-[11px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected day trip list */}
      {selectedDay !== null && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {MONTHS[viewMonth]} {selectedDay}
          </h3>
          {selectedTrips.length === 0 ? (
            <p className="text-sm text-gray-400">No trips starting this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedTrips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm transition-all group"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                      {trip.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{trip.location}</div>
                    {trip.difficulty && (
                      <div className="text-xs text-gray-400 mt-0.5">{trip.difficulty}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full block mb-1 ${statusBadge(trip.status)}`}>
                      {trip.status}
                    </span>
                    <div className="text-xs font-medium text-gray-700">{formatPrice(trip.priceCents)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
