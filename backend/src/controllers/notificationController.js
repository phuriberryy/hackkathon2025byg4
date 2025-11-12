import { query } from '../db/pool.js'

export const getNotifications = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const result = await query(
    `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
    [req.user.id]
  )

  return res.json(result.rows)
}

export const markNotificationsRead = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  await query('UPDATE notifications SET read=true WHERE user_id=$1 AND read=false', [req.user.id])
  return res.json({ success: true })
}

