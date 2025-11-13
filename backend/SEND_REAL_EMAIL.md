# 📧 คู่มือส่งอีเมลจริง

## 🎯 เป้าหมาย
ส่งอีเมลจริงไปยัง `phurichaya_lamsawat@cmu.ac.th` เมื่อมีคนกด "Exchange Item"

---

## ⚙️ วิธีที่ 1: ใช้ Gmail SMTP (แนะนำ - ง่ายที่สุด)

### ขั้นตอนที่ 1: สร้าง App Password สำหรับ Gmail

1. ไปที่ https://myaccount.google.com/
2. ไปที่ **Security** → **2-Step Verification** (ต้องเปิดก่อน)
3. ไปที่ **App passwords**
4. เลือก **Mail** และ **Other (Custom name)**
5. ตั้งชื่อ: `CMU ShareCycle`
6. คลิก **Generate**
7. **คัดลอก App Password** (16 ตัวอักษร)

### ขั้นตอนที่ 2: ตั้งค่าในไฟล์ `.env`

เปิดไฟล์ `.env` ในโฟลเดอร์ `backend/` และเพิ่มหรือแก้ไข:

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password_16_chars
EMAIL_FROM=your_gmail@gmail.com
```

**ตัวอย่าง:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=yourname@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=yourname@gmail.com
```

### ขั้นตอนที่ 3: ทดสอบการส่งอีเมล

```bash
cd /Users/pmykingg/Documents/project/hackkathon2025byg4/backend
npm run test:email phurichaya_lamsawat@cmu.ac.th
```

---

## ⚙️ วิธีที่ 2: ใช้ SendGrid (ฟรี - ไม่ต้องใช้ App Password)

### ขั้นตอนที่ 1: สร้างบัญชี SendGrid

1. ไปที่ https://signup.sendgrid.com/
2. สร้างบัญชีฟรี (ได้ 100 อีเมล/วัน)
3. ไปที่ **Settings** → **API Keys**
4. สร้าง API Key ใหม่
5. **คัดลอก API Key**

### ขั้นตอนที่ 2: ตั้งค่าในไฟล์ `.env`

```env
# Email Configuration (SendGrid)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_FROM=your_verified_email@example.com
```

---

## ⚙️ วิธีที่ 3: ใช้ Mailtrap (สำหรับ Testing)

1. ไปที่ https://mailtrap.io/
2. สร้างบัญชีฟรี
3. ไปที่ **Inboxes** → **SMTP Settings**
4. คัดลอกข้อมูล SMTP

```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_username
EMAIL_PASS=your_mailtrap_password
EMAIL_FROM=noreply@cmusharecycle.com
```

---

## 🚀 หลังจากตั้งค่าแล้ว

### 1. รีสตาร์ท Backend Server

```bash
cd /Users/pmykingg/Documents/project/hackkathon2025byg4/backend
npm run dev
```

คุณจะเห็น:
```
📧 กำลังตรวจสอบ Email Service...
✅ Email server is ready to send messages
   Host: smtp.gmail.com
   Port: 587
   User: your_gmail@gmail.com
```

### 2. ทดสอบการส่งอีเมล

```bash
npm run test:email phurichaya_lamsawat@cmu.ac.th
```

### 3. ทดสอบการสร้าง Exchange Request

1. Login เป็น User A
2. โพสต์สินค้า
3. Login เป็น User B
4. กด "Exchange Item"
5. ตรวจสอบ inbox ของ `phurichaya_lamsawat@cmu.ac.th`

---

## 🔍 ตรวจสอบว่า Email ถูกส่ง

### ดู Log ใน Terminal

```
✅ Email sent successfully: <message-id>
   To: phurichaya_lamsawat@cmu.ac.th
   Subject: มีคำขอแลกเปลี่ยนใหม่บน CMU ShareCycle
```

### ตรวจสอบ Inbox

- ตรวจสอบ inbox ของ `phurichaya_lamsawat@cmu.ac.th`
- ตรวจสอบ Spam/Junk folder

---

## 🐛 แก้ไขปัญหา

### Error: "Authentication failed"

**แก้ไข:**
- ตรวจสอบว่าใช้ **App Password** (ไม่ใช่ password ปกติ)
- สำหรับ Gmail: ต้องเปิด 2-Step Verification ก่อน

### Error: "Connection failed"

**แก้ไข:**
- ตรวจสอบ EMAIL_HOST และ EMAIL_PORT
- ตรวจสอบ network connection

### Error: "Email not sent"

**แก้ไข:**
- ตรวจสอบ log ใน terminal
- ตรวจสอบว่า email config ถูกต้อง
- ลองใช้ service อื่น (SendGrid, Mailtrap)

---

## 📝 Checklist

- [ ] เลือก email service (Gmail/SendGrid/Mailtrap)
- [ ] สร้าง App Password หรือ API Key
- [ ] ตั้งค่าในไฟล์ `.env`
- [ ] ทดสอบ: `npm run test:email phurichaya_lamsawat@cmu.ac.th`
- [ ] ตรวจสอบ inbox
- [ ] ทดสอบการสร้าง Exchange Request

---

## 🎯 สรุป

**วิธีที่ง่ายที่สุด:** ใช้ Gmail SMTP
1. สร้าง App Password
2. ตั้งค่าใน `.env`
3. ทดสอบการส่งอีเมล

**อีเมลจะถูกส่งไปยัง:** `phurichaya_lamsawat@cmu.ac.th` เมื่อมีคนกด "Exchange Item"

