import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** PUT /api/notifications/read — marks all of the current user's notifications as read */
export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })

  return NextResponse.json({ ok: true })
}
