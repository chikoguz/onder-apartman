'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'

export default function ChatPage() {
  const [supabase, setSupabase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setSupabase(createClient()) }, [])

  useEffect(() => {
    if (!supabase) return
    const getData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(userData)
      const { data: messagesData } = await supabase.from('messages').select('*, user:users(*)').order('created_at', { ascending: true })
      setMessages(messagesData || [])
    }
    getData()

    const channel = supabase.channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          supabase.from('messages').select('*, user:users(*)').eq('id', payload.new.id).single()
            .then(({ data }: any) => { if (data) setMessages((prev: any[]) => [...prev, data]) })
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev: any[]) => prev.map((m: any) => m.id === payload.new.id ? { ...m, ...payload.new } : m))
        } else if (payload.eventType === 'DELETE') {
          setMessages((prev: any[]) => prev.filter((m: any) => m.id !== payload.old.id))
        }
      }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!user || (!newMessage.trim() && !image)) return
    setUploading(true)
    let imageUrl = null
    if (image) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
      const { error } = await supabase.storage.from('chat-images').upload(fileName, image)
      if (error) { alert('Hata: ' + error.message); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(fileName)
      imageUrl = publicUrl
    }
    await supabase.from('messages').insert({ user_id: user.id, mesaj: newMessage, image_url: imageUrl })
    setNewMessage('')
    setImage(null)
    setUploading(false)
  }

  const handleEdit = async (id: string) => {
    if (!editText.trim()) return
    await supabase.from('messages').update({ mesaj: editText, updated_at: new Date().toISOString() }).eq('id', id)
    setEditingId(null)
    setEditText('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silinsin mi?')) return
    await supabase.from('messages').delete().eq('id', id)
  }

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <h1 className="page-title" style={{ marginBottom: '16px' }}>Sohbet</h1>

      <div className="card-flat" style={{ flex: 1, overflow: 'auto', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg: any) => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.user_id === user?.id ? 'flex-end' : 'flex-start' }}>
              <div className={`message-bubble ${msg.user_id === user?.id ? 'message-sent' : 'message-received'}`}>
                {msg.user_id !== user?.id && (
                  <p style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>{msg.user?.ad_soyad}</p>
                )}
                {editingId === msg.id ? (
                  <div>
                    <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: '100%', padding: '4px', color: '#111827' }} />
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      <button onClick={() => handleEdit(msg.id)} style={{ fontSize: '11px', padding: '2px 6px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px' }}>Kaydet</button>
                      <button onClick={() => setEditingId(null)} style={{ fontSize: '11px', padding: '2px 6px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px' }}>İptal</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p>{msg.mesaj}</p>
                    {msg.image_url && <img src={msg.image_url} alt="" style={{ maxWidth: '200px', borderRadius: '8px', marginTop: '8px' }} />}
                    {msg.user_id === user?.id && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setEditingId(msg.id); setEditText(msg.mesaj) }} style={{ fontSize: '10px', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>Düzenle</button>
                        <button onClick={() => handleDelete(msg.id)} style={{ fontSize: '10px', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>Sil</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="card" style={{ padding: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ cursor: 'pointer', padding: '8px', borderRadius: '8px', background: '#f3f4f6' }}>
            <svg width="20" height="20" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
          </label>
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Mesaj yazın..." style={{ flex: 1, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
          <button onClick={handleSend} disabled={uploading || (!newMessage.trim() && !image)} className="btn btn-primary" style={{ padding: '10px 20px' }}>
            {uploading ? '...' : 'Gönder'}
          </button>
        </div>
        {image && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>{image.name}</p>}
      </div>
    </div>
  )
}
