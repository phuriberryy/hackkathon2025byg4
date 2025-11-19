import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Handshake,
  Recycle,
  Users,
  PiggyBank,
  Plus,
  ArrowRight,
  RefreshCcw,
  Leaf,
  Zap,
  Clock3,
  ChevronDown,
  MapPin,
  User as UserIcon,
  Eye,
  Package,
  TrendingUp,
  CheckCircle,
  BarChart3,
  Heart,
} from 'lucide-react'
import { itemsApi, statisticsApi, API_BASE } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { io } from 'socket.io-client'

export default function HomePage({ onExchangeItem, onDonationItem, onPostItem, refreshKey }) {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedCondition, setSelectedCondition] = useState('All Conditions')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const categoryOptions = [
    { value: 'All Categories', label: 'All Categories' },
    { value: 'Clothes & Fashion', label: '👕 Clothes & Fashion' },
    { value: 'Dorm Essentials', label: '🏡 Dorm Essentials' },
    { value: 'Books & Study', label: '📚 Books & Study' },
    { value: 'Kitchen & Appliances', label: '🍳 Kitchen & Appliances' },
    { value: 'Cleaning & Laundry', label: '🧼 Cleaning & Laundry' },
    { value: 'Hobbies & Entertainment', label: '🎮 Hobbies & Entertainment' },
    { value: 'Sports Gear', label: '🏀 Sports Gear' },
    { value: 'Others', label: '✨ Others' },
  ]

  const conditionOptions = [
    { value: 'All Conditions', label: 'All Conditions' },
    { value: 'Like New', label: 'Like New' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
  ]

  const benefitCards = [
    { title: 'Fair Exchange', description: 'Trade value for value', icon: Handshake },
    { title: 'Zero Waste', description: 'Everything reused', icon: Recycle },
    { title: 'Build Community', description: 'Meet fellow students', icon: Users },
    { title: 'Save Money', description: 'No buying needed', icon: PiggyBank },
  ]

  const fetchItems = useCallback(() => {
    setLoading(true)
    itemsApi
      .list()
      .then((data) => {
        setItems(data)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchItems()
  }, [refreshKey, fetchItems])

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
      // Only log non-transport errors to reduce console spam
      if (err.message !== 'websocket error' && err.message !== 'xhr poll error') {
        console.debug('Socket connection error:', err.message)
      }
    })

    socket.on('connect', () => {
      console.debug('Socket connected for real-time updates')
    })

    socket.on('item:created', () => {
      fetchItems()
    })

    socket.on('item:updated', () => {
      fetchItems()
    })

    socket.on('item:deleted', () => {
      fetchItems()
    })

    socket.on('exchange:completed', () => {
      fetchItems()
      // Refresh statistics when exchange completes
      statisticsApi.getStatistics()
        .then(setStatistics)
        .catch((err) => console.error('Failed to refresh statistics:', err))
    })

    socket.on('donation:completed', () => {
      fetchItems()
      // Refresh statistics when donation completes
      statisticsApi.getStatistics()
        .then(setStatistics)
        .catch((err) => console.error('Failed to refresh statistics:', err))
    })

    return () => {
      socket.disconnect()
    }
  }, [token, fetchItems])

  useEffect(() => {
    setLoadingStats(true)
    statisticsApi
      .getStatistics()
      .then((data) => {
        setStatistics(data)
      })
      .catch((err) => {
        console.error('Failed to load statistics:', err)
      })
      .finally(() => setLoadingStats(false))
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const title = item.title || ''
      const description = item.description || ''
      const matchesQuery =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategory === 'All Categories' || item.category === selectedCategory
      const matchesCondition =
        selectedCondition === 'All Conditions' || item.item_condition === selectedCondition
      return matchesQuery && matchesCategory && matchesCondition
    })
  }, [items, searchQuery, selectedCategory, selectedCondition])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-0">
      {/* HERO */}
      <section className="relative mb-16 overflow-hidden rounded-[40px] bg-gradient-to-r from-[#F3F9F2] via-[#EEF6EE] to-[#F8FBF7] px-8 py-14 shadow-soft">
        <div className="absolute -left-10 top-12 hidden text-primary/10 lg:block">
          <RefreshCcw className="h-[360px] w-[360px]" strokeWidth={1} />
        </div>
        <div className="absolute -right-6 bottom-0 hidden text-primary/15 lg:block">
          <Leaf className="h-[300px] w-[300px]" strokeWidth={1} />
        </div>
        <div className="relative flex flex-col gap-12 lg:flex-row">
          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              <Leaf size={16} />
              CMU ShareCycle · Green Campus
            </p>
            <div className="space-y-3">
              <p className="text-6xl font-extrabold leading-none text-gray-900 sm:text-7xl">
                Exchange
              </p>
              <p className="text-5xl font-bold text-[#5FA660] sm:text-6xl">What You Have</p>
              <p className="text-5xl font-bold text-[#5FA660] sm:text-6xl">For What You Need</p>
            </div>
            <p className="mt-6 text-lg text-gray-600 sm:text-xl">
              The smartest way for CMU students to exchange items.{' '}
              <span className="font-semibold text-gray-900">No money, no waste, just community.</span>
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button 
                onClick={() => {
                  const itemsSection = document.getElementById('items-section')
                  if (itemsSection) {
                    itemsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark"
              >
                <span>Browse Items</span>
                <ArrowRight size={18} />
              </button>
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm">
                <Zap size={16} />
                Zero waste campus mission
              </div>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            {benefitCards.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-[28px] border border-white/60 bg-white px-5 py-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <benefit.icon size={24} />
                  </div>
                  <ArrowRight size={18} className="text-gray-300" />
                </div>
                <p className="text-base font-semibold text-gray-900">{benefit.title}</p>
                <p className="text-sm text-gray-500">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS DASHBOARD */}
      {loadingStats ? (
        <section className="mb-16">
          <div className="rounded-2xl bg-white p-12 text-center shadow-soft">
            <p className="text-sm text-gray-500">Loading statistics...</p>
          </div>
        </section>
      ) : statistics ? (
        <section className="mb-16">
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm">
              <BarChart3 size={14} />
              Platform Statistics
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Community Impact</h2>
            <p className="mt-2 text-lg text-gray-600">See how we're making a difference together</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Users */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-600">
                  <Users size={24} />
                </div>
                <div className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700">
                  Active
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalUsers.toLocaleString()}</p>
              <p className="mt-1 text-sm font-medium text-gray-600">Total Users</p>
              <p className="mt-2 text-xs text-gray-500">CMU students joined</p>
            </div>

            {/* Total Items */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-green-50 to-green-100/50 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/20 text-green-600">
                  <Package size={24} />
                </div>
                <div className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700">
                  {statistics.activeItems} Active
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalItems.toLocaleString()}</p>
              <p className="mt-1 text-sm font-medium text-gray-600">Total Items</p>
              <p className="mt-2 text-xs text-gray-500">{statistics.activeItems} available now</p>
            </div>

            {/* Successful Exchanges */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-600">
                  <CheckCircle size={24} />
                </div>
                <div className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700">
                  Completed
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalExchanges.toLocaleString()}</p>
              <p className="mt-1 text-sm font-medium text-gray-600">Successful Exchanges</p>
              <p className="mt-2 text-xs text-gray-500">Items exchanged</p>
            </div>

            {/* CO₂ Reduced */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600">
                  <Leaf size={24} />
                </div>
                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <TrendingUp size={12} className="inline mr-1" />
                  Impact
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalCO2Reduced.toLocaleString()}</p>
              <p className="mt-1 text-sm font-medium text-gray-600">kg CO₂ Reduced</p>
              <p className="mt-2 text-xs text-gray-500">Environmental impact</p>
            </div>
          </div>

          {/* Additional Stats Row */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 shadow-soft">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-600">
                  <RefreshCcw size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalRequests.toLocaleString()}</p>
                  <p className="text-sm font-medium text-gray-600">Total Exchange Requests</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Clock3 size={14} />
                <span>{statistics.pendingRequests} pending approval</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-teal-50 to-teal-100/50 p-6 shadow-soft">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-600">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.totalExchanges > 0 
                      ? ((statistics.totalExchanges / statistics.totalUsers) * 100).toFixed(1)
                      : '0'}%
                  </p>
                  <p className="text-sm font-medium text-gray-600">Exchange Rate</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Users size={14} />
                <span>Average exchanges per user</span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ITEMS */}
      <section id="items-section">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm">
            <RefreshCcw size={14} />
            Browse Items
          </div>
          <h2 className="text-4xl font-bold text-gray-900">Available for Exchange</h2>
          <p className="mt-2 text-lg text-gray-600">Discover items posted by fellow CMU students</p>
        </div>

        <div className="mb-10 flex flex-col gap-4 rounded-[32px] bg-white/80 p-5 shadow-soft lg:flex-row lg:items-center lg:p-6">
          <div className="flex-1">
            <label className="sr-only" htmlFor="search-items">
              Search items
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="search-items"
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-primary/10 bg-surface px-5 py-3 pl-12 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none rounded-full border border-primary/15 bg-white px-5 py-3 pr-12 text-sm font-semibold text-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>

            <div className="relative">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="appearance-none rounded-full border border-primary/15 bg-white px-5 py-3 pr-12 text-sm font-semibold text-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {conditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>

            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark">
              <Search size={16} />
              <span>Search</span>
            </button>

            <button
              onClick={onPostItem}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-white shadow-card transition hover:bg-primary-dark"
            >
              <Plus size={20} />
              Post Item
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-12 text-center text-sm text-gray-500 shadow-md">
            Loading items...
          </div>
        )}
        {!loading && filteredItems.length === 0 && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-md">
            <p className="text-lg font-medium text-gray-600">No items available right now.</p>
            <p className="mt-2 text-sm text-gray-500">Be the first to post an item!</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const isInProgress = item.status === 'in_progress'
            const isDonated = item.status === 'donated'
            return (
            <article
              key={item.id}
              className={`flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-soft transition ${
                isInProgress 
                  ? 'opacity-60 grayscale-[30%] cursor-not-allowed' 
                  : 'hover:-translate-y-1 hover:shadow-card'
              }`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={
                    item.image_url ||
                    'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                {/* Left badge: X days remaining or expired */}
                <div className="absolute left-4 top-4">
                  {(() => {
                    if (!item.available_until) {
                      return null
                    }
                    // ใช้การเปรียบเทียบวันที่ (ไม่สนใจเวลา) เพื่อให้สอดคล้องกับ backend
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const expiryDate = new Date(item.available_until)
                    expiryDate.setHours(0, 0, 0, 0)
                    const diffTime = expiryDate - today
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    
                    // เมื่อ diffDays = 0 หมายถึง 0 days remaining (วันนี้เป็นวันสุดท้าย)
                    // ซึ่ง backend จะถือว่า expired และไม่แสดงใน feed
                    if (diffDays < 0) {
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700">
                          <Clock3 size={16} />
                          Expired
                        </span>
                      )
                    } else if (diffDays === 0) {
                      // 0 days remaining - จะถูกย้ายไป expired tab
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5 text-sm font-semibold text-yellow-700">
                          <Clock3 size={16} />
                          0 days remaining
                        </span>
                      )
                    } else if (diffDays <= 7) {
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5 text-sm font-semibold text-yellow-700">
                          <Clock3 size={16} />
                          {diffDays} days remaining
                        </span>
                      )
                    }
                    return null
                  })()}
                </div>
                {/* Right badge: Exchange/Donation or in progress */}
                {isInProgress ? (
                  <span className="absolute right-4 top-4 rounded-full bg-yellow-500 px-3 py-1.5 text-sm font-semibold text-white shadow-md">
                    In progress
                  </span>
                ) : item.listing_type === 'donation' ? (
                  <span className="absolute right-4 top-4 rounded-full bg-red-500 px-3 py-1.5 text-sm font-semibold text-white">
                    Donation
                  </span>
                ) : (
                  <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white">
                    Exchange
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col space-y-4 p-5">
                {/* Category Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                  <Zap size={14} />
                  {item.category}
                </div>
                
                {/* Title - Clickable to view details */}
                <h3 
                  onClick={() => navigate(`/items/${item.id}`)}
                  className="cursor-pointer text-lg font-semibold text-gray-900 line-clamp-2 transition hover:text-primary"
                >
                  {item.title}
                </h3>
                
                {/* Details: Condition, Location, Seller */}
                <div className="flex-1 space-y-2.5 text-base text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Condition:</span>
                    <span>{item.item_condition}</span>
                  </div>
                  {item.pickup_location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-gray-400" />
                      <span className="truncate">{item.pickup_location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <UserIcon size={18} className="text-gray-400" />
                    <span className="truncate">{item.owner_name || 'CMU Student'}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => navigate(`/items/${item.id}`)}
                    className="flex-1 rounded-lg border-2 border-primary bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10"
                  >
                    <Eye size={16} className="mx-auto" />
                    <span className="mt-1 block text-xs">View Details</span>
                  </button>
                  {isInProgress ? (
                    <button
                      disabled
                      className="flex-1 rounded-lg bg-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-500 shadow-md cursor-not-allowed"
                    >
                      <RefreshCcw size={16} className="mx-auto" />
                      <span className="mt-1 block text-xs">In progress</span>
                    </button>
                  ) : isDonated ? (
                    <button
                      disabled
                      className="flex-1 rounded-lg bg-green-300 px-4 py-2.5 text-sm font-semibold text-green-700 shadow-md cursor-not-allowed"
                    >
                      <Heart size={16} className="mx-auto" />
                      <span className="mt-1 block text-xs">Donated</span>
                    </button>
                  ) : item.status === 'active' && item.listing_type !== 'donation' ? (
                    <button
                      onClick={() => onExchangeItem(item.id)}
                      className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-dark"
                    >
                      <RefreshCcw size={16} className="mx-auto" />
                      <span className="mt-1 block text-xs">Exchange</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
            )
          })}
        </div>
      </section>

    </div>
  )
}

