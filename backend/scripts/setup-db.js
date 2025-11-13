import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import url from 'url'
import readline from 'readline'
import fs from 'fs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

// Encode database name สำหรับ URL (รองรับช่องว่างและอักขระพิเศษ)
function encodeDatabaseName(name) {
  return encodeURIComponent(name)
}

async function main() {
  console.log('🚀 Database Setup Helper\n')
  console.log('📖 วิธีดูข้อมูลจาก pgAdmin4:')
  console.log('   1. คลิกขวาที่ Server (เช่น "PostgreSQL 17") → Properties')
  console.log('   2. ไปที่แท็บ "Connection"')
  console.log('   3. ดู Host, Port, Username, Password\n')
  console.log('โปรดกรอกข้อมูลการเชื่อมต่อ PostgreSQL:\n')

  // ถามข้อมูล
  const host = await question('Host (default: localhost): ') || 'localhost'
  const port = await question('Port (default: 5432): ') || '5432'
  const username = await question('Username (default: postgres): ') || 'postgres'
  const password = await question('Password (ถ้าไม่มีให้กด Enter): ') || ''
  let database = await question('Database name (เช่น "cmu sharecycle" หรือ "sharecycle"): ') || 'sharecycle'

  // Encode database name สำหรับ URL
  const encodedDatabase = encodeDatabaseName(database)

  // สร้าง connection string
  let databaseUrl
  if (password) {
    databaseUrl = `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${encodedDatabase}`
  } else {
    databaseUrl = `postgresql://${encodeURIComponent(username)}@${host}:${port}/${encodedDatabase}`
  }

  console.log(`\n🔌 กำลังทดสอบการเชื่อมต่อ...`)
  console.log(`📍 Connection: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`)

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    // ทดสอบการเชื่อมต่อ
    await pool.query('SELECT NOW()')
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ!\n')

    // ตรวจสอบว่ามีตารางหรือยัง
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)

    if (tablesResult.rows.length > 0) {
      console.log(`📊 พบตาราง ${tablesResult.rows.length} ตาราง:`)
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`)
      })
      console.log('\n✅ ฐานข้อมูลพร้อมใช้งานแล้ว!')
    } else {
      console.log('⚠️  ยังไม่มีตารางในฐานข้อมูล')
      const runMigration = await question('\nต้องการรัน migration เพื่อสร้างตารางตอนนี้ไหม? (y/n): ')
      
      if (runMigration.toLowerCase() === 'y' || runMigration.toLowerCase() === 'yes') {
        console.log('\n🔄 กำลังรัน migration...')
        const fs = await import('fs')
        const sqlPath = path.resolve(__dirname, '..', 'sql', 'schema.sql')
        const sql = fs.readFileSync(sqlPath, 'utf-8')
        await pool.query(sql)
        console.log('✅ Migration สำเร็จ! ตารางถูกสร้างแล้ว\n')
      } else {
        console.log('\n💡 คุณสามารถรัน migration ทีหลังได้ด้วยคำสั่ง: npm run db:migrate')
      }
    }

    // แสดง connection string สำหรับ .env
    console.log('\n📝 Connection String สำหรับ .env:')
    console.log('DATABASE_URL=' + databaseUrl)
    
    // ถามว่าต้องการสร้างไฟล์ .env หรือไม่
    const envPath = path.resolve(__dirname, '..', '.env')
    const envExists = fs.existsSync(envPath)
    
    if (envExists) {
      console.log(`\n⚠️  ไฟล์ .env มีอยู่แล้วที่: ${envPath}`)
      const overwrite = await question('ต้องการอัพเดท DATABASE_URL ในไฟล์ .env หรือไม่? (y/n): ')
      
      if (overwrite.toLowerCase() === 'y' || overwrite.toLowerCase() === 'yes') {
        let envContent = fs.readFileSync(envPath, 'utf-8')
        
        // อัพเดทหรือเพิ่ม DATABASE_URL
        if (envContent.includes('DATABASE_URL=')) {
          envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL=${databaseUrl}`)
        } else {
          envContent += `\nDATABASE_URL=${databaseUrl}\n`
        }
        
        fs.writeFileSync(envPath, envContent)
        console.log('✅ อัพเดทไฟล์ .env สำเร็จ!')
      }
    } else {
      const createEnv = await question('\nต้องการสร้างไฟล์ .env อัตโนมัติหรือไม่? (y/n): ')
      
      if (createEnv.toLowerCase() === 'y' || createEnv.toLowerCase() === 'yes') {
        const jwtSecret = await question('JWT_SECRET (default: cmu-sharecycle-secret-key-2025): ') || 'cmu-sharecycle-secret-key-2025'
        
        const envContent = `PORT=4000
CLIENT_ORIGIN=http://localhost:3000
DATABASE_URL=${databaseUrl}
JWT_SECRET=${jwtSecret}
`
        
        fs.writeFileSync(envPath, envContent)
        console.log(`✅ สร้างไฟล์ .env สำเร็จที่: ${envPath}`)
      } else {
        console.log('\n💡 บันทึก connection string นี้ไว้ใช้ใน .env:')
        console.log('DATABASE_URL=' + databaseUrl)
      }
    }

  } catch (err) {
    console.error('\n❌ เกิดข้อผิดพลาด:')
    console.error(err.message)
    
    if (err.message.includes('password authentication failed')) {
      console.error('\n💡 แก้ไข: ตรวจสอบ username และ password')
    } else if (err.message.includes('does not exist')) {
      console.error('\n💡 แก้ไข: ตรวจสอบว่าสร้างฐานข้อมูลแล้วหรือยัง')
      console.error(`   สร้างด้วย: CREATE DATABASE "${database}";`)
    } else if (err.message.includes('ECONNREFUSED')) {
      console.error('\n💡 แก้ไข: ตรวจสอบว่า PostgreSQL กำลังรันอยู่')
      console.error('   macOS: brew services start postgresql@17')
    }
    
    process.exit(1)
  } finally {
    await pool.end()
    rl.close()
  }
}

main().catch((err) => {
  console.error('เกิดข้อผิดพลาด:', err)
  process.exit(1)
})

