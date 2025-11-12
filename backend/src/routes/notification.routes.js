import { Router } from 'express'
import { getNotifications, markNotificationsRead } from '../controllers/notificationController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, getNotifications)
router.post('/read', authenticate, markNotificationsRead)

export default router

