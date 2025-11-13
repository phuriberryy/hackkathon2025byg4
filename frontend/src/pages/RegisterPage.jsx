import { useState } from 'react'
import { Mail, Lock, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', faculty: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await register({ ...form })
      navigate('/')
    } catch (err) {
      setError(err.message || 'ไม่สามารถสมัครสมาชิกได้')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F0] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">สมัครสมาชิก</h1>
          <p className="mb-6 text-center text-sm text-gray-700">
            ใช้อีเมล @cmu.ac.th เพื่อยืนยันตัวตนนิสิต
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                ชื่อ-นามสกุล
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="ชื่อจริง"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">คณะ/หน่วยงาน</label>
              <input
                type="text"
                name="faculty"
                value={form.faculty}
                onChange={handleChange}
                placeholder="Faculty of Medicine"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">อีเมล CMU</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="student@cmu.ac.th"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">รหัสผ่าน</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary"
                >
                  {showPassword ? 'ซ่อน' : 'แสดง'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? 'กำลังสมัคร...' : 'สร้างบัญชี'}
            </button>
          </form>

          {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}

          <p className="mt-6 text-center text-sm text-gray-700">
            มีบัญชีอยู่แล้ว?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}




