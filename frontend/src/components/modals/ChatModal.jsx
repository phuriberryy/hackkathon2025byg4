import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { Send, MessageCircle, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'
import { API_BASE, chatApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const SOCKET_URL = API_BASE.replace(/\/api$/, '')

export default function ChatModal({ open, onClose }) {
  const { token, user } = useAuth()
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const socketRef = useRef(null)
  const bottomRef = useRef(null)
  const activeChatRef = useRef(null)

  useEffect(() => {
    if (!open || !token) return

    setLoading(true)
    chatApi
      .list(token)
      .then((data) => {
        setChats(data)
        setActiveChatId((current) => current ?? data[0]?.id ?? null)
      })
      .finally(() => setLoading(false))
  }, [open, token])

  useEffect(() => {
    if (!token || !open) return

    const socket = io(SOCKET_URL, {
      auth: { token },
    })
    socketRef.current = socket

    socket.on('connect_error', (err) => {
      console.error('Socket error', err)
    })

    socket.on('chat:message', (message) => {
      setMessages((prev) =>
        message.chat_id === activeChatRef.current ? [...prev, message] : prev
      )
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setMessages([])
      setActiveChatId(null)
      activeChatRef.current = null
    }
  }, [token, open])

  useEffect(() => {
    if (!token || !activeChatId || !open) return

    activeChatRef.current = activeChatId
    socketRef.current?.emit('chat:join', { chatId: activeChatId })
    chatApi.messages(token, activeChatId).then(setMessages)
  }, [activeChatId, token, open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChatId) return
    socketRef.current?.emit('chat:message', { chatId: activeChatId, body: newMessage.trim() })
    setNewMessage('')
  }

  const handleStartChat = async () => {
    if (!recipientEmail || !token) return
    if (!recipientEmail.endsWith('@cmu.ac.th')) {
      alert('ต้องใช้อีเมล @cmu.ac.th เท่านั้น')
      return
    }
    const chat = await chatApi.create(token, { participantEmail: recipientEmail })
    if (!chats.find((c) => c.id === chat.id)) {
      setChats((prev) => [chat, ...prev])
    }
    setRecipientEmail('')
    setActiveChatId(chat.id)
  }

  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId), [chats, activeChatId])

  return (
    <Modal open={open} onClose={onClose} title="Messages" size="xl">
      {!token ? (
        <p className="text-sm text-gray-500">กรุณาเข้าสู่ระบบเพื่อใช้งานแชท</p>
      ) : (
        <div className="flex gap-4">
          <div className="w-64 space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500">เริ่มแชทกับอีเมล CMU</label>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="friend@cmu.ac.th"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white"
                >
                  เริ่ม
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-surface p-3">
              <p className="mb-2 text-xs font-semibold text-gray-500">การสนทนา</p>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="animate-spin" size={14} /> Loading...
                  </div>
                )}
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                      activeChatId === chat.id ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                    }`}
                    onClick={() => setActiveChatId(chat.id)}
                  >
                    <p className="font-semibold text-gray-800">{chat.participant_name || 'CMU Student'}</p>
                    <p className="text-xs text-gray-500">{chat.participant_email}</p>
                  </button>
                ))}
                {!loading && chats.length === 0 && (
                  <p className="text-xs text-gray-500">ยังไม่มีการสนทนา</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-3xl bg-white p-4 shadow-inner">
            {activeChat ? (
              <div className="flex h-[420px] flex-col">
                <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <MessageCircle size={18} className="text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{activeChat.participant_name}</p>
                    <p className="text-xs text-gray-500">{activeChat.participant_email}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                          msg.sender_id === user?.id
                            ? 'bg-primary text-white'
                            : 'bg-surface text-gray-800'
                        }`}
                      >
                        {msg.body}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSend()
                      }
                    }}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    className="rounded-2xl bg-primary px-4 py-2 text-white shadow-md"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-sm text-gray-500">
                <MessageCircle className="mb-2 text-primary" />
                เลือกการสนทนาหรือเริ่มใหม่ด้วยอีเมล CMU
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

