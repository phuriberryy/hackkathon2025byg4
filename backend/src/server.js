import http from 'http'
import app from './app.js'
import env from './config/env.js'
import { initChatServer } from './services/chatService.js'
import { verifyDatabaseConnection } from './db/pool.js'
import { verifyEmailConnection } from './utils/email.js'

const server = http.createServer(app)
initChatServer(server)

// 💡 ตรวจสอบการเชื่อมต่อ Database
console.log('🔍 กำลังตรวจสอบการเชื่อมต่อ Database...')
const isDbConnected = await verifyDatabaseConnection()
if (!isDbConnected) {
    console.error('❌ Database connection failed. Shutting down server.')
    console.log('🚨 กรุณาตรวจสอบว่า PostgreSQL Server ทำงานอยู่, ชื่อ Database และ Password ใน .env ถูกต้อง')
    process.exit(1) // ปิดเซิร์ฟเวอร์ทันทีหาก DB ใช้ไม่ได้
}
console.log('✅ Database connected successfully!')

// 💡 ตรวจสอบ Email Service (Mock หรือ Real)
console.log('📧 กำลังตรวจสอบ Email Service...')
await verifyEmailConnection()

server.listen(env.port, () => {
    console.log(`Backend listening on port ${env.port}`)
    console.log('🎉 Server is fully operational.')
})