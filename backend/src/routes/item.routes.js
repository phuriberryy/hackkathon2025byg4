import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getUserItems,
} from '../controllers/itemController.js'

const router = Router()

// Public routes
router.get('/', getItems)
router.get('/:itemId', [param('itemId').isUUID()], getItemById)

// Protected routes
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

router.put(
  '/:itemId',
  authenticate,
  [
    param('itemId').isUUID(),
    body('title').optional().isLength({ min: 3 }),
    body('category').optional().notEmpty(),
    body('itemCondition').optional().notEmpty(),
    body('lookingFor').optional().isString(),
    body('description').optional().isString(),
    body('availableUntil').optional().isISO8601(),
    body('imageUrl').optional().isString(),
    body('pickupLocation').optional().isString(),
    body('status').optional().isIn(['active', 'inactive', 'exchanged', 'deleted']),
  ],
  updateItem
)

router.delete(
  '/:itemId',
  authenticate,
  [param('itemId').isUUID()],
  deleteItem
)

router.get(
  '/user/:userId',
  authenticate,
  [param('userId').isUUID()],
  getUserItems
)

export default router
