import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner'
import { io } from 'socket.io-client'
import { Send, MessageCircle, Loader2, Check, X, QrCode } from 'lucide-react'
import Modal from '../ui/Modal'
import { API_BASE, chatApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const SOCKET_URL = API_BASE.replace(/\/api$/, '')

export default function ChatModal({ open, onClose, initialChatId }) {
  const { token, user } = useAuth()
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatActionLoading, setChatActionLoading] = useState(false)
  const [confirmingQr, setConfirmingQr] = useState(false)
  const [qrMode, setQrMode] = useState('camera')
  const [qrCodeInput, setQrCodeInput] = useState('')
  const [qrError, setQrError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isQrExpanded, setIsQrExpanded] = useState(true);
  const socketRef = useRef(null)
  const bottomRef = useRef(null)
  const activeChatRef = useRef(null)
  const scanLockRef = useRef(false)
  

  const updateChatInState = (updatedChat) => {
    if (!updatedChat) return
    setChats((prev) => {
      const existingIndex = prev.findIndex((chat) => chat.id === updatedChat.id)
      if (existingIndex === -1) {
        return [updatedChat, ...prev]
      }
      const next = [...prev]
      next[existingIndex] = { ...next[existingIndex], ...updatedChat }
      return next
    })
  }

  const getChatStatusLabel = (chat) => {
    if (!chat) return ''
    switch (chat.status) {
      case 'active':
        return chat.qrConfirmed ? 'ยืนยันแล้ว' : 'พร้อมแชท'
      case 'pending':
        if (chat.ownerAccepted || chat.requesterAccepted) {
          return 'รออีกฝ่ายยืนยัน'
        }
        return 'รอการยืนยัน'
      case 'declined':
        return 'ถูกปฏิเสธ'
      default:
        return chat.status
    }
  }

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

    socket.on('chat:created', (chat) => {
      setChats((prev) => {
        if (prev.some((existing) => existing.id === chat.id)) {
          return prev
        }
        return [chat, ...prev]
      })
      setActiveChatId(chat.id)
    })

    socket.on('chat:updated', (chat) => {
      updateChatInState(chat)
      if (chat.id === activeChatRef.current) {
        setActiveChatId((current) => current ?? chat.id)
      }
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
    if (!open) return
    if (initialChatId) {
      setActiveChatId(initialChatId)
    }
  }, [initialChatId, open])

  useEffect(() => {
    setQrMode('camera')
    setQrCodeInput('')
    setQrError('')
    setActionError('')
    scanLockRef.current = false
    setIsQrExpanded(true);
  }, [activeChatId])

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
    if (!activeChat?.canSendMessages) return
    socketRef.current?.emit('chat:message', { chatId: activeChatId, body: newMessage.trim() })
    setNewMessage('')
  }

  const handleAcceptChat = async () => {
    if (!token || !activeChatId) return
    setChatActionLoading(true)
    setActionError('')
    try {
      const updated = await chatApi.accept(token, activeChatId)
      updateChatInState(updated)
    } catch (err) {
      setActionError(err.message || 'ไม่สามารถยอมรับได้')
    } finally {
      setChatActionLoading(false)
    }
  }

  const handleDeclineChat = async () => {
    if (!token || !activeChatId) return
    if (!window.confirm('คุณต้องการปฏิเสธการแชทนี้หรือไม่?')) return
    setChatActionLoading(true)
    setActionError('')
    try {
      const updated = await chatApi.decline(token, activeChatId)
      updateChatInState(updated)
    } catch (err) {
      setActionError(err.message || 'ไม่สามารถปฏิเสธได้')
    } finally {
      setChatActionLoading(false)
    }
  }

  const handleConfirmQr = async (code) => {
    if (!token || !activeChatId) return
    const trimmed = (code || '').trim()
    if (!trimmed) {
      setQrError('กรุณากรอกรหัสแลกเปลี่ยน')
      return
    }
    setQrError('')
    scanLockRef.current = true
    setConfirmingQr(true)
    try {
      const updated = await chatApi.confirmQr(token, activeChatId, { code: trimmed })
      updateChatInState(updated)
      setQrCodeInput('')
    } catch (err) {
      setQrError(err.message || 'ไม่สามารถยืนยันรหัสได้')
      scanLockRef.current = false
    } finally {
      setConfirmingQr(false)
    }
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
  const chatStatus = activeChat?.status
  const isExchangeChat = activeChat?.isExchangeChat
  const isOwner = activeChat?.role === 'owner'
  const isRequester = activeChat?.role === 'requester'
  const hasAccepted =
    isOwner ? activeChat?.ownerAccepted : isRequester ? activeChat?.requesterAccepted : true
  const otherAccepted =
    isOwner ? activeChat?.requesterAccepted : isRequester ? activeChat?.ownerAccepted : true
  const chatDeclined = chatStatus === 'declined'
  // --- START: โค้ดที่แก้ไข ---
  const qrCodeExists = Boolean(activeChat?.qrCode) // 1. สร้างตัวแปรใหม่เช็คว่า QR มีหรือยัง
  const qrConfirmed = Boolean(activeChat?.qrConfirmed)

  // 2. แสดงปุ่ม "ยอมรับ/ปฏิเสธ" ถ้าแชทไม่ถูกปฏิเสธ และ QR Code "ยังไม่ถูกสร้าง"
  const showChatActions = isExchangeChat && !chatDeclined && !qrCodeExists

  // 3. แสดงส่วน QR ของ Owner ถ้าแชท active, เป็น owner, และ QR Code "ถูกสร้างแล้ว"
  const showQrOwner = isExchangeChat && chatStatus === 'active' && isOwner && qrCodeExists

  // 4. แสดงส่วน QR ของ Requester (Logic เดียวกัน)
  const showQrRequester = isExchangeChat && chatStatus === 'active' && isRequester && qrCodeExists
  // --- END: โค้ดที่แก้ไข ---
  
  const chatDisabled = chatDeclined || !activeChat?.canSendMessages 

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
                    {chat.isExchangeChat && (
                      <p className="mt-1 text-[11px] font-semibold text-primary">
                        {getChatStatusLabel(chat)}
                      </p>
                    )}
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
              <div className="flex h-[520px] flex-col">
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={18} className="text-primary" />
                    <div>
                      <p className="text-sm font-semibold">{activeChat.participant_name}</p>
                      <p className="text-xs text-gray-500">{activeChat.participant_email}</p>
                    </div>
                  </div>
                  {activeChat.itemTitle && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                      {activeChat.itemTitle}
                    </span>
                  )}
                </div>

                {actionError && (
                  <div className="mb-3 rounded-2xl bg-red-50 px-4 py-2 text-xs text-red-600">
                    {actionError}
                  </div>
                )}

                {isExchangeChat && (
                  <div className="mb-3 space-y-3">
                    {chatDeclined && (
                      <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow-inner">
                        การแชทนี้ถูกปฏิเสธแล้ว ไม่สามารถสนทนาต่อได้
                      </div>
                    )}

                    {showChatActions && !chatDeclined && (
                      <div className="rounded-2xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800 shadow-inner">
                        <p className="font-semibold text-yellow-900">ยืนยันเพื่อเปิดแชท</p>
                        <p className="mt-1 text-xs text-yellow-700">
                          {hasAccepted
                            ? 'คุณยืนยันแล้ว กำลังรออีกฝ่ายตอบรับ'
                            : 'กรุณายอมรับเพื่อเปิดการสนทนาและสร้าง QR Code ยืนยันการแลกเปลี่ยน'}
                        </p>
                        {!hasAccepted && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={handleDeclineChat}
                              disabled={chatActionLoading}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                            >
                              {chatActionLoading ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <>
                                  <X size={16} />
                                  <span>ปฏิเสธ</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={handleAcceptChat}
                              disabled={chatActionLoading}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark disabled:opacity-60"
                            >
                              {chatActionLoading ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <>
                                  <Check size={16} />
                                  <span>ยอมรับ</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        {hasAccepted && !otherAccepted && (
                          <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-yellow-700">
                            รออีกฝ่ายยืนยันอยู่...
                          </div>
                        )}
                      </div>
                    )}

                    {/* --- START: โค้ดที่แก้ไข (ฉบับสมบูรณ์ + Success Message) --- */}
                    {chatStatus === 'active' && !chatDeclined && (
                      <>
                        {qrConfirmed ? (
                          // -------------------------------
                          // 1. ถ้า QR ยืนยันแล้ว: แสดง "แลกเปลี่ยนสำเร็จ"
                          // -------------------------------
                          <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 shadow-inner">
                            <p className="font-semibold text-green-900">✅ แลกเปลี่ยนสำเร็จ!</p>
                            <p className="mt-1 text-xs text-green-600">
                              การแลกเปลี่ยนเสร็จสมบูรณ์แล้ว ขอบคุณที่ใช้บริการ CMU ShareCycle
                            </p>
                          </div>
                        ) : (
                          // -------------------------------
                          // 2. ถ้า QR ยังไม่ยืนยัน: แสดง UI ย่อ/ขยาย แบบเดิม
                          // -------------------------------
                          <>
                            {isQrExpanded ? (
                              // 2a. มุมมอง "ขยาย" (แบบเดิม + ปุ่มย่อ)
                              <>
                                {showQrOwner && (
                                  <div className="relative rounded-[32px] border border-primary/15 bg-[#F4FBF4] p-6 text-center shadow-soft">
                                    <button
                                      type="button"
                                      onClick={() => setIsQrExpanded(false)}
                                      className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-gray-900/10"
                                      title="ย่อ"
                                    >
                                      <X size={18} />
                                    </button>
                                    
                                    {/* --- เนื้อหา QR Code เดิมของ Owner --- */}
                                    <div className="mb-4 flex items-center justify-center gap-3">
                                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow">
                                        <QrCode size={22} />
                                      </div>
                                      <div className="text-left">
                                        <p className="text-base font-semibold text-primary">แสดง QR Code</p>
                                        <p className="text-xs text-gray-500">
                                          แสดง QR Code หรือรหัสให้อีกฝ่ายเพื่อยืนยันการแลกเปลี่ยน
                                        </p>
                                      </div>
                                    </div>
                                    {activeChat.qrCode ? (
                                      <>
                                        <div className="mx-auto inline-flex rounded-[24px] border border-primary/10 bg-white p-5 shadow-card">
                                          <QRCodeCanvas value={activeChat.qrCode} size={200} includeMargin />
                                        </div>
                                        <div className="mx-auto mt-6 w-full rounded-[18px] bg-white px-4 py-3 shadow-inner">
                                          <p className="text-xs font-semibold text-gray-500">รหัสการแลกเปลี่ยน</p>
                                          <p className="mt-1 text-2xl font-bold tracking-widest text-primary">
                                            {activeChat.qrCode}
                                          </p>
                                          <p className="mt-2 text-xs text-gray-500">
                                            ส่งรหัสนี้หรือให้เพื่อนสแกน QR Code เพื่อยืนยันการแลกเปลี่ยน
                                          </p>
                                        </div>
                                      </>
                                    ) : (
                                      <p className="mt-3 text-sm text-gray-600">กำลังสร้าง QR Code...</p>
                                    )}
                                    <div className="mt-4 rounded-[18px] bg-white px-4 py-3 text-left text-xs text-gray-600 shadow-inner">
                                      <p className="font-semibold text-primary">คำแนะนำ:</p>
                                      <ol className="mt-2 list-decimal space-y-1 pl-5">
                                        <li>แสดง QR Code ให้อีกฝ่ายสแกน</li>
                                        <li>หรือบอกรหัสด้านบนให้อีกฝ่ายใส่</li>
                                        <li>เมื่ออีกฝ่ายยืนยันแล้ว การแลกเปลี่ยนจะเสร็จสมบูรณ์</li>
                                      </ol>
                                    </div>
                                    {/* (เราลบ "✅ อีกฝ่ายยืนยัน..." ออกจากตรงนี้) */}
                                  </div>
                                )}

                                {showQrRequester && (
                                  <div className="relative rounded-[32px] border border-primary/15 bg-[#F4FBF4] p-6 shadow-soft">
                                    <button
                                      type="button"
                                      onClick={() => setIsQrExpanded(false)}
                                      className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-gray-900/10"
                                      title="ย่อ"
                                    >
                                      <X size={18} />
                                    </button>
                                    
                                    {/* --- เนื้อหา QR Code เดิมของ Requester --- */}
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-base font-semibold text-primary">สแกน QR Code</p>
                                        <p className="text-xs text-gray-500">
                                          สแกนหรือกรอกรหัสจากผู้โพสต์เพื่อยืนยันการแลกเปลี่ยน
                                        </p>
                                      </div>
                                      <div className="flex gap-2 rounded-full bg-white p-1 text-xs font-semibold text-primary shadow-inner">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setQrMode('camera')
                                            setQrError('')
                                            scanLockRef.current = false
                                          }}
                                          className={`flex-1 rounded-full px-4 py-2 ${
                                            qrMode === 'camera'
                                              ? 'bg-primary text-white'
                                              : 'transition hover:bg-primary/10'
                                          }`}
                                        >
                                          สแกนกล้อง
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setQrMode('manual')
                                            setQrError('')
                                            scanLockRef.current = false
                                          }}
                                          className={`flex-1 rounded-full px-4 py-2 ${
                                            qrMode === 'manual'
                                              ? 'bg-primary text-white'
                                              : 'transition hover:bg-primary/10'
                                          }`}
                                        >
                                          ใส่รหัส
                                        </button>
                                      </div>
                                    </div>

                                    {/* (เราลบ "✅ ยืนยัน..." ออกจากตรงนี้) */}
                                    {qrMode === 'camera' ? (
                                      <div className="mt-4 overflow-hidden rounded-[28px] border border-gray-900/10 bg-black">
                                        <QrScanner
                                          onDecode={(result) => {
                                            if (
                                              result &&
                                              !confirmingQr &&
                                              !qrConfirmed &&
                                              !scanLockRef.current
                                            ) {
                                              handleConfirmQr(
                                                typeof result === 'string'
                                                  ? result
                                                  : Array.isArray(result)
                                                  ? result[0]
                                                  : ''
                                              )
                                            }
                                          }}
                                          onError={(error) => {
                                            if (error) {
                                              setQrError(error?.message || 'ไม่สามารถเปิดกล้องได้')
                                            }
                                          }}
                                          constraints={{ facingMode: 'environment' }}
                                          containerStyle={{ width: '100%', padding: 0 }}
                                          videoStyle={{ width: '100%' }}
                                        />
                                        <div className="bg-black/70 px-4 py-3 text-center text-xs text-white">
                                          กรุณาอนุญาตการใช้งานกล้อง และวาง QR Code ให้อยู่ในกรอบ
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mt-4 space-y-3 rounded-[24px] bg-white px-4 py-4 shadow-inner">
                                        <p className="text-xs font-semibold text-gray-600">
                                          กรอกรหัสที่ได้รับ (รูปแบบ EX12345678)
                                        </p>
                                        <input
                                          type="text"
                                          value={qrCodeInput}
                                          onChange={(e) => setQrCodeInput(e.target.value.toUpperCase())}
                                          placeholder="EXXXXXXXXX"
                                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-center text-sm uppercase tracking-[0.2em]"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleConfirmQr(qrCodeInput)}
                                          disabled={confirmingQr}
                                          className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark disabled:opacity-60"
                                        >
                                          {confirmingQr ? (
                                            <Loader2 className="mx-auto animate-spin" size={16} />
                                          ) : (
                                            'ยืนยันรหัส'
                                          )}
                                        </button>
                                      </div>
                                    )}
                                    <div className="mt-4 rounded-[18px] bg-white px-4 py-3 text-left text-xs text-gray-600 shadow-inner">
                                      <p className="font-semibold text-primary">วิธีสแกน:</p>
                                      <ol className="mt-2 list-decimal space-y-1 pl-5">
                                        <li>อนุญาตให้เข้าถึงกล้องของคุณ</li>
                                        <li>วาง QR Code ที่ได้รับจากผู้โพสต์ให้อยู่ในกรอบ</li>
                                        <li>ระบบจะสแกนอัตโนมัติเมื่อพบ QR Code</li>
                                      </ol>
                                    </div>
                                    {qrError && (
                                      <div className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">
                                        {qrError}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              // 2b. มุมมอง "ย่อ" (แบบใหม่)
                              <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3 text-sm shadow-inner">
                                <div className="flex items-center gap-2 font-semibold text-primary">
                                  <QrCode size={16} />
                                  <span>
                                    {/* (โค้ดนี้ยังทำงานเหมือนเดิม แต่จะถูกซ่อนเมื่อ qrConfirmed=true) */}
                                    {qrConfirmed
                                      ? 'ยืนยันการแลกเปลี่ยนแล้ว'
                                      : 'พร้อมยืนยันการแลกเปลี่ยน'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setIsQrExpanded(true)}
                                  className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-card transition hover:bg-primary-dark"
                                >
                                  {qrConfirmed ? 'ดู' : 'ขยาย'}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                    {/* --- END: โค้ดที่แก้ไข (ฉบับสมบูรณ์ + Success Message) --- */}
                    
                
                  </div>
                  )}

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
                    placeholder={
                      chatDisabled ? 'ไม่สามารถส่งข้อความได้' : 'พิมพ์ข้อความ...'
                    }
                    disabled={chatDisabled}
                    className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={chatDisabled || !newMessage.trim()}
                    className="rounded-2xl bg-primary px-4 py-2 text-white shadow-md transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
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




