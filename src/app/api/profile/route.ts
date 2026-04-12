import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/profile — returns the current user's full profile */
export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value
  if (!userId) return NextResponse.json(null, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, fullName: true, email: true, phone: true,
      emergencyName: true, emergencyPhone: true,
      fieldStudiesId: true, bio: true, role: true, createdAt: true,
    },
  })

  return NextResponse.json(user)
}

/** PUT /api/profile — updates editable profile fields */
export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fullName, phone, emergencyName, emergencyPhone, bio } = (await request.json()) as {
    fullName?: string
    phone?: string
    emergencyName?: string
    emergencyPhone?: string
    bio?: string
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(fullName !== undefined && { fullName: fullName.trim() }),
      phone: phone?.trim() || null,
      emergencyName: emergencyName?.trim() || null,
      emergencyPhone: emergencyPhone?.trim() || null,
      bio: bio?.trim() || null,
    },
    select: {
      id: true, fullName: true, email: true, phone: true,
      emergencyName: true, emergencyPhone: true,
      fieldStudiesId: true, bio: true, role: true,
    },
  })

  return NextResponse.json(user)
}
