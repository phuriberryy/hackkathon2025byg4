import { useState, useEffect } from 'react'
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../lib/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน กรุณาใช้ลิงก์จากอีเมล')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    if (!token) {
      setError('ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน')
      setSubmitting(false)
      return
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      setSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      setSubmitting(false)
      return
    }

    try {
      await authApi.resetPassword({ token, password })
      setSuccess(true)
      // Redirect ไปหน้า login หลังจาก 3 วินาที
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F0] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          {/* Back Button */}
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={18} />
            <span>กลับไปหน้าเข้าสู่ระบบ</span>
          </Link>

          {!success ? (
            <>
              <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
                รีเซ็ตรหัสผ่าน
              </h1>
              <p className="mb-6 text-center text-sm text-gray-700">
                กรุณากรอกรหัสผ่านใหม่ของคุณ
              </p>

              {!token && (
                <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน กรุณาใช้ลิงก์จากอีเมล</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password Input */}
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
                    ยืนยันรหัสผ่านใหม่
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

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !token}
                  className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {submitting ? 'กำลังรีเซ็ตรหัสผ่าน...' : 'รีเซ็ตรหัสผ่าน'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                รีเซ็ตรหัสผ่านสำเร็จ!
              </h2>
              <p className="mb-6 text-sm text-gray-700">
                คุณได้รีเซ็ตรหัสผ่านสำเร็จแล้ว
                <br />
                กำลังนำคุณไปหน้าเข้าสู่ระบบ...
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark"
              >
                ไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          )}

          {/* Separator */}
          {!success && (
            <>
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-sm text-gray-500">หรือ</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Back to Login Link */}
              <p className="text-center text-sm text-gray-700">
                จำรหัสผ่านได้แล้ว?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary hover:underline"
                >
                  เข้าสู่ระบบ
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

