import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'
import MarkAllReadButton from './MarkAllReadButton'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Notifications' }

const FILTERS: { label: string; value: NotificationType | 'ALL' }[] = [
  { label: 'All',          value: 'ALL' },
  { label: 'Trips',        value: 'TRIP_UPDATE' },
  { label: 'Gear',         value: 'GEAR_REMINDER' },
  { label: 'Action Items', value: 'ACTION_ITEM' },
  { label: 'News',         value: 'ANNOUNCEMENT' },
  { label: 'Field Notes',  value: 'FIELD_NOTES' },
]

const TYPE_LABEL: Record<NotificationType, string> = {
  FIELD_NOTES:  'Field Notes',
  NEW_TRIP:     'New Trip',
  ANNOUNCEMENT: 'News',
  EVENT:        'Event',
  TRIP_UPDATE:  'Trip',
  GEAR_REMINDER:'Gear',
  ACTION_ITEM:  'Action',
}

const TYPE_COLOR: Record<NotificationType, string> = {
  FIELD_NOTES:  'bg-green-100 text-green-700',
  NEW_TRIP:     'bg-blue-100 text-blue-700',
  ANNOUNCEMENT: 'bg-yellow-100 text-yellow-700',
  EVENT:        'bg-purple-100 text-purple-700',
  TRIP_UPDATE:  'bg-green-100 text-green-700',
  GEAR_REMINDER:'bg-amber-100 text-amber-700',
  ACTION_ITEM:  'bg-red-100 text-red-700',
}

type Props = { searchParams: Promise<{ type?: string }> }

export default async function NotificationsPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value!

  const { type } = await searchParams
  const activeType = (type?.toUpperCase() ?? 'ALL') as NotificationType | 'ALL'
  const filter = FILTERS.find((f) => f.value === activeType)?.value ?? 'ALL'

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(filter !== 'ALL' ? { type: filter } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>
      <p className="text-gray-500 text-sm mb-5">
        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-5">
        {FILTERS.map(({ label, value }) => (
          <a
            key={value}
            href={value === 'ALL' ? '/notifications' : `/notifications?type=${value.toLowerCase()}`}
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

      {notifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-gray-400">No notifications here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const content = (
              <div className={`bg-white border rounded-2xl p-4 transition-all hover:shadow-sm ${
                !n.read ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
              }`}>
                <div className="flex items-start gap-3">
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    {!n.read
                      ? <div className="w-2 h-2 rounded-full bg-green-500" />
                      : <div className="w-2 h-2 rounded-full bg-transparent" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[n.type as NotificationType]}`}>
                        {TYPE_LABEL[n.type as NotificationType]}
                      </span>
                      <span className="text-[11px] text-gray-400">{formatDate(n.createdAt)}</span>
                    </div>
                    <div className={`text-sm font-semibold ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{n.body}</div>
                  </div>
                </div>
              </div>
            )

            return n.linkUrl ? (
              <Link key={n.id} href={n.linkUrl}>{content}</Link>
            ) : (
              <div key={n.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
