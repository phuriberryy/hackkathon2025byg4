import { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../lib/api'

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  // For forgot password (request reset)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // For reset password
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  // If token exists, show reset password form
  const isResetMode = !!token

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      await authApi.forgotPassword({ email })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งอีเมล')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setResetting(true)
    setResetError('')
    setResetSuccess(false)

    if (password !== confirmPassword) {
      setResetError('รหัสผ่านไม่ตรงกัน')
      setResetting(false)
      return
    }

    if (password.length < 6) {
      setResetError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      setResetting(false)
      return
    }

    try {
      await authApi.resetPassword({ token, password })
      setResetSuccess(true)
      setTimeout(() => {
        navigate('/login')
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
          {isResetMode ? (
            // Reset Password Form
            <>
              <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
                รีเซ็ตรหัสผ่าน
              </h1>
              <p className="mb-6 text-center text-sm text-gray-700">
                กรุณากรอกรหัสผ่านใหม่ของคุณ
              </p>

              {resetSuccess ? (
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <p className="text-sm font-semibold text-green-800">
                    รีเซ็ตรหัสผ่านสำเร็จ! กำลังนำคุณไปหน้าเข้าสู่ระบบ...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
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
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                        required
                        minLength={6}
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

              {resetError && (
                <p className="mt-4 text-center text-sm text-red-500">{resetError}</p>
              )}

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <ArrowLeft size={16} />
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>
            </>
          ) : (
            // Forgot Password Form
            <>
              <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
                ลืมรหัสผ่าน?
              </h1>
              <p className="mb-6 text-center text-sm text-gray-700">
                กรุณากรอกอีเมล CMU ของคุณ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ
              </p>

              {success ? (
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <p className="text-sm font-semibold text-green-800">
                    เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว
                  </p>
                  <p className="mt-2 text-xs text-green-700">
                    กรุณาตรวจสอบอีเมลและคลิกที่ลิงก์เพื่อรีเซ็ตรหัสผ่านของคุณ
                  </p>
                  <Link
                    to="/login"
                    className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    กลับไปหน้าเข้าสู่ระบบ
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark disabled:opacity-60"
                  >
                    {submitting ? 'กำลังส่งอีเมล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                  </button>
                </form>
              )}

              {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <ArrowLeft size={16} />
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

