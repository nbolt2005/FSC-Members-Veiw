'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  tripId: string
  isFull: boolean
}

export default function SignupButton({ tripId, isFull }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSignup() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/trips/${tripId}/signup`, { method: 'POST' })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        // Refresh the server component so the page reflects the new state
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSignup}
        disabled={loading}
        className={`w-full py-3 px-6 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          isFull
            ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700'
            : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
        }`}
      >
        {loading
          ? 'Processing…'
          : isFull
          ? 'Join Waitlist'
          : 'Sign Up for This Trip'}
      </button>

      {error && (
        <p className="text-red-600 text-sm text-center">{error}</p>
      )}
    </div>
  )
}
