import { useMemo, useState } from 'react'
import {
  Settings,
  Edit2,
  ArrowRightLeft,
  User,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posts')
  const { user } = useAuth()

  const initials = useMemo(() => {
    if (!user?.name) return 'YO'
    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user])

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-gray-600">กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์ของคุณ</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-0">
      <section className="overflow-hidden rounded-[40px] bg-white shadow-soft">
        <div className="h-40 bg-gradient-to-r from-[#1B843C] via-[#2D7D3F] to-[#76BE7B]" />
        <div className="relative px-8 pb-10 pt-4">
          <div className="absolute -top-16 left-10 flex h-32 w-32 items-center justify-center rounded-full border-[6px] border-white bg-primary text-4xl font-bold text-white shadow-soft">
            {initials}
          </div>

          <div className="mt-16 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2 text-base text-gray-800">
                  <User size={18} className="text-primary" />
                  {user.faculty || 'CMU Student'}
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-primary/60" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary/60" />
                  {user.faculty || 'Chiang Mai University'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                <Edit2 size={16} />
                Edit Profile
              </button>
              <button className="rounded-full border border-gray-200 p-3 text-gray-500 shadow-sm transition hover:bg-gray-50">
                <Settings size={18} />
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-6 border-t border-gray-100 pt-6 sm:flex-row">
            <div>
              <p className="text-4xl font-bold text-primary">0</p>
              <p className="text-sm text-gray-500">Items Shared</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">0kg</p>
              <p className="text-sm text-gray-500">CO₂ Reduced</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">Level 1</p>
              <p className="text-sm text-gray-500">Community Impact</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-gray-100 px-8 py-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === 'posts'
                ? 'bg-primary text-white shadow-card'
                : 'bg-surface text-gray-700 hover:bg-primary/10'
            }`}
          >
            <Package size={16} />
            โพสต์ของฉัน
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-card'
                : 'bg-surface text-gray-700 hover:bg-primary/10'
            }`}
          >
            <ArrowRightLeft size={16} />
            ประวัติการแลกเปลี่ยน
          </button>
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-light px-4 py-2 text-xs font-semibold text-primary">
            <ShieldCheck size={14} />
            Verified CMU Student
          </span>
        </div>
      </section>

      <div className="mt-10 rounded-[32px] bg-white p-12 text-center shadow-soft">
        {activeTab === 'posts' ? (
          <>
            <p className="text-lg font-semibold text-gray-700">No posts yet.</p>
            <p className="mt-2 text-sm text-gray-500">
              Start sharing items to see them appear in your profile.
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold text-gray-700">No exchange history yet.</p>
            <p className="mt-2 text-sm text-gray-500">Your exchange timeline will show up here.</p>
          </>
        )}
      </div>
    </div>
  )
}

