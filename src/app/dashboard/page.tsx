'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const supabase = createClient()
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
      
      const totalDebt = debts?.reduce((sum, d) => sum + Number(d.tutar), 0) || 0
      const paidDebt = debts?.filter(d => d.odendi).reduce((sum, d) => sum + Number(d.tutar), 0) || 0

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
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-700',
    },
    {
      title: 'Ödenen',
      value: `${stats.paidDebt.toFixed(2)} TL`,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
    },
    {
      title: 'Bekleyen',
      value: `${stats.pendingDebt.toFixed(2)} TL`,
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-700',
    },
    {
      title: 'Gider Sayısı',
      value: stats.expenseCount,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
    },
    {
      title: 'Etkinlik',
      value: stats.eventCount,
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
    },
    {
      title: 'Mesaj',
      value: stats.messageCount,
      color: 'bg-indigo-50 border-indigo-200',
      textColor: 'text-indigo-700',
    },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Hoş Geldin, {user.ad_soyad}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`p-6 rounded-xl border ${card.color}`}
          >
            <p className="text-sm text-gray-600 mb-1">{card.title}</p>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Hızlı İşlemler</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/dashboard/expenses"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Gider Ekle
          </a>
          <a
            href="/dashboard/chat"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Mesaj Gönder
          </a>
          <a
            href="/dashboard/events"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Etkinlik Oluştur
          </a>
        </div>
      </div>
    </div>
  )
}
