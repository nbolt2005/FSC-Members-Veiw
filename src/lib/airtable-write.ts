// ── Airtable write helpers ────────────────────────────────────────────────
// These are write-only; reading stays in the sync route.

const FSC_BASE    = process.env.AIRTABLE_BASE_ID_FSC!
const PORTAL_BASE = process.env.AIRTABLE_BASE_ID_TRIPLEAD!
const API_KEY     = process.env.AIRTABLE_API_KEY!

function clean(fields: Record<string, any>) {
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v != null && v !== '' && v !== 0))
}

/** Write/update a trip in the TRIPLEAD Airtable base (FIELD STUDIES CP 2025-2026) */
export async function writePortalTripToAirtable(
  data: Record<string, any>,
  recordId?: string
): Promise<string | null> {
  const fields = clean({
    'Trip Name':       data.title       || data.tripName,
    'Trip Type':       data.tripType,
    'Location':        data.location,
    'Start Date':      data.startDate   || data.startAt?.toString().slice(0, 10),
    'End Date':        data.endDate     || data.endAt?.toString().slice(0, 10),
    'Nights':          data.nights,
    'Capacity':        data.capacity,
    'Drivers Needed':  data.driversNeeded,
    'Lead Name':       data.leadName,
    'Lead Email':      data.leadEmail,
    'Status':          data.status,
    'Cost Per Person': data.costPerPerson ?? Math.round((data.priceCents ?? 0) / 100),
    'Gas Per Car':     data.gasPerCar,
    'Blurb':           data.blurb       || data.description,
    'Image URL':       data.imageURL    ? [{ url: data.imageURL }] : undefined,
    'Unique Trip ID':  data.uniqueTripId,
  })

  const base = `https://api.airtable.com/v0/${PORTAL_BASE}/${encodeURIComponent('FIELD STUDIES CP 2025-2026')}`
  const url  = recordId ? `${base}/${recordId}` : base
  const res  = await fetch(url, {
    method:  recordId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(recordId ? { fields } : { records: [{ fields }] }),
  })
  if (!res.ok) { console.error('TRIPLEAD write error:', await res.text()); return null }
  const json = await res.json()
  return recordId ?? json.records?.[0]?.id ?? null
}

/** Write/update a trip in the FSC main base Overnight Trip Tracker */
export async function writeToOvernightTracker(
  data: Record<string, any>,
  recordId?: string
): Promise<string | null> {
  const statusMap: Record<string, string> = { OPEN: 'Signups Open', SignupsOpen: 'Signups Open' }
  const fields = clean({
    'Trip Name':                   data.title         || data.tripName,
    'Start Date':                  data.startDate     || data.startAt?.toString().slice(0, 10),
    'End Date':                    data.endDate       || data.endAt?.toString().slice(0, 10),
    '# of Nights':                 data.nights,
    'Capacity (Including leads)':  data.capacity,
    'Additional Drivers Required': data.driversNeeded,
    'Trip Lead Name':              data.leadName,
    'Trip Status':                 statusMap[data.status] || data.status,
    'Blurb for Field Notes':       data.blurb         || data.description,
    'Unique Trip ID':              data.uniqueTripId,
    'Image URL':                   data.imageURL      ? [{ url: data.imageURL }] : undefined,
  })

  const base = `https://api.airtable.com/v0/${FSC_BASE}/${encodeURIComponent('Overnight Trip Tracker')}`
  const url  = recordId ? `${base}/${recordId}` : base
  const res  = await fetch(url, {
    method:  recordId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(recordId ? { fields } : { records: [{ fields }] }),
  })
  if (!res.ok) { console.error('Overnight tracker write error:', await res.text()); return null }
  const json = await res.json()
  return recordId ?? json.records?.[0]?.id ?? null
}
