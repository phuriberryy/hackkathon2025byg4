import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import {
  createChat,
  getChatMessages,
  getChats,
  acceptChat,
  declineChat,
  confirmChatQr,
} from '../controllers/chatController.js'

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

router.patch('/:chatId/accept', [param('chatId').isUUID()], acceptChat)
router.patch('/:chatId/decline', [param('chatId').isUUID()], declineChat)
router.post(
  '/:chatId/confirm',
  [param('chatId').isUUID(), body('code').isString().notEmpty()],
  confirmChatQr
)

export default router





