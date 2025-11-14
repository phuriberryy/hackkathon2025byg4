import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getProfile,
  getMyItems,
  getExchangeHistory,
  updateProfile,
} from '../controllers/profileController.js'

const router = Router()

// ต้อง authenticated ทุก route
router.use(authenticate)

// ดึงข้อมูล profile และ statistics
router.get('/', getProfile)

// อัปเดต profile
router.put('/', updateProfile)

// ดึง items ที่ผู้ใช้โพสต์
router.get('/items', getMyItems)

// ดึงประวัติการแลกเปลี่ยน
router.get('/exchange-history', getExchangeHistory)

export default router





