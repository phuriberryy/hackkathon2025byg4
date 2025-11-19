import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import { io } from 'socket.io-client'
import { Send, MessageCircle, Loader2, Check, X, QrCode, CheckCheck, MapPin } from 'lucide-react'
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
  const qrCodeScannerRef = useRef(null)
  const qrCodeReaderRef = useRef(null)
  

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
        return chat.qrConfirmed ? 'Confirmed' : 'Ready to chat'
      case 'pending':
        if (chat.ownerAccepted || chat.requesterAccepted) {
          return 'Waiting for the other party to confirm'
        }
        return 'Waiting for confirmation'
      case 'declined':
        return 'Declined'
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
        setChats(Array.isArray(data) ? data : [])
        setActiveChatId((current) => current ?? (Array.isArray(data) && data[0]?.id ? data[0].id : null))
      })
      .catch((err) => {
        console.error('Failed to load chats:', err)
        setChats([])
      })
      .finally(() => setLoading(false))
  }, [open, token])

  useEffect(() => {
    if (!token || !open) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      timeout: 20000,
      transports: ['polling', 'websocket'], // Try polling first (more reliable), then websocket
      upgrade: true, // Allow upgrade from polling to websocket
    })
    socketRef.current = socket

    socket.on('connect_error', (err) => {
      // Only log once to reduce console spam, and only for non-transport errors
      if (!socketRef.current?.hasLoggedError && err.message !== 'websocket error') {
        console.error('Socket connection error:', err.message)
        socketRef.current.hasLoggedError = true
        // Reset after 10 seconds to allow retry logging
        setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.hasLoggedError = false
          }
        }, 10000)
      }
    })

    socket.on('connect', () => {
      // Reset error flag on successful connection
      if (socketRef.current) {
        socketRef.current.hasLoggedError = false
      }
      // Rejoin active chat room after reconnection
      if (activeChatRef.current) {
        socket.emit('chat:join', { chatId: activeChatRef.current })
        // Reload messages after reconnection
        if (token && activeChatRef.current) {
          chatApi.messages(token, activeChatRef.current)
            .then(setMessages)
            .catch((err) => {
              console.error('Failed to reload messages after reconnection:', err)
              // Don't show alert for reconnection errors
            })
        }
      }
    })
    
    socket.on('chat:error', ({ message }) => {
      alert(message || 'Failed to send message')
    })

    socket.on('chat:message', (message) => {
      setMessages((prev) => {
        // Check if message already exists (avoid duplicates after reconnection)
        const exists = prev.some((msg) => msg.id === message.id)
        if (exists) return prev
        return message.chat_id === activeChatRef.current ? [...prev, message] : prev
      })
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

    socket.on('message:read', ({ messageId, readAt }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, read_at: readAt, is_read: true } : msg
        )
      )
    })

    socket.on('disconnect', (reason) => {
      console.debug('Socket disconnected:', reason)
      // Will automatically reconnect due to reconnection: true
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

  // Calculate activeChat and related values before useEffect that uses them
  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId), [chats, activeChatId])
  const qrConfirmed = useMemo(() => Boolean(activeChat?.qrConfirmed), [activeChat?.qrConfirmed])

  // Define handleConfirmQr before useEffect that uses it
  const handleConfirmQr = useCallback(async (code) => {
    if (!token || !activeChatId) return
    const trimmed = (code || '').trim()
    if (!trimmed) {
      setQrError(`Please enter the ${activeChat?.isDonationChat ? 'donation' : 'exchange'} code`)
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
      setQrError(err.message || 'Failed to confirm code')
      scanLockRef.current = false
    } finally {
      setConfirmingQr(false)
    }
  }, [token, activeChatId])

  // Setup and cleanup html5-qrcode scanner
  useEffect(() => {
    let isMounted = true
    let timer = null
    let scannerInstance = null

    const cleanupScanner = async () => {
      if (scannerInstance) {
        try {
          // Stop scanner first, then clear
          // html5-qrcode will handle the state check internally
          await scannerInstance.stop().catch(() => {
            // Ignore if already stopped or not running
          })
          // Clear only after stop is complete
          scannerInstance.clear()
        } catch (err) {
          // Ignore errors during cleanup (scanner might already be stopped)
          console.debug('Scanner cleanup error:', err)
        }
        scannerInstance = null
      }
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current = null
      }
    }

    if (!open || qrMode !== 'camera') {
      // Cleanup if scanner is running but conditions are not met
      cleanupScanner()
      return () => {
        isMounted = false
        if (timer) clearTimeout(timer)
        cleanupScanner()
      }
    }

    // Wait for ref to be available
    timer = setTimeout(async () => {
      // Cleanup any existing scanner before starting a new one
      if (qrCodeScannerRef.current) {
        await cleanupScanner()
      }
      
      if (!isMounted || !qrCodeReaderRef.current) return

      const qrCodeId = 'qr-reader'
      const html5QrCode = new Html5Qrcode(qrCodeId)
      scannerInstance = html5QrCode
      qrCodeScannerRef.current = html5QrCode

      const startScanning = async () => {
        if (!isMounted) return
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              if (
                isMounted &&
                decodedText &&
                !confirmingQr &&
                !qrConfirmed &&
                !scanLockRef.current
              ) {
                handleConfirmQr(decodedText)
              }
            },
            (errorMessage) => {
              // Ignore errors during scanning (common when no QR code is detected)
            }
          )
        } catch (err) {
          if (isMounted) {
            setQrError(err?.message || 'Failed to open camera')
          }
        }
      }

      startScanning()
    }, 100)

    return () => {
      isMounted = false
      if (timer) clearTimeout(timer)
      cleanupScanner()
    }
  }, [open, qrMode, confirmingQr, qrConfirmed, handleConfirmQr])

  useEffect(() => {
    if (!token || !activeChatId || !open) return

    activeChatRef.current = activeChatId
    // Only join if socket is connected
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:join', { chatId: activeChatId })
    }
    chatApi.messages(token, activeChatId)
      .then(setMessages)
      .catch((err) => {
        console.error('Failed to load messages:', err)
        setMessages([]) // Reset messages on error
      })
  }, [activeChatId, token, open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChatId) return
    if (!activeChat?.canSendMessages) return
    
    // Check socket connection with retry
    if (!socketRef.current?.connected) {
      // Wait a bit for reconnection
      await new Promise(resolve => setTimeout(resolve, 500))
      if (!socketRef.current?.connected) {
        alert('Cannot connect to server. Please wait a moment and try again')
        return
      }
    }
    
    try {
      socketRef.current.emit('chat:message', { chatId: activeChatId, body: newMessage.trim() })
      setNewMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
      alert('Failed to send message. Please try again')
    }
  }

  const handleAcceptChat = async () => {
    if (!token || !activeChatId) return
    setChatActionLoading(true)
    setActionError('')
    try {
      const updated = await chatApi.accept(token, activeChatId)
      updateChatInState(updated)
    } catch (err) {
      setActionError(err.message || 'Failed to accept')
    } finally {
      setChatActionLoading(false)
    }
  }

  const handleDeclineChat = async () => {
    if (!token || !activeChatId) return
    if (!window.confirm('Do you want to decline this chat?')) return
    setChatActionLoading(true)
    setActionError('')
    try {
      const updated = await chatApi.decline(token, activeChatId)
      updateChatInState(updated)
    } catch (err) {
      setActionError(err.message || 'Failed to decline')
    } finally {
      setChatActionLoading(false)
    }
  }

  const handleStartChat = async () => {
    if (!recipientEmail || !token) return
    const trimmedEmail = recipientEmail.trim()
    if (!trimmedEmail) {
      alert('Please enter email')
      return
    }
    if (!trimmedEmail.endsWith('@cmu.ac.th')) {
      alert('Must use @cmu.ac.th email only')
      return
    }
    try {
      const chat = await chatApi.create(token, { participantEmail: trimmedEmail })
      if (chat && chat.id) {
        if (!chats.find((c) => c.id === chat.id)) {
          setChats((prev) => [chat, ...prev])
        }
        setRecipientEmail('')
        setActiveChatId(chat.id)
      }
    } catch (err) {
      console.error('Failed to start chat:', err)
      alert(err.message || 'Failed to start chat. Please try again')
    }
  }

  const chatStatus = activeChat?.status
  const isExchangeChat = activeChat?.isExchangeChat
  const isDonationChat = activeChat?.isDonationChat
  const isOwner = activeChat?.role === 'owner'
  const isRequester = activeChat?.role === 'requester'
  const hasAccepted =
    isOwner ? activeChat?.ownerAccepted : isRequester ? activeChat?.requesterAccepted : true
  const otherAccepted =
    isOwner ? activeChat?.requesterAccepted : isRequester ? activeChat?.ownerAccepted : true
  const chatDeclined = chatStatus === 'declined'
  // --- START: โค้ดที่แก้ไข ---
  const qrCodeExists = Boolean(activeChat?.qrCode) // 1. สร้างตัวแปรใหม่เช็คว่า QR มีหรือยัง

  // 2. แสดงปุ่ม "ยอมรับ/ปฏิเสธ" ถ้าแชทไม่ถูกปฏิเสธ และ QR Code "ยังไม่ถูกสร้าง" (รองรับทั้ง exchange และ donation)
  const showChatActions = (isExchangeChat || isDonationChat) && !chatDeclined && !qrCodeExists

  // 3. แสดงส่วน QR ของ Owner ถ้าแชท active, เป็น owner, และ QR Code "ถูกสร้างแล้ว" (รองรับทั้ง exchange และ donation)
  const showQrOwner = (isExchangeChat || isDonationChat) && chatStatus === 'active' && isOwner && qrCodeExists

  // 4. แสดงส่วน QR ของ Requester (Logic เดียวกัน) (รองรับทั้ง exchange และ donation)
  const showQrRequester = (isExchangeChat || isDonationChat) && chatStatus === 'active' && isRequester && qrCodeExists
  // --- END: โค้ดที่แก้ไข ---
  
  // หลังจากยืนยัน QR แล้วไม่สามารถส่งข้อความได้อีก
  const chatDisabled = chatDeclined || !activeChat?.canSendMessages || qrConfirmed 

  return (
    <Modal open={open} onClose={onClose} title="Messages" size="xl">
      {!token ? (
        <p className="text-sm text-gray-500">Please log in to use chat</p>
      ) : (
        <div className="flex gap-4">
          <div className="w-64 space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500">Start chat with CMU email</label>
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
                  Start
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-surface p-3">
              <p className="mb-2 text-xs font-semibold text-gray-500">Conversations</p>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="animate-spin" size={14} /> Loading...
                  </div>
                )}
                {Array.isArray(chats) && chats.length > 0 ? (
                  chats.map((chat) => {
                    if (!chat || !chat.id) return null
                    return (
                      <button
                        key={chat.id}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                          activeChatId === chat.id ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                        }`}
                        onClick={() => setActiveChatId(chat.id)}
                      >
                        <p className="font-semibold text-gray-800">{chat.participant_name || 'CMU Student'}</p>
                        <p className="text-xs text-gray-500">{chat.participant_email || ''}</p>
                        {(chat.isExchangeChat || chat.isDonationChat) && (
                          <p className="mt-1 text-[11px] font-semibold text-primary">
                            {getChatStatusLabel(chat)}
                          </p>
                        )}
                      </button>
                    )
                  })
                ) : (
                  !loading && <p className="text-xs text-gray-500">No conversations yet</p>
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
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{activeChat?.participant_name || 'CMU Student'}</p>
                    <p className="text-xs text-gray-500">{activeChat?.participant_email || ''}</p>
                    {activeChat?.itemTitle && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                          {activeChat.itemTitle}
                        </span>
                        {activeChat?.itemPickupLocation && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-600">
                            <MapPin size={12} />
                            {activeChat.itemPickupLocation}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                </div>

                {actionError && (
                  <div className="mb-3 rounded-2xl bg-red-50 px-4 py-2 text-xs text-red-600">
                    {actionError}
                  </div>
                )}

                {(isExchangeChat || isDonationChat) && (
                  <div className="mb-3 space-y-3">
                    {chatDeclined && (
                      <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow-inner">
                        This chat has been declined. Cannot continue conversation.
                      </div>
                    )}

                    {showChatActions && !chatDeclined && (
                      <div className="rounded-2xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800 shadow-inner">
                        <p className="font-semibold text-yellow-900">Confirm to open chat</p>
                        <p className="mt-1 text-xs text-yellow-700">
                          {hasAccepted && otherAccepted
                            ? `Please accept to create QR Code for ${isDonationChat ? 'donation' : 'exchange'} confirmation`
                            : hasAccepted
                            ? 'You have confirmed. Waiting for the other party to respond'
                            : `Please accept to open conversation and create QR Code for ${isDonationChat ? 'donation' : 'exchange'} confirmation`}
                        </p>
                        {(!hasAccepted || (hasAccepted && otherAccepted)) && (
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
                                  <span>Decline</span>
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
                                  <span>Accept</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        {hasAccepted && !otherAccepted && (
                          <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-yellow-700">
                            Waiting for the other party to confirm...
                          </div>
                        )}
                      </div>
                    )}

                    {/* --- START: โค้ดที่แก้ไข (ฉบับสมบูรณ์ + Success Message) --- */}
                    {chatStatus === 'active' && !chatDeclined && (
                      <>
                        {qrConfirmed ? (
                          // -------------------------------
                          // 1. ถ้า QR ยืนยันแล้ว: แสดง "แลกเปลี่ยน/บริจาคสำเร็จ"
                          // -------------------------------
                          <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 shadow-inner">
                            <p className="font-semibold text-green-900">✅ {isDonationChat ? 'Donation' : 'Exchange'} completed!</p>
                            <p className="mt-1 text-xs text-green-600">
                              The {isDonationChat ? 'donation' : 'exchange'} has been completed. Thank you for using CMU ShareCycle
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
                                      title="Collapse"
                                    >
                                      <X size={18} />
                                    </button>
                                    
                                    {/* --- เนื้อหา QR Code เดิมของ Owner --- */}
                                    <div className="mb-4 flex items-center justify-center gap-3">
                                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow">
                                        <QrCode size={22} />
                                      </div>
                                      <div className="text-left">
                                        <p className="text-base font-semibold text-primary">Show QR Code</p>
                                        <p className="text-xs text-gray-500">
                                          Show QR Code or code to the other party to confirm the {isDonationChat ? 'donation' : 'exchange'}
                                        </p>
                                      </div>
                                    </div>
                                    {activeChat.qrCode ? (
                                      <>
                                        <div className="mx-auto inline-flex rounded-[24px] border border-primary/10 bg-white p-5 shadow-card">
                                          <QRCodeCanvas value={activeChat.qrCode} size={200} includeMargin />
                                        </div>
                                        <div className="mx-auto mt-6 w-full rounded-[18px] bg-white px-4 py-3 shadow-inner">
                                          <p className="text-xs font-semibold text-gray-500">{isDonationChat ? 'Donation' : 'Exchange'} Code</p>
                                          <p className="mt-1 text-2xl font-bold tracking-widest text-primary">
                                            {activeChat.qrCode}
                                          </p>
                                          <p className="mt-2 text-xs text-gray-500">
                                            Send this code or have your friend scan the QR Code to confirm the {isDonationChat ? 'donation' : 'exchange'}
                                          </p>
                                        </div>
                                      </>
                                    ) : (
                                      <p className="mt-3 text-sm text-gray-600">Generating QR Code...</p>
                                    )}
                                    <div className="mt-4 rounded-[18px] bg-white px-4 py-3 text-left text-xs text-gray-600 shadow-inner">
                                      <p className="font-semibold text-primary">Instructions:</p>
                                      <ol className="mt-2 list-decimal space-y-1 pl-5">
                                        <li>Show QR Code for the other party to scan</li>
                                        <li>Or tell them the code above to enter</li>
                                        <li>When the other party confirms, the {isDonationChat ? 'donation' : 'exchange'} will be completed</li>
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
                                      title="Collapse"
                                    >
                                      <X size={18} />
                                    </button>
                                    
                                    {/* --- เนื้อหา QR Code เดิมของ Requester --- */}
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-base font-semibold text-primary">Scan QR Code</p>
                                        <p className="text-xs text-gray-500">
                                          Scan or enter the code from the poster to confirm the {isDonationChat ? 'donation' : 'exchange'}
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
                                          Scan Camera
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
                                          Enter Code
                                        </button>
                                      </div>
                                    </div>

                                    {/* (เราลบ "✅ ยืนยัน..." ออกจากตรงนี้) */}
                                    {qrMode === 'camera' ? (
                                      <div className="mt-4 overflow-hidden rounded-[28px] border border-gray-900/10 bg-black">
                                        <div 
                                          id="qr-reader" 
                                          ref={qrCodeReaderRef}
                                          className="w-full"
                                        />
                                        {qrError && (
                                          <div className="bg-red-900/70 px-4 py-2 text-center text-xs text-red-200">
                                            {qrError}
                                          </div>
                                        )}
                                        <div className="bg-black/70 px-4 py-3 text-center text-xs text-white">
                                          Please allow camera access and place QR Code within the frame
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mt-4 space-y-3 rounded-[24px] bg-white px-4 py-4 shadow-inner">
                                        <p className="text-xs font-semibold text-gray-600">
                                          Enter the code you received (format: {isDonationChat ? 'DN' : 'EX'}12345678)
                                        </p>
                                        <input
                                          type="text"
                                          value={qrCodeInput}
                                          onChange={(e) => setQrCodeInput(e.target.value.toUpperCase())}
                                          placeholder={isDonationChat ? "DNXXXXXXXX" : "EXXXXXXXXX"}
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
                                            'Confirm Code'
                                          )}
                                        </button>
                                      </div>
                                    )}
                                    <div className="mt-4 rounded-[18px] bg-white px-4 py-3 text-left text-xs text-gray-600 shadow-inner">
                                      <p className="font-semibold text-primary">How to scan:</p>
                                      <ol className="mt-2 list-decimal space-y-1 pl-5">
                                        <li>Allow access to your camera</li>
                                        <li>Place the QR Code received from the poster within the frame</li>
                                        <li>The system will scan automatically when QR Code is detected</li>
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
                                      ? `${isDonationChat ? 'Donation' : 'Exchange'} confirmed`
                                      : `Ready to confirm ${isDonationChat ? 'donation' : 'exchange'}`}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setIsQrExpanded(true)}
                                  className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-card transition hover:bg-primary-dark"
                                >
                                  {qrConfirmed ? 'View' : 'Expand'}
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
                  {Array.isArray(messages) && messages.length > 0 ? (
                    messages.map((msg) => {
                      if (!msg || !msg.id) return null
                      const isSentByMe = msg.sender_id === user?.id || msg.is_sent_by_me
                      const isRead = msg.is_read || msg.read_at !== null
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                            isSentByMe
                              ? 'bg-primary text-white'
                              : 'bg-surface text-gray-800'
                          }`}
                        >
                          {msg.body || ''}
                        </div>
                        {/* แสดงสถานะสำหรับข้อความที่ส่งเอง */}
                        {isSentByMe && (
                          <div className="mt-1 flex items-center gap-1 px-2">
                            {isRead ? (
                              <>
                                <CheckCheck size={12} className="text-blue-500" />
                                <span className="text-[10px] text-gray-500">Read</span>
                              </>
                            ) : (
                              <>
                                <Check size={12} className="text-gray-400" />
                                <span className="text-[10px] text-gray-400">Sent</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                    })
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      No messages yet
                    </div>
                  )}
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
                      chatDisabled ? 'Cannot send messages' : 'Type a message...'
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
                Select a conversation or start a new one with CMU email
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}