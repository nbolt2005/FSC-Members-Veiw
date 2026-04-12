import type { Metadata } from 'next'
import { Suspense } from 'react'
import MemberLoginForm from './MemberLoginForm'

export const metadata: Metadata = { title: 'Member Sign In' }

export default function MemberLoginPage() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-white to-gray-100 flex items-center justify-center p-4 z-40">
      <Suspense>
        <MemberLoginForm />
      </Suspense>
    </div>
  )
}
