'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function ExpensesPage() {
  const [supabase, setSupabase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    baslik: '',
    aciklama: '',
    tutar: '',
    tip: 'aidat',
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

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .order('tarih', { ascending: false })
      setExpenses(expensesData || [])
      setLoading(false)
    }
    getData()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== 'admin') return

    const tutar = Number(formData.tutar)
    const perPerson = tutar / 9

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        baslik: formData.baslik,
        aciklama: formData.aciklama,
        tutar: tutar,
        tip: formData.tip,
        olusturan_id: user.id,
      })
      .select()
      .single()

    if (error) {
      alert('Hata: ' + error.message)
      return
    }

    const { data: users } = await supabase.from('users').select('id')
    if (users) {
      const debts = users.map((u: any) => ({
        user_id: u.id,
        expense_id: expense.id,
        tutar: perPerson,
        odendi: false,
      }))
      await supabase.from('debts').insert(debts)
    }

    setFormData({ baslik: '', aciklama: '', tutar: '', tip: 'aidat' })
    setShowForm(false)
    
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .order('tarih', { ascending: false })
    setExpenses(expensesData || [])
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const tipLabels: Record<string, { label: string; color: string }> = {
    aidat: { label: 'Aidat', color: 'bg-blue-100 text-blue-700' },
    ekstra: { label: 'Ekstra', color: 'bg-orange-100 text-orange-700' },
    etkinlik: { label: 'Etkinlik', color: 'bg-purple-100 text-purple-700' },
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Giderler</h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                İptal
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Yeni Gider
              </>
            )}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Yeni Gider Ekle</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Başlık</label>
              <input
                type="text"
                required
                className="input"
                placeholder="Gider başlığı"
                value={formData.baslik}
                onChange={(e) => setFormData({ ...formData, baslik: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Açıklama</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Açıklama (opsiyonel)"
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tutar (TL)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="input"
                  placeholder="0.00"
                  value={formData.tutar}
                  onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Tip</label>
                <select
                  className="input"
                  value={formData.tip}
                  onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                >
                  <option value="aidat">Aidat</option>
                  <option value="ekstra">Ekstra</option>
                  <option value="etkinlik">Etkinlik</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                <strong>Not:</strong> Bu gider 9 daireye bölünecek ve her daireye 
                <strong> {(Number(formData.tutar) || 0) / 9} TL</strong> borç olarak eklenecek.
              </p>
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Gider Ekle
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {expenses.map((expense) => (
          <div key={expense.id} className="card p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{expense.baslik}</h4>
              {expense.aciklama && (
                <p className="text-sm text-gray-500 mt-1">{expense.aciklama}</p>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className={`badge ${tipLabels[expense.tip]?.color}`}>
                  {tipLabels[expense.tip]?.label}
                </span>
                <span className="text-xs text-gray-400 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(expense.tarih).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">
                {Number(expense.tutar).toFixed(2)} TL
              </p>
              <p className="text-xs text-gray-500">
                Daire başı: {(Number(expense.tutar) / 9).toFixed(2)} TL
              </p>
            </div>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="card p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 mt-4">Henüz gider kaydedilmedi</p>
          </div>
        )}
      </div>
    </div>
  )
}
