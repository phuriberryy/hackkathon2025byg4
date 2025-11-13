-- ============================================
-- คำสั่งลบข้อมูลในตาราง (DELETE)
-- ============================================
-- ⚠️  คำเตือน: คำสั่งเหล่านี้จะลบข้อมูลทั้งหมดในตาราง
--     ใช้ด้วยความระมัดระวัง!
-- ============================================

-- ลบข้อมูลทั้งหมด (เรียงตามลำดับ Foreign Key)
-- ต้องลบจากตารางที่ถูกอ้างอิงก่อน แล้วค่อยลบตารางที่อ้างอิง

-- 1. ลบ Messages (ไม่มีตารางอื่นอ้างอิง)
DELETE FROM messages;

-- 2. ลบ Chats (ไม่มีตารางอื่นอ้างอิง)
DELETE FROM chats;

-- 3. ลบ Exchange History (ไม่มีตารางอื่นอ้างอิง)
DELETE FROM exchange_history;

-- 4. ลบ Exchange Requests (ไม่มีตารางอื่นอ้างอิง)
DELETE FROM exchange_requests;

-- 5. ลบ Notifications (ไม่มีตารางอื่นอ้างอิง)
DELETE FROM notifications;

-- 6. ลบ Items (ถูกอ้างอิงโดย exchange_requests, exchange_history, chats)
DELETE FROM items;

-- 7. ลบ Users (ถูกอ้างอิงโดย items, exchange_requests, chats, messages, notifications)
DELETE FROM users;

-- ============================================
-- ลบข้อมูลเฉพาะบางตาราง
-- ============================================

-- ลบเฉพาะ Messages
DELETE FROM messages;

-- ลบเฉพาะ Chats
DELETE FROM chats;

-- ลบเฉพาะ Exchange History
DELETE FROM exchange_history;

-- ลบเฉพาะ Exchange Requests
DELETE FROM exchange_requests;

-- ลบเฉพาะ Notifications
DELETE FROM notifications;

-- ลบเฉพาะ Items
DELETE FROM items;

-- ลบเฉพาะ Users
DELETE FROM users;

-- ============================================
-- ลบข้อมูลตามเงื่อนไข (WHERE)
-- ============================================

-- ลบ Items ที่ status = 'inactive'
DELETE FROM items WHERE status = 'inactive';

-- ลบ Items ที่หมดอายุแล้ว
DELETE FROM items WHERE available_until < CURRENT_DATE;

-- ลบ Exchange Requests ที่ status = 'rejected'
DELETE FROM exchange_requests WHERE status = 'rejected';

-- ลบ Notifications ที่อ่านแล้ว
DELETE FROM notifications WHERE read = TRUE;

-- ลบ Notifications ที่เก่ากว่า 30 วัน
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';

-- ลบ Messages ที่เก่ากว่า 90 วัน
DELETE FROM messages WHERE created_at < NOW() - INTERVAL '90 days';

-- ลบ User ตาม email
DELETE FROM users WHERE email = 'example@cmu.ac.th';

-- ลบ Items ของ User ตาม user_id
DELETE FROM items WHERE user_id = 'user-uuid-here';

-- ============================================
-- ลบข้อมูลแบบ CASCADE (ลบพร้อมข้อมูลที่เกี่ยวข้อง)
-- ============================================

-- ⚠️  ระวัง: คำสั่งนี้จะลบข้อมูลทั้งหมดที่เกี่ยวข้องด้วย!

-- ลบ User และข้อมูลที่เกี่ยวข้องทั้งหมด (items, exchange_requests, etc.)
-- เนื่องจากมี ON DELETE CASCADE ใน schema
DELETE FROM users WHERE id = 'user-uuid-here';

-- ลบ Item และข้อมูลที่เกี่ยวข้องทั้งหมด (exchange_requests, etc.)
-- เนื่องจากมี ON DELETE CASCADE ใน schema
DELETE FROM items WHERE id = 'item-uuid-here';

-- ============================================
-- ตรวจสอบข้อมูลก่อนลบ (แนะนำให้ทำก่อนลบ)
-- ============================================

-- ดูจำนวนข้อมูลในแต่ละตาราง
SELECT 'messages' as table_name, COUNT(*) as count FROM messages
UNION ALL
SELECT 'chats', COUNT(*) FROM chats
UNION ALL
SELECT 'exchange_history', COUNT(*) FROM exchange_history
UNION ALL
SELECT 'exchange_requests', COUNT(*) FROM exchange_requests
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'items', COUNT(*) FROM items
UNION ALL
SELECT 'users', COUNT(*) FROM users;

-- ดูข้อมูลที่จะถูกลบ (ตัวอย่าง)
SELECT * FROM items WHERE status = 'inactive';
SELECT * FROM exchange_requests WHERE status = 'rejected';
SELECT * FROM notifications WHERE read = TRUE;

-- ============================================
-- Reset Auto-increment (ถ้ามี) - PostgreSQL ใช้ UUID ไม่ต้อง reset
-- ============================================

-- สำหรับ PostgreSQL ที่ใช้ UUID ไม่ต้อง reset sequence
-- แต่ถ้าต้องการ reset sequence สำหรับตารางอื่น:
-- ALTER SEQUENCE table_name_id_seq RESTART WITH 1;

