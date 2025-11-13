import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  MessageCircle,
  Clock,
  User,
  ArrowLeft,
} from 'lucide-react'
import { exchangeApi, chatApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { calculateItemCO2, calculateExchangeCO2Reduction } from '../utils/co2Calculator'

export default function ExchangeRequestDetailPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [exchangeRequest, setExchangeRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchExchangeRequest = async () => {
      if (!token || !requestId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await exchangeApi.getById(token, requestId)
        setExchangeRequest(data)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch exchange request:', err)
        setError(err.message || 'ไม่พบคำขอแลกเปลี่ยน')
      } finally {
        setLoading(false)
      }
    }

    fetchExchangeRequest()
  }, [token, requestId])

  const handleAccept = async () => {
    if (!token || processing || !exchangeRequest) return

    try {
      setProcessing(true)
      if (exchangeRequest.user_role === 'owner') {
        await exchangeApi.acceptByOwner(token, requestId)
      } else {
        await exchangeApi.acceptByRequester(token, requestId)
      }
      
      // Refresh data
      const data = await exchangeApi.getById(token, requestId)
      setExchangeRequest(data)
      alert('ยอมรับคำขอแลกเปลี่ยนสำเร็จ')
    } catch (err) {
      console.error('Failed to accept exchange:', err)
      alert('ยอมรับคำขอแลกเปลี่ยนไม่สำเร็จ: ' + (err.message || 'Unknown error'))
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!token || processing || !exchangeRequest) return

    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอแลกเปลี่ยนนี้?')) {
      return
    }

    try {
      setProcessing(true)
      await exchangeApi.reject(token, requestId)
      alert('ปฏิเสธคำขอแลกเปลี่ยนสำเร็จ')
      navigate('/profile')
    } catch (err) {
      console.error('Failed to reject exchange:', err)
      alert('ปฏิเสธคำขอแลกเปลี่ยนไม่สำเร็จ: ' + (err.message || 'Unknown error'))
    } finally {
      setProcessing(false)
    }
  }

  const handleStartChat = async () => {
    if (!token || !exchangeRequest) return

    try {
      // ดึง chat ที่เกี่ยวข้องกับ exchange request
      const chats = await chatApi.list(token)
      const chat = chats.find((c) => {
        // ตรวจสอบว่า chat นี้เกี่ยวข้องกับ exchange request นี้หรือไม่
        // โดยดูจาก item_id หรือ exchange_request_id
        return c.item_id === exchangeRequest.item_id || 
               c.exchange_request_id === requestId ||
               (c.creator_id === exchangeRequest.owner_id && c.participant_id === exchangeRequest.requester_id) ||
               (c.creator_id === exchangeRequest.requester_id && c.participant_id === exchangeRequest.owner_id)
      })

      const chatId = chat
        ? chat.id
        : (
            await chatApi.create(token, {
              participantId: exchangeRequest.user_role === 'owner'
                ? exchangeRequest.requester_id
                : exchangeRequest.owner_id,
              itemId: exchangeRequest.item_id,
              exchangeRequestId: requestId,
            })
          ).id

      navigate('/', { replace: true })
      window.dispatchEvent(new CustomEvent('app:open-chat', { detail: { chatId } }))
    } catch (err) {
      console.error('Failed to start chat:', err)
      alert('ไม่สามารถเปิดแชทได้: ' + (err.message || 'Unknown error'))
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

  const getStatusLabel = () => {
    if (!exchangeRequest) return 'รอการตอบรับ'
    if (exchangeRequest.status === 'accepted') return 'ยอมรับแล้ว'
    if (exchangeRequest.status === 'rejected') return 'ปฏิเสธแล้ว'
    if (exchangeRequest.owner_accepted && exchangeRequest.requester_accepted) return 'ยอมรับแล้ว'
    if (exchangeRequest.owner_accepted || exchangeRequest.requester_accepted) return 'รอการตอบรับ'
    return 'รอการตอบรับ'
  }

  const getStatusColor = () => {
    if (!exchangeRequest) return 'bg-yellow-100 text-yellow-800'
    if (exchangeRequest.status === 'accepted') return 'bg-green-100 text-green-800'
    if (exchangeRequest.status === 'rejected') return 'bg-red-100 text-red-800'
    if (exchangeRequest.owner_accepted && exchangeRequest.requester_accepted) return 'bg-green-100 text-green-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-gray-600">กำลังโหลด...</p>
      </div>
    )
  }

  if (error || !exchangeRequest) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-red-600">{error || 'ไม่พบคำขอแลกเปลี่ยน'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 rounded-full bg-primary px-6 py-3 text-white"
        >
          กลับหน้าหลัก
        </button>
      </div>
    )
  }

  const isOwner = exchangeRequest.user_role === 'owner'
  const otherUser = isOwner ? exchangeRequest.requester_name : exchangeRequest.owner_name
  const otherUserFaculty = isOwner ? exchangeRequest.requester_faculty : exchangeRequest.owner_faculty
  const otherUserAvatar = isOwner ? exchangeRequest.requester_avatar_url : exchangeRequest.owner_avatar_url
  const canAccept = exchangeRequest.status === 'pending'
  const canReject = exchangeRequest.status === 'pending'
  const bothAccepted = exchangeRequest.owner_accepted && exchangeRequest.requester_accepted
  const showChatButton = exchangeRequest.status === 'accepted' || bothAccepted

  // คำนวณ CO₂ footprint และ CO₂ ที่ลดได้
  const calculateCO2 = () => {
    if (!exchangeRequest.item_category || !exchangeRequest.item_condition) return null
    
    const co2Footprint = calculateItemCO2(exchangeRequest.item_category, exchangeRequest.item_condition)
    const co2Reduced = calculateExchangeCO2Reduction(co2Footprint)
    
    return {
      footprint: parseFloat(co2Footprint.toFixed(2)),
      reduced: parseFloat(co2Reduced.toFixed(2)),
    }
  }

  const co2Data = calculateCO2()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-0">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        <span>กลับ</span>
      </button>

      {/* Header Section */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
          {otherUserAvatar ? (
            <img src={otherUserAvatar} alt={otherUser} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span>{otherUser.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{otherUser}</h1>
            {otherUserFaculty && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {otherUserFaculty}
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{formatTimeAgo(exchangeRequest.created_at)}</p>
        </div>
      </div>

      {/* Exchange Request Card */}
      <div className="mb-6 rounded-[24px] bg-green-50 p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw size={20} className="text-primary" />
            <span className="text-lg font-semibold text-gray-900">คำขอแลกเปลี่ยน</span>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-700">
            ID: {exchangeRequest.id.slice(0, 8)}
          </span>
        </div>

        {/* Items Display */}
        <div className="mb-6 flex items-center gap-4">
          {/* Other User's Item */}
          <div className="flex-1 rounded-[16px] bg-white p-4 shadow-sm">
            <div className="mb-3 aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              {exchangeRequest.item_image_url ? (
                <img
                  src={exchangeRequest.item_image_url}
                  alt={exchangeRequest.item_title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <User size={48} />
                </div>
              )}
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">{exchangeRequest.item_title}</h3>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {exchangeRequest.item_category}
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {exchangeRequest.item_condition}
              </span>
            </div>
          </div>

          {/* Exchange Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
            <RefreshCw size={24} />
          </div>

          {/* Your Item (Placeholder - เนื่องจากยังไม่มีข้อมูล item ที่ต้องการแลก) */}
          <div className="flex-1 rounded-[16px] bg-white p-4 shadow-sm">
            <div className="mb-3 aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <User size={48} />
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Your Item</h3>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-gray-700">
                Your Item
              </span>
            </div>
          </div>
        </div>

        {/* Requester's Message */}
        {exchangeRequest.message && (
          <div className="rounded-[16px] bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-700 italic">&quot;{exchangeRequest.message}&quot;</p>
          </div>
        )}

        {/* CO₂ Information */}
        {co2Data && (
          <div className="mt-4 rounded-[16px] bg-primary/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">CO₂ Footprint</p>
                <p className="text-xs text-gray-600">ของสินค้านี้</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">
                  {co2Data.footprint} kg
                </p>
                <p className="text-xs text-gray-600">CO₂e</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status and Action Section */}
      {showChatButton ? (
        <div className="rounded-[24px] bg-green-50 p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle size={24} className="text-green-500" />
            <p className="text-lg font-semibold text-gray-900">
              ทั้งสองฝ่ายยอมรับแล้ว – พร้อมแชท!
            </p>
          </div>
          {/* CO₂ Reduction Info */}
          {co2Data && (
            <div className="mb-4 rounded-[16px] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">CO₂ ที่ลดได้</p>
                  <p className="text-xs text-gray-600">จากการแลกเปลี่ยนนี้</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {co2Data.reduced} kg
                  </p>
                  <p className="text-xs text-gray-600">CO₂e</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleStartChat}
            className="w-full rounded-full bg-primary px-6 py-4 text-lg font-semibold text-white shadow-card transition hover:bg-primary-dark"
          >
            <div className="flex items-center justify-center gap-2">
              <MessageCircle size={24} />
              <span>เริ่มแชท</span>
            </div>
          </button>
        </div>
      ) : (
        <div className="rounded-[24px] bg-yellow-50 p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={24} className="text-yellow-600" />
            <p className="text-lg font-semibold text-gray-900">
              {isOwner
                ? `${otherUser} ต้องการแลกของกับคุณ`
                : `คุณต้องการแลกของกับ ${otherUser}`}
            </p>
          </div>
          {(canAccept || canReject) && (
            <div className="flex gap-4">
              <button
                onClick={handleAccept}
                disabled={processing}
                className="flex-1 rounded-full bg-green-500 px-6 py-4 text-lg font-semibold text-white shadow-card transition hover:bg-green-600 disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle size={24} />
                  <span>ยอมรับ</span>
                </div>
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 rounded-full bg-red-500 px-6 py-4 text-lg font-semibold text-white shadow-card transition hover:bg-red-600 disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <XCircle size={24} />
                  <span>ปฏิเสธ</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

