import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-white to-gray-100 flex items-center justify-center p-4 z-40">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Field Studies Club</h1>
          <p className="text-sm text-gray-500 mt-1">Choose how you want to sign in</p>
        </div>

        <div className="space-y-3">
          {/* Member login */}
          <Link
            href="/login/member"
            className="group flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 hover:border-green-400 hover:shadow-md transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                I'm a Member
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                Sign up for trips, view your history
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Trip lead login */}
          <Link
            href="/login/lead"
            className="group flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                I'm a Trip Lead
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                Manage your trips · @fieldstudie.org
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Browse without login */}
          <div className="text-center pt-2">
            <Link
              href="/browse"
              className="text-sm text-gray-500 hover:text-green-700 transition-colors"
            >
              Just browsing? View trips without signing in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
