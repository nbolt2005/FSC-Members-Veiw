'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

type User = { id: string; fullName: string; email: string; role: string }

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

const NAV_LINKS = [
  { href: '/',               label: 'Home' },
  { href: '/trips',          label: 'Trips' },
  { href: '/calendar',       label: 'Calendar' },
  { href: '/announcements',  label: 'News' },
  { href: '/gear',           label: 'Gear' },
]

export default function Nav() {
  const pathname = usePathname()
  const [users, setUsers]             = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [open, setOpen]               = useState(false)
  const [unread, setUnread]           = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pathname === '/login') return
    fetch('/api/users')
      .then((r) => r.json())
      .then((data: User[]) => {
        setUsers(data)
        const cookieId = getCookie('userId')
        const found = data.find((u) => u.id === cookieId) ?? data[0] ?? null
        setCurrentUser(found)
        if (!cookieId && found) selectUser(found, data)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pathname === '/login') return
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data: { read: boolean }[]) => {
        if (Array.isArray(data)) setUnread(data.filter((n) => !n.read).length)
      })
      .catch(() => {})
  }, [pathname])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function selectUser(user: User, list?: User[]) {
    await fetch('/api/auth/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    setCurrentUser(user)
    if (list) setUsers(list)
    setOpen(false)
    window.location.reload()
  }

  // Hide entirely on login page
  if (pathname === '/login') return null

  const avatar = (name: string) => name.charAt(0).toUpperCase()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Brand */}
          <Link href="/" className="font-bold text-lg text-green-700 tracking-tight flex-shrink-0">
            FSC Portal
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-5">
            {NAV_LINKS.map(({ href, label }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
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
          </div>

          {/* Right side: notifications + user */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            {/* User selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold select-none">
                  {currentUser ? avatar(currentUser.fullName) : '?'}
                </span>
                <span className="hidden sm:inline text-gray-700 max-w-[100px] truncate text-sm">
                  {currentUser?.fullName ?? '…'}
                </span>
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-2xl shadow-lg py-1.5 overflow-hidden">
                  <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Demo — switch user
                  </p>
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-50 transition-colors ${
                        currentUser?.id === user.id ? 'text-green-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {avatar(user.fullName)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate">{user.fullName}</div>
                        <div className="text-[11px] text-gray-400">{user.role}</div>
                      </div>
                      {currentUser?.id === user.id && (
                        <svg className="w-4 h-4 ml-auto text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link href="/profile" onClick={() => setOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      View Profile
                    </Link>
                    <Link href="/about" onClick={() => setOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      About FSC
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
