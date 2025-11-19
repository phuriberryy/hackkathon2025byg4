import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  ArrowRightLeft,
  User,
  Mail,
  Package,
  CheckCircle,
  Image as ImageIcon,
  Eye,
  Clock3,
  Heart,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { profileApi, exchangeApi, donationApi, itemsApi, API_BASE } from '../lib/api'
import { io } from 'socket.io-client'
import EditItemModal from '../components/modals/EditItemModal'
import ManageItemModal from '../components/modals/ManageItemModal'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posts')
  const [profile, setProfile] = useState(null)
  const [myItems, setMyItems] = useState([])
  const [exchangeHistory, setExchangeHistory] = useState([])
  const [exchangeRequests, setExchangeRequests] = useState([])
  const [donationHistory, setDonationHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditItemModal, setShowEditItemModal] = useState(false)
  const [showManageItemModal, setShowManageItemModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const { user, token } = useAuth()

  // แยก items ที่หมดอายุแล้วแต่ยังไม่ถูกแลกเปลี่ยน
  const activeItems = myItems.filter(item => !item.is_expired)
  const expiredItems = myItems.filter(item => item.is_expired)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const data = await profileApi.getProfile(token)
        setProfile(data)
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [token])

  const fetchMyItems = useCallback(async () => {
    // Fetch items เมื่อ activeTab เป็น 'posts' หรือ 'expired' เพื่อให้แสดงทั้ง active และ expired items
    if (!token || (activeTab !== 'posts' && activeTab !== 'expired')) return

    try {
      const data = await profileApi.getMyItems(token)
      setMyItems(data)
    } catch (err) {
      console.error('Failed to fetch my items:', err)
    }
  }, [token, activeTab])

  useEffect(() => {
    fetchMyItems()
  }, [fetchMyItems])

  // Real-time updates via socket.io
  useEffect(() => {
    if (!token) return

    const socket = io(API_BASE.replace(/\/api$/, ''), {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      transports: ['polling', 'websocket'],
      upgrade: true,
    })

    socket.on('connect_error', (err) => {
      // Silently handle connection errors - backend might not be running
      if (err.message !== 'websocket error' && err.message !== 'xhr poll error') {
        console.debug('Socket connection error:', err.message)
      }
    })

    socket.on('item:updated', () => {
      if (activeTab === 'posts' || activeTab === 'expired') {
        fetchMyItems()
      }
    })

    socket.on('item:deleted', () => {
      if (activeTab === 'posts' || activeTab === 'expired') {
        fetchMyItems()
      }
    })

    socket.on('exchange:completed', () => {
      if (activeTab === 'history') {
        profileApi.getExchangeHistory(token)
          .then(setExchangeHistory)
          .catch((err) => console.error('Failed to refresh exchange history:', err))
      }
      if (activeTab === 'posts' || activeTab === 'expired') {
        fetchMyItems()
      }
    })

    socket.on('donation:completed', () => {
      if (activeTab === 'donations') {
        donationApi.getMyDonations(token)
          .then(setDonationHistory)
          .catch((err) => console.error('Failed to refresh donation history:', err))
      }
      if (activeTab === 'posts' || activeTab === 'expired') {
        fetchMyItems()
      }
    })

    socket.on('notification:new', () => {
      // Refresh exchange requests count if needed
      if (activeTab === 'posts') {
        exchangeApi.getMyRequests(token)
          .then(setExchangeRequests)
          .catch((err) => console.error('Failed to refresh exchange requests:', err))
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [token, activeTab, fetchMyItems])

  useEffect(() => {
    const fetchExchangeHistory = async () => {
      if (!token || activeTab !== 'history') return

      try {
        const data = await profileApi.getExchangeHistory(token)
        setExchangeHistory(data)
      } catch (err) {
        console.error('Failed to fetch exchange history:', err)
      }
    }

    fetchExchangeHistory()
  }, [token, activeTab])

  useEffect(() => {
    const fetchDonationHistory = async () => {
      if (!token || activeTab !== 'donations') return

      try {
        const data = await donationApi.getMyDonations(token)
        setDonationHistory(data)
      } catch (err) {
        console.error('Failed to fetch donation history:', err)
      }
    }

    fetchDonationHistory()
  }, [token, activeTab])

  useEffect(() => {
    const fetchExchangeRequests = async () => {
      if (!token || activeTab !== 'posts') return

      try {
        const data = await exchangeApi.getMyRequests(token)
        setExchangeRequests(data)
      } catch (err) {
        console.error('Failed to fetch exchange requests:', err)
      }
    }

    fetchExchangeRequests()
  }, [token, activeTab])

  const getItemViews = (itemId) => {
    // นับจำนวน exchange requests สำหรับ item นี้
    if (!exchangeRequests || !Array.isArray(exchangeRequests)) return 0
    const count = exchangeRequests.filter((er) => er && er.item_id === itemId).length
    return count
  }

  const canEditItem = (item) => {
    // ตรวจสอบว่ามี exchange request ที่ accept แล้วหรือไม่
    if (!exchangeRequests || !Array.isArray(exchangeRequests)) return true
    const hasAcceptedRequest = exchangeRequests.some((er) => 
      er && 
      er.item_id === item.id && 
      (er.status === 'chatting' || 
       er.status === 'in_progress' || 
       er.owner_accepted === true || 
       er.requester_accepted === true)
    )
    return !hasAcceptedRequest
  }

  const handleEditItem = (item) => {
    setSelectedItem(item)
    setShowEditItemModal(true)
  }

  const handleManageItem = (item) => {
    setSelectedItem(item)
    setShowManageItemModal(true)
  }

  const handleDeleteItem = async (item) => {
    if (!token) return
    
    if (!window.confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      await itemsApi.delete(token, item.id)
      // Refresh items list
      if (activeTab === 'posts' || activeTab === 'expired') {
        const data = await profileApi.getMyItems(token)
        setMyItems(data)
      }
    } catch (err) {
      console.error('Failed to delete item:', err)
      alert(err.message || 'Failed to delete item')
    }
  }

  const handleItemUpdate = async () => {
    // Refresh items list เมื่อแก้ไข item เพื่อให้ expired items อัปเดต
    if (token && (activeTab === 'posts' || activeTab === 'expired')) {
      try {
        const data = await profileApi.getMyItems(token)
        setMyItems(data)
      } catch (err) {
        console.error('Failed to refresh items:', err)
      }
    }
  }


  const initials = useMemo(() => {
    if (!user?.name) return 'YO'
    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user])

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-gray-600">Please log in to view your profile</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    )
  }

  const displayUser = profile?.user || user
  const stats = profile?.stats || { itemsShared: 0, co2Reduced: '0.00' }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-0">
      <section className="overflow-hidden rounded-[40px] bg-white shadow-soft">
        <div className="h-40 bg-gradient-to-r from-[#1B843C] via-[#2D7D3F] to-[#76BE7B]" />
        <div className="relative px-8 pb-10 pt-4">
          <div className="absolute -top-16 left-10 flex h-32 w-32 items-center justify-center rounded-full border-[6px] border-white bg-primary text-4xl font-bold text-white shadow-soft">
            {initials}
          </div>

          <div className="mt-16 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{displayUser.name || 'Your Name'}</h1>
              <div className="mt-4 space-y-3">
                {displayUser.faculty && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Faculty/College</p>
                      <p className="text-base font-semibold text-gray-900">{displayUser.faculty}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail size={20} className="text-primary" />
                </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Email</p>
                    <p className="text-base font-semibold text-gray-900">{displayUser.email}</p>
                </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-6 border-t border-gray-100 pt-6 sm:flex-row sm:justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{stats.itemsShared || 0}</p>
              <p className="text-sm text-gray-500">Items Shared</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{stats.co2Reduced || '0.00'}kg</p>
              <p className="text-sm text-gray-500">CO₂ Reduced</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-gray-100 px-8 py-4">
          <div className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#F0F7F1] px-4 py-2">
          <button
            onClick={() => setActiveTab('posts')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'posts'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-transparent text-gray-700'
            }`}
          >
            <Package size={16} />
            My Posts
          </button>
          <button
            onClick={() => setActiveTab('expired')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'expired'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-transparent text-gray-700'
            }`}
          >
            <Clock3 size={16} />
            Expired ({expiredItems.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'history'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-transparent text-gray-700'
            }`}
          >
            <ArrowRightLeft size={16} />
            Exchange History
          </button>
          <button
            onClick={() => setActiveTab('donations')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'donations'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-transparent text-gray-700'
            }`}
          >
            <Heart size={16} />
            Donations ({donationHistory.length})
          </button>
          </div>
        </div>
      </section>

      <div className="mt-10">
        {activeTab === 'posts' && (
          <div>
            {activeItems.length === 0 ? (
              <div className="rounded-[32px] bg-white p-12 text-center shadow-soft">
                <p className="text-lg font-semibold text-gray-700">No active posts yet.</p>
                <p className="mt-2 text-sm text-gray-500">Start sharing items to see them appear in your profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeItems.map((item) => {
                  const views = getItemViews(item.id)
                  const isActive = item.status === 'active'
                  const canEdit = canEditItem(item)

                  return (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-[24px] bg-white shadow-soft transition hover:shadow-card"
                    >
                      {/* Image with Status Badge */}
                      <div className="relative h-48 w-full overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100">
                            <ImageIcon size={48} className="text-gray-400" />
                          </div>
                        )}
                        {isActive && (
                          <span className="absolute right-3 top-3 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
                            Active
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="flex-1 text-lg font-semibold text-gray-900">{item.title}</h3>
                        </div>

                        {/* Category Tag */}
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            {item.category}
                          </span>
                        </div>

                        {/* Views Count */}
                        <div className="mb-4 flex items-center gap-1 text-sm text-gray-500">
                          <Eye size={16} className="text-gray-400" />
                          <span>{views} views</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleManageItem(item)}
                            disabled={!canEdit}
                            className="flex-1 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!canEdit ? 'Cannot edit because there is an accepted exchange request' : ''}
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            disabled={!canEdit}
                            className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!canEdit ? 'Cannot edit because there is an accepted exchange request' : ''}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            disabled={!canEdit}
                            className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!canEdit ? 'Cannot delete because there is an accepted exchange request' : 'Delete this post'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'expired' && (
          <div>
            <div className="mb-6 rounded-[24px] bg-yellow-50 border border-yellow-200 p-6">
              <div className="flex items-start gap-3">
                <Clock3 size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">Expired Posts</h3>
                  <p className="text-sm text-yellow-800">
                    These posts have expired but have not been exchanged. You can delete or update them.
                  </p>
                </div>
              </div>
            </div>
            {expiredItems.length === 0 ? (
              <div className="rounded-[32px] bg-white p-12 text-center shadow-soft">
                <Clock3 size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-semibold text-gray-700">No expired posts</p>
                <p className="mt-2 text-sm text-gray-500">Expired posts will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {expiredItems.map((item) => {
                  const views = getItemViews(item.id)
                  const canEdit = canEditItem(item)
                  const expiredDate = item.available_until ? new Date(item.available_until).toLocaleDateString('en-US') : 'Not specified'

                  return (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-[24px] bg-white border-2 border-yellow-200 shadow-soft transition hover:shadow-card opacity-90"
                    >
                      {/* Image with Expired Badge */}
                      <div className="relative h-48 w-full overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover grayscale-[30%]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100">
                            <ImageIcon size={48} className="text-gray-400" />
                          </div>
                        )}
                        <span className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
                          Expired
                        </span>
                        <div className="absolute left-3 top-3 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                          <Clock3 size={12} className="inline mr-1" />
                          Expired: {expiredDate}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="flex-1 text-lg font-semibold text-gray-900">{item.title}</h3>
                        </div>

                        {/* Category Tag */}
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            {item.category}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="mb-4 space-y-2 text-sm text-gray-600">
                          <p className="text-xs text-gray-500">Not exchanged</p>
                          <div className="flex items-center gap-1">
                            <Eye size={16} className="text-gray-400" />
                            <span>{views} views</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleManageItem(item)}
                            disabled={!canEdit}
                            className="flex-1 rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!canEdit ? 'Cannot edit because there is an accepted exchange request' : ''}
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            disabled={!canEdit}
                            className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!canEdit ? 'Cannot edit because there is an accepted exchange request' : ''}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            disabled={!canEdit}
                            className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!canEdit ? 'Cannot delete because there is an accepted exchange request' : 'Delete this post'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'history' && (
          <div>
            {exchangeHistory.length === 0 ? (
              <div className="rounded-[32px] bg-white p-12 text-center shadow-soft">
                <p className="text-lg font-semibold text-gray-700">No exchange history yet.</p>
                <p className="mt-2 text-sm text-gray-500">Your exchange timeline will show up here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {exchangeHistory.map((history) => {
                  const exchangeDate = new Date(history.exchanged_at)

                  return (
                    <div
                      key={history.id}
                      className="rounded-[24px] bg-white p-6 shadow-soft transition hover:shadow-card"
                    >
                      {/* Date and CO2 Badge */}
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-600">
                          {exchangeDate.toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                          <CheckCircle size={16} className="text-green-600" />
                          ประหยัด CO₂ {parseFloat(history.co2_reduced || 0).toFixed(1)}kg
                        </span>
                      </div>

                      {/* Exchange Items Display */}
                      <div className="flex items-center gap-4">
                        {/* My Item (ของของฉัน) */}
                        <div className="flex-1">
                          <div className="text-center">
                            <div className="mb-2 inline-block rounded-lg bg-gray-50 p-2">
                              {history.my_item_image_url ? (
                                <img
                                  src={history.my_item_image_url}
                                  alt={history.my_item_title || 'My item'}
                                  className="h-32 w-32 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-200">
                                  <Package size={32} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                            <p className="mt-2 text-xs font-medium text-gray-500">ของของฉัน</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {history.my_item_title || history.item_title || 'Unknown Item'}
                            </p>
                            {history.my_item_category && (
                              <p className="mt-1 text-xs text-gray-500">{history.my_item_category}</p>
                            )}
                          </div>
                        </div>

                        {/* Exchange Arrow */}
                        <div className="flex flex-col items-center">
                          <ArrowRightLeft size={24} className="text-primary" />
                        </div>

                        {/* Received Item (ที่ได้รับ) */}
                        <div className="flex-1">
                          <div className="text-center">
                            <div className="mb-2 inline-block rounded-lg bg-gray-50 p-2">
                              {history.received_item_image_url ? (
                                <img
                                  src={history.received_item_image_url}
                                  alt={history.received_item_title || 'Received item'}
                                  className="h-32 w-32 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-200">
                                  <Package size={32} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                            <p className="mt-2 text-xs font-medium text-gray-500">ที่ได้รับ</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {history.received_item_title || 'Unknown Item'}
                            </p>
                            {history.received_item_category && (
                              <p className="mt-1 text-xs text-gray-500">{history.received_item_category}</p>
                            )}
                            {history.received_from_name && (
                              <p className="mt-1 text-xs text-gray-500">
                                จาก {history.received_from_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'donations' && (
          <div>
            {donationHistory.length === 0 ? (
              <div className="rounded-[32px] bg-white p-12 text-center shadow-soft">
                <Heart size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-semibold text-gray-700">No donations yet.</p>
                <p className="mt-2 text-sm text-gray-500">Your donation history will show up here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {donationHistory.map((donation) => {
                  const donationDate = new Date(donation.donated_at)

                  return (
                    <div
                      key={donation.id}
                      className="rounded-[24px] bg-white p-6 shadow-soft transition hover:shadow-card"
                    >
                      {/* Date and CO2 Badge */}
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-600">
                          {donationDate.toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                          <Heart size={16} className="text-red-600" />
                          ประหยัด CO₂ {parseFloat(donation.co2_reduced || 0).toFixed(1)}kg
                        </span>
                      </div>

                      {/* Donation Item Display */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-center">
                            <div className="mb-2 inline-block rounded-lg bg-gray-50 p-2">
                              {donation.item_image_url ? (
                                <img
                                  src={donation.item_image_url}
                                  alt={donation.item_title || 'Donated item'}
                                  className="h-32 w-32 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-200">
                                  <Package size={32} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                            <p className="mt-2 text-xs font-medium text-gray-500">Donated Item</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {donation.item_title || 'Unknown Item'}
                            </p>
                            {donation.item_category && (
                              <p className="mt-1 text-xs text-gray-500">{donation.item_category}</p>
                            )}
                          </div>
                        </div>

                        {/* Donation Info */}
                        <div className="flex-1">
                          <div className="rounded-lg bg-red-50 p-4">
                            {donation.recipient_name && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-500">Recipient</p>
                                <p className="text-sm font-semibold text-gray-900">{donation.recipient_name}</p>
                              </div>
                            )}
                            {donation.recipient_contact && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-500">ข้อมูลติดต่อ</p>
                                <p className="text-sm text-gray-700">{donation.recipient_contact}</p>
                              </div>
                            )}
                            {donation.donation_location && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-500">Donation Location</p>
                                <p className="text-sm text-gray-700">{donation.donation_location}</p>
                              </div>
                            )}
                            {donation.message && (
                              <div className="mt-2 border-t border-red-200 pt-2">
                                <p className="text-xs font-medium text-gray-500">ข้อความ</p>
                                <p className="text-sm text-gray-700">{donation.message}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Item Modal */}
      <EditItemModal
        open={showEditItemModal}
        onClose={() => {
          setShowEditItemModal(false)
          setSelectedItem(null)
        }}
        item={selectedItem}
        onSuccess={handleItemUpdate}
      />

      {/* Manage Item Modal */}
      <ManageItemModal
        open={showManageItemModal}
        onClose={() => {
          setShowManageItemModal(false)
          setSelectedItem(null)
        }}
        item={selectedItem}
        onUpdate={handleItemUpdate}
      />
    </div>
  )
}
