'use client'

import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Anasayfa', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/expenses', label: 'Giderler', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/dashboard/debts', label: 'Borçlar', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { href: '/dashboard/chat', label: 'Sohbet', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '/dashboard/events', label: 'Etkinlikler', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [supabase, setSupabase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  useEffect(() => {
    if (!supabase) return
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setUser(data)
      setLoading(false)
    }
    getUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-transparent rounded-full animate-spin" style={{ borderTopColor: '#0ea5e9' }}></div>
          </div>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      <header className="bg-white border-b sticky top-0 z-50" style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: '#0f172a', letterSpacing: '-0.3px' }}>Önder Apartman</h1>
                {user && (
                  <p className="text-xs" style={{ color: '#64748b' }}>Daire {user.daire_no} • {user.ad_soyad}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-xl active:bg-slate-100"
              style={{ color: '#64748b' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
        
        {menuOpen && (
          <div className="lg:hidden border-t" style={{ borderColor: '#e2e8f0', background: 'white' }}>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </a>
              ))}
              <div className="divider my-2"></div>
              <button
                onClick={handleLogout}
                className="nav-item w-full text-left"
                style={{ color: '#ef4444' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış
              </button>
            </nav>
          </div>
        )}
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        <aside className="hidden lg:block w-60 p-4">
          <nav className="space-y-1 sticky top-20">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </a>
            ))}
            <div className="divider my-3"></div>
            <button
              onClick={handleLogout}
              className="nav-item w-full text-left"
              style={{ color: '#ef4444' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Çıkış
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
