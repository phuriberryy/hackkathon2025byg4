import { Router } from 'express'
import { body } from 'express-validator'
import { login, register, forgotPassword, resetPassword } from '../controllers/authController.js'

const router = Router()

router.post(
  '/register',
  [
    body('name').isLength({ min: 2 }).withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }),
    body('faculty').optional().isString(),
  ],
  register
)

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  login
)

router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email required'),
  ],
  forgotPassword
)

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  resetPassword
)

export default router







