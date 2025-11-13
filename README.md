# CMU ShareCycle

เว็บแอปพลิเคชันสำหรับแลกเปลี่ยนสินค้าระหว่างนักศึกษามหาวิทยาลัยเชียงใหม่ (CMU ShareCycle) - ระบบแลกเปลี่ยนสินค้าแบบยั่งยืนสำหรับชุมชน CMU

## 🚀 Quick Start

### 1. ไปที่โฟลเดอร์โปรเจ็กต์

```bash
cd hackkathon2025byg4
```

### 2. รันทั้ง Backend และ Frontend

```bash
npm start
# หรือ
./start.sh
```

### 3. รันแยกกัน

```bash
# Terminal 1 - Backend
npm run start:backend
# หรือ
./start-backend.sh

# Terminal 2 - Frontend
npm run start:frontend
# หรือ
./start-frontend.sh
```

## 📋 คำสั่งที่มีให้

```bash
npm start              # รันทั้ง backend และ frontend
npm run start:backend  # รัน backend เท่านั้น (port 4000)
npm run start:frontend # รัน frontend เท่านั้น (port 3000)
npm run install:all    # ติดตั้ง dependencies ทั้ง backend และ frontend
npm run setup          # Setup ทั้งหมด (install + echo)
```

## ⚠️ สิ่งที่ต้องทำก่อนรัน

### 1. Setup Database

```bash
cd backend

# ตรวจสอบ/สร้างไฟล์ .env
# แก้ไข DATABASE_URL ให้ถูกต้อง

# รัน migration
npm run db:migrate
```

### 2. ตรวจสอบ Environment Variables

#### Backend (.env)
```env
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/sharecycle
JWT_SECRET=your-secret-key-min-16-characters
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=CMU ShareCycle <your-email@gmail.com>
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:4000/api
```

## 📍 URLs

- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:3000
- **Health Check**: http://localhost:4000/health

## 📚 เอกสารเพิ่มเติม

- **QUICK_START.md** - คู่มือเริ่มต้นใช้งานแบบเร็ว
- **RUN.md** - คู่มือการรันแบบละเอียด
- **backend/README.md** - ข้อมูล Backend
- **frontend/README.md** - ข้อมูล Frontend

## 🛑 หยุดการทำงาน

กด `Ctrl+C` ใน terminal ที่รันอยู่

## 📝 หมายเหตุ

**สำคัญ**: ต้องอยู่ในโฟลเดอร์ `hackkathon2025byg4` ก่อนรันคำสั่ง npm

```bash
# ❌ ผิด
cd /Users/pmykingg/Documents/project
npm run start:backend

# ✅ ถูก
cd /Users/pmykingg/Documents/project/hackkathon2025byg4
npm run start:backend
```

## 🤝 การมีส่วนร่วม

โปรเจ็กต์นี้เป็นส่วนหนึ่งของโครงการ Hackathon 2025 โดยทีม G4

## 📄 License

Private - สำหรับใช้งานภายในมหาวิทยาลัยเชียงใหม่เท่านั้น




