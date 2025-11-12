# Database Schema - CMU ShareCycle

## 📋 Overview

Schema สำหรับฐานข้อมูล PostgreSQL ของ CMU ShareCycle

## 🗄️ Tables

### 1. users
เก็บข้อมูลผู้ใช้

- `id` - UUID (Primary Key)
- `name` - ชื่อ-นามสกุล
- `faculty` - คณะ/หน่วยงาน
- `email` - อีเมล (Unique)
- `password_hash` - รหัสผ่าน (hashed)
- `avatar_url` - URL รูปโปรไฟล์
- `created_at` - วันที่สร้าง

### 2. items
เก็บข้อมูลสินค้า

- `id` - UUID (Primary Key)
- `user_id` - Foreign Key → users(id)
- `title` - ชื่อสินค้า
- `category` - หมวดหมู่
- `item_condition` - สภาพสินค้า (Like New, Good, Fair)
- `looking_for` - สิ่งที่ต้องการแลก
- `pickup_location` - สถานที่รับ
- `description` - คำอธิบาย
- `available_until` - วันที่หมดอายุ
- `image_url` - URL รูปภาพ
- `status` - สถานะ (active, inactive, exchanged, deleted)
- `created_at` - วันที่สร้าง

### 3. exchange_requests
เก็บข้อมูลคำขอแลกเปลี่ยน

- `id` - UUID (Primary Key)
- `item_id` - Foreign Key → items(id)
- `requester_id` - Foreign Key → users(id)
- `message` - ข้อความ
- `status` - สถานะ (pending, accepted, rejected, completed, cancelled)
- `created_at` - วันที่สร้าง

### 4. chats
เก็บข้อมูลการสนทนา

- `id` - UUID (Primary Key)
- `item_id` - Foreign Key → items(id) (optional)
- `creator_id` - Foreign Key → users(id)
- `participant_id` - Foreign Key → users(id)
- `created_at` - วันที่สร้าง

**Constraint**: `creator_id != participant_id`

### 5. messages
เก็บข้อมูลข้อความ

- `id` - UUID (Primary Key)
- `chat_id` - Foreign Key → chats(id)
- `sender_id` - Foreign Key → users(id)
- `body` - เนื้อหาข้อความ
- `created_at` - วันที่สร้าง

### 6. notifications
เก็บข้อมูลการแจ้งเตือน

- `id` - UUID (Primary Key)
- `user_id` - Foreign Key → users(id)
- `title` - หัวข้อ
- `body` - เนื้อหา
- `metadata` - ข้อมูลเพิ่มเติม (JSONB)
- `read` - อ่านแล้วหรือยัง (boolean)
- `created_at` - วันที่สร้าง

## 🔍 Indexes

### Performance Indexes

- `idx_items_user_id` - สำหรับค้นหาสินค้าของผู้ใช้
- `idx_items_status` - สำหรับกรองตามสถานะ
- `idx_items_created_at` - สำหรับเรียงลำดับตามวันที่
- `idx_items_category` - สำหรับกรองตามหมวดหมู่
- `idx_exchange_requests_item_id` - สำหรับค้นหาคำขอแลกเปลี่ยน
- `idx_exchange_requests_requester_id` - สำหรับค้นหาคำขอของผู้ใช้
- `idx_chats_creator_id` - สำหรับค้นหาแชทของผู้สร้าง
- `idx_chats_participant_id` - สำหรับค้นหาแชทของผู้เข้าร่วม
- `idx_messages_chat_id` - สำหรับค้นหาข้อความในแชท
- `idx_notifications_user_id` - สำหรับค้นหาการแจ้งเตือนของผู้ใช้
- `idx_notifications_read` - สำหรับกรองตามสถานะการอ่าน
- `idx_users_email` - สำหรับค้นหาผู้ใช้ด้วยอีเมล

## 🔒 Constraints

### Data Validation

1. **Chats**: `creator_id != participant_id` - ไม่สามารถแชทกับตัวเองได้
2. **Items**: `item_condition IN ('Like New', 'Good', 'Fair')` - สภาพสินค้าต้องถูกต้อง
3. **Items**: `status IN ('active', 'inactive', 'exchanged', 'deleted')` - สถานะสินค้าต้องถูกต้อง
4. **Exchange Requests**: `status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')` - สถานะคำขอต้องถูกต้อง

## 📊 Relationships

```
users
  ├── items (1:N)
  ├── exchange_requests (1:N as requester)
  ├── chats (1:N as creator/participant)
  ├── messages (1:N as sender)
  └── notifications (1:N)

items
  ├── exchange_requests (1:N)
  └── chats (1:N, optional)

chats
  └── messages (1:N)
```

## 🚀 การใช้งาน

### 1. Setup Database

```bash
# ตั้งค่า DATABASE_URL ใน backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/sharecycle
```

### 2. Run Migration

```bash
cd backend
npm run db:migrate
```

### 3. Verify Schema

```bash
# เชื่อมต่อ PostgreSQL
psql $DATABASE_URL

# ตรวจสอบตาราง
\dt

# ตรวจสอบ indexes
\di

# ตรวจสอบ constraints
\d+ users
\d+ items
\d+ chats
```

## ⚠️ หมายเหตุ

- Schema นี้ใช้ PostgreSQL
- ต้องมี extension `uuid-ossp` สำหรับ UUID
- Foreign keys มี CASCADE หรือ SET NULL ตามความเหมาะสม
- Indexes จะช่วยเพิ่มประสิทธิภาพการ query
- Constraints จะช่วยป้องกันข้อมูลที่ไม่ถูกต้อง

## 🔄 Migration

หากต้องการแก้ไข schema:

1. สร้างไฟล์ migration ใหม่
2. อัปเดต schema.sql
3. รัน migration

**คำเตือน**: การเปลี่ยนแปลง schema อาจส่งผลต่อข้อมูลที่มีอยู่แล้ว ควร backup ก่อน

## 📝 ข้อมูลเพิ่มเติม

- **Backend README**: `../README.md`
- **API Documentation**: `../README.md`

