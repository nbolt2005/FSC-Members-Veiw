'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'email' | 'confirm'

type Preview = {
  fullName: string
  slackName: string | null
  hasPhone: boolean
  isDriver: boolean
}

export default function MemberLoginForm() {
  const router = useRouter()

  const [step, setStep]       = useState<Step>('email')
  const [email, setEmail]     = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [phone, setPhone]     = useState('')
  const [isDriver, setIsDriver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Step 1: look up the email, get preview
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res  = await fetch('/api/auth/login/member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    setPreview(data.preview)
    setIsDriver(data.preview.isDriver)
    setStep('confirm')
    setLoading(false)
  }

  // Step 2: confirm identity + save phone/driver
  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res  = await fetch('/api/auth/login/member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone: phone || undefined, isDriver, confirm: true }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    router.push('/member')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      {/* Back */}
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Member Sign In</h1>
        <p className="text-sm text-gray-500 mt-1">
          {step === 'email' ? 'Enter the email you used to join FSC' : 'Confirm your info'}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {/* ── Step 1: Email ── */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Your Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Looking up…' : 'Continue'}
            </button>
          </form>
        )}

        {/* ── Step 2: Confirm + collect phone/driver ── */}
        {step === 'confirm' && preview && (
          <form onSubmit={handleConfirm} className="space-y-4">
            {/* Identity confirmation */}
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <p className="text-xs text-green-600 font-medium mb-0.5">Signing in as</p>
              <p className="font-semibold text-gray-900">{preview.fullName}</p>
              {preview.slackName && preview.slackName !== preview.fullName && (
                <p className="text-sm text-gray-500">Slack: {preview.slackName}</p>
              )}
            </div>

            {/* Phone number */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Phone Number
                {!preview.hasPhone && (
                  <span className="ml-1.5 text-amber-600 font-normal">(required — not on file)</span>
                )}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 867-5309"
                required={!preview.hasPhone}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {preview.hasPhone && (
                <p className="text-xs text-gray-400 mt-1">Leave blank to keep your existing number</p>
              )}
            </div>

            {/* Driver toggle */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Are you able to drive on trips?
              </label>
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setIsDriver(val)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      isDriver === val
                        ? val
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'bg-gray-800 border-gray-800 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {val ? 'Yes, I can drive' : "No / No car"}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setStep('email'); setError(null) }}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
