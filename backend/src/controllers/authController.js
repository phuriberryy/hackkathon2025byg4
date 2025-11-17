import { validationResult } from 'express-validator'
import { randomBytes } from 'crypto'
import { query } from '../db/pool.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signToken } from '../utils/token.js'
import { sendEmail } from '../utils/email.js'
import env from '../config/env.js'

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

  // await sendEmail({
  //   to: user.email,
  //   subject: 'Welcome to CMU ShareCycle',
  //   html: `<p>สวัสดี ${user.name},</p><p>บัญชีของคุณพร้อมใช้งานแล้ว เริ่มแลกเปลี่ยนเพื่อช่วยลดขยะกันเลย!</p>`,
  // })

  return res.status(201).json({ 
    message: 'Registration successful. Please log in to continue.',
    user: {
      id: user.id,
      name: user.name,
      faculty: user.faculty,
      email: user.email,
      created_at: user.created_at,
    }
  })
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

// ลืมรหัสผ่าน - ส่งอีเมลรีเซ็ตรหัสผ่าน
export const forgotPassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email } = req.body

  if (!email.endsWith('@cmu.ac.th')) {
    return res.status(400).json({ message: 'Only cmu.ac.th emails are allowed' })
  }

  try {
    // ตรวจสอบว่ามี user นี้หรือไม่
    const userResult = await query('SELECT id, name, email FROM users WHERE email=$1', [email])
    
    // เพื่อความปลอดภัย เราไม่บอกว่า email ไม่มีในระบบ
    // แต่ถ้ามี user จริงๆ เราจะส่งอีเมล
    if (userResult.rowCount > 0) {
      const user = userResult.rows[0]
      
      // สร้าง reset token
      const resetToken = randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // หมดอายุใน 24 ชั่วโมง
      
      // ลบ token เก่าที่ยังไม่ใช้
      await query(
        'DELETE FROM password_reset_tokens WHERE user_id=$1 AND used=FALSE',
        [user.id]
      )
      
      // เก็บ token ใหม่
      await query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, resetToken, expiresAt]
      )
      
      // สร้าง reset link
      const resetLink = `${env.clientOrigin}/reset-password?token=${resetToken}`
      
      // ส่งอีเมล
      try {
        await sendEmail({
          to: user.email,
          subject: 'รีเซ็ตรหัสผ่าน - CMU ShareCycle',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2D7D3F;">รีเซ็ตรหัสผ่าน</h2>
              <p>สวัสดี ${user.name},</p>
              <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ</p>
              <p>กรุณาคลิกลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:</p>
              <p style="margin: 30px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #2D7D3F; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  รีเซ็ตรหัสผ่าน
                </a>
              </p>
              <p>หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
              <p style="word-break: break-all; color: #666; font-size: 12px;">${resetLink}</p>
              <p style="margin-top: 30px; color: #999; font-size: 12px;">
                <strong>หมายเหตุ:</strong> ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง
              </p>
              <p style="margin-top: 20px; color: #999; font-size: 12px;">
                ถ้าคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้
              </p>
              <p style="margin-top: 30px; color: #666; font-size: 12px;">
                CMU ShareCycle - Green Campus<br>
                <a href="${env.clientOrigin}" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
              </p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Failed to send password reset email:', emailErr)
        // ไม่ throw error เพื่อไม่ให้ user รู้ว่า email ไม่มีในระบบ
      }
    }
    
    // ส่ง response เดียวกันไม่ว่าจะมี user หรือไม่ (เพื่อความปลอดภัย)
    return res.json({ 
      message: 'หากอีเมลนี้มีในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้คุณ',
      success: true 
    })
  } catch (err) {
    console.error('Forgot password error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// รีเซ็ตรหัสผ่านด้วย token
export const resetPassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { token, password } = req.body

  try {
    // ตรวจสอบ token
    const tokenResult = await query(
      `SELECT prt.*, u.email, u.name
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token=$1 AND prt.used=FALSE AND prt.expires_at > NOW()`,
      [token]
    )

    if (!tokenResult.rowCount) {
      return res.status(400).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว' })
    }

    const tokenData = tokenResult.rows[0]

    // Hash password ใหม่
    const passwordHash = await hashPassword(password)

    // อัปเดตรหัสผ่าน
    await query(
      'UPDATE users SET password_hash=$1 WHERE id=$2',
      [passwordHash, tokenData.user_id]
    )

    // ทำเครื่องหมายว่า token ถูกใช้แล้ว
    await query(
      'UPDATE password_reset_tokens SET used=TRUE WHERE token=$1',
      [token]
    )

    return res.json({ 
      message: 'รีเซ็ตรหัสผ่านสำเร็จ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว',
      success: true 
    })
  } catch (err) {
    console.error('Reset password error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}







