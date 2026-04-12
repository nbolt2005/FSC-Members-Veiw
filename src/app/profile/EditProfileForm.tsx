'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Profile = {
  fullName: string
  phone: string | null
  emergencyName: string | null
  emergencyPhone: string | null
  bio: string | null
}

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Profile>(profile)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(key: keyof Profile, value: string) {
    setForm((prev) => ({ ...prev, [key]: value || null }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
      setTimeout(() => { setOpen(false); setSaved(false) }, 800)
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-green-700 hover:text-green-800 border border-green-200 px-4 py-1.5 rounded-full transition-colors hover:bg-green-50"
      >
        {open ? 'Cancel' : 'Edit Profile'}
      </button>

      {open && (
        <form onSubmit={handleSave} className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Edit Profile</h3>

          <Field label="Full Name" required>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Phone (optional)">
            <input
              type="tel"
              value={form.phone ?? ''}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="555-0100"
              className={inputClass}
            />
          </Field>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Emergency Contact
            </p>
            <div className="space-y-3">
              <Field label="Name">
                <input
                  type="text"
                  value={form.emergencyName ?? ''}
                  onChange={(e) => set('emergencyName', e.target.value)}
                  placeholder="Jane Smith"
                  className={inputClass}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={form.emergencyPhone ?? ''}
                  onChange={(e) => set('emergencyPhone', e.target.value)}
                  placeholder="555-0100"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <Field label="Bio (optional)">
            <textarea
              value={form.bio ?? ''}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="Tell the club about yourself…"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  )
}

const inputClass =
  'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  )
}
