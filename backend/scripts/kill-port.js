#!/usr/bin/env node

/**
 * สคริปต์สำหรับ kill process ที่ใช้ port 4000
 * ใช้เมื่อเจอ error: EADDRINUSE: address already in use :::4000
 */

import { execSync } from 'child_process'

const PORT = process.argv[2] || 4000

async function main() {
  try {
    console.log(`🔍 กำลังหา process ที่ใช้ port ${PORT}...`)
    
    // หา process ID ที่ใช้ port
    const pid = execSync(`lsof -ti:${PORT}`, { encoding: 'utf-8' }).trim()
    
    if (!pid) {
      console.log(`✅ Port ${PORT} ว่างอยู่แล้ว`)
      process.exit(0)
    }
    
    console.log(`📌 พบ process ID: ${pid}`)
    
    // ดูว่า process นี้คืออะไร
    try {
      const processInfo = execSync(`ps -p ${pid} -o pid,command`, { encoding: 'utf-8' })
      console.log(`\n📋 Process info:`)
      console.log(processInfo)
    } catch (err) {
      // process อาจจะหายไปแล้ว
    }
    
    // Kill process
    console.log(`\n🛑 กำลังหยุด process ${pid}...`)
    execSync(`kill ${pid}`)
    
    // รอสักครู่
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // ตรวจสอบอีกครั้ง
    try {
      const stillRunning = execSync(`lsof -ti:${PORT}`, { encoding: 'utf-8' }).trim()
      if (stillRunning) {
        console.log(`⚠️  Process ยังรันอยู่ กำลัง force kill...`)
        execSync(`kill -9 ${pid}`)
      }
    } catch (err) {
      // ไม่มี process รันอยู่แล้ว
    }
    
    console.log(`✅ Port ${PORT} ว่างแล้ว!`)
    
  } catch (err) {
    if (err.message.includes('lsof')) {
      console.log(`✅ Port ${PORT} ว่างอยู่แล้ว`)
    } else {
      console.error(`❌ เกิดข้อผิดพลาด:`, err.message)
      process.exit(1)
    }
  }
}

main()

