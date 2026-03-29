'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [supabase, setSupabase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalDebt: 0,
    paidDebt: 0,
    pendingDebt: 0,
    expenseCount: 0,
    eventCount: 0,
    messageCount: 0,
  })

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  useEffect(() => {
    if (!supabase) return

    const getData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      setUser(userData)

      const { data: debts } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', authUser.id)
      
      const totalDebt = debts?.reduce((sum: number, d: any) => sum + Number(d.tutar), 0) || 0
      const paidDebt = debts?.filter((d: any) => d.odendi).reduce((sum: number, d: any) => sum + Number(d.tutar), 0) || 0

      const { count: expenseCount } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })

      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalDebt,
        paidDebt,
        pendingDebt: totalDebt - paidDebt,
        expenseCount: expenseCount || 0,
        eventCount: eventCount || 0,
        messageCount: messageCount || 0,
      })
    }
    getData()
  }, [supabase])

  if (!user) return null

  const cards = [
    { title: 'Toplam Borç', value: `${stats.totalDebt.toFixed(2)} TL`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#fef2f2', color: '#dc2626' },
    { title: 'Ödenen', value: `${stats.paidDebt.toFixed(2)} TL`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#ecfdf5', color: '#059669' },
    { title: 'Bekleyen', value: `${stats.pendingDebt.toFixed(2)} TL`, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#fffbeb', color: '#d97706' },
    { title: 'Giderler', value: stats.expenseCount, icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', bg: '#eff6ff', color: '#2563eb' },
    { title: 'Etkinlik', value: stats.eventCount, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', bg: '#faf5ff', color: '#7c3aed' },
    { title: 'Mesajlar', value: stats.messageCount, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', bg: '#f5f3ff', color: '#6366f1' },
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Hoş Geldin, {user.ad_soyad}</h2>
        <p className="page-subtitle">Daire {user.daire_no} - {user.tip === 'owner' ? 'Mal Sahibi' : 'Kiracı'}</p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm" style={{ color: '#6b7280' }}>{card.title}</p>
                <p className="text-xl font-bold mt-1" style={{ color: '#1f2937' }}>{card.value}</p>
              </div>
              <div className="p-2 rounded-lg" style={{ background: card.bg }}>
                <svg className="w-5 h-5" style={{ color: card.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <h3 className="text-base font-semibold mb-3" style={{ color: '#1f2937' }}>Hızlı İşlemler</h3>
        <div className="flex flex-wrap gap-2">
          <a href="/dashboard/expenses" className="btn btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Yeni Gider
          </a>
          <a href="/dashboard/chat" className="btn btn-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Mesaj Gönder
          </a>
          <a href="/dashboard/events" className="btn btn-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Etkinlik Oluştur
          </a>
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="mt-4 card p-4" style={{ borderLeft: '3px solid #3b82f6' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: '#eff6ff' }}>
              <svg className="w-5 h-5" style={{ color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#1f2937' }}>Admin Panel</p>
              <p className="text-sm" style={{ color: '#6b7280' }}>Gider ekleme ve borç yönetimi yetkiniz var</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
