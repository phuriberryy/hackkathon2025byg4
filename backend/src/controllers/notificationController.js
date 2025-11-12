import { query } from '../db/pool.js'

// ดึง notifications ทั้งหมด
export const getNotifications = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const result = await query(
      `SELECT * FROM notifications 
       WHERE user_id=$1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    )

    return res.json(result.rows)
  } catch (err) {
    console.error('Get notifications error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ทำเครื่องหมายว่าอ่านแล้ว
export const markNotificationsRead = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    await query(
      'UPDATE notifications SET read=true WHERE user_id=$1 AND read=false',
      [req.user.id]
    )
    return res.json({ success: true })
  } catch (err) {
    console.error('Mark notifications read error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ทำเครื่องหมาย notification เดียวว่าอ่านแล้ว
export const markNotificationRead = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { notificationId } = req.params

  try {
    // ตรวจสอบว่า notification เป็นของ user นี้หรือไม่
    const notificationCheck = await query(
      'SELECT user_id FROM notifications WHERE id=$1',
      [notificationId]
    )

    if (!notificationCheck.rowCount) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    if (notificationCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only mark your own notifications as read' })
    }

    await query(
      'UPDATE notifications SET read=true WHERE id=$1',
      [notificationId]
    )

    return res.json({ success: true })
  } catch (err) {
    console.error('Mark notification read error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึงจำนวน notifications ที่ยังไม่อ่าน
export const getUnreadCount = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id=$1 AND read=false',
      [req.user.id]
    )

    return res.json({ count: parseInt(result.rows[0].count) || 0 })
  } catch (err) {
    console.error('Get unread count error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
