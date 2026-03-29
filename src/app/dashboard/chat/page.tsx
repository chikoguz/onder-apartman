'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'

export default function ChatPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

      const { data: messagesData } = await supabase
        .from('messages')
        .select('*, user:users(*)')
        .order('created_at', { ascending: true })
      setMessages(messagesData || [])
    }
    getData()

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          supabase
            .from('messages')
            .select('*, user:users(*)')
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) setMessages((prev) => [...prev, data])
            })
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          )
        } else if (payload.eventType === 'DELETE') {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!user || (!newMessage.trim() && !image)) return

    setUploading(true)
    let imageUrl = null

    if (image) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, image)

      if (uploadError) {
        alert('Resim yükleme hatası: ' + uploadError.message)
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName)
      
      imageUrl = publicUrl
    }

    await supabase.from('messages').insert({
      user_id: user.id,
      mesaj: newMessage,
      image_url: imageUrl,
    })

    setNewMessage('')
    setImage(null)
    setUploading(false)
  }

  const handleEdit = async (id: string) => {
    if (!editText.trim()) return
    
    await supabase
      .from('messages')
      .update({ mesaj: editText, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    setEditingId(null)
    setEditText('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Mesajı silmek istediğinize emin misiniz?')) return
    await supabase.from('messages').delete().eq('id', id)
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <h2 className="text-2xl font-bold mb-4">Sohbet</h2>

      <div className="flex-1 overflow-y-auto bg-white rounded-xl border p-4 space-y-4 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] ${
                msg.user_id === user?.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              } rounded-lg p-3`}
            >
              <p className="text-xs opacity-70 mb-1">
                {msg.user?.ad_soyad || 'Kullanıcı'} - {formatTime(msg.created_at)}
              </p>
              
              {editingId === msg.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-2 py-1 text-black rounded"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(msg.id)}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs bg-gray-500 text-white px-2 py-1 rounded"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p>{msg.mesaj}</p>
                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt="Resim"
                      className="mt-2 rounded max-w-full"
                    />
                  )}
                  {msg.user_id === user?.id && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setEditingId(msg.id)
                          setEditText(msg.mesaj)
                        }}
                        className="text-xs opacity-70 hover:opacity-100"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="text-xs opacity-70 hover:opacity-100 text-red-300"
                      >
                        Sil
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="flex gap-2">
          <label className="cursor-pointer px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </label>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Mesaj yazın..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={uploading || (!newMessage.trim() && !image)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? '...' : 'Gönder'}
          </button>
        </div>
        {image && (
          <p className="text-sm text-gray-500 mt-2">
            Seçili: {image.name}
          </p>
        )}
      </div>
    </div>
  )
}
