import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { createChat, getChatMessages, getChats } from '../controllers/chatController.js'

const router = Router()

router.use(authenticate)

router.get('/', getChats)
router.get('/:chatId/messages', [param('chatId').isUUID()], getChatMessages)
router.post(
  '/',
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
    body('exchangeRequestId').optional().isUUID(),
  ],
  createChat
)

export default router