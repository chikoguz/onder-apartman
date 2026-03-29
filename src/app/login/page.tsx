'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adSoyad: '',
    telefon: '',
    daireNo: '',
    tip: 'owner',
  })

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              adSoyad: formData.adSoyad,
              telefon: formData.telefon,
              daireNo: formData.daireNo,
              tip: formData.tip,
              role: 'user',
            },
          },
        })
        if (error) throw error
        alert('Kayıt başarılı! Giriş yapabilirsiniz.')
        setIsRegister(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
      
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Önder Apartman</h1>
          <p className="text-gray-500 mt-2">Yönetim Sistemi</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-center mb-6">
            {isRegister ? 'Yeni Üye Ol' : 'Hoş Geldiniz'}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="label">Ad Soyad</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Adınızı girin"
                    value={formData.adSoyad}
                    onChange={(e) => setFormData({ ...formData, adSoyad: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Telefon</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="0555 555 55 55"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Daire No</label>
                    <select
                      required
                      className="input"
                      value={formData.daireNo}
                      onChange={(e) => setFormData({ ...formData, daireNo: e.target.value })}
                    >
                      <option value="">Seçin</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <option key={n} value={n}>Daire {n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Tip</label>
                    <select
                      className="input"
                      value={formData.tip}
                      onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                    >
                      <option value="owner">Mal Sahibi</option>
                      <option value="tenant">Kiracı</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="label">E-posta</label>
              <input
                type="email"
                required
                className="input"
                placeholder="email@ornek.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Şifre</label>
              <input
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Bekleyin...
                </span>
              ) : isRegister ? 'Üye Ol' : 'Giriş Yap'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500">
            {isRegister ? 'Zaten üye misiniz?' : 'Hesabınız yok mu?'}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
              }}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isRegister ? 'Giriş yap' : 'Üye ol'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
