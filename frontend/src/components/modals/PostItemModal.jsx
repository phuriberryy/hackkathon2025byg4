import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import Modal from '../ui/Modal'
import { itemsApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function PostItemModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    condition: '',
    lookingFor: '',
    availableUntil: '',
    pickupLocation: '',
    description: '',
    listingType: 'exchange', // 'exchange' or 'donation'
  })
  const [imagePreview, setImagePreview] = useState(null)
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
      alert('Please log in before posting item')
      return
    }
    // Validate required fields
    if (!imagePreview) {
      alert('Please upload an image')
      return
    }
    if (!formData.itemName || !formData.category || !formData.condition) {
      alert('Please fill in all required fields')
      return
    }
    // Validate lookingFor only for exchange type
    if (formData.listingType === 'exchange' && !formData.lookingFor) {
      alert('Please specify what you are looking for in exchange')
      return
    }
    setSubmitting(true)
    try {
      await itemsApi.create(token, {
        title: formData.itemName,
        category: formData.category,
        itemCondition: formData.condition,
        lookingFor: formData.lookingFor,
        description: formData.description,
        availableUntil: formData.availableUntil,
        imageUrl: imagePreview,
        pickupLocation: formData.pickupLocation,
        listingType: formData.listingType,
      })
      onSuccess?.()
      onClose()
      setFormData({
        itemName: '',
        category: '',
        condition: '',
        lookingFor: '',
        availableUntil: '',
        pickupLocation: '',
        description: '',
        listingType: 'exchange',
      })
      setImagePreview(null)
    } catch (err) {
      alert(err.message || 'Failed to post')
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
      title={formData.listingType === 'donation' ? 'Post Item for Donation' : 'Post Item for Exchange'}
      subtitle={formData.listingType === 'donation' ? 'Post an item you want to donate to CMU students' : 'Post an item you want to exchange with CMU students'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Listing Type Selection */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-900">
            Listing Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, listingType: 'exchange' }))}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                formData.listingType === 'exchange'
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              🔄 Exchange
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, listingType: 'donation' }))}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                formData.listingType === 'donation'
                  ? 'border-red-500 bg-red-500 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              ❤️ Donation
            </button>
          </div>
        </div>
        {/* Image Upload */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-900">
            Upload Image <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
            name="image"
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
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleInputChange}
            placeholder="e.g., Calculus Textbook"
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

        {/* Looking to Exchange For - Only show for exchange type */}
        {formData.listingType === 'exchange' && (
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Looking to Exchange For <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lookingFor"
              value={formData.lookingFor}
              onChange={handleInputChange}
              placeholder="e.g., Laptop stand, Kitchen utensils, Study desk"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Let others know what you're looking for in exchange.
            </p>
          </div>
        )}

        {/* Expiration Date */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-900">
            Post Expiration Date <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <input
              type="date"
              name="availableUntil"
              value={formData.availableUntil}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Set the date when this post will expire (when expired, the system will automatically keep it in history)
          </p>
        </div>

        {/* Pickup Location */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-900">
            Pickup Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="pickupLocation"
            value={formData.pickupLocation}
            onChange={handleInputChange}
            placeholder="e.g., Engineering Building, Library 1st floor"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Specify where people can meet you to exchange/pick up the item.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-900">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your item, its features, why you're sharing it..."
            rows={4}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 resize-none"
            required
          />
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
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary-dark transition disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Post Item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}





