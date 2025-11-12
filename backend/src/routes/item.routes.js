import { Router } from 'express'
import { body } from 'express-validator'
import { getItems, createItem } from '../controllers/itemController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', getItems)

router.post(
  '/',
  authenticate,
  [
    body('title').isLength({ min: 3 }),
    body('category').notEmpty(),
    body('itemCondition').notEmpty(),
    body('lookingFor').optional().isString(),
    body('description').optional().isString(),
    body('availableUntil').optional().isISO8601(),
    body('imageUrl').optional().isString(),
    body('pickupLocation').optional().isString(),
  ],
  createItem
)

export default router

