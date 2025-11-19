import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { io } from 'socket.io-client'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import ExchangeRequestDetailPage from './pages/ExchangeRequestDetailPage'
import DonationRequestDetailPage from './pages/DonationRequestDetailPage'
import ItemDetailPage from './pages/ItemDetailPage'
import PostItemModal from './components/modals/PostItemModal'
import ExchangeRequestModal from './components/modals/ExchangeRequestModal'
import DonationRequestModal from './components/modals/DonationRequestModal'
import NotificationsModal from './components/modals/NotificationsModal'
import ChatModal from './components/modals/ChatModal'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import { API_BASE, notificationApi } from './lib/api'

const SOCKET_URL = API_BASE.replace(/\/api$/, '')

function AppContent() {
  const location = useLocation()
  const [postItemOpen, setPostItemOpen] = useState(false)
  const [exchangeRequestOpen, setExchangeRequestOpen] = useState(false)
  const [donationRequestOpen, setDonationRequestOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [itemsVersion, setItemsVersion] = useState(0)
  const { token, loading } = useAuth()

  const isLoginPage = location.pathname === '/login' || location.pathname === '/register'
  const isAuthenticated = !!token

  const handlePostItem = () => {
    setPostItemOpen(true)
  }

  const handleExchangeItem = (itemId) => {
    setSelectedItem(itemId)
    setExchangeRequestOpen(true)
  }

  const handleDonationItem = (itemId) => {
    setSelectedItem(itemId)
    setDonationRequestOpen(true)
  }

  const handleNotificationsClick = () => {
    setNotificationsOpen(true)
  }

  const handleMessageClick = () => {
    setChatOpen(true)
  }

  const handleItemCreated = () => {
    setItemsVersion((prev) => prev + 1)
  }

  useEffect(() => {
    if (!token) {
      setUnreadCount(0)
      return
    }
    notificationApi
      .list(token)
      .then((data) => {
        const unread = data.filter((n) => !n.read).length
        setUnreadCount(unread)
      })
      .catch(() => setUnreadCount(0))
  }, [token])

  useEffect(() => {
    if (!token) return
    const socket = io(SOCKET_URL, {
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
      // Silently handle connection errors for notifications
      // Only log non-transport errors to reduce console spam
      if (err.message !== 'websocket error') {
        console.debug('Notification socket connection error:', err.message)
      }
    })

    socket.on('notification:new', () => {
      setUnreadCount((prev) => prev + 1)
    })
    
    return () => {
      socket.disconnect()
    }
  }, [token])

  // Listen for openChat custom event
  useEffect(() => {
    const handleOpenChat = (event) => {
      const { chatId } = event.detail || {}
      if (chatId) {
        setSelectedChatId(chatId)
        setChatOpen(true)
      }
    }

    window.addEventListener('openChat', handleOpenChat)
    return () => {
      window.removeEventListener('openChat', handleOpenChat)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-gray-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {isAuthenticated && !isLoginPage && (
        <Header
          unread={unreadCount}
          onNotificationsClick={handleNotificationsClick}
        />
      )}
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
              <HomePage 
                onExchangeItem={handleExchangeItem}
                onDonationItem={handleDonationItem}
                onPostItem={handlePostItem}
                refreshKey={itemsVersion}
              />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items/:itemId"
            element={
              <ProtectedRoute>
                <ItemDetailPage 
                  onExchangeItem={handleExchangeItem}
                  onDonationItem={handleDonationItem}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exchange/:requestId"
            element={
              <ProtectedRoute>
                <ExchangeRequestDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donation-requests/:requestId"
            element={
              <ProtectedRoute>
                <DonationRequestDetailPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {isAuthenticated && !isLoginPage && <Footer />}

      {/* Floating Message Button */}
      {isAuthenticated && !isLoginPage && (
        <button
          onClick={handleMessageClick}
          className="floating-message-button"
          aria-label="Open messages"
        >
          <MessageCircle size={24} />
        </button>
      )}

      <PostItemModal
        open={postItemOpen}
        onClose={() => setPostItemOpen(false)}
        onSuccess={handleItemCreated}
      />
      <ExchangeRequestModal
        open={exchangeRequestOpen}
        onClose={() => {
          setExchangeRequestOpen(false)
          setSelectedItem(null)
        }}
        itemId={selectedItem}
      />
      <DonationRequestModal
        open={donationRequestOpen}
        onClose={() => {
          setDonationRequestOpen(false)
          setSelectedItem(null)
        }}
        itemId={selectedItem}
      />
      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onUnreadChange={setUnreadCount}
      />
      <ChatModal
        open={chatOpen}
        onClose={() => {
          setChatOpen(false)
          setSelectedChatId(null)
        }}
        initialChatId={selectedChatId}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

