import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import PostItemModal from './components/modals/PostItemModal'
import ExchangeRequestModal from './components/modals/ExchangeRequestModal'
import NotificationsModal from './components/modals/NotificationsModal'

function AppContent() {
  const location = useLocation()
  const [postItemOpen, setPostItemOpen] = useState(false)
  const [exchangeRequestOpen, setExchangeRequestOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const isLoginPage = location.pathname === '/login'

  const handlePostItem = () => {
    setPostItemOpen(true)
  }

  const handleExchangeItem = (itemId: string) => {
    setSelectedItem(itemId)
    setExchangeRequestOpen(true)
  }

  const handleNotificationsClick = () => {
    setNotificationsOpen(true)
  }

  const handleMessageClick = () => {
    console.log('Open messages')
    // Handle message click
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {!isLoginPage && (
        <Header
          unread={0}
          onNotificationsClick={handleNotificationsClick}
        />
      )}
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <HomePage 
                onExchangeItem={handleExchangeItem}
                onPostItem={handlePostItem}
              />
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
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

      <PostItemModal open={postItemOpen} onClose={() => setPostItemOpen(false)} />
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
      />
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
