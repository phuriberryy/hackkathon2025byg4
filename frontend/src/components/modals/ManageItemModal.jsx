import { useState, useEffect, useCallback } from 'react'
import { X, Mail, Building2, Clock, MessageCircle } from 'lucide-react'
import { itemsApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ManageItemModal({ open, onClose, item, onUpdate }) {
  const [exchangeRequests, setExchangeRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuth()
  const navigate = useNavigate()

  const fetchExchangeRequests = useCallback(async () => {
    if (!item || !token) return

    try {
      setLoading(true)
      setError('')
      const data = await itemsApi.getItemExchangeRequests(token, item.id)
      setExchangeRequests(data)
    } catch (err) {
      console.error('Failed to fetch exchange requests:', err)
      setError(err.message || 'Failed to load exchange requests')
    } finally {
      setLoading(false)
    }
  }, [item, token])

  useEffect(() => {
    if (open && item && token) {
      fetchExchangeRequests()
    }
  }, [open, item, token, fetchExchangeRequests])

  const handleViewRequest = (requestId) => {
    navigate(`/exchange/${requestId}`)
    onClose()
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    return `${days} days ago`
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Accepted
          </span>
        )
      case 'rejected':
        return (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Rejected
          </span>
        )
      default:
        return (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
            Pending
          </span>
        )
    }
  }

  if (!open || !item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Post</h2>
            <p className="mt-1 text-sm text-gray-600">{item.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
          ) : exchangeRequests.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-12 text-center">
              <MessageCircle className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg font-semibold text-gray-700">No exchange requests yet</p>
              <p className="mt-2 text-sm text-gray-500">
                When someone is interested in exchanging with this post, requests will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">
                Exchange Requests ({exchangeRequests.length})
              </p>
              {exchangeRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                          {request.requester_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{request.requester_name}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail size={12} />
                              {request.requester_email}
                            </div>
                            {request.requester_faculty && (
                              <div className="flex items-center gap-1">
                                <Building2 size={12} />
                                {request.requester_faculty}
                              </div>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      {request.message && (
                        <div className="mb-3 rounded-lg bg-gray-50 p-3">
                          <p className="text-sm text-gray-700 italic">&quot;{request.message}&quot;</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTimeAgo(request.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => handleViewRequest(request.id)}
                        className="flex-1 rounded-lg border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
                      >
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

