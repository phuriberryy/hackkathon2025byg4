# CMU ShareCycle - Backend

API Server สำหรับระบบแลกเปลี่ยนสินค้าของ CMU ShareCycle - ระบบแลกเปลี่ยนสินค้าแบบยั่งยืนสำหรับชุมชน CMU

## 📖 เกี่ยวกับโปรเจ็กต์

Backend API สำหรับระบบแลกเปลี่ยนสินค้าระหว่างนักศึกษามหาวิทยาลัยเชียงใหม่ โดยให้บริการ REST API และ WebSocket สำหรับการแชทและการแจ้งเตือนแบบ real-time

## 🚀 การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. สร้างไฟล์ Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/`:

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

### 3. Setup Database

รัน migration script เพื่อสร้างตารางในฐานข้อมูล:

```bash
npm run db:migrate
```

## 🎯 การรันแอปพลิเคชัน

### Development Mode

```bash
npm run dev
```

Server จะรันที่ `http://localhost:4000` และจะ reload อัตโนมัติเมื่อมีการแก้ไขไฟล์

### Production Mode

```bash
npm start
```

## 📁 โครงสร้างโปรเจ็กต์

```
src/
├── config/             # Configuration
│   └── env.js         # Environment variables
├── controllers/        # Route controllers
│   ├── authController.js
│   ├── itemController.js
│   ├── exchangeController.js
│   ├── notificationController.js
│   └── chatController.js
├── db/                # Database
│   └── pool.js        # PostgreSQL connection pool
├── middleware/        # Express middleware
│   └── auth.js        # Authentication middleware
├── routes/            # API routes
│   ├── auth.routes.js
│   ├── item.routes.js
│   ├── exchange.routes.js
│   ├── notification.routes.js
│   └── chat.routes.js
├── services/          # Services
│   └── chatService.js # Socket.IO chat service
├── utils/             # Utilities
│   ├── token.js       # JWT token utilities
│   ├── password.js    # Password hashing
│   └── email.js       # Email sending
├── app.js             # Express app
└── server.js          # HTTP server
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - ลงทะเบียนผู้ใช้ใหม่
- `POST /api/auth/login` - เข้าสู่ระบบ

### Items

- `GET /api/items` - ดึงรายการสินค้าทั้งหมด
- `POST /api/items` - โพสต์สินค้าใหม่ (ต้อง authenticated)

### Exchange

- `POST /api/exchange` - ส่งคำขอแลกเปลี่ยนสินค้า (ต้อง authenticated)

### Notifications

- `GET /api/notifications` - ดึงการแจ้งเตือน (ต้อง authenticated)
- `POST /api/notifications/read` - ทำเครื่องหมายว่าอ่านแล้ว (ต้อง authenticated)

### Chats

- `GET /api/chats` - ดึงรายการแชท (ต้อง authenticated)
- `GET /api/chats/:chatId/messages` - ดึงข้อความในแชท (ต้อง authenticated)
- `POST /api/chats` - สร้างแชทใหม่ (ต้อง authenticated)

### Health Check

- `GET /health` - ตรวจสอบสถานะ server

## 🔌 WebSocket Events

### Client → Server

- `chat:join` - เข้าร่วมแชท
- `chat:message` - ส่งข้อความ

### Server → Client

- `chat:message` - รับข้อความใหม่
- `notification:new` - การแจ้งเตือนใหม่

## 🛠 เทคโนโลยีที่ใช้

- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **PostgreSQL** - Database
- **Socket.IO** - WebSocket Library
- **JWT** - Authentication
- **bcryptjs** - Password Hashing
- **Nodemailer** - Email Sending
- **Zod** - Schema Validation
- **express-validator** - Request Validation

## 🔐 Authentication

ระบบใช้ JWT (JSON Web Token) สำหรับการ authentication:

1. ผู้ใช้ login หรือ register
2. Server ส่ง JWT token กลับไป
3. Client ส่ง token ใน header: `Authorization: Bearer <token>`
4. Server verify token และเพิ่มข้อมูล user ใน `req.user`

## 📧 Email Service

ระบบส่งอีเมลเมื่อ:
- ผู้ใช้ลงทะเบียนใหม่ (Welcome email)
- มีคำขอแลกเปลี่ยนใหม่
- มีข้อความใหม่ในแชท

**หมายเหตุ**: ต้องตั้งค่า email service (Gmail, SendGrid, etc.) ใน environment variables

## 🗄 Database Schema

ดูไฟล์ `sql/schema.sql` สำหรับโครงสร้างฐานข้อมูล

### ตารางหลัก

- `users` - ข้อมูลผู้ใช้
- `items` - ข้อมูลสินค้า
- `exchange_requests` - คำขอแลกเปลี่ยน
- `notifications` - การแจ้งเตือน
- `chats` - ข้อมูลแชท
- `messages` - ข้อความในแชท

## 🔧 Scripts

- `npm run dev` - รัน server ในโหมด development (auto-reload)
- `npm start` - รัน server ในโหมด production
- `npm run db:migrate` - รัน database migration

## 📝 หมายเหตุ

- ต้องใช้ PostgreSQL database
- ต้องตั้งค่า email service สำหรับส่งอีเมล
- JWT_SECRET ต้องมีความยาวอย่างน้อย 16 ตัวอักษร
- ระบบรองรับเฉพาะอีเมล @cmu.ac.th

## 🤝 การมีส่วนร่วม

โปรเจ็กต์นี้เป็นส่วนหนึ่งของโครงการ Hackathon 2025 โดยทีม G4

## 📄 License

Private - สำหรับใช้งานภายในมหาวิทยาลัยเชียงใหม่เท่านั้น
