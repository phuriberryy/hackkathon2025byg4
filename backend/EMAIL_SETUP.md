# คู่มือการตั้งค่าและทดสอบอีเมลสำหรับ CMU ShareCycle

## 📧 การตั้งค่า Email สำหรับ CMU (@cmu.ac.th)

### 1. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/` และเพิ่มการตั้งค่าดังนี้:

#### สำหรับ CMU Email (Office 365) - **แนะนำ**

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your_email@cmu.ac.th
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@cmu.ac.th
```

**หมายเหตุ:**
- สำหรับ Office 365 อาจต้องใช้ **App Password** แทน password ปกติ
- วิธีสร้าง App Password: https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944
- หรือตั้งค่าใน Microsoft 365 Admin Center: Security → App passwords

#### สำหรับ CMU Email (SMTP) - **ถ้ามี**

```env
EMAIL_HOST=smtp.cmu.ac.th
EMAIL_PORT=587
EMAIL_USER=your_email@cmu.ac.th
EMAIL_PASS=your_password
EMAIL_FROM=your_email@cmu.ac.th
```

### 2. วิธีทดสอบการส่งอีเมล

#### วิธีที่ 1: ใช้ Test Script (แนะนำ) ⭐

```bash
cd backend
npm run test:email your_email@cmu.ac.th
```

**ตัวอย่าง:**
```bash
npm run test:email john.doe@cmu.ac.th
```

**ผลลัพธ์ที่คาดหวัง:**
```
🔍 กำลังตรวจสอบการเชื่อมต่ออีเมล...

✅ Email server is ready to send messages
   Host: smtp.office365.com
   Port: 587
   User: your_email@cmu.ac.th

✅ เชื่อมต่อกับ email server สำเร็จ
📧 กำลังส่งอีเมลทดสอบไปยัง john.doe@cmu.ac.th...

✅ Email sent successfully: <message-id>
   To: john.doe@cmu.ac.th
   Subject: ทดสอบการส่งอีเมลจาก CMU ShareCycle

✅ ส่งอีเมลสำเร็จ!
📬 กรุณาตรวจสอบ inbox ของ john.doe@cmu.ac.th
💡 หากไม่พบอีเมล กรุณาตรวจสอบใน Junk/Spam folder
```

#### วิธีที่ 2: ใช้ API Endpoint

1. **เริ่ม backend server:**
```bash
cd backend
npm run dev
```

2. **ส่ง POST request ไปที่ `/api/email/test`:**

**ใช้ curl:**
```bash
curl -X POST http://localhost:4000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your_email@cmu.ac.th",
    "subject": "ทดสอบการส่งอีเมล",
    "html": "<h1>Hello from CMU ShareCycle!</h1>"
  }'
```

**ใช้ Postman/Thunder Client:**
- **URL**: `POST http://localhost:4000/api/email/test`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "to": "your_email@cmu.ac.th",
  "subject": "ทดสอบการส่งอีเมล",
  "html": "<h1>Hello from CMU ShareCycle!</h1>"
}
```

#### วิธีที่ 3: ทดสอบอีเมลแจ้งเตือนต่างๆ

**ทดสอบอีเมลแจ้งเตือนคำขอแลกเปลี่ยน:**
```bash
curl -X POST http://localhost:4000/api/email/test-exchange-request \
  -H "Content-Type: application/json" \
  -d '{"to": "your_email@cmu.ac.th"}'
```

**ทดสอบอีเมลแจ้งเตือนการยอมรับคำขอ:**
```bash
curl -X POST http://localhost:4000/api/email/test-exchange-accepted \
  -H "Content-Type: application/json" \
  -d '{"to": "your_email@cmu.ac.th"}'
```

**ทดสอบอีเมลแจ้งเตือนการแลกเปลี่ยนสำเร็จ:**
```bash
curl -X POST http://localhost:4000/api/email/test-exchange-completed \
  -H "Content-Type: application/json" \
  -d '{"to": "your_email@cmu.ac.th"}'
