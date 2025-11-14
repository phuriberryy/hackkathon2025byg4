import fs from 'fs'
import path from 'path'
import url from 'url'
import readline from 'readline'
import dotenv from 'dotenv'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '..', '.env')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('📧 Gmail SMTP Setup Helper\n')
  console.log('คู่มือนี้จะช่วยตั้งค่า Gmail SMTP สำหรับส่งอีเมลจริง\n')
  console.log('📖 วิธีสร้าง Gmail App Password:')
  console.log('   1. ไปที่ https://myaccount.google.com/')
  console.log('   2. ไปที่ Security → 2-Step Verification (ต้องเปิดก่อน)')
  console.log('   3. ไปที่ App passwords')
  console.log('   4. เลือก Mail และ Other (Custom name)')
  console.log('   5. ตั้งชื่อ: CMU ShareCycle')
  console.log('   6. คลิก Generate')
  console.log('   7. คัดลอก App Password (16 ตัวอักษร)\n')

  // อ่านไฟล์ .env ที่มีอยู่ (ถ้ามี)
  let envContent = ''
  let existingEnv = {}
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
    existingEnv = dotenv.parse(envContent)
    console.log('✅ พบไฟล์ .env แล้ว\n')
  } else {
    console.log('⚠️  ไม่พบไฟล์ .env จะสร้างใหม่\n')
  }

  // ถามข้อมูล
  const emailUser = await question(`Gmail Address (your_email@gmail.com): `) || existingEnv.EMAIL_USER || ''
  
  if (!emailUser) {
    console.error('\n❌ ต้องระบุ Gmail Address')
    rl.close()
    process.exit(1)
  }

  if (!emailUser.endsWith('@gmail.com')) {
    console.log('\n⚠️  ควรเป็น Gmail address (@gmail.com)')
    const continueAnyway = await question('ต้องการดำเนินการต่อหรือไม่? (y/n): ')
    if (continueAnyway.toLowerCase() !== 'y' && continueAnyway.toLowerCase() !== 'yes') {
      rl.close()
      process.exit(0)
    }
  }

  const emailPass = await question(`Gmail App Password (16 ตัวอักษร): `) || existingEnv.EMAIL_PASS || ''
  
  if (!emailPass) {
    console.error('\n❌ ต้องระบุ Gmail App Password')
    console.log('💡 ต้องใช้ App Password ไม่ใช่ password ปกติ')
    console.log('   วิธีสร้าง: https://myaccount.google.com/apppasswords')
    rl.close()
    process.exit(1)
  }

  // อัพเดทหรือสร้างไฟล์ .env
  const emailConfig = `
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=${emailUser}
EMAIL_PASS=${emailPass}
EMAIL_FROM=${emailUser}
`

  // ถ้ามีไฟล์ .env อยู่แล้ว ให้อัพเดทเฉพาะส่วน email
  if (fs.existsSync(envPath)) {
    // ลบ email config เก่า (ถ้ามี)
    const lines = envContent.split('\n')
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim()
      return !trimmed.startsWith('EMAIL_HOST') &&
             !trimmed.startsWith('EMAIL_PORT') &&
             !trimmed.startsWith('EMAIL_USER') &&
             !trimmed.startsWith('EMAIL_PASS') &&
             !trimmed.startsWith('EMAIL_FROM') &&
             !trimmed.startsWith('# Email Configuration')
    })
    
    // เพิ่ม email config ใหม่
    const newContent = filteredLines.join('\n') + emailConfig
    
    fs.writeFileSync(envPath, newContent)
    console.log(`\n✅ อัพเดทไฟล์ .env สำเร็จ!`)
  } else {
    // สร้างไฟล์ .env ใหม่
    const defaultConfig = `PORT=4000
CLIENT_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://pmykingg@localhost:5432/cmu%20sharecycle
JWT_SECRET=cmu-sharecycle-secret-key-2025-min-16-chars
${emailConfig}`
    
    fs.writeFileSync(envPath, defaultConfig)
    console.log(`\n✅ สร้างไฟล์ .env สำเร็จ!`)
  }

  // แสดงข้อมูลที่ตั้งค่า
  console.log('\n📧 ข้อมูลที่ตั้งค่า:')
  console.log(`   Host: smtp.gmail.com`)
  console.log(`   Port: 587`)
  console.log(`   User: ${emailUser}`)
  console.log(`   From: ${emailUser}`)
  console.log(`   Password: ${'*'.repeat(emailPass.length)}`)

  // ถามว่าต้องการทดสอบการส่งอีเมลหรือไม่
  const testEmail = await question('\nต้องการทดสอบการส่งอีเมลไปยัง phurichaya_lamsawat@cmu.ac.th หรือไม่? (y/n): ')
  
  if (testEmail.toLowerCase() === 'y' || testEmail.toLowerCase() === 'yes') {
    console.log(`\n🧪 กำลังทดสอบการส่งอีเมล...`)
    console.log('   (รันคำสั่ง: npm run test:email phurichaya_lamsawat@cmu.ac.th)')
    console.log('\n💡 คุณสามารถรันคำสั่งนี้ได้เอง:')
    console.log(`   npm run test:email phurichaya_lamsawat@cmu.ac.th`)
  }

  console.log('\n✅ การตั้งค่า Gmail SMTP เสร็จสมบูรณ์!')
  console.log('\n📝 ขั้นตอนต่อไป:')
  console.log('   1. รีสตาร์ท backend server (ถ้ากำลังรันอยู่)')
  console.log('   2. ทดสอบการส่งอีเมล: npm run test:email phurichaya_lamsawat@cmu.ac.th')
  console.log('   3. ตรวจสอบ inbox ของ phurichaya_lamsawat@cmu.ac.th')
  console.log('   4. ทดสอบการสร้าง exchange request')
  
  rl.close()
}

main().catch((err) => {
  console.error('เกิดข้อผิดพลาด:', err)
  process.exit(1)
})


