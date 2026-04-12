import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AnnouncementType } from '@prisma/client'

/** GET /api/announcements?type=CLUB — returns announcements, newest first */
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as AnnouncementType | null

  const announcements = await prisma.announcement.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { fullName: true, role: true } },
      trip:   { select: { id: true, title: true } },
    },
  })

  return NextResponse.json(announcements)
}
