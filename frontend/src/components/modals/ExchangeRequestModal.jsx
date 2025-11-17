import { useState } from 'react'
import { CheckCircle, Image as ImageIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal'
import { exchangeApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function ExchangeRequestModal({ open, onClose, itemId }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    condition: '',
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
      alert('Please log in before sending exchange request')
      return
    }
    if (!itemId) {
      alert('Item not found. Please try again')
      return
    }

    // Validate form fields
    if (!formData.itemName.trim()) {
      alert('Please enter your item name')
      return
    }
    if (!formData.category) {
      alert('Please select category')
      return
    }
    if (!formData.condition) {
      alert('Please select condition')
      return
    }
    if (!formData.description.trim()) {
      alert('Please enter item description')
      return
    }

    setSubmitting(true)
    try {
      // Convert image to base64 if exists
      let imageUrl = null
      if (imagePreview) {
        imageUrl = imagePreview // imagePreview is already base64 from FileReader
      }

      const payload = {
        itemId,
        message: message || undefined,
        requesterItemName: formData.itemName || undefined,
        requesterItemCategory: formData.category || undefined,
        requesterItemCondition: formData.condition || undefined,
        requesterItemDescription: formData.description || undefined,
        requesterItemImageUrl: imageUrl || undefined,
      }

      await exchangeApi.request(token, payload)
      alert('Exchange request sent successfully')
      onClose()
      setFormData({
        itemName: '',
        category: '',
        condition: '',
        description: '',
      })
      setMessage('')
      setImagePreview(null)
    } catch (err) {
      console.error('Exchange request error:', err)
      let errorMsg = err.message || (err.errors && JSON.stringify(err.errors)) || 'Failed to send request'
      
      // แปลง error message เป็นภาษาไทย
      if (errorMsg.includes('You cannot exchange your own item')) {
        errorMsg = 'You cannot exchange your own item'
      } else if (errorMsg.includes('already exists') || errorMsg.includes('already sent')) {
        errorMsg = 'You have already sent an exchange request for this item'
      }
      
      // ถ้ามี existingRequestId แสดงข้อความและถามว่าต้องการดูคำขอที่มีอยู่หรือไม่
      if (err.existingRequestId) {
        const shouldView = window.confirm(
          errorMsg + '\n\nDo you want to view the existing request?'
        )
        if (shouldView) {
          onClose()
          navigate(`/exchange/${err.existingRequestId}`)
        }
      } else {
        alert('Failed to send exchange request: ' + errorMsg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const categoryOptions = [
    { value: '', label: 'Select category' },
    { value: 'Clothes & Fashion', label: '👕 Clothes & Fashion (เสื้อผ้า, กางเกง, รองเท้า)' },
    { value: 'Dorm Essentials', label: '🏡 Dorm Essentials (หม้อหุงข้าว, ราวตากผ้า, ผ้าห่ม)' },
    { value: 'Books & Study', label: '📚 Books & Study (ตำราเรียน, สมุด, ไฟอ่านหนังสือ)' },
    { value: 'Kitchen & Appliances', label: '🍳 Kitchen & Appliances (กระทะ, เขียง, หม้อทอด)' },
    { value: 'Cleaning & Laundry', label: '🧼 Cleaning & Laundry (น้ำยาซักผ้า, ไม้ถูพื้น, ไม้กวาด)' },
    { value: 'Hobbies & Entertainment', label: '🎮 Hobbies & Entertainment (บอร์ดเกม, กีตาร์, ของสะสม)' },
    { value: 'Sports Gear', label: '🏀 Sports Gear (รองเท้ากีฬา, ลูกบอล, เสื่อโยคะ)' },
    { value: 'Others', label: '✨ Others (อื่น ๆ)' },
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
      title="Request Exchange"
      subtitle="Send Exchange Request"
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
            {submitting ? 'Sending...' : 'Send Exchange Request'}
          </button>
        </div>
      </form>
    </Modal>
  )
}







