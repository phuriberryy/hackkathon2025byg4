import { useState, useEffect } from 'react'
import { X, User, Building2 } from 'lucide-react'

const faculties = [
  'คณะมนุษยศาสตร์',
  'คณะศึกษาศาสตร์',
  'คณะวิจิตรศิลป์',
  'คณะสังคมศาสตร์',
  'คณะวิทยาศาสตร์',
  'คณะวิศวกรรมศาสตร์',
  'คณะแพทยศาสตร์',
  'คณะเกษตรศาสตร์',
  'คณะทันตแพทยศาสตร์',
  'คณะเภสัชศาสตร์',
  'คณะเทคนิคการแพทย์',
  'คณะพยาบาลศาสตร์',
  'คณะอุตสาหกรรมเกษตร',
  'คณะสัตวแพทยศาสตร์',
  'คณะบริหารธุรกิจ',
  'คณะเศรษฐศาสตร์',
  'คณะสถาปัตยกรรมศาสตร์',
  'คณะการสื่อสารมวลชน',
  'คณะรัฐศาสตร์และรัฐประศาสนศาสตร์',
  'คณะนิติศาสตร์',
  'วิทยาลัยศิลปะ สื่อ และเทคโนโลยี',
  'วิทยาลัยนานาชาติ',
  'วิทยาลัยพหุวิทยาการและสหวิทยาการ',
]

export default function EditProfileModal({ isOpen, onClose, user, onUpdate }) {
  const [form, setForm] = useState({ name: '', faculty: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && user) {
      setForm({
        name: user.name || '',
        faculty: user.faculty || '',
      })
      setError('')
    }
  }, [isOpen, user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await onUpdate(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Edit Profile</h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
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

          {/* Faculty */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Faculty/Department
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Building2 size={18} />
              </div>
              <select
                name="faculty"
                value={form.faculty}
                onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 pr-10 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              >
                <option value="">Select Faculty/Department</option>
                {faculties.map((faculty) => (
                  <option key={faculty} value={faculty}>
                    {faculty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

