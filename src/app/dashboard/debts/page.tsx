'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function DebtsPage() {
  const [supabase, setSupabase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [debts, setDebts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { setSupabase(createClient()) }, [])

  useEffect(() => {
    if (!supabase) return
    const getData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(userData)
      const { data: allUsers } = await supabase.from('users').select('*').order('daire_no')
      setUsers(allUsers || [])
      let query = supabase.from('debts').select('*, expense:expenses(*), user:users(*)').order('created_at', { ascending: false })
      if (userData?.role !== 'admin') query = query.eq('user_id', authUser.id)
      const { data: debtsData } = await query
      setDebts(debtsData || [])
      setLoading(false)
    }
    getData()
  }, [supabase])

  const togglePaid = async (debtId: string, currentStatus: boolean) => {
    if (user?.role !== 'admin') return
    await supabase.from('debts').update({ odendi: !currentStatus }).eq('id', debtId)
    let query = supabase.from('debts').select('*, expense:expenses(*), user:users(*)').order('created_at', { ascending: false })
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%' }} /></div>

  const isAdmin = user?.role === 'admin'
  const groupedDebts = isAdmin ? debts.reduce((acc: Record<string, any[]>, debt) => {
    if (!acc[debt.user_id]) acc[debt.user_id] = []
    acc[debt.user_id].push(debt)
    return acc
  }, {}) : null

  return (
    <div className="animate-fadeIn">
      <h1 className="page-title" style={{ marginBottom: '24px' }}>{isAdmin ? 'Tüm Borçlar' : 'Borçlarım'}</h1>

      {isAdmin && groupedDebts ? (
        <div className="space-y-4">
          {Object.entries(groupedDebts).map(([userId, userDebts]) => {
            const total = userDebts.reduce((s: number, d: any) => s + Number(d.tutar), 0)
            const paid = userDebts.filter((d: any) => d.odendi).reduce((s: number, d: any) => s + Number(d.tutar), 0)
            return (
              <div key={userId} className="card">
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{getUserName(userId)}</span>
                  <div style={{ fontSize: '13px', display: 'flex', gap: '16px' }}>
                    <span style={{ color: '#16a34a' }}>Ödenen: {paid.toFixed(2)} TL</span>
                    <span style={{ color: '#d97706' }}>Kalan: {(total - paid).toFixed(2)} TL</span>
                  </div>
                </div>
                <div>
                  {userDebts.map((debt: any) => (
                    <div key={debt.id} className="list-item">
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '500', fontSize: '14px' }}>{debt.expense?.baslik}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(debt.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: '600' }}>{Number(debt.tutar).toFixed(2)} TL</span>
                        <button onClick={() => togglePaid(debt.id, debt.odendi)} className={`badge ${debt.odendi ? 'badge-success' : 'badge-warning'}`} style={{ cursor: 'pointer', border: 'none' }}>
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
        <div className="card-flat">
          {debts.map((debt: any) => (
            <div key={debt.id} className="list-item">
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '600', fontSize: '14px' }}>{debt.expense?.baslik}</p>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>{debt.expense?.aciklama || '-'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '18px', fontWeight: '600' }}>{Number(debt.tutar).toFixed(2)} TL</p>
                <span className={`badge ${debt.odendi ? 'badge-success' : 'badge-danger'}`}>
                  {debt.odendi ? 'Ödendi' : 'Ödenmedi'}
                </span>
              </div>
            </div>
          ))}
          {debts.length === 0 && (
            <div className="empty-state">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3>Borç yok</h3>
              <p>Tüm borçlarınız ödenmiş</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
