import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { formatDateRange, formatPrice, statusBadgeClass } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type TripWithRoster = Prisma.TripGetPayload<{
  include: {
    _count:  { select: { signups: true; waitlist: true } }
    signups: { include: { user: { select: { fullName: true; email: true; phone: true; isDriver: true } } } }
    waitlist: { include: { user: { select: { fullName: true; email: true; phone: true } } } }
  }
}>

function StepHeaderServer({ current }: { current: number }) {
  const steps = ['Advertising', 'Publish Signups', 'Manage Trip']
  return (
    <div className="flex items-center gap-2 px-12 py-4" style={{ background: '#2a2118' }}>
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div style={{
            width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 10, fontFamily: 'monospace',
            background: i === current ? '#5a7a3a' : 'rgba(255,255,255,.15)',
            color: i === current ? 'white' : 'rgba(255,255,255,.4)',
          }}>{i + 1}</div>
          <span style={{
            fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: i === current ? 'white' : 'rgba(255,255,255,.3)',
          }}>{s}</span>
          {i < 2 && <span style={{ color: 'rgba(255,255,255,.2)', margin: '0 4px' }}>›</span>}
        </div>
      ))}
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', OPEN: 'Signups Open', FULL: 'Full', CLOSED: 'Closed',
}

export default async function ManageTripPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) redirect('/login/lead')

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, fullName: true, email: true, role: true },
  })
  if (!user || (user.role !== 'TRIP_LEAD' && user.role !== 'ADMIN')) redirect('/login/lead')

  const { id } = await params

  const trip: TripWithRoster | null = await prisma.trip.findUnique({
    where:   { id },
    include: {
      _count:  { select: { signups: true, waitlist: true } },
      signups: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { fullName: true, email: true, phone: true, isDriver: true } } },
      },
      waitlist: {
        orderBy: { position: 'asc' },
        include: { user: { select: { fullName: true, email: true, phone: true } } },
      },
    },
  })

  if (!trip) redirect('/lead')

  const spotsLeft = trip.capacity - trip._count.signups
  const fillPct   = Math.min(100, Math.round((trip._count.signups / trip.capacity) * 100))
  const drivers   = trip.signups.filter(s => s.user.isDriver).length

  return (
    <div style={{ background: '#f5efe4', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <StepHeaderServer current={2} />

      {/* Hero */}
      <div className="relative" style={{ height: 200, overflow: 'hidden' }}>
        {trip.imageURL ? (
          <img src={trip.imageURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45)' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#2a2118' }} />
        )}
        <div className="absolute inset-0 flex flex-col justify-end px-12 pb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span style={{
                display: 'inline-block', background: 'rgba(90,122,58,.85)', color: 'white',
                fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '2px 10px', borderRadius: 100, marginBottom: 8,
              }}>{STATUS_LABELS[trip.status] ?? trip.status}</span>
              <h1 style={{ color: 'white', fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{trip.title}</h1>
              <p style={{ color: 'rgba(255,255,255,.7)', margin: '4px 0 0', fontSize: 14 }}>
                {trip.location} · {formatDateRange(trip.startAt, trip.endAt)}
              </p>
            </div>
            <Link href={`/lead/trips/${id}/signups`}
              style={{
                background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)',
                color: 'white', borderRadius: 100, padding: '8px 20px', fontSize: 12,
                fontFamily: 'monospace', textDecoration: 'none', letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>
              Edit Details ↗
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 48px 80px' }}>

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { value: trip._count.signups, label: 'Signed Up', color: '#5a7a3a' },
            { value: trip.capacity,       label: 'Capacity',  color: '#2a2118' },
            { value: drivers,             label: 'Drivers',   color: '#3a6b8a' },
            { value: trip._count.waitlist, label: 'Waitlisted', color: '#8a6b3a' },
          ].map(({ value, label, color }) => (
            <div key={label} style={{ background: 'white', borderRadius: 16, padding: '20px 0', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(42,33,24,.45)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Capacity bar */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'monospace', color: 'rgba(42,33,24,.55)', marginBottom: 8 }}>
            <span>{trip._count.signups} / {trip.capacity} filled</span>
            <span style={{ color: spotsLeft > 0 ? '#5a7a3a' : '#c0392b', fontWeight: 600 }}>
              {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining` : 'Trip Full'}
            </span>
          </div>
          <div style={{ height: 8, background: '#f0ebe3', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${fillPct}%`, background: '#5a7a3a', borderRadius: 100, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2a2118', marginTop: 12 }}>{formatPrice(trip.priceCents)} <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(42,33,24,.45)' }}>per person</span></div>
        </div>

        {/* ── Key Links ── */}
        {(trip.trailLink || trip.outlineDocURL || trip.packListURL || trip.tentCarsSheetURL) && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
            <h2 style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5a7a3a', margin: '0 0 16px' }}>Key Links</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trip.trailLink && (
                <LinkRow label="Campsite / Trail" url={trip.trailLink} />
              )}
              {trip.outlineDocURL && (
                <LinkRow label="Trip Outline Doc" url={trip.outlineDocURL} />
              )}
              {trip.packListURL && (
                <LinkRow label="Pack List" url={trip.packListURL} />
              )}
              {trip.tentCarsSheetURL && (
                <LinkRow label="Tent & Cars Sheet" url={trip.tentCarsSheetURL} />
              )}
            </div>
          </div>
        )}

        {/* ── Roster ── */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <h2 style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5a7a3a', margin: '0 0 16px' }}>
            Roster ({trip.signups.length})
          </h2>
          {trip.signups.length === 0 ? (
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(42,33,24,.4)', textAlign: 'center', padding: '24px 0' }}>No signups yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {trip.signups.map((s, i) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: i < trip.signups.length - 1 ? '1px solid #f0ebe3' : 'none',
                }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#2a2118' }}>{s.user.fullName}</span>
                    <span style={{ fontSize: 12, color: 'rgba(42,33,24,.45)', marginLeft: 8 }}>{s.user.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.user.phone && (
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(42,33,24,.5)' }}>{s.user.phone}</span>
                    )}
                    {s.user.isDriver && (
                      <span style={{
                        fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                        background: '#e8f0e2', color: '#3a6b2a', padding: '2px 8px', borderRadius: 100,
                      }}>Driver</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Waitlist ── */}
        {trip.waitlist.length > 0 && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
            <h2 style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8a6b3a', margin: '0 0 16px' }}>
              Waitlist ({trip.waitlist.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {trip.waitlist.map((w, i) => (
                <div key={w.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: i < trip.waitlist.length - 1 ? '1px solid #f0ebe3' : 'none',
                }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#2a2118' }}>{w.user.fullName}</span>
                    <span style={{ fontSize: 12, color: 'rgba(42,33,24,.45)', marginLeft: 8 }}>{w.user.email}</span>
                  </div>
                  {w.user.phone && (
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(42,33,24,.5)' }}>{w.user.phone}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', borderRadius: 10, background: '#faf8f4', textDecoration: 'none',
      transition: 'background .15s',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.06em', color: 'rgba(42,33,24,.6)', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#3a6b8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{url}</span>
    </a>
  )
}
