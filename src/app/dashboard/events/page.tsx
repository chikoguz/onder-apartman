'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function EventsPage() {
  const supabase = createClient()
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const upcomingEvents = events.filter(e => new Date(e.tarih) >= new Date())
  const pastEvents = events.filter(e => new Date(e.tarih) < new Date())

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Etkinlikler</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'İptal' : 'Yeni Etkinlik'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Yeni Etkinlik Oluştur</h3>
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
                  Tarih
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.tarih}
                  onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saat
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.saat}
                  onChange={(e) => setFormData({ ...formData, saat: e.target.value })}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Etkinlik Oluştur
            </button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {upcomingEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Gelecek Etkinlikler ({upcomingEvents.length})
            </h3>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl border p-4 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{event.baslik}</h4>
                    {event.aciklama && (
                      <p className="text-sm text-gray-500 mt-1">{event.aciklama}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-sm text-gray-600">
                      <span>📅 {new Date(event.tarih).toLocaleDateString('tr-TR')}</span>
                      <span>🕐 {new Date(event.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>👤 {event.olusturan?.ad_soyad}</span>
                    </div>
                  </div>
                  {event.olusturan_id === user?.id && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-500">
              Geçmiş Etkinlikler ({pastEvents.length})
            </h3>
            <div className="space-y-3">
              {pastEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-gray-50 rounded-xl border p-4 flex justify-between items-start opacity-60"
                >
                  <div>
                    <h4 className="font-semibold">{event.baslik}</h4>
                    {event.aciklama && (
                      <p className="text-sm text-gray-500 mt-1">{event.aciklama}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-sm text-gray-500">
                      <span>📅 {new Date(event.tarih).toLocaleDateString('tr-TR')}</span>
                      <span>👤 {event.olusturan?.ad_soyad}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <p className="text-center text-gray-500 py-8">Henüz etkinlik yok</p>
        )}
      </div>
    </div>
  )
}
