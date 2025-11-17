import { body, validationResult } from 'express-validator'
import { sendEmail } from '../utils/email.js'

// ทดสอบการส่งอีเมล
export const testEmail = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { to, subject, html } = req.body

  try {
    await sendEmail({
      to,
      subject: subject || 'ทดสอบการส่งอีเมลจาก CMU ShareCycle',
      html: html || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2D7D3F;">ทดสอบการส่งอีเมล</h2>
          <p>สวัสดีครับ/ค่ะ,</p>
          <p>นี่คืออีเมลทดสอบจาก <strong>CMU ShareCycle</strong></p>
          <p>หากคุณได้รับอีเมลนี้ แสดงว่าระบบส่งอีเมลทำงานได้ปกติ</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            CMU ShareCycle - Green Campus<br>
            <a href="http://localhost:3000" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
          </p>
        </div>
      `,
    })

    return res.json({
      success: true,
      message: 'อีเมลส่งสำเร็จ!',
      to,
    })
  } catch (err) {
    console.error('Test email error:', err)
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถส่งอีเมลได้',
      error: err.message,
    })
  }
}

// ทดสอบการส่งอีเมลแจ้งเตือนคำขอแลกเปลี่ยน
export const testExchangeRequestEmail = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { to } = req.body

  try {
    await sendEmail({
      to,
      subject: 'มีคำขอแลกเปลี่ยนใหม่บน CMU ShareCycle',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2D7D3F;">มีคำขอแลกเปลี่ยนใหม่</h2>
          <p>สวัสดี คุณ,</p>
          <p><strong>John Doe</strong> ขอแลกเปลี่ยนสำหรับสินค้า "<strong>Business Strategy Book</strong>"</p>
          <p><strong>ข้อความ:</strong> "I need this for my marketing class. My business book is in great condition!"</p>
          <p>กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดและยอมรับ/ปฏิเสธคำขอ</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            CMU ShareCycle - Green Campus<br>
            <a href="http://localhost:3000" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
          </p>
        </div>
      `,
    })

    return res.json({
      success: true,
      message: 'อีเมลแจ้งเตือนคำขอแลกเปลี่ยนส่งสำเร็จ!',
      to,
    })
  } catch (err) {
    console.error('Test exchange request email error:', err)
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถส่งอีเมลได้',
      error: err.message,
    })
  }
}

// ทดสอบการส่งอีเมลแจ้งเตือนการยอมรับคำขอแลกเปลี่ยน
export const testExchangeAcceptedEmail = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { to } = req.body

  try {
    await sendEmail({
      to,
      subject: 'เจ้าของโพสต์ยอมรับคำขอแลกเปลี่ยน',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2D7D3F;">คำขอแลกเปลี่ยนของคุณได้รับการยอมรับ</h2>
          <p>สวัสดี คุณ,</p>
          <p><strong>Jane Smith</strong> ยอมรับคำขอแลกเปลี่ยนสำหรับสินค้า "<strong>Business Strategy Book</strong>"</p>
          <p>กรุณาเข้าสู่ระบบเพื่อยอมรับคำขอแลกเปลี่ยนของคุณ</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            CMU ShareCycle - Green Campus<br>
            <a href="http://localhost:3000" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
          </p>
        </div>
      `,
    })

    return res.json({
      success: true,
      message: 'อีเมลแจ้งเตือนการยอมรับส่งสำเร็จ!',
      to,
    })
  } catch (err) {
    console.error('Test exchange accepted email error:', err)
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถส่งอีเมลได้',
      error: err.message,
    })
  }
}

// ทดสอบการส่งอีเมลแจ้งเตือนการแลกเปลี่ยนสำเร็จ
export const testExchangeCompletedEmail = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { to } = req.body

  try {
    await sendEmail({
      to,
      subject: 'การแลกเปลี่ยนสำเร็จ - CMU ShareCycle',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2D7D3F;">การแลกเปลี่ยนสำเร็จ!</h2>
          <p>การแลกเปลี่ยนสินค้า "<strong>Business Strategy Book</strong>" สำเร็จแล้ว</p>
          <p>แชทได้เปิดให้แล้วเพื่อให้คุณทั้งสองสามารถติดต่อกันได้</p>
          <p>CO₂ ที่ลดได้จากการแลกเปลี่ยนนี้: <strong>30.38 kg</strong></p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            CMU ShareCycle - Green Campus<br>
            <a href="http://localhost:3000" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
          </p>
        </div>
      `,
    })

    return res.json({
      success: true,
      message: 'อีเมลแจ้งเตือนการแลกเปลี่ยนสำเร็จส่งสำเร็จ!',
      to,
    })
  } catch (err) {
    console.error('Test exchange completed email error:', err)
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถส่งอีเมลได้',
      error: err.message,
    })
  }
}











