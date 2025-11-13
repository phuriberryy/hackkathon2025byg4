# 🔔 คู่มือ: Exchange Request → Notification → Email

## ✅ สิ่งที่ทำงานอยู่แล้ว

เมื่อผู้ใช้กด **"Exchange Item"** ในฟีด ระบบจะ:

1. ✅ สร้างคำขอแลกเปลี่ยน (exchange request) ใน database
2. ✅ สร้าง notification สำหรับเจ้าของโพสต์
3. ✅ ส่งอีเมลไปยังเจ้าของโพสต์ที่อีเมล @cmu.ac.th

---

## 📋 Flow การทำงาน

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │  ────>  │   Backend   │  ────>  │  Database   │  ────>  │    Email    │
│  Exchange   │  POST   │  Exchange   │  INSERT │ Notifications│  SEND   │   Service   │
│   Button    │         │ Controller  │         │   Table     │         │  (SMTP)     │
└─────────────┘         └─────────────┘         └─────────────┘         └─────────────┘
```

### ขั้นตอนที่ 1: ผู้ใช้กด Exchange Item

**Frontend** (`ExchangeRequestModal.jsx`):
```javascript
await exchangeApi.request(token, { itemId, message })
```

### ขั้นตอนที่ 2: Backend สร้าง Exchange Request

**Backend** (`exchangeController.js` - `createExchangeRequest`):
```javascript
// 1. สร้าง exchange request
const exchangeResult = await query(
  `INSERT INTO exchange_requests (item_id, requester_id, message)
   VALUES ($1,$2,$3)`,
  [itemId, req.user.id, message]
)

// 2. สร้าง notification สำหรับเจ้าของโพสต์
await query(
  `INSERT INTO notifications (user_id, title, body, type, metadata)
   VALUES ($1,$2,$3,$4,$5)`,
  [
    item.user_id,  // เจ้าของโพสต์
    'มีคำขอแลกเปลี่ยนใหม่',
    `${req.user.name} ขอแลกเปลี่ยนสำหรับ "${item.title}"`,
    'exchange_request',
    JSON.stringify({ exchangeRequestId: exchangeRequest.id, itemId, requesterId: req.user.id }),
  ]
)

// 3. ส่งอีเมลไปยังเจ้าของโพสต์
await sendEmail({
  to: item.email,  // อีเมล @cmu.ac.th ของเจ้าของโพสต์
  subject: 'มีคำขอแลกเปลี่ยนใหม่บน CMU ShareCycle',
  html: `...`
})
```

### ขั้นตอนที่ 3: Notification แสดงใน Frontend

**Frontend** (`NotificationsModal.jsx`):
- ดึง notifications จาก API: `GET /api/notifications`
- แสดง notification ที่มี type = `exchange_request`
- คลิกเพื่อไปดูรายละเอียด exchange request

---

## ⚙️ การตั้งค่า Email

### วิธีที่ 1: ใช้สคริปต์ช่วยตั้งค่า (แนะนำ)

รันคำสั่งนี้แล้วสคริปต์จะถามข้อมูลทีละขั้นตอน:

```bash
cd /Users/pmykingg/Documents/project/hackkathon2025byg4/backend
npm run email:setup
```

สคริปต์จะถาม:
- **Email Host**: กด Enter (ใช้ `smtp.office365.com`)
- **Email Port**: กด Enter (ใช้ `587`)
- **Email User**: ใส่อีเมลของคุณ เช่น `your_email@cmu.ac.th`
- **Email Password**: ใส่ **App Password** (ไม่ใช่ password ปกติ!)
- **Email From**: กด Enter (ใช้ email เดียวกับ Email User)

สคริปต์จะ:
- อัพเดทหรือสร้างไฟล์ `.env` ให้อัตโนมัติ
- แสดงข้อมูลที่ตั้งค่า
- ถามว่าต้องการทดสอบการส่งอีเมลหรือไม่

### วิธีที่ 2: ตั้งค่าในไฟล์ `.env` เอง

เปิดไฟล์ `.env` ในโฟลเดอร์ `backend/` และเพิ่มหรือแก้ไข:

```env
# Email Configuration (สำหรับ CMU Office 365)
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your_email@cmu.ac.th
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@cmu.ac.th
```

**⚠️ สำคัญ:** 
- แทนที่ `your_email@cmu.ac.th` ด้วยอีเมลจริงของคุณ
- แทนที่ `your_app_password` ด้วย **App Password** (ไม่ใช่ password ปกติ!)

### 3. สำหรับ CMU Email (Office 365)

**สำคัญ:** ต้องใช้ **App Password** แทน password ปกติ!

**วิธีสร้าง App Password:**
1. ไปที่ https://account.microsoft.com/security
2. เปิด **Two-step verification**
3. ไปที่ **App passwords**
4. สร้าง App Password ใหม่
5. ใช้ App Password นี้ใน `EMAIL_PASS`

### 4. ทดสอบการส่งอีเมล

หลังจากตั้งค่าแล้ว ทดสอบการส่งอีเมล:

```bash
cd /Users/pmykingg/Documents/project/hackkathon2025byg4/backend
npm run test:email your_email@cmu.ac.th
```

ถ้าสำเร็จจะเห็น:
```
✅ Email sent successfully!
📬 กรุณาตรวจสอบ inbox ของ your_email@cmu.ac.th
```

---

## 🔍 ตรวจสอบว่า Notification ทำงาน

### 1. ตรวจสอบใน Database

```bash
psql -U pmykingg -d "cmu sharecycle"

