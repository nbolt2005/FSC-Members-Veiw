import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const FSC_BASE  = process.env.AIRTABLE_BASE_ID_FSC!
const API_KEY   = process.env.AIRTABLE_API_KEY!
const SYNC_SECRET = process.env.SYNC_SECRET

// ── Fetch all pages from Airtable ─────────────────────────────────────────
async function fetchAllParticipants(): Promise<any[]> {
  const records: any[] = []
  let offset: string | undefined

  do {
    const params = new URLSearchParams({
      pageSize: "100",
      ...(offset ? { offset } : {}),
    })
    const url = `https://api.airtable.com/v0/${FSC_BASE}/Participant%20Info?${params}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`Airtable error: ${await res.text()}`)
    const json = await res.json()
    records.push(...(json.records ?? []))
    offset = json.offset
  } while (offset)

  return records
}

// ── Map Airtable Participant Info → Prisma User upsert payload ────────────
function mapParticipant(record: any) {
  const f = record.fields

  const slackName: string = (f["Name on Slack (First and Last)"] || "").trim()
  // Prefer legal name, fall back to slack name
  const fullName: string  = (f["Legal Name (First and Last)"] || slackName || "").trim()
  // Prefer refined email, fall back to personal email
  const email: string     = (f["Email (refined)"] || f["Personal email"] || "").trim().toLowerCase()

  if (!email || !fullName) return null

  return {
    airtableId: record.id as string,
    email,
    fullName,
    slackName:      slackName || undefined,
    emergencyName:  (f["Emergency Contact Name"] || undefined) as string | undefined,
    emergencyPhone: (f["Emergency Contact Phone Number"] || undefined) as string | undefined,
  }
}

// ── POST /api/sync/members ─────────────────────────────────────────────────
export async function POST(req: Request) {
  // Optional secret check
  if (SYNC_SECRET) {
    const auth = req.headers.get("x-sync-secret")
    if (auth !== SYNC_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const records = await fetchAllParticipants()

  let upserted = 0
  let skipped  = 0

  for (const record of records) {
    const mapped = mapParticipant(record)
    if (!mapped) { skipped++; continue }

    const { airtableId, email, fullName, slackName, emergencyName, emergencyPhone } = mapped

    await prisma.user.upsert({
      where: { email },
      update: {
        fullName,
        ...(slackName      ? { slackName }      : {}),
        ...(emergencyName  ? { emergencyName }  : {}),
        ...(emergencyPhone ? { emergencyPhone } : {}),
      },
      create: {
        email,
        fullName,
        ...(slackName      ? { slackName }      : {}),
        ...(emergencyName  ? { emergencyName }  : {}),
        ...(emergencyPhone ? { emergencyPhone } : {}),
        fieldStudiesId: `AT-${airtableId}`,
      },
    })
    upserted++
  }

  return NextResponse.json({
    ok: true,
    total: records.length,
    upserted,
    skipped,
  })
}
