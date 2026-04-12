'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const TRIP_TYPES = ['Backpacking', 'Camping', 'Mountaineering', 'Skiing', 'Bikepacking', 'Big Trips!', 'Other']
const TRIP_EMOJI: Record<string, string> = {
  Backpacking: '🎒', Camping: '⛺', Mountaineering: '🧗', Skiing: '⛷️',
  Bikepacking: '🚴', 'Big Trips!': '🌍', Other: '🏕️',
}
const TRIP_IMAGES: Record<string, string> = {
  Backpacking:    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80',
  Camping:        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80',
  Mountaineering: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&q=80',
  Skiing:         'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=80',
  Bikepacking:    'https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=1200&q=80',
  'Big Trips!':   'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
  Other:          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
}

function BudgetRow({ label, value, onChange, min = 0, max = 500, step = 1, prefix = '', suffix = '' }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; prefix?: string; suffix?: string
}) {
  return (
    <div className="grid items-center gap-3 mb-3.5" style={{ gridTemplateColumns: '160px 1fr 80px' }}>
      <span className="font-mono text-[11px] text-[rgba(42,33,24,.6)] tracking-[0.04em]">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="accent-[#5a7a3a]" />
      <span className="font-mono text-xs text-[#2a2118] text-right">{prefix}{value.toLocaleString()}{suffix}</span>
    </div>
  )
}

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

