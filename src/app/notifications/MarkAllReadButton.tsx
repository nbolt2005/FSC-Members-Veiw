'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function MarkAllReadButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    await fetch('/api/notifications/read', { method: 'PUT' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-sm font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
    >
      {loading ? 'Marking…' : 'Mark all read'}
    </button>
  )
}
