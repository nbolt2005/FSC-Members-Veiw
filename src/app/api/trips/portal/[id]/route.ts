import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writePortalTripToAirtable, writeToOvernightTracker } from '@/lib/airtable-write'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** GET /api/trips/portal/[id] — fetch a portal trip (trip leads only) */
export async function GET(_req: Request, { params }: Params) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const trip = await prisma.trip.findUnique({ where: { id } })
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  return NextResponse.json({ trip })
}

/** PATCH /api/trips/portal/[id] — update a portal trip */
export async function PATCH(req: Request, { params }: Params) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.trip.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  // Map incoming fields to Prisma shape
  const data: Record<string, any> = {}
  if (body.tripName   != null)  data.title         = body.tripName
  if (body.title      != null)  data.title         = body.title
  if (body.location   != null)  data.location      = body.location
  if (body.blurb      != null)  data.description   = body.blurb
  if (body.description != null) data.description   = body.description
  if (body.startDate  != null)  data.startAt       = new Date(body.startDate)
  if (body.endDate    != null)  data.endAt         = new Date(body.endDate)
  if (body.costPerPerson != null) data.priceCents  = body.costPerPerson * 100
  if (body.status     != null)  data.status        = body.status
  if (body.imageURL   != null)  data.imageURL      = body.imageURL
  if (body.trailLink  != null)  data.trailLink     = body.trailLink
  if (body.outlineDocURL   != null) data.outlineDocURL    = body.outlineDocURL
  if (body.packListURL     != null) data.packListURL      = body.packListURL
  if (body.tentCarsSheetURL != null) data.tentCarsSheetURL = body.tentCarsSheetURL

  const updated = await prisma.trip.update({ where: { id }, data })

  // Sync to Airtable
  const merged = { ...existing, ...updated }
  const payload = {
    title: merged.title, tripName: merged.title,
    location: merged.location, blurb: merged.description,
    startDate: merged.startAt.toISOString().slice(0, 10),
    endDate:   merged.endAt.toISOString().slice(0, 10),
    nights:    merged.nights, capacity: merged.capacity,
    driversNeeded: merged.driversNeeded, imageURL: merged.imageURL,
    costPerPerson: Math.round(merged.priceCents / 100),
    status: merged.status, uniqueTripId: merged.uniqueTripId,
  }
  await Promise.all([
    existing.airtableId    ? writePortalTripToAirtable(payload, existing.airtableId).catch(() => null)    : null,
    existing.fscAirtableId ? writeToOvernightTracker(payload, existing.fscAirtableId).catch(() => null) : null,
  ])

  return NextResponse.json({ trip: updated })
}
