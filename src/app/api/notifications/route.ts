import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export const dynamic = 'force-dynamic'

/** GET /api/notifications?type=GEAR_REMINDER — returns notifications for current user */
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value
  if (!userId) return NextResponse.json([])

  const type = request.nextUrl.searchParams.get('type') as NotificationType | null

  const notifications = await prisma.notification.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(notifications)
}
