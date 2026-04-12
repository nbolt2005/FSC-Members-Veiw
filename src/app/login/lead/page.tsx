import type { Metadata } from 'next'
import { Suspense } from 'react'
import LeadLoginForm from './LeadLoginForm'

export const metadata: Metadata = { title: 'Trip Lead Sign In' }

export default function LeadLoginPage() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-gray-100 flex items-center justify-center p-4 z-40">
      <Suspense>
        <LeadLoginForm />
      </Suspense>
    </div>
  )
}
