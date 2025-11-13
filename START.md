# วิธีการรัน CMU ShareCycle

## 📋 ขั้นตอนการรัน

### 1. Setup Database (ต้องทำก่อน)

```bash
# ตรวจสอบว่า PostgreSQL ทำงานอยู่
# แล้วตั้งค่า DATABASE_URL ใน backend/.env

cd backend
npm run db:migrate
```

### 2. รัน Backend

```bash
cd backend
npm run dev
```

Backend จะรันที่ `http://localhost:4000`

### 3. รัน Frontend (ใน terminal ใหม่)

```bash
cd frontend
npm start
```

Frontend จะรันที่ `http://localhost:3000`

## ⚠️ ข้อควรระวัง

1. **Database**: ต้องมี PostgreSQL database และรัน migration ก่อน
2. **Environment Variables**: ตรวจสอบว่า `.env` files ตั้งค่าถูกต้อง
3. **Ports**: ตรวจสอบว่า port 4000 และ 3000 ว่างอยู่
4. **Email**: ต้องตั้งค่า email service ใน backend/.env (ถ้าต้องการส่งอีเมล)

## 🔍 ตรวจสอบสถานะ

### Backend
```bash
curl http://localhost:4000/health
# ควรได้: {"ok":true}
```

### Frontend
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

## 📝 Environment Variables

### Backend (.env)
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

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:4000/api
```

## 🚀 Quick Start

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🔧 Troubleshooting

### Backend ไม่รัน
- ตรวจสอบว่า database ตั้งค่าถูกต้อง
- ตรวจสอบว่า port 4000 ว่างอยู่
- ดู error log ใน terminal

### Frontend ไม่รัน
- ตรวจสอบว่า backend รันอยู่
- ตรวจสอบว่า port 3000 ว่างอยู่
- ดู error log ใน terminal

### Database Error
- ตรวจสอบว่า PostgreSQL ทำงานอยู่
- ตรวจสอบว่า DATABASE_URL ถูกต้อง
- รัน `npm run db:migrate` อีกครั้ง




