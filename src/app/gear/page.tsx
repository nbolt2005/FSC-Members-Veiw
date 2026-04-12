import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Gear Library' }

export default async function GearPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Gear Library</h1>
        <p className="text-gray-500 text-sm">
          Borrow club gear for your trips. Contact a Trip Lead to check out items.
        </p>
      </div>

      {/* My active checkouts */}
      {myCheckouts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            My Checkouts ({myCheckouts.length})
          </h2>
          <div className="space-y-2">
            {myCheckouts.map((checkout) => {
              const overdue = new Date(checkout.dueAt) < new Date()
              return (
                <div
                  key={checkout.id}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                    overdue
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {checkout.gearItem.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Qty: {checkout.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-700'}`}>
                      Due {formatDate(checkout.dueAt)}
                    </div>
                    {overdue && (
                      <div className="text-xs text-red-500 mt-0.5">Overdue — please return</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Gear inventory */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Available Gear ({gearItems.length} items)
        </h2>

        <div className="grid sm:grid-cols-2 gap-3">
          {gearItems.map((item) => {
            const pct       = item.quantityAvailable / item.quantityTotal
            const isOut     = item.quantityAvailable === 0
            const isLow     = !isOut && pct < 0.4

            const badgeClass = isOut
              ? 'bg-red-100 text-red-700'
              : isLow
              ? 'bg-amber-100 text-amber-700'
              : 'bg-green-100 text-green-700'

            const barClass = isOut
              ? 'bg-red-400'
              : isLow
              ? 'bg-amber-400'
              : 'bg-green-500'

            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.quantityAvailable} of {item.quantityTotal} available
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeClass}`}>
                    {isOut ? 'Out' : isLow ? 'Low' : 'In Stock'}
                  </span>
                </div>

                {/* Availability bar */}
                <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barClass} transition-all`}
                    style={{ width: `${Math.max(pct * 100, 0)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {gearItems.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <p className="text-gray-400">No gear items in the library yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
