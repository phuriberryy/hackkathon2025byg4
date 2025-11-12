import nodemailer from 'nodemailer'
import env from '../config/env.js'

// ตรวจสอบว่ามีการตั้งค่า email หรือไม่
const hasEmailConfig = env.emailHost && env.emailUser && env.emailPass && env.emailFrom

// สร้าง transporter สำหรับส่งอีเมล
// รองรับทั้ง Office 365 และ SMTP server ของ CMU
const transporter = hasEmailConfig ? nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  secure: env.emailPort === 465, // true for 465, false for other ports
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
  // สำหรับ CMU email (Office 365) ใช้ requireTLS
  requireTLS: true,
  tls: {
    rejectUnauthorized: false, // สำหรับ development/testing
  },
  debug: false, // ตั้งเป็น true เพื่อดู debug logs
  logger: false, // ตั้งเป็น true เพื่อดู logger
}) : null

// ตรวจสอบการเชื่อมต่ออีเมล
export const verifyEmailConnection = async () => {
  if (!hasEmailConfig) {
    console.error('❌ Email configuration not found')
    console.log('   กรุณาตั้งค่า EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_FROM ใน .env file')
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
  if (!hasEmailConfig || !transporter) {
    throw new Error('Email configuration not found. Please set EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_FROM in .env file')
  }

  // ตรวจสอบว่าเป็น email @cmu.ac.th หรือไม่
  if (!to.endsWith('@cmu.ac.th')) {
    throw new Error('Notifications can only be sent to a cmu.ac.th address')
  }

  try {
    const info = await transporter.sendMail({
      from: env.emailFrom.includes('@') 
        ? `"CMU ShareCycle" <${env.emailFrom}>`
        : `"CMU ShareCycle" <${env.emailUser}>`,
      to,
      subject,
      html,
    })

    console.log('✅ Email sent successfully:', info.messageId)
    console.log('   To:', to)
    console.log('   Subject:', subject)
    return info
  } catch (err) {
    console.error('❌ Failed to send email:', err.message)
    if (err.code === 'EAUTH') {
      console.error('   Authentication failed - ตรวจสอบ EMAIL_USER และ EMAIL_PASS')
      console.error('   สำหรับ Office 365 อาจต้องใช้ App Password แทน password ปกติ')
      console.error('   วิธีสร้าง App Password: https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944')
    } else if (err.code === 'ECONNECTION') {
      console.error('   Connection failed - ตรวจสอบ EMAIL_HOST และ EMAIL_PORT')
    } else if (err.code === 'ETIMEDOUT') {
      console.error('   Connection timeout - ตรวจสอบ network connection')
    }
    throw err
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
