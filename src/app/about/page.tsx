import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TripStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'About FSC' }

export default async function AboutPage() {
  const [memberCount, openTripCount, gearCount] = await Promise.all([
    prisma.user.count(),
    prisma.trip.count({ where: { status: TripStatus.OPEN } }),
    prisma.gearItem.count(),
  ])

  return (
    <div className="max-w-2xl">
      {/* Hero */}
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center mb-4">
          <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M5 3l14 9-14 9V3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Field Studies Club</h1>
        <p className="text-gray-600 leading-relaxed">
          We are a student-led outdoor recreation club dedicated to exploring California's wild places —
          from Sierra peaks to coastal redwoods. Everyone is welcome, regardless of experience level.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard value={memberCount} label="Members" />
        <StatCard value={openTripCount} label="Open Trips" />
        <StatCard value={gearCount} label="Gear Items" />
      </div>

      {/* Mission */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-2">Our Mission</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          To foster a community of outdoor enthusiasts who support and inspire each other to explore
          the natural world. We organize accessible, affordable trips and maintain a gear library so
          that cost and equipment are never barriers to getting outside.
        </p>
      </div>

      {/* How to join */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">How to Join</h2>
        <ol className="space-y-2 text-sm text-gray-600">
          {[
            'Pay the semester membership fee ($20) via Venmo @FieldStudiesClub',
            'Create your account on this portal using your school email',
            'Complete your profile and add an emergency contact',
            'Browse upcoming trips and sign up — spots fill quickly!',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4">
          <Link
            href="/trips"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800"
          >
            Browse upcoming trips →
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">FAQ</h2>
        <div className="space-y-3">
          {[
            {
              q: "Do I need experience to join?",
              a: "No experience needed! We have trips for all levels — from easy day hikes to strenuous multi-day backpacking. Each trip listing includes a difficulty rating.",
            },
            {
              q: "What does membership include?",
              a: "Membership gives you access to all club trips, the gear library, and our Slack community. Members get discounted trip fees compared to non-members.",
            },
            {
              q: "How does the gear library work?",
              a: "Members can check out gear (tents, sleeping bags, trekking poles, etc.) for free during gear shed hours. You'll need a signed waiver and must return items clean.",
            },
            {
              q: "What happens if a trip is full?",
              a: "You're automatically placed on the waitlist. If a confirmed member cancels, the first person on the waitlist gets their spot and is notified.",
            },
            {
              q: "How do I contact a trip lead?",
              a: "Find the trip lead's contact on the trip detail page. You can also reach any lead through our Slack workspace.",
            },
          ].map(({ q, a }) => (
            <details key={q} className="group border-b border-gray-100 last:border-0 pb-3 last:pb-0">
              <summary className="text-sm font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
                {q}
                <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Contact Us</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 w-20">General:</span>
            <span>Slack @fieldstudies-general</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 w-20">Trips:</span>
            <span>Slack @fieldstudies-trips · DM any Trip Lead</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 w-20">Gear:</span>
            <span>Slack @fieldstudies-gear · Contact Alice Chen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 w-20">Ideas:</span>
            <span>Submit a trip idea via the trip suggestion form</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
      <div className="text-2xl font-bold text-green-700">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
