import { useMemo, useState, useEffect } from 'react'
import {
  Settings,
  Edit2,
  ArrowRightLeft,
  User,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  CheckCircle,
  Image as ImageIcon,
  Eye,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { profileApi, itemsApi, exchangeApi } from '../lib/api'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posts')
  const [profile, setProfile] = useState(null)
  const [myItems, setMyItems] = useState([])
  const [exchangeHistory, setExchangeHistory] = useState([])
  const [exchangeRequests, setExchangeRequests] = useState([])
  const [loading, setLoading] = useState(true)
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

  // delete feature is not used in UI yet; implement when enabling delete action

  const handleEditItem = (itemId) => {
    // TODO: เปิด modal สำหรับแก้ไข item
    alert('ฟีเจอร์แก้ไขโพสต์จะเปิดให้ใช้งานเร็วๆ นี้')
  }

  const handleManageItem = (itemId) => {
    // TODO: เปิด modal สำหรับจัดการ item (ดู exchange requests, etc.)
    alert('ฟีเจอร์จัดการโพสต์จะเปิดให้ใช้งานเร็วๆ นี้')
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

            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                <Edit2 size={16} />
                Edit Profile
              </button>
              <button className="rounded-full border border-gray-200 p-3 text-gray-500 shadow-sm transition hover:bg-gray-50">
                <Settings size={18} />
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-6 border-t border-gray-100 pt-6 sm:flex-row">
            <div>
              <p className="text-4xl font-bold text-primary">{stats.itemsShared || 0}</p>
              <p className="text-sm text-gray-500">Items Shared</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">{stats.co2Reduced || '0.00'}kg</p>
              <p className="text-sm text-gray-500">CO₂ Reduced</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">Level {Math.floor((stats.itemsShared || 0) / 5) + 1}</p>
              <p className="text-sm text-gray-500">Community Impact</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-gray-100 px-8 py-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === 'posts'
                ? 'bg-primary text-white shadow-card'
                : 'bg-surface text-gray-700 hover:bg-primary/10'
            }`}
          >
            <Package size={16} />
            โพสต์ของฉัน
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-card'
                : 'bg-surface text-gray-700 hover:bg-primary/10'
            }`}
          >
            <ArrowRightLeft size={16} />
            ประวัติการแลกเปลี่ยน
          </button>
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-light px-4 py-2 text-xs font-semibold text-primary">
            <ShieldCheck size={14} />
            Verified CMU Student
          </span>
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
                            onClick={() => handleManageItem(item.id)}
                            className="flex-1 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
                          >
                            จัดการ
                          </button>
                          <button
                            onClick={() => handleEditItem(item.id)}
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
    </div>
  )
}
