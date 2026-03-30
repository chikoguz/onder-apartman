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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f9fafb' }}>
      <div className="w-full max-w-sm animate-slideUp">
        <div className="text-center mb-8">
          <div style={{ 
            width: '56px', 
            height: '56px', 
            margin: '0 auto 16px',
            borderRadius: '12px',
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg style={{ width: '28px', height: '28px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Önder Apartman</h1>
          <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>Yönetim Sistemi</p>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
              <button
                onClick={() => { setIsRegister(false); setError('') }}
                style={{ 
                  padding: '8px 20px', 
                  borderRadius: '6px',
                  background: !isRegister ? 'white' : 'transparent',
                  color: !isRegister ? '#2563eb' : '#6b7280',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: !isRegister ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                Giriş
              </button>
              <button
                onClick={() => { setIsRegister(true); setError('') }}
                style={{ 
                  padding: '8px 20px', 
                  borderRadius: '6px',
                  background: isRegister ? 'white' : 'transparent',
                  color: isRegister ? '#2563eb' : '#6b7280',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: isRegister ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                Üye Ol
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
              <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
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
                <div className="form-group">
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
                  <div className="form-group">
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
                  <div className="form-group">
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

            <div className="form-group">
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

            <div className="form-group">
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
              className="btn btn-primary btn-lg w-full"
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg className="animate-spin" style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Bekleyin...
                </span>
              ) : isRegister ? 'Üye Ol' : 'Giriş Yap'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280', fontSize: '14px' }}>
            {isRegister ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
              }}
              style={{ color: '#2563eb', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {isRegister ? 'Giriş yapın' : 'Üye olun'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
