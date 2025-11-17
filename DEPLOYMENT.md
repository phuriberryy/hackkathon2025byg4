# Deployment Guide

คู่มือการ deploy CMU ShareCycle ทั้ง Frontend และ Backend

## Frontend Deployment (GitHub Pages)

Frontend ถูก deploy อัตโนมัติผ่าน GitHub Actions เมื่อ push code ไปยัง `main` branch

### URL
- Production: https://phuriberryy.github.io/hackkathon2025byg4/

### การตั้งค่า

1. **ตั้งค่า GitHub Secrets:**
   - ไปที่: https://github.com/phuriberryy/hackkathon2025byg4/settings/secrets/actions
   - เพิ่ม secret ชื่อ `REACT_APP_API_URL`
   - Value: URL ของ production backend (เช่น `https://your-backend.railway.app/api`)

2. **เปิดใช้งาน GitHub Pages:**
   - ไปที่: https://github.com/phuriberryy/hackkathon2025byg4/settings/pages
   - Source: เลือก "GitHub Actions"

## Backend Deployment

### ตัวเลือกการ Deploy

#### 1. Railway (แนะนำ - ง่ายและฟรี)

**ขั้นตอน:**

1. ไปที่ https://railway.app และ Sign up/Login
2. คลิก "New Project"
3. เลือก "Deploy from GitHub repo"
4. เลือก repository `phuriberryy/hackkathon2025byg4`
5. เลือก "backend" folder
6. Railway จะ detect `railway.json` อัตโนมัติ

**ตั้งค่า Environment Variables:**

1. ไปที่ Project → Variables
2. เพิ่ม variables ต่อไปนี้:

```env
PORT=4000
CLIENT_ORIGINS=http://localhost:3000,https://phuriberryy.github.io
DATABASE_URL=<your_database_url>
JWT_SECRET=<your_jwt_secret_min_16_chars>
```

**ตั้งค่า Database:**

1. คลิก "New" → "Database" → "PostgreSQL"
2. Railway จะสร้าง database และตั้งค่า `DATABASE_URL` อัตโนมัติ
3. Run migrations:
   - ไปที่ "Deployments" → คลิก deployment ล่าสุด
   - เปิด "Shell"
   - รัน: `npm run db:migrate`

**Copy Backend URL:**

1. ไปที่ "Settings" → "Networking"
2. คลิก "Generate Domain"
3. Copy URL (เช่น `https://cmu-sharecycle-production.up.railway.app`)
4. ใช้ URL นี้เป็น `REACT_APP_API_URL` ใน GitHub Secrets (เพิ่ม `/api` ต่อท้าย)

---

#### 2. Render

**ขั้นตอน:**

1. ไปที่ https://render.com และ Sign up/Login
2. คลิก "New" → "Web Service"
3. Connect GitHub repository: `phuriberryy/hackkathon2025byg4`
4. ตั้งค่า:
   - **Name:** `cmu-sharecycle-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`

**ตั้งค่า Environment Variables:**

1. ไปที่ "Environment" tab
2. เพิ่ม variables:

```env
NODE_ENV=production
PORT=4000
CLIENT_ORIGINS=http://localhost:3000,https://phuriberryy.github.io
DATABASE_URL=<your_database_url>
JWT_SECRET=<your_jwt_secret_min_16_chars>
```

**ตั้งค่า Database:**

1. คลิก "New" → "PostgreSQL"
2. Render จะสร้าง database และตั้งค่า `DATABASE_URL` อัตโนมัติ
3. Run migrations:
   - ไปที่ "Shell" tab
   - รัน: `npm run db:migrate`

**Copy Backend URL:**

1. ไปที่ "Settings" → "Custom Domain" หรือใช้ default URL
2. Copy URL (เช่น `https://cmu-sharecycle-backend.onrender.com`)
3. ใช้ URL นี้เป็น `REACT_APP_API_URL` ใน GitHub Secrets (เพิ่ม `/api` ต่อท้าย)

---

