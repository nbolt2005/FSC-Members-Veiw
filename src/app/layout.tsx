import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'
import BottomNav from '@/components/BottomNav'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'FSC Portal', template: '%s | FSC Portal' },
  description: 'Field Studies Club — browse trips, manage signups, and borrow gear.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-50 min-h-screen text-gray-900">
        <Nav />
        {/* pb-20 on mobile keeps content above the fixed BottomNav; sm:pb-0 removes it on desktop */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
