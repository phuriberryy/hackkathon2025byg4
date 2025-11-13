import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


// Load .env from the backend folder (one level up from scripts)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS
} = process.env;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
  console.error('Missing one or more email env vars. Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS');
  process.exit(1);
}

// Import after loading env and checks
const emailUtils = await import('../src/utils/email.js')
const { sendTestEmail, verifyEmailConnection } = emailUtils

// อ่าน email จาก command line arguments
const testEmail = process.argv[2]

if (!testEmail) {
  console.error('❌ กรุณาระบุ email address')
  console.log('Usage: node scripts/test-email.js <your_email@cmu.ac.th>')
  console.log('')
  console.log('ตัวอย่าง:')
  console.log('  node scripts/test-email.js john.doe@cmu.ac.th')
  process.exit(1)
}

if (!testEmail.endsWith('@cmu.ac.th')) {
  console.error('❌ Email ต้องเป็น @cmu.ac.th เท่านั้น')
  process.exit(1)
}

async function test() {
  console.log('🔍 กำลังตรวจสอบการเชื่อมต่ออีเมล...')
  console.log('')

  try {
    const isConnected = await verifyEmailConnection()
    console.log('')

    if (!isConnected) {
      console.error('❌ ไม่สามารถเชื่อมต่อกับ email server ได้')
      console.log('')
      console.log('💡 วิธีแก้ไข:')
      console.log('1. ตรวจสอบว่า EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS ถูกต้องใน .env file')
      console.log('')
      console.log('2. สำหรับ CMU email (Office 365) ใช้:')
      console.log('   EMAIL_HOST=smtp.office365.com')
      console.log('   EMAIL_PORT=587')
      console.log('   EMAIL_USER=your_email@cmu.ac.th')
      console.log('   EMAIL_PASS=your_app_password')
      console.log('   EMAIL_FROM=your_email@cmu.ac.th')
      console.log('')
      console.log('3. สำหรับ Office 365 อาจต้องใช้ App Password แทน password ปกติ')
      console.log('   วิธีสร้าง App Password: https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944')
      console.log('')
      console.log('4. หรือลองใช้ SMTP server ของ CMU (ถ้ามี):')
      console.log('   EMAIL_HOST=smtp.cmu.ac.th')
      console.log('   EMAIL_PORT=587')
      process.exit(1)
    }

    console.log('✅ เชื่อมต่อกับ email server สำเร็จ')
    console.log(`📧 กำลังส่งอีเมลทดสอบไปยัง ${testEmail}...`)
    console.log('')

    await sendTestEmail(testEmail)
    console.log('')
    console.log('✅ ส่งอีเมลสำเร็จ!')
    console.log(`📬 กรุณาตรวจสอบ inbox ของ ${testEmail}`)
    console.log('💡 หากไม่พบอีเมล กรุณาตรวจสอบใน Junk/Spam folder')
  } catch (err) {
    console.log('')
    console.error('❌ ไม่สามารถส่งอีเมลได้:', err.message)
    console.log('')
    console.log('💡 วิธีแก้ไข:')
    console.log('1. ตรวจสอบว่า email และ password ถูกต้อง')
    console.log('2. สำหรับ CMU email (Office 365) อาจต้องใช้ App Password แทน password ปกติ')
    console.log('3. ตรวจสอบว่า firewall หรือ antivirus ไม่ได้บล็อกการส่งอีเมล')
    console.log('4. ลองเปลี่ยน EMAIL_PORT เป็น 465 และตั้งค่า secure: true')
    console.log('')
    console.log('📝 Error details:')
    console.error(err)
    process.exit(1)
  }
}

test()
