import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writePortalTripToAirtable, writeToOvernightTracker } from '@/lib/airtable-write'

export const dynamic = 'force-dynamic'

const FSC_BASE = process.env.AIRTABLE_BASE_ID_FSC!
const API_KEY  = process.env.AIRTABLE_API_KEY!

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { tripName, blurb, startDate, endDate, location, costPerPerson, trailLink } = body

  const existing = await prisma.trip.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  // Update Neon
  const updated = await prisma.trip.update({
    where: { id },
    data: {
      title:       tripName || existing.title,
      description: blurb    || existing.description,
      startAt:     startDate ? new Date(startDate) : existing.startAt,
      endAt:       endDate   ? new Date(endDate)   : existing.endAt,
      location:    location  || existing.location,
      priceCents:  costPerPerson != null ? costPerPerson * 100 : existing.priceCents,
      trailLink:   trailLink || existing.trailLink,
      status:      'OPEN',
    },
  })

  // Sync to Airtable bases
  const payload = {
    title: updated.title, tripName: updated.title,
    location: updated.location, blurb: updated.description,
    startDate: updated.startAt.toISOString().slice(0, 10),
    endDate:   updated.endAt.toISOString().slice(0, 10),
    nights: updated.nights, capacity: updated.capacity,
    driversNeeded: updated.driversNeeded, imageURL: updated.imageURL,
    costPerPerson: Math.round(updated.priceCents / 100),
    status: 'OPEN', uniqueTripId: updated.uniqueTripId,
  }
  await Promise.all([
    existing.airtableId    ? writePortalTripToAirtable(payload, existing.airtableId).catch(() => null)    : null,
    existing.fscAirtableId ? writeToOvernightTracker(payload, existing.fscAirtableId).catch(() => null) : null,
  ])

  // POST to FSC base → Overnight Trip Outlines (budget data)
  if (FSC_BASE && API_KEY) {
    const outlineFields = {
      'Location':                                          updated.location,
      'Number of Nights':                                  updated.nights,
      'Total Miles/Distance (to and from Location)':       updated.distance,
      'Total Campsite Cost':                               updated.campsite,
      'Permit/Entrance Fee Cost per Person':               updated.permits,
      'Max number of Participants (Including Trip Leads)': updated.capacity,
      'Number of Cars/Drivers Needed':                     updated.driversNeeded,
      'Extras Per Person (Ferry Costs, Other Costs)':      updated.misc,
      'Link to Trail/Campground/Info':                     updated.trailLink || '',
    }
    await fetch(
      `https://api.airtable.com/v0/${FSC_BASE}/Overnight%20Trip%20Outlines`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: outlineFields }),
      }
    ).catch(() => null)
  }

  return NextResponse.json({ ok: true })
}
