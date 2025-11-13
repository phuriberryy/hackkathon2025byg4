import fs from 'fs'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '..', '.env')

function main() {
  console.log('🔧 แก้ไข Email Configuration\n')

  if (!fs.existsSync(envPath)) {
    console.error('❌ ไม่พบไฟล์ .env')
    process.exit(1)
  }

  let envContent = fs.readFileSync(envPath, 'utf-8')
  
  // อ่านค่าปัจจุบัน
  const emailUserMatch = envContent.match(/EMAIL_USER=(.+)/)
  const emailPassMatch = envContent.match(/EMAIL_PASS=(.+)/)
  
  const currentUser = emailUserMatch ? emailUserMatch[1].trim() : ''
  const currentPass = emailPassMatch ? emailPassMatch[1].trim() : ''
  
  console.log('📋 ค่าปัจจุบัน:')
  console.log(`   EMAIL_USER: ${currentUser}`)
  console.log(`   EMAIL_PASS: ${currentPass.substring(0, 10)}...`)
  console.log('')
  
  // ตรวจสอบว่าค่าถูกสลับกันหรือไม่
  let emailUser = currentUser
  let emailPass = currentPass
  let needsFix = false
  
  // ถ้า EMAIL_USER ไม่ใช่ email format แต่ EMAIL_PASS ดูเหมือน email
  if (!currentUser.includes('@') && currentPass.includes('@')) {
    console.log('⚠️  ตรวจพบว่าค่าถูกสลับกัน!')
    console.log('   EMAIL_USER ควรเป็น email address')
    console.log('   EMAIL_PASS ควรเป็น App Password\n')
    
    // สลับค่า
    emailUser = currentPass
    emailPass = currentUser
    needsFix = true
    
    console.log('✅ จะแก้ไขให้:')
    console.log(`   EMAIL_USER: ${emailUser}`)
    console.log(`   EMAIL_PASS: ${emailPass.substring(0, 10)}...`)
  } else if (!currentUser.includes('@')) {
    console.log('⚠️  EMAIL_USER ไม่ใช่ email format')
    console.log('   ต้องเป็น email address เช่น your_email@gmail.com\n')
    needsFix = true
  }
  
  // ถ้า EMAIL_PASS ดูเหมือน email
  if (currentPass.includes('@')) {
    console.log('⚠️  EMAIL_PASS ดูเหมือน email address')
    console.log('   ต้องเป็น App Password (16 ตัวอักษร)\n')
    needsFix = true
  }
  
  if (!needsFix) {
    console.log('✅ Email configuration ดูถูกต้องแล้ว')
    return
  }
  
  // แก้ไขไฟล์ .env
  const lines = envContent.split('\n')
  const newLines = lines.map(line => {
    if (line.startsWith('EMAIL_USER=')) {
      return `EMAIL_USER=${emailUser}`
    }
    if (line.startsWith('EMAIL_PASS=')) {
      return `EMAIL_PASS=${emailPass}`
    }
    if (line.startsWith('EMAIL_FROM=')) {
      return `EMAIL_FROM=${emailUser}`
    }
    return line
  })
  
  fs.writeFileSync(envPath, newLines.join('\n'))
  
  console.log('\n✅ แก้ไขไฟล์ .env สำเร็จ!')
  console.log('\n📧 ข้อมูลที่ตั้งค่า:')
  console.log(`   Host: smtp.gmail.com`)
  console.log(`   Port: 587`)
  console.log(`   User: ${emailUser}`)
  console.log(`   From: ${emailUser}`)
  console.log(`   Password: ${emailPass.substring(0, 10)}...`)
  
  console.log('\n📝 ขั้นตอนต่อไป:')
  console.log('   1. ตรวจสอบว่า EMAIL_USER เป็น email address ที่ถูกต้อง')
  console.log('   2. ตรวจสอบว่า EMAIL_PASS เป็น Gmail App Password (16 ตัวอักษร)')
  console.log('   3. รีสตาร์ท backend server')
  console.log('   4. ทดสอบ: npm run test:email phurichaya_lamsawat@cmu.ac.th')
}

main()