```

### 3. API Endpoints สำหรับทดสอบ

- `POST /api/email/test` - ทดสอบการส่งอีเมลทั่วไป
- `POST /api/email/test-exchange-request` - ทดสอบอีเมลแจ้งเตือนคำขอแลกเปลี่ยน
- `POST /api/email/test-exchange-accepted` - ทดสอบอีเมลแจ้งเตือนการยอมรับคำขอ
- `POST /api/email/test-exchange-completed` - ทดสอบอีเมลแจ้งเตือนการแลกเปลี่ยนสำเร็จ

### 4. ปัญหาที่อาจเกิดขึ้นและวิธีแก้ไข

#### ❌ ปัญหา: Authentication failed (EAUTH)

**สาเหตุ:**
- Email หรือ password ผิด
- ใช้ password ปกติแทน App Password (สำหรับ Office 365)

**วิธีแก้ไข:**
1. ตรวจสอบว่า email และ password ถูกต้อง
2. สำหรับ Office 365 ใช้ **App Password** แทน password ปกติ
3. วิธีสร้าง App Password:
   - เข้า Microsoft Account: https://account.microsoft.com/security
   - ไปที่ Security → Advanced security options
   - คลิก "Create a new app password"
   - ใช้ App Password ที่สร้างใน `EMAIL_PASS`

#### ❌ ปัญหา: Connection failed (ECONNECTION)

**สาเหตุ:**
- EMAIL_HOST หรือ EMAIL_PORT ผิด
- Network connection ไม่ทำงาน

**วิธีแก้ไข:**
1. ตรวจสอบว่า `EMAIL_HOST` และ `EMAIL_PORT` ถูกต้อง
2. สำหรับ Office 365: `smtp.office365.com:587`
3. ตรวจสอบว่า network connection ทำงานปกติ
4. ลองเปลี่ยน port เป็น 465 และตั้งค่า `secure: true`

#### ❌ ปัญหา: Connection timeout (ETIMEDOUT)

**สาเหตุ:**
- Firewall หรือ antivirus บล็อก port
- Network connection ช้า

**วิธีแก้ไข:**
1. ตรวจสอบว่า firewall ไม่ได้บล็อก port 587 หรือ 465
2. ลองปิด antivirus ชั่วคราวเพื่อทดสอบ
3. ตรวจสอบว่า network connection ทำงานปกติ

#### ❌ ปัญหา: Email configuration not found

**สาเหตุ:**
- ไม่มี `.env` file หรือไม่มี EMAIL_* variables

**วิธีแก้ไข:**
1. สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/`
2. เพิ่ม EMAIL_* variables ตามที่ระบุด้านบน

### 5. การตรวจสอบ Logs

เมื่อส่งอีเมลสำเร็จ คุณจะเห็น log:
```
✅ Email sent successfully: <message-id>
   To: your_email@cmu.ac.th
   Subject: ทดสอบการส่งอีเมลจาก CMU ShareCycle
```

เมื่อเกิด error คุณจะเห็น error message พร้อมวิธีแก้ไข

### 6. การตั้งค่าสำหรับ Production

สำหรับ production environment:

1. **ใช้ environment variables ที่ปลอดภัย**
2. **ไม่ควร hardcode credentials ในโค้ด**
3. **ใช้ App Password แทน password ปกติ**
4. **ตั้งค่า rate limiting สำหรับการส่งอีเมล**
5. **ใช้ email service provider (เช่น SendGrid, Mailgun) หากจำเป็น**

### 7. หมายเหตุสำคัญ

- ✅ อีเมลจะส่งได้เฉพาะไปที่ `@cmu.ac.th` เท่านั้น
- ✅ ระบบจะตรวจสอบว่า email address เป็น `@cmu.ac.th` ก่อนส่ง
- ✅ หากไม่ใช่ `@cmu.ac.th` จะเกิด error
- ⚠️ สำหรับ Office 365 อาจต้องใช้ App Password แทน password ปกติ
- ⚠️ ตรวจสอบว่า email ไม่ได้ถูก lock หรือ suspend

### 8. ตัวอย่างการใช้งาน

```bash
# ทดสอบการส่งอีเมล
cd backend
npm run test:email your_email@cmu.ac.th

# หรือใช้ curl
curl -X POST http://localhost:4000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "your_email@cmu.ac.th"}'
```

### 9. สรุป

1. **ตั้งค่า `.env` file** ด้วย EMAIL_* variables
2. **ใช้ App Password** สำหรับ Office 365
3. **ทดสอบการส่งอีเมล** ด้วย `npm run test:email`
4. **ตรวจสอบ inbox** ของ email ที่ระบุ
5. **ตรวจสอบ Junk/Spam folder** หากไม่พบอีเมล

---

## 🚀 เริ่มทดสอบเลย!

```bash
cd backend
npm run test:email your_email@cmu.ac.th
```

Good luck! 🍀
