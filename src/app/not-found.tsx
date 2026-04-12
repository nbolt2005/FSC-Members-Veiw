import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-5xl font-bold text-gray-200 mb-4">404</p>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
      <p className="text-gray-500 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800"
      >
        ← Back to home
      </Link>
    </div>
  )
}
