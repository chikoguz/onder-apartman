'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function EventsPage() {
  const [supabase, setSupabase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ baslik: '', aciklama: '', tarih: '', saat: '' })

  useEffect(() => { setSupabase(createClient()) }, [])

  useEffect(() => {
    if (!supabase) return
    const getData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(userData)
      const { data: eventsData } = await supabase.from('events').select('*, olusturan:users(*)').order('tarih', { ascending: true })
      setEvents(eventsData || [])
      setLoading(false)
    }
    getData()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const tarih = new Date(`${formData.tarih}T${formData.saat || '00:00'}`)
    await supabase.from('events').insert({ baslik: formData.baslik, aciklama: formData.aciklama, tarih: tarih.toISOString(), olusturan_id: user.id })
    setFormData({ baslik: '', aciklama: '', tarih: '', saat: '' })
    setShowForm(false)
    const { data: eventsData } = await supabase.from('events').select('*, olusturan:users(*)').order('tarih', { ascending: true })
    setEvents(eventsData || [])
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silinsin mi?')) return
    await supabase.from('events').delete().eq('id', id)
    const { data: eventsData } = await supabase.from('events').select('*, olusturan:users(*)').order('tarih', { ascending: true })
    setEvents(eventsData || [])
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%' }} /></div>

  const upcoming = events.filter(e => new Date(e.tarih) >= new Date())
  const past = events.filter(e => new Date(e.tarih) < new Date())

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Etkinlikler</h1>
        <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn btn-secondary' : 'btn btn-primary'}>
          {showForm ? 'İptal' : '+ Yeni Etkinlik'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Yeni Etkinlik</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Başlık</label>
              <input type="text" required className="input" placeholder="Etkinlik adı" value={formData.baslik} onChange={(e) => setFormData({ ...formData, baslik: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Açıklama</label>
              <textarea className="textarea" placeholder="Açıklama" value={formData.aciklama} onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Tarih</label>
                <input type="date" required className="input" value={formData.tarih} onChange={(e) => setFormData({ ...formData, tarih: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Saat</label>
                <input type="time" className="input" value={formData.saat} onChange={(e) => setFormData({ ...formData, saat: e.target.value })} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">İptal</button>
              <button type="submit" className="btn btn-primary">Oluştur</button>
            </div>
          </form>
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 className="section-title">Gelecek Etkinlikler</h3>
          <div className="card-flat">
            {upcoming.map((event) => (
              <div key={event.id} className="list-item">
                <div style={{ width: '48px', height: '48px', background: '#f3e8ff', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#7c3aed' }}>{new Date(event.tarih).getDate()}</span>
                  <span style={{ fontSize: '10px', color: '#a855f7' }}>{new Date(event.tarih).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', fontSize: '14px' }}>{event.baslik}</p>
                  {event.aciklama && <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{event.aciklama}</p>}
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    {new Date(event.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • {event.olusturan?.ad_soyad}
                  </p>
                </div>
                {event.olusturan_id === user?.id && (
                  <button onClick={() => handleDelete(event.id)} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="section-title">Geçmiş Etkinlikler</h3>
          <div className="card-flat" style={{ opacity: 0.6 }}>
            {past.map((event) => (
              <div key={event.id} className="list-item">
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '500', fontSize: '14px' }}>{event.baslik}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(event.tarih).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="card-flat">
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <h3>Henüz etkinlik yok</h3>
            <p>Yeni etkinlik oluşturun</p>
          </div>
        </div>
      )}
    </div>
  )
}
