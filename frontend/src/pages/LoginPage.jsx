import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/ui/Modal'
import { authApi } from '../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('student@cmu.ac.th')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  // Forgot password modal state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'ไม่สามารถเข้าสู่ระบบได้')
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPasswordClick = (e) => {
    e.preventDefault()
    setForgotPasswordOpen(true)
    setResetEmail('')
    setNewPassword('')
    setConfirmPassword('')
    setResetError('')
    setResetSuccess(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setResetting(true)
    setResetError('')
    setResetSuccess(false)

    if (newPassword !== confirmPassword) {
      setResetError('รหัสผ่านไม่ตรงกัน')
      setResetting(false)
      return
    }

    if (newPassword.length < 6) {
      setResetError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      setResetting(false)
      return
    }

    try {
      await authApi.resetPasswordDirect({ email: resetEmail, password: newPassword })
      setResetSuccess(true)
      setTimeout(() => {
        setForgotPasswordOpen(false)
        setResetSuccess(false)
        setResetEmail('')
        setNewPassword('')
        setConfirmPassword('')
      }, 2000)
    } catch (err) {
      setResetError(err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F0] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            เข้าสู่ระบบ
          </h1>
          <p className="mb-6 text-center text-sm text-gray-700">
            กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                อีเมล CMU
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@cmu.ac.th"
                  className="w-full rounded-xl border-0 bg-[#E8F4EA] px-4 py-3 pl-10 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>จดจำฉันไว้</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-sm font-semibold text-primary hover:underline"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
          {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}

          {/* Separator */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm text-gray-500">หรือ</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Registration Link */}
          <p className="text-center text-sm text-gray-700">
            ยังไม่มีบัญชี?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        open={forgotPasswordOpen}
        onClose={() => {
          setForgotPasswordOpen(false)
          setResetError('')
          setResetSuccess(false)
        }}
        title="ลืมรหัสผ่าน?"
        subtitle="กรุณากรอกอีเมล CMU และรหัสผ่านใหม่ของคุณ"
      >
        {resetSuccess ? (
          <div className="rounded-xl bg-green-50 p-4 text-center">
            <p className="text-sm font-semibold text-green-800">
              รีเซ็ตรหัสผ่านสำเร็จ!
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                อีเมล CMU
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="student@cmu.ac.th"
                  className="w-full rounded-xl border-0 bg-[#E8F4EA] px-4 py-3 pl-10 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  required
                />
              </div>
            </div>

            {/* New Password Input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {resetError && (
              <p className="text-center text-sm text-red-500">{resetError}</p>
            )}

            {/* Reset Button */}
            <button
              type="submit"
              disabled={resetting}
              className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark disabled:opacity-60"
            >
              {resetting ? 'กำลังรีเซ็ตรหัสผ่าน...' : 'รีเซ็ตรหัสผ่าน'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  )
}

