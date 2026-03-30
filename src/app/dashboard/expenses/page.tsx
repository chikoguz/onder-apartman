'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function ExpensesPage() {
  const [supabase, setSupabase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ baslik: '', aciklama: '', tutar: '', tip: 'aidat' })

  useEffect(() => { setSupabase(createClient()) }, [])

  useEffect(() => {
    if (!supabase) return
    const getData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(userData)
      const { data: expensesData } = await supabase.from('expenses').select('*').order('tarih', { ascending: false })
      setExpenses(expensesData || [])
      setLoading(false)
    }
    getData()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== 'admin') return
    const tutar = Number(formData.tutar)
    const { data: expense, error } = await supabase.from('expenses').insert({ baslik: formData.baslik, aciklama: formData.aciklama, tutar, tip: formData.tip, olusturan_id: user.id }).select().single()
    if (error) { alert('Hata: ' + error.message); return }
    const { data: users } = await supabase.from('users').select('id')
    if (users) {
      const debts = users.map((u: any) => ({ user_id: u.id, expense_id: expense.id, tutar: tutar / 9, odendi: false }))
      await supabase.from('debts').insert(debts)
    }
    setFormData({ baslik: '', aciklama: '', tutar: '', tip: 'aidat' })
    setShowForm(false)
    const { data: expensesData } = await supabase.from('expenses').select('*').order('tarih', { ascending: false })
    setExpenses(expensesData || [])
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%' }} /></div>

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Giderler</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn btn-secondary' : 'btn btn-primary'}>
            {showForm ? 'İptal' : '+ Yeni Gider'}
          </button>
        )}
      </div>

      {showForm && user?.role === 'admin' && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Yeni Gider</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Başlık</label>
              <input type="text" required className="input" placeholder="Gider başlığı" value={formData.baslik} onChange={(e) => setFormData({ ...formData, baslik: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Açıklama</label>
              <textarea className="textarea" placeholder="Açıklama" value={formData.aciklama} onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Tutar (TL)</label>
                <input type="number" required step="0.01" className="input" placeholder="0.00" value={formData.tutar} onChange={(e) => setFormData({ ...formData, tutar: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Tip</label>
                <select className="select" value={formData.tip} onChange={(e) => setFormData({ ...formData, tip: e.target.value })}>
                  <option value="aidat">Aidat</option>
                  <option value="ekstra">Ekstra</option>
                  <option value="etkinlik">Etkinlik</option>
                </select>
              </div>
            </div>
            {formData.tutar && (
              <div className="form-info">
                9 daireye bölünecek: {(Number(formData.tutar) / 9).toFixed(2)} TL / daire
              </div>
            )}
            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">İptal</button>
              <button type="submit" className="btn btn-primary">Ekle</button>
            </div>
          </form>
        </div>
      )}

      <div className="card-flat">
        {expenses.map((expense) => (
          <div key={expense.id} className="list-item">
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '600', color: '#111827' }}>{expense.baslik}</p>
              {expense.aciklama && <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{expense.aciklama}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <span className={`badge ${expense.tip === 'aidat' ? 'badge-primary' : expense.tip === 'ekstra' ? 'badge-warning' : 'badge-purple'}`}>
                  {expense.tip === 'aidat' ? 'Aidat' : expense.tip === 'ekstra' ? 'Ekstra' : 'Etkinlik'}
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(expense.tarih).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{Number(expense.tutar).toFixed(2)} TL</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Daire başı: {(Number(expense.tutar) / 9).toFixed(2)} TL</p>
            </div>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <h3>Henüz gider yok</h3>
            <p>Admin yeni gider ekleyebilir</p>
          </div>
        )}
      </div>
    </div>
  )
}
