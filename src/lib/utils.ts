/** Format a Date as "Mon, Jan 13" */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Format a date range. Shows single date if start and end are the same day. */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start)
  const e = new Date(end)
  if (s.toDateString() === e.toDateString()) return formatDate(s)
  return `${formatDate(s)} – ${formatDate(e)}`
}

/**
 * Format price in cents as a dollar string.
 * 0 → "Free", 1500 → "$15", 1550 → "$15.50"
 */
export function formatPrice(cents: number): string {
  if (cents === 0) return 'Free'
  const dollars = cents / 100
  return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`
}

/** Tailwind classes for a TripStatus badge */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'OPEN':   return 'bg-green-100 text-green-800'
    case 'FULL':   return 'bg-red-100 text-red-700'
    case 'CLOSED': return 'bg-gray-100 text-gray-600'
    case 'DRAFT':  return 'bg-yellow-100 text-yellow-800'
    default:       return 'bg-gray-100 text-gray-600'
  }
}

/** Tailwind classes for a difficulty badge */
export function difficultyBadgeClass(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':      return 'bg-emerald-100 text-emerald-800'
    case 'moderate':  return 'bg-amber-100 text-amber-800'
    case 'strenuous': return 'bg-red-100 text-red-700'
    default:          return 'bg-gray-100 text-gray-600'
  }
}

/** Colour bar class for trip card top stripe */
export function difficultyBarClass(difficulty: string | null): string {
  switch (difficulty?.toLowerCase()) {
    case 'easy':      return 'bg-emerald-400'
    case 'moderate':  return 'bg-amber-400'
    case 'strenuous': return 'bg-red-400'
    default:          return 'bg-green-400'
  }
}
