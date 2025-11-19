import { useEffect, useState } from 'react'
import { Bell, Clock3, CheckCircle, XCircle, MessageCircle, RefreshCw, ArrowRight, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal'
import { notificationApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function NotificationsModal({ open, onClose, onUnreadChange }) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token || !open) return
      setLoading(true)
      try {
        const data = await notificationApi.list(token)
        // แสดง notifications ทั้งหมด (history) แต่ badge จะแสดงเฉพาะ unread
        setNotifications(data)
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [open, token])

  // แยก useEffect เพื่ออัปเดต unread count หลังจาก notifications เปลี่ยน
  useEffect(() => {
    if (onUnreadChange) {
      const unreadCount = notifications.filter((n) => !n.read).length
      onUnreadChange(unreadCount)
    }
  }, [notifications, onUnreadChange])

  const handleMarkAsRead = async (notification) => {
    if (!token || notification.read) return

    try {
      await notificationApi.markNotificationRead(token, notification.id)
      // อัปเดต notification เป็น read แต่ยังแสดงใน list (history)
      setNotifications((prev) => 
        prev.map((n) => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      )
      // unread count จะถูกอัปเดตอัตโนมัติผ่าน useEffect ที่แยกออกมา
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleViewExchangeRequest = async (notification) => {
    const metadata = notification.metadata || {}
    const exchangeRequestId = metadata.exchangeRequestId || metadata.exchangeRequest_id

    if (exchangeRequestId) {
      // Mark as read ก่อน navigate
      await handleMarkAsRead(notification)
      onClose()
      navigate(`/exchange/${exchangeRequestId}`)
    }
  }

  const handleViewDonationRequest = async (notification) => {
    const metadata = notification.metadata || {}
    const donationRequestId = metadata.donationRequestId || metadata.donationRequest_id

    if (donationRequestId) {
      // Mark as read ก่อน navigate
      await handleMarkAsRead(notification)
      onClose()
      navigate(`/donation-requests/${donationRequestId}`)
    }
  }

  const handleOpenChat = async (notification) => {
    const metadata = notification.metadata || {}
    const chatId = metadata.chatId || metadata.chat_id

    if (chatId) {
      // Mark as read ก่อนเปิด chat
      await handleMarkAsRead(notification)
      onClose()
      // ส่ง custom event เพื่อเปิด ChatModal พร้อม chatId
      window.dispatchEvent(new CustomEvent('openChat', { detail: { chatId } }))
    }
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    return `${days} days ago`
  }

  const getNotificationIcon = (type, title) => {
    // Check if it's a new message (support both Thai and English)
    if (title === 'New message' || title === 'ข้อความใหม่' || type === 'message' || type === 'chat_message') {
      return <MessageCircle size={20} className="text-primary" />
    }
    
    switch (type) {
      case 'exchange_request':
        return <RefreshCw size={20} className="text-blue-500" />
      case 'exchange_accepted':
        return <CheckCircle size={20} className="text-green-500" />
      case 'exchange_rejected':
        return <XCircle size={20} className="text-red-500" />
      case 'exchange_completed':
        return <MessageCircle size={20} className="text-primary" />
      case 'donation_request':
        return <Heart size={20} className="text-red-500" />
      case 'donation_accepted':
        return <CheckCircle size={20} className="text-green-500" />
      case 'donation_rejected':
        return <XCircle size={20} className="text-red-500" />
      default:
        return <Bell size={20} className="text-gray-500" />
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Notifications" size="xl">
      {!token ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-md">
          <p className="text-sm text-gray-500">Please log in to view notifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loading && <p className="text-sm text-gray-500">Loading...</p>}
          {!loading && notifications.length === 0 && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-md">
              <p className="text-lg text-gray-600">No notifications</p>
              <p className="mt-2 text-sm text-gray-500">Notifications will appear here!</p>
            </div>
          )}
          {!loading &&
            notifications.map((notification) => {
              const isExchangeRequest = notification.type === 'exchange_request' || notification.type === 'exchange_accepted'
              const isDonationRequest = notification.type === 'donation_request' || notification.type === 'donation_accepted'
              const isCompleted = notification.type === 'exchange_completed'
              // Check for message notifications (support both Thai and English titles)
              const isMessage = notification.title === 'New message' || 
                               notification.title === 'ข้อความใหม่' || 
                               notification.type === 'message' || 
                               notification.type === 'chat_message'
              const metadata = notification.metadata || {}
              const chatId = metadata.chatId || metadata.chat_id

              return (
                <div
                  key={notification.id}
                  className={`rounded-[20px] bg-white p-5 shadow-sm transition hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-primary' : ''
                  }`}
                  onClick={async () => {
                    if (isExchangeRequest || isCompleted) {
                      await handleViewExchangeRequest(notification)
                    } else if (isDonationRequest) {
                      await handleViewDonationRequest(notification)
                    } else if (isMessage && chatId) {
                      await handleOpenChat(notification)
                    } else {
                      // ถ้าไม่ใช่ exchange/donation request หรือ message ก็ mark as read เมื่อคลิก
                      await handleMarkAsRead(notification)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      !notification.read ? 'bg-primary/10' : 'bg-gray-100'
                    }`}>
                      {getNotificationIcon(notification.type, notification.title)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{notification.title}</p>
                          <p className="mt-1 text-sm text-gray-600">{notification.body}</p>
                          <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                            <Clock3 size={14} />
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="ml-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                            NEW
                          </span>
                        )}
                      </div>
                      {(isExchangeRequest || isCompleted) && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                          <span>View Details</span>
                          <ArrowRight size={16} />
                        </div>
                      )}
                      {isDonationRequest && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-red-500">
                          <span>View Details</span>
                          <ArrowRight size={16} />
                        </div>
                      )}
                      {isMessage && chatId && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                          <span>Open Chat</span>
                          <ArrowRight size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </Modal>
  )
}
