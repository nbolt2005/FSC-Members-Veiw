'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { AnnouncementType } from '@prisma/client'

type AnnouncementCardProps = {
  announcement: {
    id: string
    title: string
    body: string
    type: AnnouncementType
    createdAt: Date | string
    author: { fullName: string; role: string }
    trip: { id: string; title: string } | null
  }
}

const TYPE_STYLES: Record<AnnouncementType, { label: string; cls: string }> = {
  FIELD_NOTES: { label: 'Field Notes', cls: 'bg-green-100 text-green-700' },
  CLUB:        { label: 'Club',        cls: 'bg-blue-100 text-blue-700' },
  ADMIN:       { label: 'Admin',       cls: 'bg-purple-100 text-purple-700' },
  TRIP:        { label: 'Trip',        cls: 'bg-amber-100 text-amber-700' },
}

const PREVIEW_LENGTH = 160

export default function AnnouncementCard({ announcement: a }: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { label, cls } = TYPE_STYLES[a.type]
  const needsExpand = a.body.length > PREVIEW_LENGTH

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
            <span className="text-[11px] text-gray-400">
              {a.author.fullName} · {formatDate(a.createdAt)}
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-1.5">{a.title}</h3>

        {/* Body — truncated unless expanded */}
        <p className="text-sm text-gray-600 leading-relaxed">
          {expanded || !needsExpand
            ? a.body
            : `${a.body.slice(0, PREVIEW_LENGTH)}…`}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {a.trip && (
              <Link
                href={`/trips/${a.trip.id}`}
                className="text-xs text-green-700 hover:underline font-medium"
              >
                {a.trip.title} →
              </Link>
            )}
          </div>
          {needsExpand && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
