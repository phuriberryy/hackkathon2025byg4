import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import {
  createDonationRequest,
  getDonationRequest,
  acceptDonationRequestByOwner,
  acceptDonationRequestByRequester,
  rejectDonationRequest,
  getMyDonationRequests,
} from '../controllers/donationRequestController.js'

const router = Router()

router.use(authenticate)

// สร้างคำขอรับบริจาค
router.post(
  '/',
  [
    body('itemId').isUUID().withMessage('Item ID is required'),
    body('recipientName').trim().notEmpty().withMessage('Recipient name is required'),
    body('recipientContact').trim().notEmpty().withMessage('Recipient contact is required'),
    body('message').optional().isString(),
  ],
  createDonationRequest
)

// ดึงรายละเอียดคำขอรับบริจาค
router.get('/:requestId', getDonationRequest)

// เจ้าของโพสต์ยอมรับคำขอรับบริจาค
router.post('/:requestId/accept-owner', acceptDonationRequestByOwner)

// ผู้ขอรับบริจาคยอมรับคำขอ
router.post('/:requestId/accept-requester', acceptDonationRequestByRequester)

// ปฏิเสธคำขอรับบริจาค
router.post('/:requestId/reject', rejectDonationRequest)

// ดึงคำขอรับบริจาคที่เกี่ยวข้องกับผู้ใช้
router.get('/my/requests', getMyDonationRequests)

export default router

