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
  create: (token, payload) =>
    request('/items', {
      method: 'POST',
      body: JSON.stringify(payload),
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
}

export const notificationApi = {
  list: (token) => request('/notifications', { token }),
  markRead: (token) => request('/notifications/read', { method: 'POST', token }),
}

export const chatApi = {
  create: (token, payload) =>
    request('/chats', { method: 'POST', body: JSON.stringify(payload), token }),
  list: (token) => request('/chats', { token }),
  messages: (token, chatId) => request(`/chats/${chatId}/messages`, { token }),
}

