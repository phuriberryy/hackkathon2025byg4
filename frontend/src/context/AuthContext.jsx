import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../lib/api'

const AuthContext = createContext(undefined)

const STORAGE_KEY = 'sharecycle_auth'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      setUser(parsed.user)
      setToken(parsed.token)
    }
    setLoading(false)
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
    const { user: newUser, token: authToken } = await authApi.register(payload)
    persist(newUser, authToken)
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





