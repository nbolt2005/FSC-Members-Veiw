'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type User = { id: string; fullName: string; email: string; role: string }

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

const NAV_LINKS = [
  { href: '/browse',   label: 'Browse Trips' },
  { href: '/calendar', label: 'Calendar' },
]

export default function Nav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [open, setOpen]               = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Hide nav on login pages
  const isLoginPage = pathname.startsWith('/login')

  useEffect(() => {
    if (isLoginPage) return
    const cookieId = getCookie('userId')
    if (!cookieId) return
    fetch('/api/users/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.user) setCurrentUser(data.user) })
      .catch(() => {})
  }, [isLoginPage, pathname])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setCurrentUser(null)
    setOpen(false)
    router.push('/login')
    router.refresh()
  }

  if (isLoginPage) return null

  const dashboardHref = !currentUser
    ? '/login'
    : currentUser.role === 'TRIP_LEAD' || currentUser.role === 'ADMIN'
      ? '/lead'
      : '/member'

  const avatar = (name: string) => name.charAt(0).toUpperCase()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Brand */}
          <Link href={dashboardHref} className="font-bold text-lg text-green-700 tracking-tight flex-shrink-0">
            FSC
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-5">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-colors ${
                    active ? 'text-green-700' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
            {currentUser && (
              <Link
                href={dashboardHref}
                className={`text-sm font-medium transition-colors ${
                  pathname === dashboardHref ? 'text-green-700' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                My Dashboard
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold select-none ${
                    currentUser.role === 'TRIP_LEAD' || currentUser.role === 'ADMIN' ? 'bg-blue-600' : 'bg-green-600'
                  }`}>
                    {avatar(currentUser.fullName)}
                  </span>
                  <span className="hidden sm:inline text-gray-700 max-w-[100px] truncate text-sm">
                    {currentUser.fullName.split(' ')[0]}
                  </span>
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-lg py-1.5 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{currentUser.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                      <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        currentUser.role === 'TRIP_LEAD' ? 'bg-blue-100 text-blue-700'
                          : currentUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {currentUser.role.replace('_', ' ')}
                      </span>
                    </div>
                    <Link href={dashboardHref} onClick={() => setOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      My Dashboard
                    </Link>
                    <Link href="/profile" onClick={() => setOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Profile & Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-full transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
