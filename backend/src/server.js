import http from 'http'
import { exec } from 'child_process'
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

// Check if port is in use and kill existing process
const checkPort = () => {
    return new Promise((resolve) => {
        exec(`lsof -ti:${env.port}`, (error) => {
            if (!error) {
                // Port is in use, kill the process
                console.log(`⚠️  Port ${env.port} is already in use. Killing existing process...`)
                exec(`lsof -ti:${env.port} | xargs kill -9 2>/dev/null`, (killError) => {
                    if (killError) {
                        console.error('❌ Failed to kill existing process.')
                    } else {
                        console.log('✅ Existing process killed. Waiting 2 seconds...')
                    }
                    setTimeout(resolve, 2000)
                })
            } else {
                resolve()
            }
        })
    })
}

// Wait for port to be available
await checkPort()

server.listen(env.port, () => {
    console.log(`Backend listening on port ${env.port}`)
    console.log('🎉 Server is fully operational.')
})

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${env.port} is still in use after cleanup.`)
        console.log(`   Please manually stop the process: lsof -ti:${env.port} | xargs kill -9`)
    } else {
        console.error('❌ Server error:', err)
    }
    process.exit(1)
})