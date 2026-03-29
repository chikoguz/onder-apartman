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
      iconClass: 'stat-icon-danger',
      variant: 'danger'
    },
    { 
      title: 'Ödenen', 
      value: `${stats.paidDebt.toFixed(2)} TL`, 
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', 
      iconClass: 'stat-icon-success',
      variant: 'success'
    },
    { 
      title: 'Bekleyen', 
      value: `${stats.pendingDebt.toFixed(2)} TL`, 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', 
      iconClass: 'stat-icon-warning',
      variant: 'warning'
    },
    { 
      title: 'Giderler', 
      value: stats.expenseCount, 
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', 
      iconClass: 'stat-icon-primary',
      variant: 'primary'
    },
    { 
      title: 'Etkinlik', 
      value: stats.eventCount, 
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', 
      iconClass: 'stat-icon-purple',
      variant: 'purple'
    },
    { 
      title: 'Mesajlar', 
      value: stats.messageCount, 
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', 
      iconClass: 'stat-icon-info',
      variant: 'info'
    },
  ]

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h2 className="page-title">Hoş Geldin, <span style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user.ad_soyad}</span></h2>
        <p className="page-subtitle">Daire {user.daire_no} • {user.tip === 'owner' ? 'Mal Sahibi' : 'Kiracı'}</p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <div key={index} className={`card-metric ${card.variant}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`stat-icon ${card.iconClass}`}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
            </div>
            <p style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.title}</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '4px', letterSpacing: '-1px' }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="section-title">Hızlı İşlemler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/dashboard/expenses" className="quick-action">
            <div className="quick-action-icon icon-box-primary">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>Yeni Gider</p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Gider ekle ve dairelere böl</p>
            </div>
          </Link>
          
          <Link href="/dashboard/chat" className="quick-action">
            <div className="quick-action-icon icon-box-success">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>Mesaj Gönder</p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Komşularla sohbet et</p>
            </div>
          </Link>
          
          <Link href="/dashboard/events" className="quick-action">
            <div className="quick-action-icon icon-box-purple">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>Etkinlik Oluştur</p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Etkinlik düzenle</p>
            </div>
          </Link>
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="mt-6 card-static p-5" style={{ borderLeft: '4px solid #0ea5e9', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, white 100%)' }}>
          <div className="flex items-center gap-4">
            <div className="icon-box icon-box-primary">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>Admin Panel</p>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Gider ekleme ve borç yönetimi yetkiniz var</p>
            </div>
          </div>
        </div>
      )}

      {stats.pendingDebt > 0 && (
        <div className="mt-4 alert alert-warning">
          <div className="icon-box icon-box-warning">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p style={{ fontWeight: '600', color: '#92400e', fontSize: '15px' }}>Ödenmemiş Borç</p>
            <p style={{ fontSize: '14px', color: '#a16207' }}>
              {stats.pendingDebt.toFixed(2)} TL tutarında ödenmemiş borcunuz bulunmaktadır.
            </p>
          </div>
          <Link href="/dashboard/debts" className="btn btn-sm" style={{ background: '#f59e0b', color: 'white' }}>
            Görüntüle
          </Link>
        </div>
      )}
    </div>
  )
}
