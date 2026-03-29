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

      const { data: messagesData } = await supabase
        .from('messages')
        .select('*, user:users(*)')
        .order('created_at', { ascending: true })
      setMessages(messagesData || [])
    }
    getData()

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          supabase
            .from('messages')
            .select('*, user:users(*)')
            .eq('id', payload.new.id)
            .single()
            .then(({ data }: any) => {
              if (data) setMessages((prev: any[]) => [...prev, data])
            })
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev: any[]) =>
            prev.map((m: any) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          )
        } else if (payload.eventType === 'DELETE') {
          setMessages((prev: any[]) => prev.filter((m: any) => m.id !== payload.old.id))
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Sohbet</h2>

      <div className="flex-1 overflow-y-auto card p-4 space-y-4 mb-4">
        {messages.map((msg: any, index: number) => {
          const showDate = index === 0 || formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at)
          
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center my-4">
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`message-bubble ${msg.user_id === user?.id ? 'message-sent' : 'message-received'}`}>
                  {msg.user_id !== user?.id && (
                    <p className="text-xs opacity-70 mb-1 font-medium">
                      {msg.user?.ad_soyad || 'Kullanıcı'}
                    </p>
                  )}
                  
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
                          className="mt-2 rounded-lg max-w-full"
                        />
                      )}
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className="text-xs opacity-70">{formatTime(msg.created_at)}</span>
                        {msg.user_id === user?.id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingId(msg.id)
                                setEditText(msg.mesaj)
                              }}
                              className="text-xs opacity-50 hover:opacity-100"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="text-xs opacity-50 hover:opacity-100 text-red-300"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="card p-4">
        <div className="flex gap-2 items-end">
          <label className="cursor-pointer p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="input flex-1"
          />
          <button
            onClick={handleSend}
            disabled={uploading || (!newMessage.trim() && !image)}
            className="btn btn-primary px-6"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        {image && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-500">Seçili: {image.name}</span>
            <button onClick={() => setImage(null)} className="text-red-500 text-sm">Kaldır</button>
          </div>
        )}
      </div>
    </div>
  )
}
