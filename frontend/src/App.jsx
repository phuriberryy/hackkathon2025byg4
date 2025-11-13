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
import PostItemModal from './components/modals/PostItemModal'
import ExchangeRequestModal from './components/modals/ExchangeRequestModal'
import NotificationsModal from './components/modals/NotificationsModal'
import ChatModal from './components/modals/ChatModal'
import { AuthProvider, useAuth } from './context/AuthContext'
import { API_BASE, notificationApi } from './lib/api'

const SOCKET_URL = API_BASE.replace(/\/api$/, '')

function AppContent() {
  const location = useLocation()
  const [postItemOpen, setPostItemOpen] = useState(false)
  const [exchangeRequestOpen, setExchangeRequestOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [initialChatId, setInitialChatId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [itemsVersion, setItemsVersion] = useState(0)
  const { token, loading } = useAuth()

  const isLoginPage = location.pathname === '/login'

  const handlePostItem = () => {
    setPostItemOpen(true)
  }

  const handleExchangeItem = (itemId) => {
    setSelectedItem(itemId)
    setExchangeRequestOpen(true)
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
    const socket = io(SOCKET_URL, { auth: { token } })
    socket.on('notification:new', () => {
      setUnreadCount((prev) => prev + 1)
    })
    socket.on('chat:created', (chat) => {
      setInitialChatId(chat.id)
      setChatOpen(true)
    })
    return () => {
      socket.disconnect()
    }
  }, [token])

  useEffect(() => {
    const handleOpenChat = (event) => {
      const chatId = event.detail?.chatId ?? null
      if (chatId) {
        setInitialChatId(chatId)
      } else {
        setInitialChatId(null)
      }
      setChatOpen(true)
    }

    window.addEventListener('app:open-chat', handleOpenChat)
    return () => {
      window.removeEventListener('app:open-chat', handleOpenChat)
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
      {!isLoginPage && (
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
              <HomePage 
                onExchangeItem={handleExchangeItem}
                onPostItem={handlePostItem}
                refreshKey={itemsVersion}
              />
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/exchange/:requestId" element={<ExchangeRequestDetailPage />} />
        </Routes>
      </main>
      {!isLoginPage && <Footer />}

      {/* Floating Message Button */}
      {!isLoginPage && (
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
      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onUnreadChange={setUnreadCount}
      />
      <ChatModal
        open={chatOpen}
        onClose={() => {
          setChatOpen(false)
          setInitialChatId(null)
        }}
        initialChatId={initialChatId}
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

