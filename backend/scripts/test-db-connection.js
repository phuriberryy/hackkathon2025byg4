import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL ไม่ได้ถูกตั้งค่าในไฟล์ .env')
    console.log('\n📝 โปรดสร้างไฟล์ .env และตั้งค่า DATABASE_URL')
    console.log('   ดูตัวอย่างในไฟล์ .env.example')
    process.exit(1)
  }

  console.log('🔌 กำลังทดสอบการเชื่อมต่อฐานข้อมูล...')
  console.log(`📍 Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`) // ซ่อน password

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    // ทดสอบการเชื่อมต่อ
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version')
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ!')
    console.log(`   เวลาปัจจุบัน: ${result.rows[0].current_time}`)
    console.log(`   PostgreSQL Version: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`)

    // ตรวจสอบว่ามีตารางหรือยัง
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)

    if (tablesResult.rows.length === 0) {
      console.log('\n⚠️  ยังไม่มีตารางในฐานข้อมูล')
      console.log('   โปรดรันคำสั่ง: npm run db:migrate')
    } else {
      console.log(`\n📊 พบตาราง ${tablesResult.rows.length} ตาราง:`)
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`)
      })
    }

    console.log('\n🎉 ทุกอย่างพร้อมใช้งาน!')
  } catch (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้')
    console.error('\n🔍 ข้อผิดพลาด:')
    console.error(err.message)
    
    if (err.message.includes('password authentication failed')) {
      console.error('\n💡 แก้ไข: ตรวจสอบ username และ password ใน DATABASE_URL')
    } else if (err.message.includes('does not exist')) {
      console.error('\n💡 แก้ไข: ตรวจสอบว่าสร้างฐานข้อมูลแล้วหรือยัง')
      console.error('   ใช้ pgAdmin4 หรือ psql เพื่อสร้างฐานข้อมูล: CREATE DATABASE sharecycle;')
    } else if (err.message.includes('ECONNREFUSED')) {
      console.error('\n💡 แก้ไข: ตรวจสอบว่า PostgreSQL กำลังรันอยู่')
      console.error('   macOS: brew services start postgresql@14')
    }
    
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection()


