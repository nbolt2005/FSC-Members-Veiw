import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDateRange, formatPrice, statusBadgeClass } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', OPEN: 'Signups Open', FULL: 'Full', CLOSED: 'Closed',
}

const STATUS_STEP: Record<string, number> = {
  DRAFT: 1, OPEN: 2, FULL: 2, CLOSED: 2,
}

export default async function TripLibraryPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) redirect('/login/lead')

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, role: true },
  })
  if (!user || (user.role !== 'TRIP_LEAD' && user.role !== 'ADMIN')) redirect('/login/lead')

  const trips = await prisma.trip.findMany({
    where:   { tripLeadId: userId },
    orderBy: { startAt: 'desc' },
    include: { _count: { select: { signups: true } } },
  })

  const drafts   = trips.filter(t => t.status === 'DRAFT')
  const active   = trips.filter(t => t.status === 'OPEN' || t.status === 'FULL')
  const archived = trips.filter(t => t.status === 'CLOSED')

  return (
    <div style={{ background: '#f5efe4', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: '#2a2118', padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>Trip Library</span>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '4px 0 0' }}>Your Trips</h1>
        </div>
        <Link href="/lead/trips/new" style={{
          background: '#5a7a3a', color: 'white', borderRadius: 100,
          padding: '10px 24px', textDecoration: 'none', fontSize: 13,
          fontWeight: 600, letterSpacing: '0.02em',
        }}>
          + Start From Scratch
        </Link>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 48px 80px' }}>

        {/* ── Start From Scratch card (always at top) ── */}
        <Link href="/lead/trips/new" style={{ textDecoration: 'none', display: 'block', marginBottom: 32 }}>
          <div style={{
            border: '2px dashed rgba(90,122,58,.4)', borderRadius: 20, padding: '36px 40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
            cursor: 'pointer', transition: 'border-color .2s, background .2s',
            background: 'rgba(90,122,58,.04)',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#5a7a3a'; (e.currentTarget as HTMLElement).style.background = 'rgba(90,122,58,.08)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(90,122,58,.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(90,122,58,.04)' }}
          >
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏕️</div>
              <h2 style={{ color: '#2a2118', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Start From Scratch</h2>
              <p style={{ color: 'rgba(42,33,24,.55)', fontSize: 13, margin: 0 }}>
                Plan a new overnight trip — set dates, location, budget, and upload a hero photo
              </p>
            </div>
            <div style={{
              background: '#5a7a3a', color: 'white', borderRadius: 100,
              padding: '12px 28px', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              Create Trip →
            </div>
          </div>
        </Link>

        {/* ── In Progress (Drafts) ── */}
        {drafts.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <SectionLabel text={`In Progress (${drafts.length})`} color="#8a6b3a" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {drafts.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  href={`/lead/trips/${trip.id}/signups`}
                  cta="Continue →"
                  ctaColor="#8a6b3a"
                  ctaBg="rgba(138,107,58,.1)"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Active ── */}
        {active.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <SectionLabel text={`Active (${active.length})`} color="#5a7a3a" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {active.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  href={`/lead/trips/${trip.id}`}
                  cta="Manage →"
                  ctaColor="#5a7a3a"
                  ctaBg="rgba(90,122,58,.1)"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Past / Archived ── */}
        {archived.length > 0 && (
          <section>
            <SectionLabel text={`Past (${archived.length})`} color="rgba(42,33,24,.35)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.65 }}>
              {archived.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  href={`/lead/trips/${trip.id}`}
                  cta="View"
                  ctaColor="rgba(42,33,24,.5)"
                  ctaBg="rgba(42,33,24,.06)"
                />
              ))}
            </div>
          </section>
        )}

        {trips.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontFamily: 'monospace', fontSize: 13, color: 'rgba(42,33,24,.4)' }}>
              No trips yet — hit "Start From Scratch" above to create your first one
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <div style={{
      fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.12em',
      textTransform: 'uppercase', color, marginBottom: 12,
    }}>{text}</div>
  )
}

function TripCard({ trip, href, cta, ctaColor, ctaBg }: {
  trip: any; href: string; cta: string; ctaColor: string; ctaBg: string
}) {
  const spotsLeft = trip.capacity - trip._count.signups
  const fillPct   = trip.capacity > 0 ? Math.min(100, Math.round((trip._count.signups / trip.capacity) * 100)) : 0

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white', borderRadius: 16, overflow: 'hidden',
        display: 'flex', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        transition: 'box-shadow .15s',
      }}>
        {/* Photo strip */}
        {trip.imageURL ? (
          <div style={{ width: 90, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            <img src={trip.imageURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ width: 90, flexShrink: 0, background: '#e8e3da', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28 }}>🏕️</span>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(42,33,24,.08)', color: 'rgba(42,33,24,.55)',
                padding: '2px 8px', borderRadius: 100,
              }}>{STATUS_LABELS[trip.status] ?? trip.status}</span>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2a2118', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.title}</h3>
            <p style={{ fontSize: 12, color: 'rgba(42,33,24,.5)', margin: '0 0 8px' }}>
              {trip.location} · {formatDateRange(trip.startAt, trip.endAt)}
            </p>
            {/* Mini fill bar */}
            {trip.status !== 'DRAFT' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 80, height: 4, background: '#f0ebe3', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${fillPct}%`, background: '#5a7a3a', borderRadius: 100 }} />
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(42,33,24,.45)' }}>
                  {trip._count.signups}/{trip.capacity}
                </span>
              </div>
            )}
          </div>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#2a2118' }}>{formatPrice(trip.priceCents)}</span>
            <span style={{
              fontFamily: 'monospace', fontSize: 11, color: ctaColor,
              background: ctaBg, padding: '4px 12px', borderRadius: 100,
            }}>{cta}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
