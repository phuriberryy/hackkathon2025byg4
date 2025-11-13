-- ============================================
-- Seed Data - สร้างข้อมูลทดสอบ
-- ============================================
-- ใช้สำหรับสร้างข้อมูลทดสอบหลังจากลบข้อมูลทั้งหมด
-- ============================================

-- ลบข้อมูลเก่าก่อน (ถ้ามี)
DELETE FROM messages;
DELETE FROM chats;
DELETE FROM exchange_history;
DELETE FROM exchange_requests;
DELETE FROM notifications;
DELETE FROM items;
DELETE FROM users;

-- ============================================
-- สร้าง Users (ต้องสร้างก่อนเพราะตารางอื่นอ้างอิง)
-- ============================================

-- User 1
INSERT INTO users (id, name, faculty, email, password_hash, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'ภูริชญา หลำสวัสดิ์',
  'คณะวิจิตรศิลป์',
  'phurichaya_lamsawat@cmu.ac.th',
  '$2a$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- password: password123
  NOW()
);

-- User 2
INSERT INTO users (id, name, faculty, email, password_hash, created_at)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'แพรว สมใจ',
  'คณะวิทยาศาสตร์',
  'praew@cmu.ac.th',
  '$2a$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- password: password123
  NOW()
);

-- User 3
INSERT INTO users (id, name, faculty, email, password_hash, created_at)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'สมชาย ใจดี',
  'คณะวิศวกรรมศาสตร์',
  'somchai@cmu.ac.th',
  '$2a$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- password: password123
  NOW()
);

-- ============================================
-- สร้าง Items
-- ============================================

-- Item 1 (ของ User 1)
INSERT INTO items (id, user_id, title, category, item_condition, looking_for, description, pickup_location, available_until, image_url, status, created_at)
VALUES (
  'd4e5f6a7-b8c9-0123-def0-234567890123',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Calculus Textbook',
  'Books & Textbooks',
  'Good',
  'Physics textbook หรือ Engineering books',
  'หนังสือ Calculus ที่ใช้เรียนแล้ว ยังอยู่ในสภาพดี',
  'Engineering Building',
  CURRENT_DATE + INTERVAL '30 days',
  'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80',
  'active',
  NOW()
);

-- Item 2 (ของ User 1)
INSERT INTO items (id, user_id, title, category, item_condition, looking_for, description, pickup_location, available_until, image_url, status, created_at)
VALUES (
  'e5f6a7b8-c9d0-1234-ef01-345678901234',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Reusable Water Bottle',
  'Eco Items',
  'Like New',
  'Eco-friendly items',
  'ขวดน้ำที่ใช้แล้ว ยังใหม่มาก',
  'Science Building',
  CURRENT_DATE + INTERVAL '14 days',
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  'active',
  NOW()
);

-- Item 3 (ของ User 2)
INSERT INTO items (id, user_id, title, category, item_condition, looking_for, description, pickup_location, available_until, image_url, status, created_at)
VALUES (
  'f6a7b8c9-d0e1-2345-f012-456789012345',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Desk Lamp',
  'Dorm Items',
  'Good',
  'Study desk หรือ chair',
  'โคมไฟตั้งโต๊ะ ใช้งานได้ดี',
  'Library',
  CURRENT_DATE + INTERVAL '21 days',
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
  'active',
  NOW()
);

-- ============================================
-- สร้าง Exchange Requests
-- ============================================

-- Exchange Request 1 (User 2 ขอแลก Item 1)
INSERT INTO exchange_requests (id, item_id, requester_id, message, status, owner_accepted, requester_accepted, created_at)
VALUES (
  'a7b8c9d0-e1f2-3456-0123-567890123456',
  'd4e5f6a7-b8c9-0123-def0-234567890123',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'สวัสดีครับ สนใจแลกเปลี่ยนหนังสือ Calculus กับ Physics textbook ของผมครับ',
  'pending',
  FALSE,
  FALSE,
  NOW()
);

-- ============================================
-- สร้าง Notifications
-- ============================================

-- Notification 1 (สำหรับ User 1)
INSERT INTO notifications (id, user_id, title, body, type, metadata, read, created_at)
VALUES (
  'b8c9d0e1-f2a3-4567-1234-678901234567',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'มีคำขอแลกเปลี่ยนใหม่',
  'แพรว สมใจ ขอแลกเปลี่ยนสำหรับ "Calculus Textbook"',
  'exchange_request',
  '{"exchangeRequestId": "a7b8c9d0-e1f2-3456-0123-567890123456", "itemId": "d4e5f6a7-b8c9-0123-def0-234567890123"}',
  FALSE,
  NOW()
);

-- ============================================
-- ตรวจสอบข้อมูลที่สร้าง
-- ============================================

SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'items', COUNT(*) FROM items
UNION ALL
SELECT 'exchange_requests', COUNT(*) FROM exchange_requests
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;

-- แสดงข้อมูล Users
SELECT id, name, email, faculty FROM users;

-- แสดงข้อมูล Items
SELECT id, title, category, status FROM items;

