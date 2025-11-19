import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  User as UserIcon,
  Calendar,
  Package,
  Zap,
  Clock3,
  AlertCircle,
  Heart,
} from 'lucide-react'
import { itemsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { calculateItemCO2 } from '../utils/co2Calculator'

export default function ItemDetailPage({ onExchangeItem, onDonationItem }) {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) {
        setError('Item ID not found')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await itemsApi.getById(itemId)
        setItem(data)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch item:', err)
        setError('Item not found')
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [itemId])

  const handleExchange = () => {
    if (onExchangeItem) {
      onExchangeItem(itemId)
    }
  }


  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDaysRemaining = (dateString) => {
    if (!dateString) return null
    // ใช้การเปรียบเทียบวันที่ (ไม่สนใจเวลา) เพื่อให้สอดคล้องกับ backend
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiryDate = new Date(dateString)
    expiryDate.setHours(0, 0, 0, 0)
    const diffTime = expiryDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl bg-white p-12 text-center shadow-md">
          <p className="text-lg text-gray-600">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl bg-white p-12 text-center shadow-md">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-gray-900">{error || 'Item not found'}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const isInProgress = item.status === 'in_progress'
  const isOwner = user && user.id === item.user_id
  const daysRemaining = getDaysRemaining(item.available_until)
  const co2Footprint = calculateItemCO2(item.category, item.item_condition)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Back Button */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900"
      >
        <ArrowLeft size={18} />
        <span>Back to Home</span>
      </Link>

      <div className="rounded-2xl bg-white shadow-md">
        {/* Image Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-gray-100">
          {item.image_url ? (
            <img
              src={
                item.image_url?.startsWith('data:') 
                  ? item.image_url 
                  : `${item.image_url}?t=${Date.now()}`
              }
              alt={item.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                console.error('[ITEM DETAIL] Failed to load image:', item.image_url?.substring(0, 100))
                e.target.style.display = 'none'
                const parent = e.target.parentElement
                if (parent && !parent.querySelector('.error-placeholder')) {
                  const errorDiv = document.createElement('div')
                  errorDiv.className = 'error-placeholder flex h-full w-full items-center justify-center bg-gray-100 text-gray-400'
                  errorDiv.innerHTML = `
                    <div class="text-center">
                      <svg class="mx-auto mb-2" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <p class="text-xs">Failed to load image</p>
                    </div>
                  `
                  parent.appendChild(errorDiv)
                }
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
              <div className="text-center">
                <Package size={64} className="mx-auto mb-2" />
                <p className="text-sm">No image</p>
              </div>
            </div>
          )}
          {/* Status Badges */}
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {item.available_until && daysRemaining !== null && (
              <>
                {daysRemaining < 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700">
                    <Clock3 size={16} />
                    Expired
                  </span>
                ) : daysRemaining <= 7 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5 text-sm font-semibold text-yellow-700">
                    <Clock3 size={16} />
                    {daysRemaining} days remaining
                  </span>
                ) : null}
              </>
            )}
          </div>
          <div className="absolute right-4 top-4">
            {isInProgress ? (
              <span className="rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-md">
                In progress
              </span>
            ) : item.listing_type === 'donation' ? (
              <span className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white">
                Donation
              </span>
            ) : (
              <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
                Exchange
              </span>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {item.category && (
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                  <Zap size={14} />
                  {item.category}
                </span>
              )}
              {item.item_condition && (
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                  <Package size={14} />
                  {item.item_condition}
                </span>
              )}
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-900">{item.title || 'No item name'}</h1>
            
            {/* Description */}
            {item.description && (
              <div className="mb-6 rounded-xl bg-gray-50 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">Description</p>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{item.description}</p>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Owner */}
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <UserIcon size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Owner</p>
                  <p className="font-semibold text-gray-900">{item.owner_name || 'Not specified'}</p>
                </div>
              </div>
              <div className="mt-2 border-t border-gray-200 pt-2">
                <p className="text-xs text-gray-500">Faculty</p>
                <p className="text-sm font-medium text-gray-700">{item.owner_faculty || 'Not specified'}</p>
              </div>
              <div className="mt-2 border-t border-gray-200 pt-2">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-700">{item.owner_email || 'Not specified'}</p>
              </div>
            </div>

            {/* Pickup Location */}
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MapPin size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pickup Location</p>
                <p className="font-semibold text-gray-900">{item.pickup_location || 'Not specified'}</p>
              </div>
            </div>

            {/* Available Until */}
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Calendar size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Available until</p>
                <p className="font-semibold text-gray-900">{formatDate(item.available_until)}</p>
              </div>
            </div>

            {/* CO₂ Footprint */}
            <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Zap size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">CO₂ Footprint</p>
                <p className="font-semibold text-green-700">{co2Footprint.toFixed(2)} kg CO₂e</p>
              </div>
            </div>

            {/* Posted Date */}
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Calendar size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Posted date</p>
                <p className="font-semibold text-gray-900">{formatDate(item.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Looking For - Only show for exchange items */}
          {item.listing_type !== 'donation' && (
            <div className="mb-6 rounded-xl bg-yellow-50 p-4">
              <p className="mb-2 text-sm font-semibold text-yellow-900">Looking for:</p>
              <p className="text-yellow-800">{item.looking_for || 'Not specified'}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {!isOwner && !isInProgress && item.status === 'active' && item.listing_type === 'donation' && (
              <button
                onClick={() => onDonationItem(item.id)}
                className="flex-1 rounded-full bg-red-500 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <Heart size={20} />
                Request Donation
              </button>
            )}
            {!isOwner && !isInProgress && item.status === 'active' && item.listing_type !== 'donation' && (
              <button
                onClick={handleExchange}
                className="flex-1 rounded-full bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark"
              >
                Request Exchange
              </button>
            )}
            {isOwner && item.status === 'active' && (
              <div className="flex-1 rounded-xl bg-blue-50 p-4 text-center">
                <p className="text-sm font-semibold text-blue-900">This is your item</p>
                <p className="mt-1 text-xs text-blue-700">You can manage this item on the Profile page</p>
              </div>
            )}
            {isInProgress && (
              <div className="flex-1 rounded-xl bg-yellow-50 p-4 text-center">
                <p className="text-sm font-semibold text-yellow-900">This item is currently in the exchange process</p>
              </div>
            )}
            {item.status === 'donated' && (
              <div className="flex-1 rounded-xl bg-green-50 p-4 text-center">
                <p className="text-sm font-semibold text-green-900 flex items-center justify-center gap-2">
                  <Heart size={20} className="text-green-600" />
                  This item has been donated
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

