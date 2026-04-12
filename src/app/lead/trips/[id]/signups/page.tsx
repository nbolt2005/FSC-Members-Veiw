'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

function StepHeader({ current }: { current: number }) {
  const steps = ['Advertising', 'Publish Signups', 'Manage Trip']
  return (
    <div className="bg-[#2a2118] px-12 py-4 flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-mono text-[10px] ${i === current ? 'bg-[#5a7a3a] text-white' : 'bg-[rgba(255,255,255,.15)] text-[rgba(255,255,255,.4)]'}`}>{i + 1}</div>
          <span className={`font-mono text-[11px] tracking-[0.08em] uppercase ${i === current ? 'text-white' : 'text-[rgba(255,255,255,.3)]'}`}>{s}</span>
          {i < 2 && <span className="text-[rgba(255,255,255,.2)] mx-1">›</span>}
        </div>
      ))}
    </div>
  )
}

interface TripData {
  id: string
  title: string
  location: string
  description: string | null
  startAt: string
  endAt: string
  priceCents: number
  nights: number
  capacity: number
  driversNeeded: number
  imageURL: string | null
  trailLink: string | null
  outlineDocURL: string | null
  packListURL: string | null
  tentCarsSheetURL: string | null
  status: string
}

export default function PublishSignupsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const tripId = params.id

  const [trip, setTrip] = useState<TripData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Editable fields
  const [tripName, setTripName] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [costPerPerson, setCostPerPerson] = useState(0)
  const [blurb, setBlurb] = useState('')
  const [trailLink, setTrailLink] = useState('')
  const [outlineDocURL, setOutlineDocURL] = useState('')
  const [packListURL, setPackListURL] = useState('')
  const [tentCarsSheetURL, setTentCarsSheetURL] = useState('')

  useEffect(() => {
    fetch(`/api/trips/portal/${tripId}`)
      .then(r => r.json())
      .then(({ trip }) => {
        if (!trip) { setError('Trip not found'); setLoading(false); return }
        setTrip(trip)
        setTripName(trip.title || '')
        setLocation(trip.location || '')
        setStartDate(trip.startAt?.slice(0, 10) || '')
        setEndDate(trip.endAt?.slice(0, 10) || '')
        setCostPerPerson(Math.round((trip.priceCents || 0) / 100))
        setBlurb(trip.description || '')
        setTrailLink(trip.trailLink || '')
        setOutlineDocURL(trip.outlineDocURL || '')
        setPackListURL(trip.packListURL || '')
        setTentCarsSheetURL(trip.tentCarsSheetURL || '')
        setLoading(false)
      })
      .catch(() => { setError('Failed to load trip'); setLoading(false) })
  }, [tripId])

  async function saveDetails() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/trips/portal/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripName, location, startDate, endDate, costPerPerson, blurb, trailLink, outlineDocURL, packListURL, tentCarsSheetURL }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function publish() {
    setPublishing(true)
    setError('')
    try {
      // Save latest details first
      await saveDetails()
      const res = await fetch(`/api/trips/${tripId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripName, location, startDate, endDate, costPerPerson, blurb, trailLink }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Publish failed')
      setSuccess(true)
      setTimeout(() => router.push(`/lead/trips/${tripId}`), 1800)
    } catch (e: any) {
      setError(e.message)
      setPublishing(false)
    }
  }

  if (loading) return (
    <div style={{ background: '#f5efe4', minHeight: '100vh' }} className="flex items-center justify-center">
      <span className="font-mono text-sm text-[rgba(42,33,24,.5)]">Loading trip…</span>
    </div>
  )

  if (error && !trip) return (
    <div style={{ background: '#f5efe4', minHeight: '100vh' }} className="flex items-center justify-center">
      <span className="font-mono text-sm text-red-600">{error}</span>
    </div>
  )

  return (
    <div style={{ background: '#f5efe4', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <StepHeader current={1} />

      {/* Hero strip */}
      {trip?.imageURL && (
        <div className="relative h-36 overflow-hidden">
          <img src={trip.imageURL} alt="" className="w-full h-full object-cover" style={{ filter: 'brightness(0.55)' }} />
          <div className="absolute inset-0 flex items-center px-12">
            <h1 className="text-3xl font-bold text-white tracking-tight">{tripName || 'Untitled Trip'}</h1>
          </div>
        </div>
      )}
      {!trip?.imageURL && (
        <div className="bg-[#2a2118] px-12 py-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">{tripName || 'Untitled Trip'}</h1>
        </div>
      )}

      <div className="px-12 py-10 max-w-3xl mx-auto space-y-10">

        {/* ── Trip Details ── */}
        <section>
          <h2 className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#5a7a3a] mb-4">Trip Details</h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">

            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-[rgba(42,33,24,.5)] mb-1.5">Trip Name</label>
              <input
                className="w-full border-0 border-b border-[rgba(42,33,24,.15)] bg-transparent py-2 text-[#2a2118] text-lg font-semibold focus:outline-none focus:border-[#5a7a3a] transition-colors"
                value={tripName}
                onChange={e => setTripName(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-[rgba(42,33,24,.5)] mb-1.5">Location</label>
              <input
                className="w-full border-0 border-b border-[rgba(42,33,24,.15)] bg-transparent py-2 text-[#2a2118] focus:outline-none focus:border-[#5a7a3a] transition-colors"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-[rgba(42,33,24,.5)] mb-1.5">Start Date</label>
                <input type="date"
                  className="w-full border-0 border-b border-[rgba(42,33,24,.15)] bg-transparent py-2 text-[#2a2118] focus:outline-none focus:border-[#5a7a3a] transition-colors"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-[rgba(42,33,24,.5)] mb-1.5">End Date</label>
                <input type="date"
                  className="w-full border-0 border-b border-[rgba(42,33,24,.15)] bg-transparent py-2 text-[#2a2118] focus:outline-none focus:border-[#5a7a3a] transition-colors"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-[rgba(42,33,24,.5)] mb-1.5">Cost Per Person ($)</label>
              <input type="number" min={0}
                className="w-full border-0 border-b border-[rgba(42,33,24,.15)] bg-transparent py-2 text-[#2a2118] focus:outline-none focus:border-[#5a7a3a] transition-colors"
                value={costPerPerson}
                onChange={e => setCostPerPerson(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-[rgba(42,33,24,.5)] mb-1.5">Hype Description</label>
              <textarea rows={4}
                className="w-full border border-[rgba(42,33,24,.12)] rounded-lg bg-[#faf8f4] px-4 py-3 text-[#2a2118] text-sm resize-none focus:outline-none focus:border-[#5a7a3a] transition-colors"
                value={blurb}
                onChange={e => setBlurb(e.target.value)}
              />
            </div>

          </div>
        </section>

        {/* ── Campsite Confirmation ── */}
        <section>
          <h2 className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#5a7a3a] mb-1">Campsite / Trail Confirmation</h2>
          <p className="text-xs text-[rgba(42,33,24,.5)] mb-4 font-mono">Paste the link to your campsite reservation, permit confirmation, or trail info</p>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <input
              className="w-full border-0 border-b border-[rgba(42,33,24,.15)] bg-transparent py-2 text-[#2a2118] text-sm focus:outline-none focus:border-[#5a7a3a] transition-colors"
              placeholder="https://www.recreation.gov/…"
              value={trailLink}
              onChange={e => setTrailLink(e.target.value)}
            />
          </div>
        </section>

        {/* ── Trip Documents ── */}
        <section>
          <h2 className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#5a7a3a] mb-1">Trip Documents</h2>
          <p className="text-xs text-[rgba(42,33,24,.5)] mb-4 font-mono">Paste Google Drive or Notion URLs for your trip docs (optional — can be added later)</p>
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">

            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-[rgba(42,33,24,.5)] mb-1.5">Trip Outline Doc</label>
              <input
                className="w-full border-0 border-b border-[rgba(42,33,24,.15)] bg-transparent py-2 text-[#2a2118] text-sm focus:outline-none focus:border-[#5a7a3a] transition-colors"
                placeholder="https://docs.google.com/…"
                value={outlineDocURL}
                onChange={e => setOutlineDocURL(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-[rgba(42,33,24,.5)] mb-1.5">Pack List</label>
              <input
                className="w-full border-0 border-b border-[rgba(42,33,24,.15)] bg-transparent py-2 text-[#2a2118] text-sm focus:outline-none focus:border-[#5a7a3a] transition-colors"
                placeholder="https://docs.google.com/…"
                value={packListURL}
                onChange={e => setPackListURL(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-[rgba(42,33,24,.5)] mb-1.5">Tent & Cars Sheet</label>
              <input
                className="w-full border-0 border-b border-[rgba(42,33,24,.15)] bg-transparent py-2 text-[#2a2118] text-sm focus:outline-none focus:border-[#5a7a3a] transition-colors"
                placeholder="https://docs.google.com/…"
                value={tentCarsSheetURL}
                onChange={e => setTentCarsSheetURL(e.target.value)}
              />
            </div>

          </div>
        </section>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700 font-mono">
            {error}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center gap-4 pb-16">
          <button
            onClick={saveDetails}
            disabled={saving || publishing}
            className="px-8 py-3 rounded-full border border-[rgba(42,33,24,.25)] text-[#2a2118] font-mono text-sm hover:bg-[rgba(42,33,24,.06)] transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>

          <button
            onClick={publish}
            disabled={saving || publishing}
            className="flex-1 py-3.5 rounded-full font-semibold text-white text-sm tracking-wide transition-all disabled:opacity-40"
            style={{ background: publishing ? 'rgba(90,122,58,.6)' : '#5a7a3a' }}
          >
            {publishing ? 'Publishing…' : 'Publish Signups →'}
          </button>
        </div>

      </div>

      {/* ── Success overlay ── */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(42,33,24,.65)' }}>
          <div className="bg-white rounded-3xl px-12 py-10 text-center max-w-sm mx-4 shadow-2xl">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-[#2a2118] mb-2">Signups Open!</h2>
            <p className="text-sm text-[rgba(42,33,24,.6)] font-mono">Your trip is now live. Taking you to the manage view…</p>
          </div>
        </div>
      )}
    </div>
  )
}
