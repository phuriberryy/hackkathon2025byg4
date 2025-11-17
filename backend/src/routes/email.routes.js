import { Router } from 'express'
import { body } from 'express-validator'
import {
  testEmail,
  testExchangeRequestEmail,
  testExchangeAcceptedEmail,
  testExchangeCompletedEmail,
} from '../controllers/emailController.js'

const router = Router()

// ทดสอบการส่งอีเมลทั่วไป
router.post(
  '/test',
  [
    body('to').isEmail().withMessage('Valid email required'),
    body('subject').optional().isString(),
    body('html').optional().isString(),
  ],
  testEmail
)

// ทดสอบการส่งอีเมลแจ้งเตือนคำขอแลกเปลี่ยน
router.post(
  '/test-exchange-request',
  [body('to').isEmail().withMessage('Valid email required')],
  testExchangeRequestEmail
)

// ทดสอบการส่งอีเมลแจ้งเตือนการยอมรับคำขอแลกเปลี่ยน
router.post(
  '/test-exchange-accepted',
  [body('to').isEmail().withMessage('Valid email required')],
  testExchangeAcceptedEmail
)

// ทดสอบการส่งอีเมลแจ้งเตือนการแลกเปลี่ยนสำเร็จ
router.post(
  '/test-exchange-completed',
  [body('to').isEmail().withMessage('Valid email required')],
  testExchangeCompletedEmail
)

export default router











