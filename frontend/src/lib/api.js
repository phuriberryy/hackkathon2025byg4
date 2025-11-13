export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api'

const handleResponse = async (res) => {
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}

const request = async (path, { token, headers, ...options } = {}) => {
  const mergedHeaders = {
    'Content-Type': 'application/json',
    ...(headers || {}),
  }

  if (token) {
    mergedHeaders['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: mergedHeaders,
  })

  return handleResponse(res)
}

export const authApi = {
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

export const itemsApi = {
  list: () => request('/items'),
  getById: (itemId) => request(`/items/${itemId}`),
  create: (token, payload) =>
    request('/items', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    }),
  update: (token, itemId, payload) =>
    request(`/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    }),
  delete: (token, itemId) =>
    request(`/items/${itemId}`, {
      method: 'DELETE',
      token,
    }),
  getUserItems: (token, userId) =>
    request(`/items/user/${userId}`, {
      token,
    }),
  getItemExchangeRequests: (token, itemId) =>
    request(`/items/${itemId}/exchange-requests`, {
      token,
    }),
}

export const exchangeApi = {
  request: (token, payload) =>
    request('/exchange', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    }),
  getById: (token, requestId) =>
    request(`/exchange/${requestId}`, {
      token,
    }),
  getMyRequests: (token) =>
    request('/exchange/my-requests', {
      token,
    }),
  acceptByOwner: (token, requestId) =>
    request(`/exchange/${requestId}/accept-owner`, {
      method: 'POST',
      token,
    }),
  acceptByRequester: (token, requestId) =>
    request(`/exchange/${requestId}/accept-requester`, {
      method: 'POST',
      token,
    }),
  reject: (token, requestId) =>
    request(`/exchange/${requestId}/reject`, {
      method: 'POST',
      token,
    }),
}

export const notificationApi = {
  list: (token) => request('/notifications', { token }),
  markRead: (token) => request('/notifications/read', { method: 'POST', token }),
  markNotificationRead: (token, notificationId) =>
    request(`/notifications/${notificationId}/read`, { method: 'POST', token }),
  getUnreadCount: (token) => request('/notifications/unread-count', { token }),
}

export const profileApi = {
  getProfile: (token) => request('/profile', { token }),
  updateProfile: (token, payload) =>
    request('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    }),
  getMyItems: (token) => request('/profile/items', { token }),
  getExchangeHistory: (token) => request('/profile/exchange-history', { token }),
}

export const chatApi = {
  create: (token, payload) =>
    request('/chats', { method: 'POST', body: JSON.stringify(payload), token }),
  list: (token) => request('/chats', { token }),
  messages: (token, chatId) => request(`/chats/${chatId}/messages`, { token }),
}
