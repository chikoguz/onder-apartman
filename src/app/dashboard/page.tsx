'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'

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
    { 
      title: 'Toplam Borç', 
      value: `${stats.totalDebt.toFixed(2)} TL`, 
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 
      bg: '#fef2f2', 
      color: '#dc2626',
      iconBg: 'rgba(239, 68, 68, 0.1)',
      iconColor: '#ef4444'
    },
    { 
      title: 'Ödenen', 
      value: `${stats.paidDebt.toFixed(2)} TL`, 
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', 
      bg: '#f0fdf4', 
      color: '#16a34a',
      iconBg: 'rgba(34, 197, 94, 0.1)',
      iconColor: '#22c55e'
    },
    { 
      title: 'Bekleyen', 
      value: `${stats.pendingDebt.toFixed(2)} TL`, 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', 
      bg: '#fffbeb', 
      color: '#d97706',
      iconBg: 'rgba(245, 158, 11, 0.1)',
      iconColor: '#f59e0b'
    },
    { 
      title: 'Giderler', 
      value: stats.expenseCount, 
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', 
      bg: '#eff6ff', 
      color: '#2563eb',
      iconBg: 'rgba(14, 165, 233, 0.1)',
      iconColor: '#3b82f6'
    },
    { 
      title: 'Etkinlik', 
      value: stats.eventCount, 
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', 
      bg: '#faf5ff', 
      color: '#7c3aed',
      iconBg: 'rgba(124, 58, 237, 0.1)',
      iconColor: '#8b5cf6'
    },
    { 
      title: 'Mesajlar', 
      value: stats.messageCount, 
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', 
      bg: '#f5f3ff', 
      color: '#6366f1',
      iconBg: 'rgba(99, 102, 241, 0.1)',
      iconColor: '#6366f1'
    },
  ]

  const quickActions = [
    { label: 'Yeni Gider', href: '/dashboard/expenses', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', primary: true },
    { label: 'Mesaj Gönder', href: '/dashboard/chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', primary: false },
    { label: 'Etkinlik Oluştur', href: '/dashboard/events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', primary: false },
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Hoş Geldin, <span style={{ color: '#3b82f6' }}>{user.ad_soyad}</span></h2>
        <p className="page-subtitle">Daire {user.daire_no} • {user.tip === 'owner' ? 'Mal Sahibi' : 'Kiracı'}</p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <div key={index} className="stat-card" style={{ background: card.bg }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#cbd5e1' }}>{card.title}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
              </div>
              <div className="icon-box" style={{ background: card.iconBg }}>
                <svg className="w-5 h-5" style={{ color: card.iconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="section-title">Hızlı İşlemler</h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href} className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
              </svg>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="mt-6 card-static p-5" style={{ borderLeft: '4px solid #3b82f6', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, white 100%)' }}>
          <div className="flex items-center gap-4">
            <div className="icon-box icon-box-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#0f172a' }}>Admin Panel</p>
              <p className="text-sm" style={{ color: '#cbd5e1' }}>Gider ekleme ve borç yönetimi yetkiniz var</p>
            </div>
          </div>
        </div>
      )}

      {stats.pendingDebt > 0 && (
        <div className="mt-6 card-static p-5" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, white 100%)', borderColor: '#fed7aa' }}>
          <div className="flex items-center gap-4">
            <div className="icon-box icon-box-warning">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: '#c2410c' }}>Ödenmemiş Borç</p>
              <p className="text-sm" style={{ color: '#9a3412' }}>
                {stats.pendingDebt.toFixed(2)} TL tutarında ödenmemiş borcunuz bulunmaktadır.
              </p>
            </div>
            <Link href="/dashboard/debts" className="btn btn-sm" style={{ background: '#f97316', color: 'white' }}>
              Görüntüle
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