# ดู notifications
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

# ดู exchange requests
SELECT * FROM exchange_requests ORDER BY created_at DESC LIMIT 10;
```

### 2. ตรวจสอบใน Frontend

1. Login เป็นเจ้าของโพสต์
2. ดูที่ปุ่มกระดิ่ง (Bell icon)
3. ควรเห็น notification "มีคำขอแลกเปลี่ยนใหม่"

### 3. ตรวจสอบ Email

- ตรวจสอบ inbox ของอีเมล @cmu.ac.th
- ตรวจสอบ Spam/Junk folder
- ดู log ใน backend terminal

---

## 🐛 แก้ไขปัญหา

### ปัญหา: ไม่เห็น Notification

**ตรวจสอบ:**
1. ตรวจสอบว่า notification ถูกสร้างใน database หรือไม่
2. ตรวจสอบว่า frontend เรียก API `/api/notifications` หรือไม่
3. ตรวจสอบ console ใน browser ว่ามี error หรือไม่

### ปัญหา: ไม่ได้รับ Email

**ตรวจสอบ:**
1. ตรวจสอบว่า email config ถูกตั้งค่าใน `.env` หรือไม่
2. ตรวจสอบว่า email เป็น @cmu.ac.th หรือไม่
3. ตรวจสอบ log ใน backend terminal
4. ทดสอบการส่งอีเมล: `npm run test:email your_email@cmu.ac.th`

### ปัญหา: Email Error

**Error: "Email configuration not found"**
- ตรวจสอบว่า EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_FROM ถูกตั้งค่าใน `.env`

**Error: "Authentication failed"**
- ตรวจสอบว่าใช้ App Password หรือไม่ (ไม่ใช่ password ปกติ)
- ตรวจสอบว่า EMAIL_USER และ EMAIL_PASS ถูกต้อง

**Error: "Connection failed"**
- ตรวจสอบว่า EMAIL_HOST และ EMAIL_PORT ถูกต้อง
- สำหรับ CMU: `smtp.office365.com:587`

---

## 📝 Checklist

- [ ] ตั้งค่า EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_FROM ใน `.env`
- [ ] สร้าง App Password สำหรับ CMU email
- [ ] ทดสอบการส่งอีเมล: `npm run test:email your_email@cmu.ac.th`
- [ ] ทดสอบการสร้าง exchange request
- [ ] ตรวจสอบว่า notification ถูกสร้างใน database
- [ ] ตรวจสอบว่า notification แสดงใน frontend
- [ ] ตรวจสอบว่า email ถูกส่งไปยังเจ้าของโพสต์

---

## 🎯 สรุป

**สิ่งที่ทำงาน:**
- ✅ สร้าง exchange request
- ✅ สร้าง notification
- ✅ ส่งอีเมล

**สิ่งที่ต้องทำ:**
- ⚙️ ตั้งค่า email ใน `.env`
- 🧪 ทดสอบการส่งอีเมล
- 🔍 ตรวจสอบว่า notification แสดงใน frontend

---

## 📚 เอกสารเพิ่มเติม

- `EMAIL_SETUP.md` - คู่มือตั้งค่า email แบบละเอียด
- `HOW_IT_WORKS.md` - อธิบาย flow การทำงานของระบบ

