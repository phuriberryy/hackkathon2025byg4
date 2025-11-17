import { useState, useEffect } from 'react'
import { Mail, Lock, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', faculty: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { register, token, loading } = useAuth()

  // If logged in, redirect to home page
  useEffect(() => {
    if (!loading && token) {
      navigate('/', { replace: true })
    }
  }, [token, loading, navigate])

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
      // Redirect to login page after successful registration
      navigate('/login', { 
        replace: true,
        state: { message: 'Registration successful! Please log in to continue.' }
      })
    } catch (err) {
      setError(err.message || 'Failed to sign up')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F0] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Sign Up</h1>
          <p className="mb-6 text-center text-sm text-gray-700">
            Use @cmu.ac.th email to verify student identity
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Full Name
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
                  placeholder="Your name"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Faculty/Department</label>
              <select
                name="faculty"
                value={form.faculty}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              >
                <option value="">Select Faculty/Department</option>
                <option value="คณะมนุษยศาสตร์">คณะมนุษยศาสตร์</option>
                <option value="คณะศึกษาศาสตร์">คณะศึกษาศาสตร์</option>
                <option value="คณะวิจิตรศิลป์">คณะวิจิตรศิลป์</option>
                <option value="คณะสังคมศาสตร์">คณะสังคมศาสตร์</option>
                <option value="คณะวิทยาศาสตร์">คณะวิทยาศาสตร์</option>
                <option value="คณะวิศวกรรมศาสตร์">คณะวิศวกรรมศาสตร์</option>
                <option value="คณะแพทยศาสตร์">คณะแพทยศาสตร์</option>
                <option value="คณะเกษตรศาสตร์">คณะเกษตรศาสตร์</option>
                <option value="คณะทันตแพทยศาสตร์">คณะทันตแพทยศาสตร์</option>
                <option value="คณะเภสัชศาสตร์">คณะเภสัชศาสตร์</option>
                <option value="คณะเทคนิคการแพทย์">คณะเทคนิคการแพทย์</option>
                <option value="คณะพยาบาลศาสตร์">คณะพยาบาลศาสตร์</option>
                <option value="คณะอุตสาหกรรมเกษตร">คณะอุตสาหกรรมเกษตร</option>
                <option value="คณะสัตวแพทยศาสตร์">คณะสัตวแพทยศาสตร์</option>
                <option value="คณะบริหารธุรกิจ">คณะบริหารธุรกิจ</option>
                <option value="คณะเศรษฐศาสตร์">คณะเศรษฐศาสตร์</option>
                <option value="คณะสถาปัตยกรรมศาสตร์">คณะสถาปัตยกรรมศาสตร์</option>
                <option value="คณะการสื่อสารมวลชน">คณะการสื่อสารมวลชน</option>
                <option value="คณะรัฐศาสตร์และรัฐประศาสนศาสตร์">คณะรัฐศาสตร์และรัฐประศาสนศาสตร์</option>
                <option value="คณะนิติศาสตร์">คณะนิติศาสตร์</option>
                <option value="วิทยาลัยศิลปะ สื่อ และเทคโนโลยี">วิทยาลัยศิลปะ สื่อ และเทคโนโลยี</option>
                <option value="วิทยาลัยนานาชาติ">วิทยาลัยนานาชาติ</option>
                <option value="วิทยาลัยพหุวิทยาการและสหวิทยาการ">วิทยาลัยพหุวิทยาการและสหวิทยาการ</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">CMU Account</label>
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
              <label className="mb-2 block text-sm font-semibold text-gray-900">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? 'Signing up...' : 'Create Account'}
            </button>
          </form>

          {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}

          <p className="mt-6 text-center text-sm text-gray-700">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}




