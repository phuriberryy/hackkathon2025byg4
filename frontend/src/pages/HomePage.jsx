import { useEffect, useMemo, useState } from 'react'
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
} from 'lucide-react'
import { itemsApi } from '../lib/api'
import { calculateItemCO2 } from '../utils/co2Calculator'

export default function HomePage({ onExchangeItem, onPostItem, refreshKey }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedCondition, setSelectedCondition] = useState('All Conditions')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const categoryOptions = [
    { value: 'All Categories', label: 'All Categories' },
    { value: 'Books & Textbooks', label: 'Books & Textbooks' },
    { value: 'Clothes', label: 'Clothes' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Dorm Items', label: 'Dorm Items' },
    { value: 'Sports Equipment', label: 'Sports Equipment' },
    { value: 'Eco Items', label: 'Eco Items' },
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

  useEffect(() => {
    setLoading(true)
    itemsApi
      .list()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
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
              <button className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark">
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

      {/* ITEMS */}
      <section>
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
              <span>ค้นหา</span>
            </button>

            <button
              onClick={onPostItem}
              className="inline-flex items-center gap-2 rounded-full bg-[#0E8B43] px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-[#0B6C33]"
            >
              <Plus size={18} />
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
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
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
                {/* Badge ซ้ายบน: เหลือ X วัน หรือ หมดอายุแล้ว */}
                <div className="absolute left-4 top-4">
                  {(() => {
                    if (!item.available_until) {
                      return null
                    }
                    const today = new Date()
                    const expiryDate = new Date(item.available_until)
                    const diffTime = expiryDate - today
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    
                    if (diffDays < 0) {
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700">
                          <Clock3 size={16} />
                          หมดอายุแล้ว
                        </span>
                      )
                    } else if (diffDays <= 7) {
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5 text-sm font-semibold text-yellow-700">
                          <Clock3 size={16} />
                          เหลือ {diffDays} วัน
                        </span>
                      )
                    }
                    return null
                  })()}
                </div>
                {/* Badge ขวาบน: Exchange */}
                <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white">
                  Exchange
                </span>
              </div>
              <div className="flex flex-1 flex-col space-y-4 p-5">
                {/* Category Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                  <Zap size={14} />
                  {item.category}
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                
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
                
                {/* Exchange Button */}
                <button
                  onClick={() => onExchangeItem(item.id)}
                  className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark"
                >
                  <RefreshCcw size={20} />
                  Exchange
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

