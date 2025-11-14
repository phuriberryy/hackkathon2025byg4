import fs from 'fs'
import path from 'path'
import url from 'url'
import readline from 'readline'

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
  console.log('📧 อัพเดท Gmail App Password\n')

  if (!fs.existsSync(envPath)) {
    console.error('❌ ไม่พบไฟล์ .env')
    console.log('   กรุณารัน: npm run email:gmail')
    process.exit(1)
  }

  let envContent = fs.readFileSync(envPath, 'utf-8')
  
  // ถาม Gmail address (ถ้ายังไม่มี)
  const hasEmailUser = envContent.includes('EMAIL_USER=')
  let emailUser = ''
  
  if (hasEmailUser) {
    const match = envContent.match(/EMAIL_USER=(.+)/)
    if (match) {
      emailUser = match[1].trim()
      console.log(`✅ พบ Gmail Address: ${emailUser}`)
      const change = await question('ต้องการเปลี่ยนหรือไม่? (y/n): ')
      if (change.toLowerCase() === 'y' || change.toLowerCase() === 'yes') {
        emailUser = await question('Gmail Address (your_email@gmail.com): ') || ''
      }
    }
  } else {
    emailUser = await question('Gmail Address (your_email@gmail.com): ') || ''
  }

  if (!emailUser) {
    console.error('❌ ต้องระบุ Gmail Address')
    process.exit(1)
  }

  // ถาม App Password
  const appPassword = await question('Gmail App Password (uyzf pnbd idic tknn): ') || 'uyzf pnbd idic tknn'
  
  // ลบช่องว่างใน App Password
  const cleanPassword = appPassword.replace(/\s+/g, '')

  // อัพเดทหรือเพิ่ม email config
  let newEnvContent = envContent

  // ลบ email config เก่า (ถ้ามี)
  const lines = newEnvContent.split('\n')
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
  const emailConfig = `
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=${emailUser}
EMAIL_PASS=${cleanPassword}
EMAIL_FROM=${emailUser}
`

  newEnvContent = filteredLines.join('\n').trim() + emailConfig

  fs.writeFileSync(envPath, newEnvContent)
  
  console.log('\n✅ อัพเดทไฟล์ .env สำเร็จ!')
  console.log('\n📧 ข้อมูลที่ตั้งค่า:')
  console.log(`   Host: smtp.gmail.com`)
  console.log(`   Port: 587`)
  console.log(`   User: ${emailUser}`)
  console.log(`   From: ${emailUser}`)
  console.log(`   Password: ${'*'.repeat(cleanPassword.length)}`)

  // ถามว่าต้องการทดสอบการส่งอีเมลหรือไม่
  const testEmail = await question('\nต้องการทดสอบการส่งอีเมลไปยัง phurichaya_lamsawat@cmu.ac.th หรือไม่? (y/n): ')
  
  if (testEmail.toLowerCase() === 'y' || testEmail.toLowerCase() === 'yes') {
    console.log(`\n🧪 รันคำสั่งนี้เพื่อทดสอบ:`)
    console.log(`   npm run test:email phurichaya_lamsawat@cmu.ac.th`)
  }

  console.log('\n📝 ขั้นตอนต่อไป:')
  console.log('   1. รีสตาร์ท backend server (ถ้ากำลังรันอยู่)')
  console.log('   2. ทดสอบการส่งอีเมล: npm run test:email phurichaya_lamsawat@cmu.ac.th')
  console.log('   3. ตรวจสอบ inbox ของ phurichaya_lamsawat@cmu.ac.th')
  
  rl.close()
}

main().catch((err) => {
  console.error('เกิดข้อผิดพลาด:', err)
  process.exit(1)
})


