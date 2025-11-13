import { validationResult } from 'express-validator'
import { query } from '../db/pool.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signToken } from '../utils/token.js'
import { sendEmail } from '../utils/email.js'
import crypto from 'crypto'

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

  // await sendEmail({
  //   to: user.email,
  //   subject: 'Welcome to CMU ShareCycle',
  //   html: `<p>สวัสดี ${user.name},</p><p>บัญชีของคุณพร้อมใช้งานแล้ว เริ่มแลกเปลี่ยนเพื่อช่วยลดขยะกันเลย!</p>`,
  // })

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

export const forgotPassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email } = req.body

  if (!email.endsWith('@cmu.ac.th')) {
    return res.status(400).json({ message: 'Only cmu.ac.th emails are allowed' })
  }

  const result = await query('SELECT id, name FROM users WHERE email=$1', [email])
  if (!result.rowCount) {
    // Don't reveal if email exists or not for security
    return res.json({ message: 'If the email exists, a password reset link has been sent' })
  }

  const user = result.rows[0]
  
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

  // Delete any existing tokens for this user
  await query('DELETE FROM password_reset_tokens WHERE user_id=$1', [user.id])

  // Insert new token
  await query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, resetToken, expiresAt]
  )

  // Send email with reset link
  const resetUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/forgot-password?token=${resetToken}`
  
  try {
    await sendEmail({
      to: email,
      subject: 'รีเซ็ตรหัสผ่าน CMU ShareCycle',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2D7D3F;">รีเซ็ตรหัสผ่าน</h2>
          <p>สวัสดี ${user.name},</p>
          <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชี CMU ShareCycle ของคุณ</p>
          <p>กรุณาคลิกที่ลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่านของคุณ:</p>
          <p style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #2D7D3F; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              รีเซ็ตรหัสผ่าน
            </a>
          </p>
          <p>หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            <strong>หมายเหตุ:</strong> ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง<br>
            หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้
          </p>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            CMU ShareCycle - Green Campus
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send reset email:', err)
    // Still return success to not reveal if email exists
  }

  return res.json({ message: 'If the email exists, a password reset link has been sent' })
}

export const resetPassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { token, password } = req.body

  // Find token
  const tokenResult = await query(
    'SELECT * FROM password_reset_tokens WHERE token=$1 AND used=FALSE AND expires_at > NOW()',
    [token]
  )

  if (!tokenResult.rowCount) {
    return res.status(400).json({ message: 'Invalid or expired reset token' })
  }

  const resetToken = tokenResult.rows[0]

  // Hash new password
  const passwordHash = await hashPassword(password)

  // Update user password
  await query('UPDATE users SET password_hash=$1 WHERE id=$2', [
    passwordHash,
    resetToken.user_id,
  ])

  // Mark token as used
  await query('UPDATE password_reset_tokens SET used=TRUE WHERE id=$1', [
    resetToken.id,
  ])

  return res.json({ message: 'Password has been reset successfully' })
}

export const resetPasswordDirect = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body

  if (!email.endsWith('@cmu.ac.th')) {
    return res.status(400).json({ message: 'Only cmu.ac.th emails are allowed' })
  }

  // Find user by email
  const userResult = await query('SELECT id FROM users WHERE email=$1', [email])
  if (!userResult.rowCount) {
    return res.status(404).json({ message: 'User not found' })
  }

  const user = userResult.rows[0]

  // Hash new password
  const passwordHash = await hashPassword(password)

  // Update user password
  await query('UPDATE users SET password_hash=$1 WHERE id=$2', [
    passwordHash,
    user.id,
  ])

  return res.json({ message: 'Password has been reset successfully' })
}

