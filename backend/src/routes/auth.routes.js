import { Router } from 'express'
import { body } from 'express-validator'
import { login, register } from '../controllers/authController.js'

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

export default router

