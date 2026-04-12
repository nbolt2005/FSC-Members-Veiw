import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/gear — returns all gear items plus the current user's active checkouts */
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value

  const [gearItems, myCheckouts] = await Promise.all([
    prisma.gearItem.findMany({ orderBy: { name: 'asc' } }),
    userId
      ? prisma.gearCheckout.findMany({
          where: { userId, returnedAt: null },
          include: { gearItem: true },
          orderBy: { dueAt: 'asc' },
        })
      : Promise.resolve([]),
  ])

  return NextResponse.json({ gearItems, myCheckouts })
}
