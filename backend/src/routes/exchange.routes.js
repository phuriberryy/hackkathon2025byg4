import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import {
  createExchangeRequest,
  getExchangeRequest,
  acceptExchangeRequestByOwner,
  acceptExchangeRequestByRequester,
  rejectExchangeRequest,
  getMyExchangeRequests,
} from '../controllers/exchangeController.js'

const router = Router()

// ต้อง authenticated ทุก route
router.use(authenticate)

// สร้างคำขอแลกเปลี่ยน
router.post(
  '/',
  [
    body('itemId').isUUID(),
    body('message').optional().isString(),
    body('requesterItemName').optional().isString(),
    body('requesterItemCategory').optional().isString(),
    body('requesterItemCondition').optional().isString(),
    body('requesterItemDescription').optional().isString(),
    body('requesterItemImageUrl').optional().isString(),
    body('requesterPickupLocation').optional().isString(),
  ],
  createExchangeRequest
)

// ดึงคำขอแลกเปลี่ยนที่เกี่ยวข้องกับผู้ใช้
router.get('/my-requests', getMyExchangeRequests)

// ดึงรายละเอียดคำขอแลกเปลี่ยน
router.get(
  '/:requestId',
  [param('requestId').isUUID()],
  getExchangeRequest
)

// เจ้าของโพสต์ยอมรับคำขอแลกเปลี่ยน
router.post(
  '/:requestId/accept-owner',
  [param('requestId').isUUID()],
  acceptExchangeRequestByOwner
)

// ผู้ขอแลกยอมรับคำขอแลกเปลี่ยน
router.post(
  '/:requestId/accept-requester',
  [param('requestId').isUUID()],
  acceptExchangeRequestByRequester
)

// ปฏิเสธคำขอแลกเปลี่ยน
router.post(
  '/:requestId/reject',
  [param('requestId').isUUID()],
  rejectExchangeRequest
)

export default router
