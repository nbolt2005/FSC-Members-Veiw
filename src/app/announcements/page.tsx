import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { AnnouncementType } from '@prisma/client'
import AnnouncementCard from '@/components/AnnouncementCard'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Announcements' }

const FILTERS: { label: string; value: AnnouncementType | 'ALL' }[] = [
  { label: 'All',         value: 'ALL' },
  { label: 'Field Notes', value: 'FIELD_NOTES' },
  { label: 'Club',        value: 'CLUB' },
  { label: 'Admin',       value: 'ADMIN' },
  { label: 'Trips',       value: 'TRIP' },
]

type Props = { searchParams: Promise<{ type?: string }> }

export default async function AnnouncementsPage({ searchParams }: Props) {
  const { type } = await searchParams
  const activeType = (type?.toUpperCase() ?? 'ALL') as AnnouncementType | 'ALL'
  const filter = FILTERS.find((f) => f.value === activeType)?.value ?? 'ALL'

  const announcements = await prisma.announcement.findMany({
    where: filter !== 'ALL' ? { type: filter } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { fullName: true, role: true } },
      trip:   { select: { id: true, title: true } },
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Announcements</h1>
      <p className="text-gray-500 text-sm mb-5">Club news, field notes, and trip updates</p>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-5">
        {FILTERS.map(({ label, value }) => (
          <a
            key={value}
            href={value === 'ALL' ? '/announcements' : `/announcements?type=${value.toLowerCase()}`}
            className={`text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filter === value
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-gray-400">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}
    </div>
  )
}
