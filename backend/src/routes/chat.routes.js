import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { createChat, getChatMessages, getChats } from '../controllers/chatController.js'

const router = Router()

router.get('/', authenticate, getChats)
router.get('/:chatId/messages', authenticate, [param('chatId').isUUID()], getChatMessages)
router.post(
  '/',
  authenticate,
  [
    body('participantId')
      .optional()
      .isUUID()
      .custom((value, { req }) => {
        if (!value && !req.body.participantEmail) {
          throw new Error('participantId or participantEmail is required')
        }
        return true
      }),
    body('participantEmail').optional().isEmail(),
    body('itemId').optional().isUUID(),
  ],
  createChat
)

export default router





