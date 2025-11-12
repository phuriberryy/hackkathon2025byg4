import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('student@cmu.ac.th')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login:', { email, password, rememberMe })
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
              <Link
                to="#"
                className="text-sm font-semibold text-primary hover:underline"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark"
            >
              เข้าสู่ระบบ
            </button>
          </form>

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
              to="#"
              className="font-semibold text-primary hover:underline"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
