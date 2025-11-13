import { useMemo, useState, useEffect } from 'react'
import {
  ArrowRightLeft,
  User,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  Trash2,
  CheckCircle,
  Image as ImageIcon,
  Eye,
  MoreVertical,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { profileApi, itemsApi, exchangeApi } from '../lib/api'
import EditItemModal from '../components/modals/EditItemModal'
import ManageItemModal from '../components/modals/ManageItemModal'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posts')
  const [profile, setProfile] = useState(null)
  const [myItems, setMyItems] = useState([])
  const [exchangeHistory, setExchangeHistory] = useState([])
  const [exchangeRequests, setExchangeRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditItemModal, setShowEditItemModal] = useState(false)
  const [showManageItemModal, setShowManageItemModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const { user, token } = useAuth()

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

  useEffect(() => {
    const fetchMyItems = async () => {
      if (!token || activeTab !== 'posts') return

      try {
        const data = await profileApi.getMyItems(token)
        setMyItems(data)
      } catch (err) {
        console.error('Failed to fetch my items:', err)
      }
    }

    fetchMyItems()
  }, [token, activeTab])

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
    const count = exchangeRequests.filter((er) => er.item_id === itemId).length
    return count
  }

  const handleDeleteItem = async (itemId) => {
    if (!token || !window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?')) {
      return
    }

    try {
      await itemsApi.delete(token, itemId)
      setMyItems(myItems.filter((item) => item.id !== itemId))
      alert('ลบโพสต์สำเร็จ')
    } catch (err) {
      console.error('Failed to delete item:', err)
      alert('ลบโพสต์ไม่สำเร็จ: ' + (err.message || 'Unknown error'))
    }
  }

  const handleEditItem = (item) => {
    setSelectedItem(item)
    setShowEditItemModal(true)
  }

  const handleManageItem = (item) => {
    setSelectedItem(item)
    setShowManageItemModal(true)
  }

  const handleItemUpdate = async () => {
    // Refresh items list
    if (token && activeTab === 'posts') {
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
        <p className="text-lg text-gray-600">กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์ของคุณ</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-gray-600">กำลังโหลด...</p>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{displayUser.name || 'Your Name'}</h1>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2 text-base text-gray-800">
                  <User size={18} className="text-primary" />
                  {displayUser.faculty || 'CMU Student'}
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-primary/60" />
                  {displayUser.email}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary/60" />
                  {displayUser.faculty || 'Chiang Mai University'}
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
              โพสต์ของฉัน
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
              ประวัติการแลกเปลี่ยน
            </button>
          </div>
        </div>
      </section>

      <div className="mt-10">
        {activeTab === 'posts' ? (
          <div>
            {myItems.length === 0 ? (
              <div className="rounded-[32px] bg-white p-12 text-center shadow-soft">
                <p className="text-lg font-semibold text-gray-700">No posts yet.</p>
                <p className="mt-2 text-sm text-gray-500">Start sharing items to see them appear in your profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myItems.map((item) => {
                  const views = getItemViews(item.id)
                  const isActive = item.status === 'active'

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
                            className="flex-1 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
                          >
                            จัดการ
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                          >
                            แก้ไข
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {exchangeHistory.length === 0 ? (
              <div className="rounded-[32px] bg-white p-12 text-center shadow-soft">
                <p className="text-lg font-semibold text-gray-700">No exchange history yet.</p>
                <p className="mt-2 text-sm text-gray-500">Your exchange timeline will show up here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exchangeHistory.map((history) => (
                  <div
                    key={history.id}
                    className="rounded-[24px] bg-white p-6 shadow-soft transition hover:shadow-card"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={20} className="text-green-500" />
                          <h3 className="text-lg font-semibold text-gray-900">{history.item_title}</h3>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {history.user_role === 'owner' ? (
                            <>
                              คุณแลกเปลี่ยนกับ <strong>{history.requester_name}</strong>
                            </>
                          ) : (
                            <>
                              คุณแลกเปลี่ยนกับ <strong>{history.owner_name}</strong>
                            </>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          CO₂ ที่ลดได้: <strong className="text-primary">{history.co2_reduced} kg</strong>
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                          {new Date(history.exchanged_at).toLocaleString('th-TH')}
                        </p>
                      </div>
                      <div className="ml-4">
                        {history.item_image_url && (
                          <img
                            src={history.item_image_url}
                            alt={history.item_title}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
