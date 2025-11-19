import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { createDonation, receiveDonation, getMyDonations, getAllDonations } from '../controllers/donationController.js'

const router = Router()

// ต้อง authenticated ทุก route
router.use(authenticate)

// สร้างการบริจาค
router.post(
  '/',
  [
    body('itemId').notEmpty().withMessage('Item ID is required'),
    body('recipientName').optional().isString(),
    body('recipientContact').optional().isString(),
    body('donationLocation').optional().isString(),
    body('message').optional().isString(),
  ],
  createDonation
)

// รับบริจาค (สำหรับคนอื่นที่เห็นของบริจาค)
router.post(
  '/receive',
  [
    body('itemId').isUUID().withMessage('Item ID is required'),
  ],
  receiveDonation
)

// ดึงประวัติการบริจาคของผู้ใช้
router.get('/my-donations', getMyDonations)

// ดึงสถิติการบริจาคทั้งหมด (public)
router.get('/statistics', getAllDonations)

export default router

