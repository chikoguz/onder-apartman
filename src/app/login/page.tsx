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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.5px' }}>Önder Apartman</h1>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '15px' }}>Yönetim Sistemi</p>
        </div>

        <div className="card-static p-7">
          <div className="flex justify-center mb-6">
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
              <button
                onClick={() => { setIsRegister(false); setError('') }}
                className="btn-ghost"
                style={{ 
                  padding: '8px 20px', 
                  borderRadius: '8px',
                  background: !isRegister ? 'white' : 'transparent',
                  boxShadow: !isRegister ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  color: !isRegister ? '#3b82f6' : '#64748b',
                  fontWeight: !isRegister ? '600' : '500'
                }}
              >
                Giriş
              </button>
              <button
                onClick={() => { setIsRegister(true); setError('') }}
                className="btn-ghost"
                style={{ 
                  padding: '8px 20px', 
                  borderRadius: '8px',
                  background: isRegister ? 'white' : 'transparent',
                  boxShadow: isRegister ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  color: isRegister ? '#3b82f6' : '#64748b',
                  fontWeight: isRegister ? '600' : '500'
                }}
              >
                Üye Ol
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl text-sm flex items-center gap-2" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
                <div className="form-row">
                  <div>
                    <label className="label">Daire No</label>
                    <select
                      required
                      className="select"
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
                      className="select"
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
              className="btn btn-primary w-full btn-lg"
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Bekleyin...
                </span>
              ) : isRegister ? 'Üye Ol' : 'Giriş Yap'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6" style={{ color: '#64748b', fontSize: '14px' }}>
          {isRegister ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'}{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
            }}
            className="font-semibold cursor-pointer"
            style={{ color: '#3b82f6' }}
          >
            {isRegister ? 'Giriş yapın' : 'Üye olun'}
          </button>
        </p>
      </div>
    </div>
  )
}
