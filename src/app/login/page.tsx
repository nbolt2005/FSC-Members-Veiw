import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  // Fetch demo users for quick login buttons (gracefully handles no DB yet)
  let demoUsers: { id: string; fullName: string; email: string; role: string }[] = []
  try {
    demoUsers = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, role: true },
      orderBy: { fullName: 'asc' },
    })
  } catch {
    // DB not set up yet — still show the login form without demo buttons
  }

  return (
    // Fixed overlay covers Nav/BottomNav — login is a full-screen experience
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center p-4 z-40">
      <Suspense>
        <LoginForm demoUsers={demoUsers} />
      </Suspense>
    </div>
  )
}
