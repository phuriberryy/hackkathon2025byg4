import http from 'http'
import app from './app.js'
import env from './config/env.js'
import { initChatServer } from './services/chatService.js'
import { verifyEmailConnection } from './utils/email.js'

const server = http.createServer(app)
initChatServer(server)

server.listen(env.port, async () => {
  console.log(`Backend listening on port ${env.port}`)
  
  // ตรวจสอบการเชื่อมต่ออีเมล
  console.log('🔍 กำลังตรวจสอบการเชื่อมต่ออีเมล...')
  const isEmailConnected = await verifyEmailConnection()
  if (isEmailConnected) {
    console.log('✅ Email server is ready')
  } else {
    console.log('⚠️  Email server connection failed - ตรวจสอบการตั้งค่าใน .env file')
  }
})

