import { useState } from 'react'
import { CheckCircle, Image as ImageIcon } from 'lucide-react'
import Modal from '../ui/Modal'
import { exchangeApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function ExchangeRequestModal({ open, onClose, itemId }) {
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    condition: '',
    pickupLocation: '',
    description: '',
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [includeMessage, setIncludeMessage] = useState(true)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { token } = useAuth()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      alert('กรุณาเข้าสู่ระบบก่อนส่งคำขอแลกเปลี่ยน')
      return
    }
    if (!itemId) return
    setSubmitting(true)
    try {
      await exchangeApi.request(token, { itemId, message })
      onClose()
      setFormData({
        itemName: '',
        category: '',
        condition: '',
        pickupLocation: '',
        description: '',
      })
      setMessage('')
      setImagePreview(null)
    } catch (err) {
      alert(err.message || 'ไม่สามารถส่งคำขอได้')
    } finally {
      setSubmitting(false)
    }
  }

  const categoryOptions = [
    { value: '', label: 'Select category' },
    { value: 'Books & Textbooks', label: 'Books & Textbooks' },
    { value: 'Clothes', label: 'Clothes' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Dorm Items', label: 'Dorm Items' },
    { value: 'Sports Equipment', label: 'Sports Equipment' },
    { value: 'Eco Items', label: 'Eco Items' },
  ]

  const conditionOptions = [
    { value: '', label: 'Select condition' },
    { value: 'Like New', label: 'Like New' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ขอแลกเปลี่ยน"
      subtitle="ส่งคำขอแลกเปลี่ยน"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-900">
            Upload Image of Your Item <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
            required
          />
          <label
            htmlFor="image-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center transition hover:border-primary hover:bg-primary/5"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="h-48 w-full rounded-lg object-cover"
              />
            ) : (
              <>
                <ImageIcon className="mb-3 text-gray-400" size={48} />
                <p className="mb-1 text-sm font-medium text-gray-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </>
            )}
          </label>
        </div>

        {/* Item Name */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-900">
            Your Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleInputChange}
            placeholder="e.g., Study Desk"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
            required
          />
        </div>

        {/* Category and Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              required
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Condition <span className="text-red-500">*</span>
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              required
            >
              {conditionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pickup Location */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-900">
            Your Pickup Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="pickupLocation"
            value={formData.pickupLocation}
            onChange={handleInputChange}
            placeholder="e.g., Engineering Building"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-900">
            Describe Your Item <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Tell them about your item and why it's a good exchange..."
            rows={4}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 resize-none"
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <input
              type="checkbox"
              checked={includeMessage}
              onChange={(e) => setIncludeMessage(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>Message to seller</span>
          </label>
          {includeMessage && (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself and explain why this would be a good exchange..."
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 resize-none"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary-dark transition disabled:opacity-60"
          >
            <CheckCircle size={18} />
            {submitting ? 'กำลังส่ง...' : 'Send Exchange Request'}
          </button>
        </div>
      </form>
    </Modal>
  )
}




