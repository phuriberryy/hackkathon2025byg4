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
  console.log('📧 Email Setup Helper\n')
  console.log('คู่มือนี้จะช่วยตั้งค่า email สำหรับ CMU ShareCycle')
  console.log('สำหรับ CMU email (Office 365) ต้องใช้ App Password\n')
  console.log('📖 วิธีสร้าง App Password:')
  console.log('   1. ไปที่ https://account.microsoft.com/security')
  console.log('   2. เปิด Two-step verification')
  console.log('   3. ไปที่ App passwords')
  console.log('   4. สร้าง App Password ใหม่\n')

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

  // ถามข้อมูล email
  const emailHost = await question(`Email Host (default: smtp.office365.com): `) || 'smtp.office365.com'
  const emailPort = await question(`Email Port (default: 587): `) || '587'
  const emailUser = await question(`Email User (your_email@cmu.ac.th): `) || existingEnv.EMAIL_USER || ''
  
  if (!emailUser) {
    console.error('\n❌ ต้องระบุ Email User')
    rl.close()
    process.exit(1)
  }

  if (!emailUser.endsWith('@cmu.ac.th')) {
    console.log('\n⚠️  Email ควรเป็น @cmu.ac.th สำหรับ CMU email')
    const continueAnyway = await question('ต้องการดำเนินการต่อหรือไม่? (y/n): ')
    if (continueAnyway.toLowerCase() !== 'y' && continueAnyway.toLowerCase() !== 'yes') {
      rl.close()
      process.exit(0)
    }
  }

  const emailPass = await question(`Email Password (App Password): `) || existingEnv.EMAIL_PASS || ''
  
  if (!emailPass) {
    console.error('\n❌ ต้องระบุ Email Password (App Password)')
    console.log('💡 สำหรับ CMU email ต้องใช้ App Password ไม่ใช่ password ปกติ')
    rl.close()
    process.exit(1)
  }

  const emailFrom = await question(`Email From (default: ${emailUser}): `) || emailUser

  // อัพเดทหรือสร้างไฟล์ .env
  const emailConfig = `
# Email Configuration
EMAIL_HOST=${emailHost}
EMAIL_PORT=${emailPort}
EMAIL_USER=${emailUser}
EMAIL_PASS=${emailPass}
EMAIL_FROM=${emailFrom}
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
             !trimmed.startsWith('EMAIL_FROM')
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

  // ถามว่าต้องการทดสอบการส่งอีเมลหรือไม่
  console.log('\n📧 ข้อมูลที่ตั้งค่า:')
  console.log(`   Host: ${emailHost}`)
  console.log(`   Port: ${emailPort}`)
  console.log(`   User: ${emailUser}`)
  console.log(`   From: ${emailFrom}`)
  console.log(`   Password: ${'*'.repeat(emailPass.length)}`)

  const testEmail = await question('\nต้องการทดสอบการส่งอีเมลหรือไม่? (y/n): ')
  
  if (testEmail.toLowerCase() === 'y' || testEmail.toLowerCase() === 'yes') {
    const testEmailAddress = await question(`ส่งอีเมลทดสอบไปที่ (default: ${emailUser}): `) || emailUser
    
    if (!testEmailAddress.endsWith('@cmu.ac.th')) {
      console.log('\n⚠️  Email ต้องเป็น @cmu.ac.th')
      rl.close()
      process.exit(0)
    }

    console.log(`\n🧪 กำลังทดสอบการส่งอีเมลไปยัง ${testEmailAddress}...`)
    console.log('   (รันคำสั่ง: npm run test:email ' + testEmailAddress + ')')
    console.log('\n💡 คุณสามารถรันคำสั่งนี้ได้เอง:')
    console.log(`   npm run test:email ${testEmailAddress}`)
  }

  console.log('\n✅ การตั้งค่า email เสร็จสมบูรณ์!')
  console.log('\n📝 ขั้นตอนต่อไป:')
  console.log('   1. รีสตาร์ท backend server (ถ้ากำลังรันอยู่)')
  console.log('   2. ทดสอบการส่งอีเมล: npm run test:email your_email@cmu.ac.th')
  console.log('   3. ทดสอบการสร้าง exchange request')
  
  rl.close()
}

main().catch((err) => {
  console.error('เกิดข้อผิดพลาด:', err)
  process.exit(1)
})

