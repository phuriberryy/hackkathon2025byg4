import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimiter.js'
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getUserItems,
  getItemExchangeRequests,
} from '../controllers/itemController.js'

const router = Router()

// Public routes
router.get('/', getItems)

// Specific routes must come before parameterized routes
router.get(
  '/user/:userId',
  authenticate,
  [param('userId').isUUID()],
  getUserItems
)

router.get(
  '/:itemId/exchange-requests',
  authenticate,
  [param('itemId').isUUID()],
  getItemExchangeRequests
)

// Parameterized routes (must be last)
router.get('/:itemId', [param('itemId').isUUID()], getItemById)

// Protected routes
// Rate limit: 5 posts per hour per user
const postItemRateLimit = createRateLimiter(5, 60 * 60 * 1000) // 5 requests per hour

router.post(
  '/',
  authenticate,
  postItemRateLimit,
  [
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['Clothes & Fashion', 'Dorm Essentials', 'Books & Study', 'Kitchen & Appliances', 'Cleaning & Laundry', 'Hobbies & Entertainment', 'Sports Gear', 'Others'])
      .withMessage('Invalid category'),
    body('itemCondition')
      .notEmpty()
      .withMessage('Item condition is required')
      .isIn(['Like New', 'Good', 'Fair'])
      .withMessage('Invalid item condition'),
    body('lookingFor')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Looking for must not exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('availableUntil')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('imageUrl')
      .optional()
      .isString()
      .withMessage('Invalid image URL'),
    body('pickupLocation')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Pickup location must not exceed 100 characters'),
  ],
  createItem
)

// Rate limit: 10 updates per hour per user
const updateItemRateLimit = createRateLimiter(10, 60 * 60 * 1000)

router.put(
  '/:itemId',
  authenticate,
  updateItemRateLimit,
  [
    param('itemId').isUUID(),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('category')
      .optional()
      .notEmpty()
      .withMessage('Category cannot be empty')
      .isIn(['Clothes & Fashion', 'Dorm Essentials', 'Books & Study', 'Kitchen & Appliances', 'Cleaning & Laundry', 'Hobbies & Entertainment', 'Sports Gear', 'Others']),
    body('itemCondition')
      .optional()
      .notEmpty()
      .withMessage('Item condition cannot be empty')
      .isIn(['Like New', 'Good', 'Fair']),
    body('lookingFor')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Looking for must not exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('availableUntil')
      .optional()
      .isISO8601(),
    body('imageUrl')
      .optional()
      .isString(),
    body('pickupLocation')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Pickup location must not exceed 100 characters'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'exchanged', 'deleted']),
  ],
  updateItem
)

router.delete(
  '/:itemId',
  authenticate,
  [param('itemId').isUUID()],
  deleteItem
)

export default router
