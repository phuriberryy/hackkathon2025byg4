# 📧 Mock Email Service - คู่มือใช้งาน

## ✅ สิ่งที่ทำ

ระบบใช้ **Mock Email Service** โดยอัตโนมัติเมื่อ:
- ไม่มีการตั้งค่า email ใน `.env`
- หรือตั้งค่า `USE_MOCK_EMAIL=true`

**Mock Email จะ:**
- ✅ ดึงอีเมลจาก database (อีเมลที่ผู้ใช้กรอกตอน register)
- ✅ Log อีเมลที่ควรจะส่งออกมาใน console
- ✅ ไม่ส่งอีเมลจริง (ไม่ต้องเชื่อมต่อ SMTP)
- ✅ ทำงานได้ทันทีโดยไม่ต้องตั้งค่า

---

## 🎯 วิธีใช้งาน

### ไม่ต้องตั้งค่าอะไรเลย!

แค่รัน backend server แล้วระบบจะใช้ Mock Email อัตโนมัติ:

```bash
cd /Users/pmykingg/Documents/project/hackkathon2025byg4/backend
npm run dev
```

เมื่อมีคนกด "Exchange Item" ระบบจะ:
1. ✅ ดึงอีเมลจาก database (อีเมลของเจ้าของโพสต์)
2. ✅ Log อีเมลออกมาใน console แบบนี้:

```
📧 ========== MOCK EMAIL (ไม่ส่งจริง) ==========
To: owner@cmu.ac.th
Subject: มีคำขอแลกเปลี่ยนใหม่บน CMU ShareCycle
From: CMU ShareCycle <noreply@cmusharecycle.local>
---
HTML Content:
สวัสดี [ชื่อ], [ชื่อผู้ขอแลก] ขอแลกเปลี่ยนสำหรับสินค้า "[ชื่อสินค้า]" ...
==========================================
```

---

## 📋 Flow การทำงาน

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │  ────>  │   Backend   │  ────>  │  Database   │
│  Exchange   │  POST   │  Exchange   │  SELECT │   Users     │
│   Button    │         │ Controller  │         │   Table     │
└─────────────┘         └─────────────┘         └─────────────┘
                                 │
                                 │ ดึงอีเมล
                                 ▼
                         ┌─────────────┐
                         │  Mock Email │
                         │   Service   │
                         └─────────────┘
                                 │
                                 │ Log ใน Console
                                 ▼
                         ┌─────────────┐
                         │   Console   │
                         │   Output    │
                         └─────────────┘
```

---

## 🔍 ดูอีเมลที่ถูกส่ง

### วิธีที่ 1: ดูใน Terminal/Console

เมื่อมีคนกด "Exchange Item" คุณจะเห็น log ใน terminal:

```
📧 ========== MOCK EMAIL (ไม่ส่งจริง) ==========
To: somchai@cmu.ac.th
Subject: มีคำขอแลกเปลี่ยนใหม่บน CMU ShareCycle
From: CMU ShareCycle <noreply@cmusharecycle.local>
---
HTML Content:
สวัสดี สมชาย, นาย ก ขอแลกเปลี่ยนสำหรับสินค้า "หนังสือเรียน" กรุณาเข้าสู่ระบบเพื่อดูรายละเอียด...
==========================================
```

### วิธีที่ 2: ตรวจสอบใน Database

```bash
psql -U pmykingg -d "cmu sharecycle"

# ดูอีเมลของผู้ใช้
SELECT id, name, email FROM users;

# ดู exchange requests
SELECT er.*, u.email as owner_email 
FROM exchange_requests er
JOIN items i ON er.item_id = i.id
JOIN users u ON i.user_id = u.id
ORDER BY er.created_at DESC;
```

---

## ⚙️ การตั้งค่า (ถ้าต้องการ)

### ใช้ Mock Email (Default - ไม่ต้องตั้งค่า)

**ไม่ต้องทำอะไรเลย!** ระบบจะใช้ Mock Email อัตโนมัติ

### ใช้ Email จริง (ถ้าต้องการ)

ถ้าต้องการส่งอีเมลจริง ตั้งค่าใน `.env`:

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your_email@cmu.ac.th
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@cmu.ac.th
```

หรือตั้งค่า `USE_MOCK_EMAIL=false` เพื่อบังคับใช้ email จริง

---

## 📝 ตัวอย่างการใช้งาน

### 1. ผู้ใช้ A โพสต์สินค้า

```javascript
// ใน database
users: { id: 'uuid-1', name: 'สมชาย', email: 'somchai@cmu.ac.th' }
items: { id: 'uuid-item', user_id: 'uuid-1', title: 'หนังสือเรียน' }
```

### 2. ผู้ใช้ B กด "Exchange Item"

```javascript
// Frontend ส่ง request
POST /api/exchange
{ itemId: 'uuid-item', message: 'ต้องการแลกเปลี่ยนครับ' }
```

### 3. Backend ดึงอีเมลจาก Database

```javascript
// exchangeController.js
const itemResult = await query(
  `SELECT items.title, items.user_id, users.email, users.name
   FROM items
   JOIN users ON items.user_id = users.id
   WHERE items.id=$1`,
  [itemId]
)
// item.email = 'somchai@cmu.ac.th'
```

### 4. Mock Email Log ออกมา

```
📧 ========== MOCK EMAIL (ไม่ส่งจริง) ==========
To: somchai@cmu.ac.th
Subject: มีคำขอแลกเปลี่ยนใหม่บน CMU ShareCycle
...
```

---

## ✅ Checklist

- [x] Mock Email Service พร้อมใช้งาน
- [x] ดึงอีเมลจาก database อัตโนมัติ
- [x] Log อีเมลใน console
- [x] ไม่ต้องตั้งค่า email config
- [x] ทำงานได้ทันที

---

## 🎯 สรุป

**Mock Email Service:**
- ✅ ง่าย - ไม่ต้องตั้งค่าอะไร
- ✅ เร็ว - ไม่ต้องเชื่อมต่อ SMTP
- ✅ ปลอดภัย - ไม่ส่งอีเมลจริง
- ✅ เหมาะสำหรับ Development/Testing

**เมื่อมีคนกด "Exchange Item":**
1. ระบบดึงอีเมลจาก database
2. Log อีเมลออกมาใน console
3. Notification ถูกสร้างใน database
4. Frontend แสดง notification ในปุ่มกระดิ่ง

**พร้อมใช้งานแล้ว!** 🎉

