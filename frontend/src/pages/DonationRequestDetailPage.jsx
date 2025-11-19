import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Heart,
  CheckCircle,
  XCircle,
  MessageCircle,
  Clock,
  ArrowLeft,
  Package,
  MapPin,
} from 'lucide-react'
import { donationRequestApi, chatApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { calculateItemCO2 } from '../utils/co2Calculator'

export default function DonationRequestDetailPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [donationRequest, setDonationRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [imageErrors, setImageErrors] = useState({ owner: false })

  useEffect(() => {
    const fetchDonationRequest = async () => {
      if (!token || !requestId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await donationRequestApi.getById(token, requestId)
        setDonationRequest(data)
        setError(null)
        setImageErrors({ owner: false })
      } catch (err) {
        console.error('Failed to fetch donation request:', err)
        setError(err.message || 'Donation request not found')
      } finally {
        setLoading(false)
      }
    }

    fetchDonationRequest()
  }, [token, requestId])

  const handleAccept = async () => {
    if (!token || processing || !donationRequest) return

    try {
      setProcessing(true)
      
      const isOwner = donationRequest.user_role === 'owner'
      
      let response
      if (isOwner) {
        response = await donationRequestApi.acceptByOwner(token, requestId)
      } else {
        if (!donationRequest.owner_accepted) {
          alert('Please wait for the post owner to accept the donation request first')
          setProcessing(false)
          return
        }
        response = await donationRequestApi.acceptByRequester(token, requestId)
      }
      
      let updatedData = response?.donationRequest || response
      
      if (!updatedData || !updatedData.id) {
        updatedData = await donationRequestApi.getById(token, requestId)
      }
      
      setDonationRequest(updatedData)
    } catch (err) {
      console.error('Failed to accept donation:', err)
      try {
        const data = await donationRequestApi.getById(token, requestId)
        const bothAccepted = data.owner_accepted && data.requester_accepted
        const isChatting = data.status === 'chatting'
        
        if (isChatting || bothAccepted) {
          setDonationRequest(data)
        } else {
          alert('Failed to accept donation request: ' + (err.message || 'Unknown error'))
        }
      } catch (refreshErr) {
        alert('Failed to accept donation request: ' + (err.message || 'Unknown error'))
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!token || processing || !donationRequest) return

    if (!window.confirm('Are you sure you want to reject this donation request?')) {
      return
    }

    try {
      setProcessing(true)
      await donationRequestApi.reject(token, requestId)
      alert('Donation request rejected successfully')
      navigate('/profile')
    } catch (err) {
      console.error('Failed to reject donation:', err)
      alert('Failed to reject donation request: ' + (err.message || 'Unknown error'))
    } finally {
      setProcessing(false)
    }
  }

  const handleStartChat = async () => {
    if (!token || !donationRequest) return

    try {
      const chats = await chatApi.list(token)
      const chat = chats.find((c) => {
        return c.item_id === donationRequest.item_id || 
               c.donation_request_id === requestId ||
               (c.creator_id === donationRequest.owner_id && c.participant_id === donationRequest.requester_id) ||
               (c.creator_id === donationRequest.requester_id && c.participant_id === donationRequest.owner_id)
      })

      let chatId = chat?.id

      if (!chatId) {
        const isOwner = donationRequest.user_role === 'owner'
        const otherUserId = isOwner ? donationRequest.requester_id : donationRequest.owner_id
        const newChat = await chatApi.create(token, {
          participantId: otherUserId,
          itemId: donationRequest.item_id,
          donationRequestId: requestId,
        })
        chatId = newChat.id
      }

      if (chatId) {
        window.dispatchEvent(new CustomEvent('openChat', { detail: { chatId } }))
      }
    } catch (err) {
      console.error('Failed to start chat:', err)
      alert('Failed to start chat: ' + (err.message || 'Unknown error'))
    }
  }

  const formatTimeAgo = (date) => {
    if (!date) return 'Unknown time'
    const now = new Date()
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return 'Unknown time'
    const diff = now - dateObj
    if (isNaN(diff)) return 'Unknown time'
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    return `${days} days ago`
  }

  const getStatusLabel = () => {
    if (!donationRequest) return 'Waiting for response'
    if (donationRequest.status === 'completed') return 'Donation completed'
    if (donationRequest.status === 'in_progress') return 'In progress'
    if (donationRequest.status === 'chatting') return 'Ready to chat'
    if (donationRequest.status === 'rejected') return 'Rejected'
    if (donationRequest.owner_accepted && donationRequest.requester_accepted) return 'Ready to chat'
    if (donationRequest.owner_accepted || donationRequest.requester_accepted) return 'Waiting for response'
    return 'Waiting for response'
  }

  const getStatusColor = () => {
    if (!donationRequest) return 'bg-yellow-100 text-yellow-800'
    if (donationRequest.status === 'completed') return 'bg-green-100 text-green-800'
    if (donationRequest.status === 'in_progress') return 'bg-blue-100 text-blue-800'
    if (donationRequest.status === 'chatting') return 'bg-green-100 text-green-800'
    if (donationRequest.status === 'rejected') return 'bg-red-100 text-red-800'
    if (donationRequest.owner_accepted && donationRequest.requester_accepted) return 'bg-green-100 text-green-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    )
  }

  if (error || !donationRequest) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-red-600">{error || 'Donation request not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 rounded-full bg-primary px-6 py-3 text-white"
        >
          Back to Home
        </button>
      </div>
    )
  }

  const isOwner = donationRequest.user_role === 'owner'
  const otherUserName = isOwner ? donationRequest.requester_name : donationRequest.owner_name
  const otherUser = otherUserName || (isOwner ? 'Requester' : 'Post Owner')
  const otherUserFaculty = isOwner ? donationRequest.requester_faculty : donationRequest.owner_faculty
  const otherUserAvatar = isOwner ? donationRequest.requester_avatar_url : donationRequest.owner_avatar_url
  const bothAccepted = donationRequest.owner_accepted && donationRequest.requester_accepted
  const currentUserAccepted = isOwner ? donationRequest.owner_accepted : donationRequest.requester_accepted
  const otherUserAccepted = isOwner ? donationRequest.requester_accepted : donationRequest.owner_accepted
  const showChatButton = donationRequest.status === 'chatting' || bothAccepted
  const showWaitingMessage = currentUserAccepted && !otherUserAccepted
  const canAccept = !currentUserAccepted && (donationRequest.status === 'pending' || donationRequest.status === 'chatting')
  const canReject = !currentUserAccepted && (donationRequest.status === 'pending' || donationRequest.status === 'chatting')

  const co2Footprint = donationRequest.item_category && donationRequest.item_condition
    ? calculateItemCO2(donationRequest.item_category, donationRequest.item_condition)
    : null
  const co2Reduced = co2Footprint ? co2Footprint * 0.8 : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-0">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Header Section */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-2xl font-bold text-white">
          {otherUserAvatar ? (
            <img src={otherUserAvatar} alt={otherUser} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span>{(otherUser && otherUser.charAt(0)) || 'U'}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{otherUser}</h1>
            {otherUserFaculty && (
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-600">
                {otherUserFaculty}
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{formatTimeAgo(donationRequest.created_at)}</p>
        </div>
      </div>

      {/* Donation Request Card */}
      <div className="mb-6 rounded-[24px] bg-red-50 p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-red-500" />
            <span className="text-lg font-semibold text-gray-900">Donation Request</span>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-700">
            {isOwner ? 'You are the donor' : 'You are the recipient'}
          </span>
        </div>

        {/* Item Info */}
        <div className="mb-4 rounded-xl bg-white p-4">
          <div className="flex gap-4">
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {donationRequest.item_image_url && !imageErrors.owner ? (
                <img
                  src={donationRequest.item_image_url}
                  alt={donationRequest.item_title}
                  className="h-full w-full object-cover"
                  onError={() => setImageErrors((prev) => ({ ...prev, owner: true }))}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package size={32} className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{donationRequest.item_title}</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-gray-400" />
                  <span>{donationRequest.item_category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Condition: {donationRequest.item_condition}</span>
                </div>
                {donationRequest.item_pickup_location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{donationRequest.item_pickup_location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recipient Information (แสดงเฉพาะเจ้าของโพสต์) */}
        {isOwner && donationRequest.recipient_name && (
          <div className="mb-4 rounded-xl bg-white p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Recipient Information:</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Recipient Name</p>
                <p className="text-sm font-medium text-gray-900">{donationRequest.recipient_name}</p>
              </div>
              {donationRequest.recipient_contact && (
                <div>
                  <p className="text-xs text-gray-500">Contact Information</p>
                  <p className="text-sm font-medium text-gray-900">{donationRequest.recipient_contact}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        {donationRequest.message && (
          <div className="mb-4 rounded-xl bg-white p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">ข้อความเพิ่มเติม:</p>
            <p className="text-sm text-gray-600">{donationRequest.message}</p>
          </div>
        )}

        {/* CO₂ Info */}
        {co2Reduced && (
          <div className="rounded-xl bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              CO₂ Reduced: {co2Reduced.toFixed(2)} kg CO₂e
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        {showWaitingMessage && (
          <div className="flex-1 rounded-xl bg-yellow-50 p-4 text-center">
            <Clock size={20} className="mx-auto mb-2 text-yellow-600" />
            <p className="text-sm font-semibold text-yellow-800">
              Waiting for {otherUser} to accept
            </p>
          </div>
        )}

        {showChatButton && (
          <button
            onClick={handleStartChat}
            className="flex-1 rounded-full bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} />
            Start Chat
          </button>
        )}

        {canAccept && (
          <button
            onClick={handleAccept}
            disabled={processing}
            className="flex-1 rounded-full bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            {processing ? 'Processing...' : 'Accept'}
          </button>
        )}

        {canReject && (
          <button
            onClick={handleReject}
            disabled={processing}
            className="flex-1 rounded-full bg-red-500 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <XCircle size={20} />
            Reject
          </button>
        )}
      </div>
    </div>
  )
}

