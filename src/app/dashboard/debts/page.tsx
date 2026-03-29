'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function DebtsPage() {
  const [supabase, setSupabase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [debts, setDebts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

      const { data: allUsers } = await supabase
        .from('users')
        .select('*')
        .order('daire_no')
      setUsers(allUsers || [])

      let query = supabase
        .from('debts')
        .select('*, expense:expenses(*), user:users(*)')
        .order('created_at', { ascending: false })

      if (userData?.role !== 'admin') {
        query = query.eq('user_id', authUser.id)
      }

      const { data: debtsData } = await query
      setDebts(debtsData || [])
      setLoading(false)
    }
    getData()
  }, [supabase])

  const togglePaid = async (debtId: string, currentStatus: boolean) => {
    if (user?.role !== 'admin') return

    await supabase
      .from('debts')
      .update({ odendi: !currentStatus })
      .eq('id', debtId)

    const { data: allUsers } = await supabase.from('users').select('*')
    setUsers(allUsers || [])

    let query = supabase
      .from('debts')
      .select('*, expense:expenses(*), user:users(*)')
      .order('created_at', { ascending: false })

    if (user?.role !== 'admin') {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      query = query.eq('user_id', authUser?.id)
    }

    const { data: debtsData } = await query
    setDebts(debtsData || [])
  }

  const getUserName = (userId: string) => {
    const u = users.find(u => u.id === userId)
    return u ? `Daire ${u.daire_no} - ${u.ad_soyad}` : 'Bilinmiyor'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const isAdmin = user?.role === 'admin'

  const groupedDebts = isAdmin
    ? debts.reduce((acc: Record<string, any[]>, debt) => {
        const key = debt.user_id
        if (!acc[key]) acc[key] = []
        acc[key].push(debt)
        return acc
      }, {} as Record<string, any[]>)
    : null

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isAdmin ? 'Tüm Borçlar' : 'Borçlarım'}
      </h2>

      {isAdmin && groupedDebts ? (
        <div className="space-y-4">
          {Object.entries(groupedDebts).map(([userId, userDebts]) => {
            const total = userDebts.reduce((sum: number, d: any) => sum + Number(d.tutar), 0)
            const paid = userDebts.filter((d: any) => d.odendi).reduce((sum: number, d: any) => sum + Number(d.tutar), 0)
            const pending = total - paid

            return (
              <div key={userId} className="card overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <span className="font-semibold text-gray-900">{getUserName(userId)}</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">Ödenen: {paid.toFixed(2)} TL</span>
                    <span className="text-red-600 font-medium">Bekleyen: {pending.toFixed(2)} TL</span>
                  </div>
                </div>
                <div className="divide-y">
                  {userDebts.map((debt: any) => (
                    <div
                      key={debt.id}
                      className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{debt.expense?.baslik}</p>
                        <p className="text-sm text-gray-500">
                          {debt.expense?.aciklama || '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{Number(debt.tutar).toFixed(2)} TL</p>
                          <p className="text-xs text-gray-400">
                            {new Date(debt.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <button
                          onClick={() => togglePaid(debt.id, debt.odendi)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium ${
                            debt.odendi
                              ? 'badge badge-success'
                              : 'badge badge-warning'
                          }`}
                        >
                          {debt.odendi ? 'Ödendi' : 'Ödenmedi'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt: any) => (
            <div key={debt.id} className="card p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{debt.expense?.baslik}</h4>
                {debt.expense?.aciklama && (
                  <p className="text-sm text-gray-500">{debt.expense?.aciklama}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(debt.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  {Number(debt.tutar).toFixed(2)} TL
                </p>
                <span className={`badge ${debt.odendi ? 'badge-success' : 'badge-danger'}`}>
                  {debt.odendi ? 'Ödendi' : 'Ödenmedi'}
                </span>
              </div>
            </div>
          ))}
          {debts.length === 0 && (
            <div className="card p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 mt-4">Borç bulunmuyor</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
