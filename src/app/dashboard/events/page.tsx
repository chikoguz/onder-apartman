'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function EventsPage() {
  const [supabase, setSupabase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    baslik: '',
    aciklama: '',
    tarih: '',
    saat: '',
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

      const { data: eventsData } = await supabase
        .from('events')
        .select('*, olusturan:users(*)')
        .order('tarih', { ascending: true })
      setEvents(eventsData || [])
      setLoading(false)
    }
    getData()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const tarih = new Date(`${formData.tarih}T${formData.saat || '00:00'}`)

    await supabase.from('events').insert({
      baslik: formData.baslik,
      aciklama: formData.aciklama,
      tarih: tarih.toISOString(),
      olusturan_id: user.id,
    })

    setFormData({ baslik: '', aciklama: '', tarih: '', saat: '' })
    setShowForm(false)

    const { data: eventsData } = await supabase
      .from('events')
      .select('*, olusturan:users(*)')
      .order('tarih', { ascending: true })
    setEvents(eventsData || [])
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Etkinliği silmek istediğinize emin misiniz?')) return
    await supabase.from('events').delete().eq('id', id)

    const { data: eventsData } = await supabase
      .from('events')
      .select('*, olusturan:users(*)')
      .order('tarih', { ascending: true })
    setEvents(eventsData || [])
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const upcomingEvents = events.filter(e => new Date(e.tarih) >= new Date())
  const pastEvents = events.filter(e => new Date(e.tarih) < new Date())

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Etkinlikler</h2>
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
              Yeni Etkinlik
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Yeni Etkinlik Oluştur</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Etkinlik Adı</label>
              <input
                type="text"
                required
                className="input"
                placeholder="Etkinlik adı"
                value={formData.baslik}
                onChange={(e) => setFormData({ ...formData, baslik: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Açıklama</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Etkinlik açıklaması (opsiyonel)"
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tarih</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.tarih}
                  onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Saat</label>
                <input
                  type="time"
                  className="input"
                  value={formData.saat}
                  onChange={(e) => setFormData({ ...formData, saat: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Etkinlik Oluştur
            </button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {upcomingEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Gelecek Etkinlikler ({upcomingEvents.length})
            </h3>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="card p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-900">{event.baslik}</h4>
                      {event.aciklama && (
                        <p className="text-sm text-gray-500 mt-1">{event.aciklama}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(event.tarih)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(event.tarih)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {event.olusturan?.ad_soyad}
                        </span>
                      </div>
                    </div>
                    {event.olusturan_id === user?.id && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition self-start"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Geçmiş Etkinlikler ({pastEvents.length})
            </h3>
            <div className="space-y-3">
              {pastEvents.map((event) => (
                <div key={event.id} className="card p-4 opacity-60">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-700">{event.baslik}</h4>
                      {event.aciklama && (
                        <p className="text-sm text-gray-500 mt-1">{event.aciklama}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                        <span>{formatDate(event.tarih)}</span>
                        <span>{event.olusturan?.ad_soyad}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div className="card p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 mt-4">Henüz etkinlik yok</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary mt-4">
              İlk Etkinliği Oluştur
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
