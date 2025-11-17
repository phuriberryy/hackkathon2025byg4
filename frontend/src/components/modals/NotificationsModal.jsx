import { useEffect, useState } from 'react'
import { Bell, Clock3, CheckCircle, XCircle, MessageCircle, RefreshCw, ArrowRight } from 'lucide-react'
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
        setNotifications(data)
        const unreadCount = data.filter((n) => !n.read).length
        onUnreadChange?.(unreadCount)
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [open, token, onUnreadChange])


  const handleViewExchangeRequest = (notification) => {
    const metadata = notification.metadata || {}
    const exchangeRequestId = metadata.exchangeRequestId || metadata.exchangeRequest_id

    if (exchangeRequestId) {
      onClose()
      navigate(`/exchange/${exchangeRequestId}`)
    }
  }


  const formatTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'เมื่อสักครู่'
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
    return `${days} วันที่แล้ว`
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'exchange_request':
        return <RefreshCw size={20} className="text-blue-500" />
      case 'exchange_accepted':
        return <CheckCircle size={20} className="text-green-500" />
      case 'exchange_rejected':
        return <XCircle size={20} className="text-red-500" />
      case 'exchange_completed':
        return <MessageCircle size={20} className="text-primary" />
      default:
        return <Bell size={20} className="text-gray-500" />
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="การแจ้งเตือน" size="xl">
      {!token ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-md">
          <p className="text-sm text-gray-500">กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loading && <p className="text-sm text-gray-500">กำลังโหลด...</p>}
          {!loading && notifications.length === 0 && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-md">
              <p className="text-lg text-gray-600">ไม่มีการแจ้งเตือน</p>
              <p className="mt-2 text-sm text-gray-500">การแจ้งเตือนจะปรากฏที่นี่!</p>
            </div>
          )}
          {!loading &&
            notifications.map((notification) => {
              const isExchangeRequest = notification.type === 'exchange_request' || notification.type === 'exchange_accepted'
              const isCompleted = notification.type === 'exchange_completed'

              return (
                <div
                  key={notification.id}
                  className={`rounded-[20px] bg-white p-5 shadow-sm transition hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-primary' : ''
                  }`}
                  onClick={() => {
                    if (isExchangeRequest || isCompleted) {
                      handleViewExchangeRequest(notification)
                    }
                  }}
                  style={{ cursor: isExchangeRequest || isCompleted ? 'pointer' : 'default' }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      !notification.read ? 'bg-primary/10' : 'bg-gray-100'
                    }`}>
                      {getNotificationIcon(notification.type)}
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
                          <span>ดูรายละเอียด</span>
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
