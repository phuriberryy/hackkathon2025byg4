import { CheckCircle, XCircle, MessageCircle, RefreshCw } from 'lucide-react'
import Modal from '../ui/Modal'

interface NotificationsModalProps {
  open: boolean
  onClose: () => void
}

export default function NotificationsModal({
  open,
  onClose,
}: NotificationsModalProps) {
  const handleAccept = (id: string) => {
    console.log('Accept exchange:', id)
  }

  const handleReject = (id: string) => {
    console.log('Reject exchange:', id)
  }

  const handleStartChat = (id: string) => {
    console.log('Start chat:', id)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="การแจ้งเตือน"
      size="xl"
    >
      <div className="rounded-2xl bg-white p-12 text-center shadow-md">
        <p className="text-lg text-gray-600">No notifications yet.</p>
        <p className="mt-2 text-sm text-gray-500">Your notifications will appear here!</p>
      </div>
    </Modal>
  )
}
