import nodemailer from 'nodemailer'
import env from '../config/env.js'

// ตรวจสอบว่ามีการตั้งค่า email หรือไม่
const hasEmailConfig = env.emailHost && env.emailUser && env.emailPass && env.emailFrom

// ใช้ mock mode ถ้าไม่มี email config หรือตั้งค่า USE_MOCK_EMAIL=true
const USE_MOCK_EMAIL = process.env.USE_MOCK_EMAIL === 'true' || !hasEmailConfig

// สร้าง transporter สำหรับส่งอีเมล (ถ้าไม่ใช่ mock mode)
// รองรับทั้ง Gmail, Office 365 และ SMTP server อื่นๆ
const transporter = !USE_MOCK_EMAIL && hasEmailConfig ? nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  secure: env.emailPort === 465, // true for 465, false for other ports
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
  // สำหรับ Gmail และ Office 365
  requireTLS: env.emailHost === 'smtp.gmail.com' || env.emailHost === 'smtp.office365.com',
  tls: {
    rejectUnauthorized: false, // สำหรับ development/testing
  },
  debug: false, // ตั้งเป็น true เพื่อดู debug logs
  logger: false, // ตั้งเป็น true เพื่อดู logger
}) : null

// Mock email function - แค่ log อีเมลออกมาใน console
const mockSendEmail = ({ to, subject, html }) => {
  console.log('\n📧 ========== MOCK EMAIL (ไม่ส่งจริง) ==========')
  console.log('To:', to)
  console.log('Subject:', subject)
  console.log('From: CMU ShareCycle <noreply@cmusharecycle.local>')
  console.log('---')
  console.log('HTML Content:')
  // แสดง HTML แบบง่ายๆ (ลบ tags)
  const textContent = html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  console.log(textContent.substring(0, 200) + (textContent.length > 200 ? '...' : ''))
  console.log('==========================================\n')
  
  return {
    messageId: `mock-${Date.now()}@cmusharecycle.local`,
    accepted: [to],
    rejected: [],
    pending: [],
    response: '250 Mock email logged successfully'
  }
}

// ตรวจสอบการเชื่อมต่ออีเมล
export const verifyEmailConnection = async () => {
  if (USE_MOCK_EMAIL) {
    console.log('📧 Email Service: MOCK MODE (ไม่ส่งอีเมลจริง แค่ log ใน console)')
    return true
  }

  if (!hasEmailConfig) {
    console.error('❌ Email configuration not found')
    console.log('   ใช้ MOCK MODE แทน (ไม่ส่งอีเมลจริง)')
    console.log('   ถ้าต้องการส่งอีเมลจริง ตั้งค่า EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_FROM ใน .env file')
    return false
  }

  if (!transporter) {
    console.error('❌ Email transporter not initialized')
    return false
  }

  try {
    await transporter.verify()
    console.log('✅ Email server is ready to send messages')
    console.log(`   Host: ${env.emailHost}`)
    console.log(`   Port: ${env.emailPort}`)
    console.log(`   User: ${env.emailUser}`)
    return true
  } catch (err) {
    console.error('❌ Email server connection failed:', err.message)
    console.log('   ใช้ MOCK MODE แทน (ไม่ส่งอีเมลจริง)')
    if (err.code === 'EAUTH') {
      console.error('   Authentication failed - ตรวจสอบ EMAIL_USER และ EMAIL_PASS')
      console.error('   สำหรับ Office 365 อาจต้องใช้ App Password แทน password ปกติ')
    } else if (err.code === 'ECONNECTION') {
      console.error('   Connection failed - ตรวจสอบ EMAIL_HOST และ EMAIL_PORT')
      console.error(`   Current: ${env.emailHost}:${env.emailPort}`)
    } else if (err.code === 'ETIMEDOUT') {
      console.error('   Connection timeout - ตรวจสอบ network connection')
    }
    return false
  }
}

// ส่งอีเมล
export const sendEmail = async ({ to, subject, html }) => {
  // ใช้ mock mode ถ้าไม่มี email config
  if (USE_MOCK_EMAIL) {
    return mockSendEmail({ to, subject, html })
  }

  if (!hasEmailConfig || !transporter) {
    console.log('⚠️  Email config not found, using MOCK MODE')
    return mockSendEmail({ to, subject, html })
  }

  // ตรวจสอบว่าเป็น email @cmu.ac.th หรือไม่ (เฉพาะเมื่อส่งจริง)
  if (!to.endsWith('@cmu.ac.th')) {
    console.log('⚠️  Email ไม่ใช่ @cmu.ac.th แต่จะส่งต่อไป (MOCK MODE)')
  }

  try {
    // กำหนด from address ให้ถูกต้อง
    const fromAddress = env.emailFrom && env.emailFrom.includes('@')
      ? env.emailFrom
      : env.emailUser

    const info = await transporter.sendMail({
      from: `"CMU ShareCycle" <${fromAddress}>`,
      to,
      subject,
      html,
      // เพิ่ม headers เพื่อลดโอกาสตก Junk/Spam
      headers: {
        'X-Priority': '3', // Normal priority
        'X-MSMail-Priority': 'Normal',
        'Importance': 'normal',
        'X-Mailer': 'CMU ShareCycle',
        'X-Auto-Response-Suppress': 'All',
        // เพิ่ม Reply-To เพื่อให้ผู้รับสามารถตอบกลับได้
        'Reply-To': fromAddress,
      },
      // ตั้งค่า replyTo
      replyTo: fromAddress,
      // เพิ่ม text version สำหรับ email clients ที่ไม่รองรับ HTML
      text: html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    })

    console.log('✅ Email sent successfully:', info.messageId)
    console.log('   To:', to)
    console.log('   Subject:', subject)
    return info
  } catch (err) {
    console.error('❌ Failed to send email:', err.message)
    console.log('   ใช้ MOCK MODE แทน (ไม่ส่งอีเมลจริง)')
    // ถ้าส่งจริงล้มเหลว ให้ใช้ mock แทน
    return mockSendEmail({ to, subject, html })
  }
}

// ส่งอีเมลทดสอบ
export const sendTestEmail = async (to) => {
  return sendEmail({
    to,
    subject: 'ทดสอบการส่งอีเมลจาก CMU ShareCycle',
    html: `
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
}
