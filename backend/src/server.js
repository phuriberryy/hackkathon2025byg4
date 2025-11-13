import http from 'http'
import app from './app.js'
import env from './config/env.js'
import { initChatServer } from './services/chatService.js'
// ❌ ลบบรรทัด import { verifyEmailConnection } จากที่นี่
// 💡 เปลี่ยนมานำเข้า verifyDatabaseConnection จากไฟล์ Pool ของคุณ
import { verifyDatabaseConnection } from './db/pool.js' // หรือ path ที่ถูกต้อง

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


server.listen(env.port, () => { // 💡 เปลี่ยนจาก async () เป็น () ธรรมดา ถ้าโค้ดในนี้ไม่มี await แล้ว
    console.log(`Backend listening on port ${env.port}`)
    
    // ❌ ลบโค้ดตรวจสอบอีเมลทั้งหมดที่เคยอยู่ในส่วนนี้ออกไป

    console.log('🎉 Server is fully operational.')
})