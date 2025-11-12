import { validationResult } from 'express-validator'
import { query } from '../db/pool.js'
import { sendEmail } from '../utils/email.js'

export const createExchangeRequest = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { itemId, message } = req.body

  const itemResult = await query(
    `SELECT items.title, items.user_id, users.email, users.name
     FROM items
     JOIN users ON items.user_id = users.id
     WHERE items.id=$1`,
    [itemId]
  )

  if (!itemResult.rowCount) {
    return res.status(404).json({ message: 'Item not found' })
  }

  const item = itemResult.rows[0]
  if (item.user_id === req.user.id) {
    return res.status(400).json({ message: 'You cannot exchange your own item' })
  }

  const exchangeResult = await query(
    `INSERT INTO exchange_requests (item_id, requester_id, message)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [itemId, req.user.id, message]
  )

  await query(
    `INSERT INTO notifications (user_id, title, body, metadata)
     VALUES ($1,$2,$3,$4)`,
    [
      item.user_id,
      'มีคำขอแลกเปลี่ยนใหม่',
      `${req.user.name} ขอแลกเปลี่ยนสำหรับ ${item.title}`,
      JSON.stringify({ itemId, requesterId: req.user.id }),
    ]
  )

  await sendEmail({
    to: item.email,
    subject: 'มีคำขอแลกเปลี่ยนใหม่บน CMU ShareCycle',
    html: `<p>สวัสดี ${item.name},</p><p>${req.user.name} ขอแลกเปลี่ยนสำหรับ "${item.title}"</p><p>ข้อความ: ${message || 'ไม่ได้ระบุ'}</p>`,
  })

  return res.status(201).json(exchangeResult.rows[0])
}