#### 3. Heroku

**ขั้นตอน:**

1. ไปที่ https://heroku.com และ Sign up/Login
2. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
3. Login: `heroku login`
4. สร้าง app: `heroku create cmu-sharecycle-backend`
5. Deploy: `git subtree push --prefix backend heroku main`

**ตั้งค่า Environment Variables:**

```bash
heroku config:set CLIENT_ORIGINS="http://localhost:3000,https://phuriberryy.github.io"
heroku config:set DATABASE_URL="<your_database_url>"
heroku config:set JWT_SECRET="<your_jwt_secret_min_16_chars>"
```

**ตั้งค่า Database:**

1. เพิ่ม PostgreSQL addon: `heroku addons:create heroku-postgresql:mini`
2. Heroku จะตั้งค่า `DATABASE_URL` อัตโนมัติ
3. Run migrations: `heroku run npm run db:migrate --prefix backend`

**Copy Backend URL:**

- URL จะเป็น: `https://cmu-sharecycle-backend.herokuapp.com`
- ใช้ URL นี้เป็น `REACT_APP_API_URL` ใน GitHub Secrets (เพิ่ม `/api` ต่อท้าย)

---

## หลัง Deploy Backend

### 1. อัปเดต Frontend API URL

1. ไปที่: https://github.com/phuriberryy/hackkathon2025byg4/settings/secrets/actions
2. แก้ไข `REACT_APP_API_URL` ให้ชี้ไปที่ production backend
3. Push code ใหม่เพื่อ trigger rebuild

### 2. ตรวจสอบการทำงาน

1. เปิด https://phuriberryy.github.io/hackkathon2025byg4/
2. เปิด Browser Console (F12)
3. ตรวจสอบว่าไม่มี CORS errors
4. ทดสอบ Login/Register

---

## Troubleshooting

### CORS Error

**ปัญหา:** `Access to fetch at '...' has been blocked by CORS policy`

**แก้ไข:**
- ตรวจสอบว่า `CLIENT_ORIGINS` ใน backend รวม `https://phuriberryy.github.io`
- Restart backend server

### Database Connection Error

**ปัญหา:** `Database connection failed`

**แก้ไข:**
- ตรวจสอบว่า `DATABASE_URL` ถูกต้อง
- ตรวจสอบว่า database server ทำงานอยู่
- Run migrations: `npm run db:migrate`

### Frontend ไม่เชื่อมต่อ Backend

**ปัญหา:** Frontend ยังเรียก `localhost:4000`

**แก้ไข:**
- ตรวจสอบว่า `REACT_APP_API_URL` ถูกตั้งค่าใน GitHub Secrets
- Push code ใหม่เพื่อ trigger rebuild

---

## Environment Variables Reference

### Backend

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `4000` |
| `CLIENT_ORIGINS` | Yes | Comma-separated allowed origins | `http://localhost:3000,https://phuriberryy.github.io` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Yes | Secret key for JWT (min 16 chars) | `your-super-secret-key` |
| `EMAIL_HOST` | No | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | No | SMTP port | `587` |
| `EMAIL_USER` | No | SMTP username | `your-email@gmail.com` |
| `EMAIL_PASS` | No | SMTP password | `your-app-password` |
| `EMAIL_FROM` | No | From email address | `noreply@example.com` |

### Frontend

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `REACT_APP_API_URL` | Yes | Backend API URL | `https://your-backend.railway.app/api` |

---

## Quick Start Checklist

- [ ] Deploy backend ไปยัง Railway/Render/Heroku
- [ ] ตั้งค่า environment variables ใน backend
- [ ] Run database migrations
- [ ] Copy backend URL
- [ ] ตั้งค่า `REACT_APP_API_URL` ใน GitHub Secrets
- [ ] เปิดใช้งาน GitHub Pages
- [ ] ทดสอบการทำงาน

---

## Support

ถ้ามีปัญหาการ deploy ติดต่อทีมพัฒนาได้ที่ GitHub Issues

