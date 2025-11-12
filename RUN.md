# 🚀 คำสั่งรัน CMU ShareCycle

## วิธีที่ 1: รันทั้ง Backend และ Frontend พร้อมกัน (แนะนำ)

```bash
# ให้สิทธิ์ execute
chmod +x start.sh

# รันทั้ง backend และ frontend
./start.sh
```

สคริปต์จะ:
- ตรวจสอบและสร้างไฟล์ `.env` อัตโนมัติ
- ติดตั้ง dependencies (ถ้ายังไม่ได้ติดตั้ง)
- รันทั้ง backend และ frontend พร้อมกัน
- สร้าง log files (`backend.log` และ `frontend.log`)

**กด Ctrl+C เพื่อหยุดการทำงาน**

---

## วิธีที่ 2: รันแยกกัน (แนะนำสำหรับการพัฒนา)

### Terminal 1 - Backend

```bash
# วิธีที่ 1: ใช้สคริปต์
chmod +x start-backend.sh
./start-backend.sh

# วิธีที่ 2: รันด้วย npm โดยตรง
cd backend
npm run dev
```

Backend จะรันที่ `http://localhost:4000`

### Terminal 2 - Frontend

```bash
# วิธีที่ 1: ใช้สคริปต์
chmod +x start-frontend.sh
./start-frontend.sh

# วิธีที่ 2: รันด้วย npm โดยตรง
cd frontend
npm start
```

Frontend จะรันที่ `http://localhost:3000`

---

## วิธีที่ 3: รันด้วย npm scripts (Manual)

### Backend

```bash
cd backend

# ตรวจสอบ/สร้างไฟล์ .env
# (แก้ไข DATABASE_URL และ EMAIL settings)

# ติดตั้ง dependencies (ถ้ายังไม่ได้ติดตั้ง)
npm install

# รัน database migration (ถ้ายังไม่ได้รัน)
npm run db:migrate

# รัน server
npm run dev
```

### Frontend

```bash
cd frontend

# ตรวจสอบ/สร้างไฟล์ .env
echo "REACT_APP_API_URL=http://localhost:4000/api" > .env

# ติดตั้ง dependencies (ถ้ายังไม่ได้ติดตั้ง)
npm install

# รัน app
npm start
```

---

## 📋 ขั้นตอนการ Setup ครั้งแรก

### 1. Setup Database

```bash
# ตรวจสอบว่า PostgreSQL ทำงานอยู่
# ตั้งค่า DATABASE_URL ใน backend/.env

cd backend
npm run db:migrate
```

### 2. Setup Environment Variables

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

### 3. ติดตั้ง Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 4. รัน Application

```bash
# ใช้สคริปต์ (แนะนำ)
./start.sh

# หรือรันแยกกัน
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

---

## 🔍 ตรวจสอบสถานะ

### Backend Health Check
```bash
curl http://localhost:4000/health
# ควรได้: {"ok":true}
```

### Frontend
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

---

## 🛑 หยุดการทำงาน

### ถ้ารันด้วยสคริปต์ (start.sh)
- กด `Ctrl+C` ใน terminal ที่รันสคริปต์

### ถ้ารันแยกกัน
- กด `Ctrl+C` ในแต่ละ terminal

### หยุด process ที่รันอยู่
```bash
# หยุด backend (port 4000)
lsof -ti:4000 | xargs kill -9

# หยุด frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

---

## 📝 Logs

### ถ้ารันด้วยสคริปต์ (start.sh)
```bash
# ดู backend log
tail -f backend.log

# ดู frontend log
tail -f frontend.log
```

### ถ้ารันแยกกัน
- Logs จะแสดงใน terminal โดยตรง

---

## ⚠️ Troubleshooting

### Port ถูกใช้งานอยู่แล้ว
```bash
# ตรวจสอบว่า port ถูกใช้งานหรือไม่
lsof -i:4000  # Backend
lsof -i:3000  # Frontend

# หยุด process ที่ใช้ port
lsof -ti:4000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error
- ตรวจสอบว่า PostgreSQL ทำงานอยู่
- ตรวจสอบว่า DATABASE_URL ถูกต้อง
- รัน `npm run db:migrate` อีกครั้ง

### Dependencies ไม่ติดตั้ง
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Environment Variables ไม่ถูกต้อง
- ตรวจสอบว่าไฟล์ `.env` มีอยู่
- ตรวจสอบว่า values ถูกต้อง
- ดูที่ `backend/.env` และ `frontend/.env`

---

## 🚀 Quick Start

```bash
# 1. ให้สิทธิ์ execute
chmod +x start.sh start-backend.sh start-frontend.sh

# 2. รันทั้ง backend และ frontend
./start.sh

# หรือรันแยกกัน
# Terminal 1
./start-backend.sh

# Terminal 2
./start-frontend.sh
```

---

## 📚 ข้อมูลเพิ่มเติม

- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/README.md`
- **Database Schema**: `backend/sql/schema.sql`

