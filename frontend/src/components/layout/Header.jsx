import { Bell, Menu, X, Leaf } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Profile', to: '/profile' },
]

function Header({ unread, onNotificationsClick }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const onLogin = () => navigate('/login')
  const { user, logout } = useAuth()
  const initials = useMemo(() => {
    if (!user?.name) return 'CM'
    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
            <Leaf size={24} />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold text-primary">CMU ShareCycle</p>
            <p className="text-xs text-gray-600">Green Campus</p>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="hidden items-center gap-3 sm:flex">
          <nav className="flex items-center gap-2 text-sm font-semibold">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-5 py-2.5 transition ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={onNotificationsClick}
            className="relative rounded-full border border-gray-200 bg-white p-2.5 text-gray-700 hover:bg-gray-50 transition"
            aria-label="notifications"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {user ? (
            <>
              <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-gray-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  {initials}
                </span>
                <span>{user.name.split(' ')[0]}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                location.pathname === '/login'
                  ? 'bg-primary text-white shadow-md'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Log In
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white sm:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="border-t border-gray-200 bg-white px-6 py-4 shadow-lg sm:hidden">
          <div className="mb-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  logout()
                  setOpen(false)
                }}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onLogin()
                  setOpen(false)
                }}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header










