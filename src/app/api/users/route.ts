import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/users — returns all users for the demo user-selector in the Nav */
export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, email: true, role: true },
    orderBy: { fullName: 'asc' },
  })
  return NextResponse.json(users)
}
