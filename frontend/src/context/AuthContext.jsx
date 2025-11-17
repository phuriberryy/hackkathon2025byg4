import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../lib/api'

const AuthContext = createContext(undefined)

const STORAGE_KEY = 'sharecycle_auth'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
        if (parsed && parsed.user && parsed.token) {
      setUser(parsed.user)
      setToken(parsed.token)
        } else {
          // ถ้าข้อมูลไม่ครบ ให้ลบออก
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (err) {
      // ถ้า JSON.parse fail ให้ลบข้อมูลเสียออก
      console.error('Failed to parse auth data:', err)
      localStorage.removeItem(STORAGE_KEY)
    } finally {
    setLoading(false)
    }
  }, [])

  const persist = (nextUser, nextToken) => {
    if (nextUser && nextToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setUser(nextUser)
    setToken(nextToken)
  }

  const login = async (email, password) => {
    const { user: loggedUser, token: authToken } = await authApi.login({ email, password })
    persist(loggedUser, authToken)
  }

  const register = async (payload) => {
    const response = await authApi.register(payload)
    // Registration successful but no token - user must log in separately
    // Don't persist anything, just return success message
    return response
  }

  const logout = () => persist(null, null)

  const updateUser = (updatedUser) => {
    if (token) {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        persist(updatedUser, parsed.token)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be within AuthProvider')
  }
  return ctx
}





