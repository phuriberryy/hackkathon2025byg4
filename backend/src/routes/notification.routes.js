import { Router } from 'express'
import { param } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import {
  getNotifications,
  markNotificationsRead,
  markNotificationRead,
  getUnreadCount,
} from '../controllers/notificationController.js'

const router = Router()

// ต้อง authenticated ทุก route
router.use(authenticate)

// ดึง notifications ทั้งหมด
router.get('/', getNotifications)

// ดึงจำนวน notifications ที่ยังไม่อ่าน
router.get('/unread-count', getUnreadCount)

// ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
router.post('/read', markNotificationsRead)

// ทำเครื่องหมาย notification เดียวว่าอ่านแล้ว
router.post(
  '/:notificationId/read',
  [param('notificationId').isUUID()],
  markNotificationRead
)

export default router
