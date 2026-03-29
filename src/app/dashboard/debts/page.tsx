'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function DebtsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [debts, setDebts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isAdmin = user?.role === 'admin'

  const groupedDebts = isAdmin
    ? debts.reduce((acc, debt) => {
        const key = debt.user_id
        if (!acc[key]) acc[key] = []
        acc[key].push(debt)
        return acc
      }, {} as Record<string, any[]>)
    : null

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {isAdmin ? 'Tüm Borçlar' : 'Borçlarım'}
      </h2>

      {isAdmin && groupedDebts ? (
        <div className="space-y-6">
          {Object.entries(groupedDebts).map(([userId, userDebts]) => {
            const total = userDebts.reduce((sum, d) => sum + Number(d.tutar), 0)
            const paid = userDebts.filter(d => d.odendi).reduce((sum, d) => sum + Number(d.tutar), 0)
            const pending = total - paid

            return (
              <div key={userId} className="bg-white rounded-xl border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{getUserName(userId)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-green-600">Ödenen: {paid.toFixed(2)} TL</span>
                    <span className="mx-2">|</span>
                    <span className="text-red-600">Bekleyen: {pending.toFixed(2)} TL</span>
                  </div>
                </div>
                <div className="divide-y">
                  {userDebts.map((debt) => (
                    <div
                      key={debt.id}
                      className="p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{debt.expense?.baslik}</p>
                        <p className="text-sm text-gray-500">
                          {debt.expense?.aciklama || '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">{Number(debt.tutar).toFixed(2)} TL</p>
                          <p className="text-xs text-gray-500">
                            {new Date(debt.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <button
                          onClick={() => togglePaid(debt.id, debt.odendi)}
                          className={`px-3 py-1 rounded text-sm ${
                            debt.odendi
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
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
          {debts.map((debt) => (
            <div
              key={debt.id}
              className="bg-white rounded-xl border p-4 flex justify-between items-center"
            >
              <div>
                <h4 className="font-semibold">{debt.expense?.baslik}</h4>
                {debt.expense?.aciklama && (
                  <p className="text-sm text-gray-500">{debt.expense?.aciklama}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(debt.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-800">
                  {Number(debt.tutar).toFixed(2)} TL
                </p>
                <span
                  className={`text-sm ${
                    debt.odendi ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {debt.odendi ? 'Ödendi' : 'Ödenmedi'}
                </span>
              </div>
            </div>
          ))}
          {debts.length === 0 && (
            <p className="text-center text-gray-500 py-8">Borç yok</p>
          )}
        </div>
      )}
    </div>
  )
}
