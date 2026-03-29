'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function ExpensesPage() {
  const supabase = createClient()
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
      const debts = users.map(u => ({
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const tipLabels: Record<string, string> = {
    aidat: 'Aidat',
    ekstra: 'Ekstra',
    etkinlik: 'Etkinlik',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Giderler</h2>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'İptal' : 'Yeni Gider'}
          </button>
        )}
      </div>

      {showForm && user?.role === 'admin' && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Yeni Gider Ekle</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlık
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.baslik}
                onChange={(e) => setFormData({ ...formData, baslik: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar (TL)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.tutar}
                  onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tip
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.tip}
                  onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                >
                  <option value="aidat">Aidat</option>
                  <option value="ekstra">Ekstra</option>
                  <option value="etkinlik">Etkinlik</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Gider Ekle (9 daireye bölünecek)
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="bg-white rounded-xl border p-4 flex justify-between items-center"
          >
            <div>
              <h4 className="font-semibold">{expense.baslik}</h4>
              {expense.aciklama && (
                <p className="text-sm text-gray-500">{expense.aciklama}</p>
              )}
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {tipLabels[expense.tip]}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(expense.tarih).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-800">
                {Number(expense.tutar).toFixed(2)} TL
              </p>
              <p className="text-xs text-gray-500">
                Daire başı: {(Number(expense.tutar) / 9).toFixed(2)} TL
              </p>
            </div>
          </div>
        ))}
        {expenses.length === 0 && (
          <p className="text-center text-gray-500 py-8">Henüz gider yok</p>
        )}
      </div>
    </div>
  )
}
