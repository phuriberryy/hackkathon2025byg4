import { useState } from 'react'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    if (!email.endsWith('@cmu.ac.th')) {
      setError('กรุณาใช้อีเมล @cmu.ac.th เท่านั้น')
      setSubmitting(false)
      return
    }

    try {
      await authApi.forgotPassword({ email })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้')
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
                ลืมรหัสผ่าน?
              </h1>
              <p className="mb-6 text-center text-sm text-gray-700">
                กรุณากรอกอีเมล CMU ของคุณ
                <br />
                เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้คุณ
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

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {submitting ? 'กำลังส่งอีเมล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
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
                ส่งอีเมลสำเร็จ!
              </h2>
              <p className="mb-6 text-sm text-gray-700">
                เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง
                <br />
                <span className="font-semibold text-primary">{email}</span>
                <br />
                <br />
                กรุณาตรวจสอบอีเมลของคุณและคลิกลิงก์เพื่อรีเซ็ตรหัสผ่าน
                <br />
                <span className="text-xs text-gray-500">
                  (ลิงก์จะหมดอายุใน 24 ชั่วโมง)
                </span>
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </button>
                <button
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  ส่งอีเมลอีกครั้ง
                </button>
              </div>
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

