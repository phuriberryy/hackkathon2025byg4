import { validationResult } from 'express-validator'
import { query } from '../db/pool.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signToken } from '../utils/token.js'
import { sendEmail } from '../utils/email.js'

export const register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, email, password, faculty } = req.body

  if (!email.endsWith('@cmu.ac.th')) {
    return res.status(400).json({ message: 'Only cmu.ac.th emails are allowed' })
  }

  const existing = await query('SELECT id FROM users WHERE email=$1', [email])
  if (existing.rowCount) {
    return res.status(409).json({ message: 'Email already registered' })
  }

  const passwordHash = await hashPassword(password)
  const result = await query(
    `INSERT INTO users (name, faculty, email, password_hash)
     VALUES ($1,$2,$3,$4)
     RETURNING id, name, faculty, email, created_at`,
    [name, faculty, email, passwordHash]
  )

  const user = result.rows[0]
  const token = signToken({ id: user.id, email: user.email, name: user.name })

  await sendEmail({
    to: user.email,
    subject: 'Welcome to CMU ShareCycle',
    html: `<p>สวัสดี ${user.name},</p><p>บัญชีของคุณพร้อมใช้งานแล้ว เริ่มแลกเปลี่ยนเพื่อช่วยลดขยะกันเลย!</p>`,
  })

  return res.status(201).json({ user, token })
}

export const login = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body
  const result = await query('SELECT * FROM users WHERE email=$1', [email])
  if (!result.rowCount) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const user = result.rows[0]
  const valid = await comparePassword(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name })

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      faculty: user.faculty,
      email: user.email,
      created_at: user.created_at,
    },
    token,
  })
}

