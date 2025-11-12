import { Router } from 'express'
import { body } from 'express-validator'
import { createExchangeRequest } from '../controllers/exchangeController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post(
  '/',
  authenticate,
  [body('itemId').isUUID(), body('message').optional().isString()],
  createExchangeRequest
)

export default router

