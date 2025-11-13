# 🗄️ คู่มือการเชื่อมต่อฐานข้อมูล PostgreSQL

## ขั้นตอนที่ 1: สร้างฐานข้อมูลใน PostgreSQL

### วิธีที่ 1: ใช้ pgAdmin4 (แนะนำสำหรับผู้เริ่มต้น)

1. เปิด pgAdmin4
2. คลิกขวาที่ **Servers** → **Create** → **Server**
3. ตั้งค่า:
   - **Name**: `Local PostgreSQL` (หรือชื่อที่คุณต้องการ)
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Maintenance database**: `postgres`
   - **Username**: `postgres` (หรือ username ของคุณ)
   - **Password**: รหัสผ่านที่คุณตั้งไว้ตอนติดตั้ง PostgreSQL
4. คลิก **Save**
5. ขยาย **Servers** → **Local PostgreSQL** → **Databases**
6. คลิกขวาที่ **Databases** → **Create** → **Database**
7. ตั้งค่า:
   - **Database**: `sharecycle`
   - **Owner**: `postgres` (หรือ username ของคุณ)
8. คลิก **Save**

### วิธีที่ 2: ใช้ Command Line (Terminal)

```bash
# เชื่อมต่อกับ PostgreSQL
psql postgres

# สร้างฐานข้อมูล
CREATE DATABASE sharecycle;

# ออกจาก psql
\q
```

## ขั้นตอนที่ 2: สร้างไฟล์ .env

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/`:

```bash
cd /Users/pmykingg/Documents/project/hackkathon2025byg4/backend
touch .env
```

จากนั้นเปิดไฟล์ `.env` และใส่ข้อมูลดังนี้:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/sharecycle
JWT_SECRET=your-super-secret-jwt-key-min-16-characters-long
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=CMU ShareCycle <your-email@gmail.com>
```

### ⚠️ หมายเหตุสำคัญ:

1. **DATABASE_URL** - แก้ไขตามข้อมูลของคุณ:
   - `postgres` = username ของคุณ (ถ้าไม่ใช่ postgres ให้เปลี่ยน)
   - `your_password` = รหัสผ่าน PostgreSQL ของคุณ
   - `localhost` = host (ถ้าใช้ remote database ให้เปลี่ยน)
   - `5432` = port (default ของ PostgreSQL)
   - `sharecycle` = ชื่อฐานข้อมูลที่สร้างไว้

   **รูปแบบ DATABASE_URL:**
   ```
   postgresql://username:password@host:port/database_name
   ```

2. **JWT_SECRET** - ต้องมีความยาวอย่างน้อย 16 ตัวอักษร (แนะนำให้ใช้ random string ยาวๆ)

3. **EMAIL_*** - ถ้ายังไม่ต้องการใช้ email service ตอนนี้ สามารถเว้นว่างไว้ก่อนได้

## ขั้นตอนที่ 3: รัน Migration เพื่อสร้างตาราง

หลังจากตั้งค่า `.env` แล้ว ให้รันคำสั่ง:

```bash
cd /Users/pmykingg/Documents/project/hackkathon2025byg4/backend
npm run db:migrate
```

ถ้าสำเร็จจะเห็นข้อความ:
```
Database migrated successfully
```

## ขั้นตอนที่ 4: ตรวจสอบการเชื่อมต่อ

### วิธีที่ 1: ใช้ pgAdmin4

1. เปิด pgAdmin4
2. ขยาย **Servers** → **Local PostgreSQL** → **Databases** → **sharecycle** → **Schemas** → **public** → **Tables**
3. คุณควรเห็นตารางต่างๆ เช่น:
   - `users`
   - `items`
   - `exchange_requests`
   - `chats`
   - `messages`
   - `notifications`
   - `exchange_history`

### วิธีที่ 2: ใช้ Command Line

```bash
# เชื่อมต่อกับฐานข้อมูล sharecycle
psql -d sharecycle

# ดูรายการตาราง
\dt

# ออกจาก psql
\q
```

### วิธีที่ 3: รัน Server และดู Log

```bash
cd /Users/pmykingg/Documents/project/hackkathon2025byg4/backend
npm run dev
```

ถ้าเชื่อมต่อฐานข้อมูลสำเร็จ จะเห็น log แสดงว่า server รันอยู่ที่ `http://localhost:4000`

## 🔧 แก้ไขปัญหา (Troubleshooting)

### ปัญหา: "password authentication failed"

**แก้ไข:**
1. ตรวจสอบ username และ password ใน `.env`
2. ถ้าลืมรหัสผ่าน PostgreSQL:
   ```bash
   # macOS - หยุด PostgreSQL
   brew services stop postgresql@14
   
   # เริ่ม PostgreSQL ในโหมด single-user
   postgres --single -D /usr/local/var/postgres
   
   # ใน PostgreSQL prompt:
   ALTER USER postgres WITH PASSWORD 'new_password';
   ```

### ปัญหา: "database does not exist"

**แก้ไข:**
- ตรวจสอบว่าสร้างฐานข้อมูล `sharecycle` แล้วหรือยัง
- ตรวจสอบชื่อฐานข้อมูลใน `DATABASE_URL` ว่าตรงกับที่สร้างไว้

### ปัญหา: "connection refused"

**แก้ไข:**
1. ตรวจสอบว่า PostgreSQL กำลังรันอยู่:
   ```bash
   # macOS
   brew services list
   # หรือ
   pg_isready
   ```

2. ถ้าไม่ได้รัน ให้เริ่ม PostgreSQL:
   ```bash
   # macOS
   brew services start postgresql@14
   ```

### ปัญหา: "relation already exists"

**แก้ไข:**
- ตารางถูกสร้างไว้แล้ว ไม่ต้องกังวล
- ถ้าต้องการลบและสร้างใหม่:
  ```bash
  # ระวัง! คำสั่งนี้จะลบข้อมูลทั้งหมด
  psql -d sharecycle -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  npm run db:migrate
  ```

## 📝 ตัวอย่าง DATABASE_URL สำหรับกรณีต่างๆ

### Local PostgreSQL (default)
```
postgresql://postgres:password@localhost:5432/sharecycle
```

### PostgreSQL บน Docker
```
postgresql://postgres:password@localhost:5433/sharecycle
```

### Remote PostgreSQL (เช่น Supabase, Railway, etc.)
```
postgresql://username:password@host.example.com:5432/sharecycle
```

### PostgreSQL with SSL
```
postgresql://username:password@host:5432/sharecycle?sslmode=require
```

## ✅ Checklist

- [ ] ติดตั้ง PostgreSQL แล้ว
- [ ] สร้างฐานข้อมูล `sharecycle` แล้ว
- [ ] สร้างไฟล์ `.env` แล้ว
- [ ] ตั้งค่า `DATABASE_URL` ใน `.env` แล้ว
- [ ] รัน `npm run db:migrate` สำเร็จแล้ว
- [ ] ตรวจสอบตารางใน pgAdmin4 หรือ psql แล้ว
- [ ] รัน server และเชื่อมต่อฐานข้อมูลสำเร็จแล้ว

## 🎉 เสร็จแล้ว!

ตอนนี้โค้ดของคุณเชื่อมต่อกับฐานข้อมูล PostgreSQL แล้ว! คุณสามารถ:
- เริ่มพัฒนา API ได้เลย
- ใช้ pgAdmin4 ดูและจัดการข้อมูล
- รัน server ด้วย `npm run dev`


