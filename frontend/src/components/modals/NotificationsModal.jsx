import { useEffect, useState } from 'react'
import { Bell, Clock3 } from 'lucide-react'
import Modal from '../ui/Modal'
import { notificationApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function NotificationsModal({ open, onClose, onUnreadChange }) {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token || !open) return
      setLoading(true)
      try {
        const data = await notificationApi.list(token)
        setNotifications(data)
        onUnreadChange?.(data.filter((n) => !n.read).length)
        await notificationApi.markRead(token)
        onUnreadChange?.(0)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [open, token, onUnreadChange])

  return (
    <Modal open={open} onClose={onClose} title="การแจ้งเตือน" size="xl">
      {!token ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-md">
          <p className="text-sm text-gray-500">กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="space-y-3">
          {loading && <p className="text-sm text-gray-500">Loading...</p>}
          {!loading && notifications.length === 0 && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-md">
              <p className="text-lg text-gray-600">No notifications yet.</p>
              <p className="mt-2 text-sm text-gray-500">Your notifications will appear here!</p>
            </div>
          )}
          {!loading &&
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start justify-between rounded-2xl bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex flex-1 gap-4">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Bell size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.body}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                      <Clock3 size={14} />
                      {new Date(notification.created_at).toLocaleString('th-TH')}
                    </p>
                  </div>
                </div>
                {!notification.read && (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                    NEW
                  </span>
                )}
              </div>
            ))}
        </div>
      )}
    </Modal>
  )
}