function NewTripForm() {
  const router      = useRouter()
  const searchParams = useSearchParams()

  const [tripName,  setTripName]  = useState(searchParams.get('name')     || '')
  const [tripType,  setTripType]  = useState(searchParams.get('type')     || 'Backpacking')
  const [location,  setLocation]  = useState(searchParams.get('location') || '')
  const [startDate, setStartDate] = useState(searchParams.get('start')    || '')
  const [endDate,   setEndDate]   = useState(searchParams.get('end')      || '')
  const [blurb,     setBlurb]     = useState(searchParams.get('blurb')    || '')
  const [imageURL,  setImageURL]  = useState(searchParams.get('image')    || '')

  const [capacity,      setCapacity]      = useState(Number(searchParams.get('capacity')) || 10)
  const [nights,        setNights]        = useState(Number(searchParams.get('nights'))   || 2)
  const [drivers,       setDrivers]       = useState(2)
  const [distance,      setDistance]      = useState(150)
  const [campsite,      setCampsite]      = useState(0)
  const [permits,       setPermits]       = useState(0)
  const [mealsIncluded, setMealsIncluded] = useState(false)
  const [mealsBudget,   setMealsBudget]   = useState(0)
  const [insurance,     setInsurance]     = useState(true)
  const [misc,          setMisc]          = useState(0)

  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')
  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState('')
  const [dragOver,     setDragOver]     = useState(false)

  async function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    setUploadError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res  = await fetch('/api/upload', { method: 'POST', body: form })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (data.url) setImageURL(data.url)
      else setUploadError(data.error || `Upload failed (${res.status})`)
    } catch (e: any) {
      setUploadError('Upload failed: ' + e.message)
    }
    setUploading(false)
  }

  const budget = useMemo(() => {
    const gasPerCar    = distance * 0.30
    const totalGas     = gasPerCar * drivers
    const gasPerPerson = capacity > 0 ? totalGas / capacity : 0
    const mealPP       = mealsIncluded ? (capacity > 0 ? mealsBudget / capacity : 0) : 0
    const insurancePP  = insurance ? 5 : 0
    const campsitePP   = capacity > 0 ? campsite / capacity : 0
    const permitsPP    = capacity > 0 ? permits  / capacity : 0
    const miscPP       = capacity > 0 ? misc     / capacity : 0
    const costPerPerson = Math.ceil(gasPerPerson + mealPP + insurancePP + campsitePP + permitsPP + miscPP)
    return {
      gas: Math.round(gasPerPerson), meals: Math.round(mealPP),
      insurance: insurancePP, campsite: Math.round(campsitePP),
      permits: Math.round(permitsPP), misc: Math.round(miscPP),
      costPerPerson, totalTrip: costPerPerson * capacity,
      gasPerCar: Math.round(gasPerCar),
    }
  }, [capacity, drivers, distance, campsite, permits, mealsIncluded, mealsBudget, insurance, misc])

  async function handleCreate() {
    if (!tripName.trim()) { setError('Trip name is required'); return }
    if (!startDate)        { setError('Start date is required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res  = await fetch('/api/trips/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripName, tripType, location, startDate, endDate,
          nights, capacity, driversNeeded: drivers,
          costPerPerson: budget.costPerPerson, gasPerCar: budget.gasPerCar,
          distance, campsite, permits, mealsIncluded, mealsBudget, insurance, misc,
          blurb, imageURL, status: 'DRAFT',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create trip')
      router.push(`/lead/trips/${data.tripId}/signups`)
    } catch (e: any) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  const heroImg = imageURL || TRIP_IMAGES[tripType] || TRIP_IMAGES.Other

  return (
    <div className="min-h-screen bg-[#f5efe4]">
      <StepHeader current={0} />

      <div className="max-w-[780px] mx-auto px-6 py-12 pb-32">

        {/* Hero photo */}
        <div className="h-[260px] rounded-[20px] overflow-hidden mb-7 relative"
          style={{ backgroundImage: `url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(42,33,24,.65) 0%, transparent 55%)' }} />
          <div className="absolute bottom-4 left-5 right-5 flex gap-1.5 flex-wrap">
            {TRIP_TYPES.map(t => (
              <button key={t} onClick={() => setTripType(t)}
                className="px-3 py-1 rounded-full border-0 cursor-pointer font-mono text-[10px] text-white tracking-[0.06em] transition-all"
                style={{ background: tripType === t ? '#5a7a3a' : 'rgba(255,255,255,.18)' }}>
                {TRIP_EMOJI[t]} {t}
              </button>
            ))}
          </div>
        </div>

        {/* Photo upload */}
        <div className="mb-5">
          <label className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(42,33,24,.45)] mb-1.5">Trip Photo (optional)</label>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f) }}
            onClick={() => document.getElementById('photo-upload')?.click()}
            className="rounded-xl p-5 text-center cursor-pointer transition-all border-2 border-dashed"
            style={{ borderColor: dragOver ? '#5a7a3a' : 'rgba(42,33,24,.2)', background: dragOver ? 'rgba(90,122,58,.05)' : '#fff' }}>
            <input id="photo-upload" type="file" accept="image/*" capture="environment"
              className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }} />
            {uploading ? (
              <p className="font-mono text-xs text-[rgba(42,33,24,.45)] m-0">Uploading…</p>
            ) : imageURL ? (
              <div className="flex items-center gap-3 justify-center">
                <img src={imageURL} alt="preview" className="w-12 h-12 rounded-lg object-cover" />
                <span className="font-mono text-[11px] text-[#5a7a3a]">Photo uploaded ✓</span>
                <button onClick={e => { e.stopPropagation(); setImageURL('') }}
                  className="border-0 bg-transparent cursor-pointer font-mono text-[11px] text-[rgba(42,33,24,.4)]">Remove</button>
              </div>
            ) : (
              <div>
                <p className="font-mono text-[13px] text-[rgba(42,33,24,.5)] m-0 mb-1">📷 Drop a photo here or tap to choose</p>
                <p className="font-mono text-[10px] text-[rgba(42,33,24,.3)] m-0">Supports screenshots, camera roll, any image</p>
              </div>
            )}
          </div>
          {uploadError && <p className="font-mono text-[11px] text-[#7a2020] mt-1.5">{uploadError}</p>}
        </div>

        {/* Trip title */}
        <div className="mb-5">
          <label className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(42,33,24,.45)] mb-2">Trip Title</label>
          <input value={tripName} onChange={e => setTripName(e.target.value)}
            placeholder="Sykes Hot Springs · Big Sur"
            className="w-full px-5 py-3.5 rounded-[14px] border border-[rgba(42,33,24,.15)] bg-white font-serif text-[26px] text-[#2a2118] box-border" />
        </div>

        {/* Date / location / cost row */}
        <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          {[
            { label: 'Start Date', node: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2.5 rounded-[10px] border border-[rgba(42,33,24,.15)] bg-white font-mono text-xs text-[#2a2118] box-border" /> },
            { label: 'End Date',   node: <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)}   className="w-full px-3 py-2.5 rounded-[10px] border border-[rgba(42,33,24,.15)] bg-white font-mono text-xs text-[#2a2118] box-border" /> },
            { label: 'Location',   node: <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Big Sur, CA" className="w-full px-3 py-2.5 rounded-[10px] border border-[rgba(42,33,24,.15)] bg-white font-mono text-xs text-[#2a2118] box-border" /> },
            { label: 'Cost / Person', node: <div className="px-3 py-2.5 rounded-[10px] border border-[rgba(90,122,58,.3)] bg-[#f0f5ea] font-serif text-xl text-[#3a6020] text-center">${budget.costPerPerson}</div> },
          ].map(({ label, node }) => (
            <div key={label}>
              <label className="block font-mono text-[10px] tracking-[0.10em] uppercase text-[rgba(42,33,24,.45)] mb-1.5">{label}</label>
              {node}
            </div>
          ))}
        </div>

        {/* Capacity + Nights sliders */}
        <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {[
            { label: 'Capacity', value: capacity, onChange: setCapacity, min: 2, max: 40, suffix: ' ppl' },
            { label: 'Nights',   value: nights,   onChange: setNights,   min: 1, max: 14, suffix: 'n' },
          ].map(({ label, value, onChange, min, max, suffix }) => (
            <div key={label}>
              <label className="block font-mono text-[10px] tracking-[0.10em] uppercase text-[rgba(42,33,24,.45)] mb-2">{label}</label>
              <div className="flex items-center gap-2.5">
                <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="flex-1 accent-[#5a7a3a]" />
                <span className="font-mono text-xs text-[#2a2118] min-w-[48px] text-right">{value}{suffix}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Hype description */}
        <div className="mb-10">
          <label className="block font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(42,33,24,.45)] mb-2">Hype Description</label>
          <textarea value={blurb} onChange={e => setBlurb(e.target.value)} rows={4}
            placeholder="Make it exciting! What makes this trip special? What will people experience?"
            className="w-full px-4 py-3.5 rounded-[14px] border border-[rgba(42,33,24,.15)] bg-white font-serif text-[15px] text-[#2a2118] resize-y leading-relaxed box-border" />
        </div>

        {/* ── Budget Calculator ── */}
        <div className="bg-white rounded-[20px] p-8 border border-[rgba(42,33,24,.08)] mb-9">
          <div className="flex justify-between items-start mb-7">
            <div>
              <h2 className="font-serif text-xl text-[#2a2118] font-normal mb-1">Budget Calculator</h2>
              <p className="font-mono text-[10px] text-[rgba(42,33,24,.4)] tracking-[0.08em]">Drag sliders · cost updates live</p>
            </div>
            <div className="text-right">
              <div className="font-serif text-[40px] text-[#5a7a3a] leading-none">${budget.costPerPerson}</div>
              <div className="font-mono text-[10px] text-[rgba(42,33,24,.4)] tracking-[0.08em] uppercase mt-1">per person</div>
            </div>
          </div>

          <BudgetRow label="Capacity"          value={capacity} onChange={setCapacity} min={2}  max={40}   suffix=" ppl" />
          <BudgetRow label="Nights"            value={nights}   onChange={setNights}   min={1}  max={14}   suffix="n" />
          <BudgetRow label="Drivers needed"    value={drivers}  onChange={setDrivers}  min={1}  max={10}   suffix=" cars" />
          <BudgetRow label="Distance (rt mi)"  value={distance} onChange={setDistance} min={0}  max={1200} step={10} suffix=" mi" />
          <BudgetRow label="Campsite total"    value={campsite} onChange={setCampsite} min={0}  max={600}  step={5}  prefix="$" />
          <BudgetRow label="Permits total"     value={permits}  onChange={setPermits}  min={0}  max={400}  step={5}  prefix="$" />

          {/* Meals toggle */}
          <div className="grid items-center gap-3 mb-3.5" style={{ gridTemplateColumns: '160px 1fr 80px' }}>
            <span className="font-mono text-[11px] text-[rgba(42,33,24,.6)] tracking-[0.04em]">Meals included</span>
            <button onClick={() => setMealsIncluded(!mealsIncluded)}
              className="w-11 h-6 rounded-full border-0 cursor-pointer relative transition-all"
              style={{ background: mealsIncluded ? '#5a7a3a' : 'rgba(42,33,24,.2)' }}>
              <div className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
                style={{ left: mealsIncluded ? '23px' : '3px' }} />
            </button>
            <span className="font-mono text-[11px] text-[rgba(42,33,24,.4)] text-right">{mealsIncluded ? 'on' : 'off'}</span>
          </div>
          {mealsIncluded && (
            <div className="grid items-center gap-3 mb-3.5" style={{ gridTemplateColumns: '160px 1fr 80px' }}>
              <span className="font-mono text-[11px] text-[rgba(42,33,24,.6)] tracking-[0.04em]">Meals budget (total)</span>
              <input type="number" min={0} value={mealsBudget} onChange={e => setMealsBudget(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border border-[rgba(42,33,24,.15)] bg-[#f5efe4] font-mono text-xs text-[#2a2118]" />
              <span className="font-mono text-xs text-[#2a2118] text-right">${mealsBudget}</span>
            </div>
          )}
          <BudgetRow label="Misc costs" value={misc} onChange={setMisc} min={0} max={600} step={5} prefix="$" />

          {/* Insurance */}
          <div className="flex items-center justify-between mb-7 pt-1">
            <span className="font-mono text-[11px] text-[rgba(42,33,24,.6)] tracking-[0.04em]">Injury Insurance ($5/person)</span>
            <button onClick={() => setInsurance(!insurance)}
              className="w-11 h-6 rounded-full border-0 cursor-pointer relative transition-all"
              style={{ background: insurance ? '#5a7a3a' : 'rgba(42,33,24,.2)' }}>
              <div className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
                style={{ left: insurance ? '23px' : '3px' }} />
            </button>
          </div>

          {/* Breakdown */}
          <div className="border-t border-[rgba(42,33,24,.08)] pt-5">
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(42,33,24,.4)] mb-3">Breakdown / Person</p>
            {([['Gas', budget.gas], ['Meals', budget.meals], ['Campsite', budget.campsite], ['Permits', budget.permits], ['Insurance', budget.insurance], ['Misc', budget.misc]] as [string, number][])
              .filter(([, v]) => v > 0)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between mb-1.5">
                  <span className="font-mono text-[11px] text-[rgba(42,33,24,.55)]">{label}</span>
                  <span className="font-mono text-[11px] text-[#2a2118]">${value}</span>
                </div>
              ))}
            <div className="flex justify-between border-t border-[rgba(42,33,24,.12)] pt-2.5 mt-2.5">
              <span className="font-mono text-xs text-[#2a2118]">Total / Person</span>
              <span className="font-serif text-xl text-[#5a7a3a]">${budget.costPerPerson}</span>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="font-mono text-[10px] text-[rgba(42,33,24,.4)]">Total trip cost ({capacity} ppl)</span>
              <span className="font-mono text-[11px] text-[rgba(42,33,24,.55)]">${budget.totalTrip.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-[#fde8e8] border border-[#f5a0a0] rounded-[10px] px-4 py-3 mb-4 font-mono text-xs text-[#7a2020]">
            {error}
          </div>
        )}

        <button onClick={handleCreate} disabled={submitting}
          className="w-full py-[18px] rounded-[16px] border-0 font-mono text-sm tracking-[0.12em] uppercase cursor-pointer text-white transition-all"
          style={{ background: submitting ? 'rgba(90,122,58,.5)' : '#5a7a3a' }}>
          {submitting ? 'Creating Trip…' : 'Publish for Advertising →'}
        </button>
        <p className="font-mono text-[10px] text-[rgba(42,33,24,.35)] text-center mt-2.5">
          Saves your trip and moves to the signup setup step.
        </p>
      </div>
    </div>
  )
}

export default function NewTripPage() {
  return <Suspense><NewTripForm /></Suspense>
}
