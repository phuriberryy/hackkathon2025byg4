# 🚀 Quick Start - CMU ShareCycle

## รันด้วยคำสั่งเดียว (แนะนำ)

```bash
cd hackkathon2025byg4

# รันทั้ง backend และ frontend
npm start
# หรือ
./start.sh
```

## รันแยกกัน

```bash
cd hackkathon2025byg4

# Terminal 1 - Backend
npm run start:backend
# หรือ
./start-backend.sh

# Terminal 2 - Frontend
npm run start:frontend
# หรือ
./start-frontend.sh
```

## คำสั่งที่มีให้

```bash
npm start              # รันทั้ง backend และ frontend
npm run start:backend  # รัน backend เท่านั้น
npm run start:frontend # รัน frontend เท่านั้น
npm run install:all    # ติดตั้ง dependencies ทั้ง backend และ frontend
npm run setup          # Setup ทั้งหมด (install + echo)
```

## สิ่งที่ต้องทำก่อนรัน

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

## URLs

- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:3000
- **Health Check**: http://localhost:4000/health

## หยุดการทำงาน

กด `Ctrl+C` ใน terminal ที่รันอยู่

## ดูรายละเอียดเพิ่มเติม

- **RUN.md** - คู่มือการรันแบบละเอียด
- **backend/README.md** - ข้อมูล Backend
- **frontend/README.md** - ข้อมูล Frontend

