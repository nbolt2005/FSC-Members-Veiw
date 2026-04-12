import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writePortalTripToAirtable, writeToOvernightTracker } from '@/lib/airtable-write'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, fullName: true, email: true, role: true },
  })
  if (!user || (user.role !== 'TRIP_LEAD' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Trip leads only' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      tripName, tripType, location, startDate, endDate,
      nights, capacity, driversNeeded, blurb, imageURL,
      costPerPerson, gasPerCar,
      distance, campsite, permits, mealsIncluded, mealsBudget, insurance, misc,
    } = body

    // Build a slug: "SykesHotSprings260412"
    const slug      = (tripName || 'Trip').replace(/\s+/g, '')
    const dateSlug  = (startDate || '').replace(/-/g, '').slice(2)
    const uniqueTripId = `${slug}${dateSlug}`

    // Sync to both Airtable bases before creating in Neon so IDs are available
    const airtablePayload = {
      title: tripName, tripName, tripType, location,
      startDate, endDate, nights: nights ?? 0,
      capacity: capacity ?? 0, driversNeeded: driversNeeded ?? 0,
      blurb, imageURL, leadName: user.fullName, leadEmail: user.email,
      status: 'DRAFT', costPerPerson: costPerPerson ?? 0, gasPerCar: gasPerCar ?? 0,
      uniqueTripId,
    }

    const [airtableId, fscAirtableId] = await Promise.all([
      writePortalTripToAirtable(airtablePayload).catch(() => null),
      writeToOvernightTracker(airtablePayload).catch(() => null),
    ])

    const trip = await prisma.trip.create({
      data: {
        title:         tripName,
        location:      location || '',
        description:   blurb || '',
        startAt:       new Date(startDate),
        endAt:         new Date(endDate || startDate),
        capacity:      capacity ?? 10,
        priceCents:    (costPerPerson ?? 0) * 100,
        status:        'DRAFT',
        tripLeadId:    user.id,
        imageURL,
        nights:        nights ?? 0,
        driversNeeded: driversNeeded ?? 0,
        gasPerCar:     gasPerCar ?? 0,
        distance:      distance ?? 0,
        campsite:      campsite ?? 0,
        permits:       permits ?? 0,
        mealsIncluded: Boolean(mealsIncluded),
        mealsBudget:   mealsBudget ?? 0,
        insurance:     insurance !== false,
        misc:          misc ?? 0,
        uniqueTripId,
        airtableId:    airtableId ?? undefined,
        fscAirtableId: fscAirtableId ?? undefined,
      },
    })

    return NextResponse.json({ tripId: trip.id })
  } catch (err: any) {
    console.error('Create trip error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
