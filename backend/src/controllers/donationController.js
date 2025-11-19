import { validationResult } from 'express-validator'
import { query } from '../db/pool.js'
import { calculateItemCO2 } from '../utils/co2Calculator.js'
import { sendEmail } from '../utils/email.js'
import env from '../config/env.js'

// สร้างการบริจาค
export const createDonation = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { itemId, recipientName, recipientContact, donationLocation, message } = req.body

  try {
    // ตรวจสอบว่า item มีอยู่และเป็นของ user นี้
    const itemResult = await query(
      `SELECT items.*, users.name as owner_name, users.email as owner_email
       FROM items
       JOIN users ON items.user_id = users.id
       WHERE items.id=$1 AND items.user_id=$2 AND items.status='active'`,
      [itemId, req.user.id]
    )

    if (!itemResult.rowCount) {
      return res.status(404).json({ 
        message: 'Item not found or you do not have permission to donate this item' 
      })
    }

    const item = itemResult.rows[0]

    // ตรวจสอบว่ามี exchange request ที่ pending หรือ chatting อยู่หรือไม่
    const activeExchange = await query(
      `SELECT id FROM exchange_requests 
       WHERE item_id=$1 AND status IN ('pending', 'chatting', 'in_progress')`,
      [itemId]
    )

    if (activeExchange.rowCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot donate item with active exchange requests. Please cancel or complete the exchange first.' 
      })
    }

    // คำนวณ CO₂ ที่ลดได้จากการบริจาค
    // การบริจาคช่วยลด CO₂ เพราะไม่ต้องผลิตใหม่
    const co2Footprint = calculateItemCO2(item.category, item.item_condition)
    const co2Reduced = co2Footprint * 0.8 // 80% reduction (similar to exchange)

    // สร้าง donation history
    const donationResult = await query(
      `INSERT INTO donation_history (
        item_id, 
        donor_id, 
        recipient_name,
        recipient_contact,
        donation_location,
        message,
        co2_reduced
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        itemId,
        req.user.id,
        recipientName || null,
        recipientContact || null,
        donationLocation || null,
        message || null,
        parseFloat(co2Reduced.toFixed(2))
      ]
    )

    // อัปเดต item status เป็น 'donated'
    await query(
      `UPDATE items 
       SET status='donated', updated_at=NOW()
       WHERE id=$1`,
      [itemId]
    )

    // ส่งอีเมลแจ้งเตือน (optional)
    try {
      await sendEmail({
        to: item.owner_email,
        subject: 'การบริจาคสำเร็จ - CMU ShareCycle',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2D7D3F;">ขอบคุณสำหรับการบริจาค!</h2>
            <p>สวัสดี ${item.owner_name},</p>
            <p>คุณได้บริจาค <strong>${item.title}</strong> สำเร็จแล้ว</p>
            <p>การบริจาคของคุณช่วยลด CO₂ ได้ <strong>${co2Reduced.toFixed(2)} kg</strong></p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              CMU ShareCycle - Green Campus<br>
              <a href="${env.clientOrigin}" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
            </p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Failed to send donation email:', emailErr)
      // ไม่ throw error เพื่อไม่ให้การบริจาคล้มเหลว
    }

    const donation = donationResult.rows[0]

    return res.status(201).json({
      ...donation,
      item_title: item.title,
      item_image_url: item.image_url,
      co2_reduced: parseFloat(co2Reduced.toFixed(2))
    })
  } catch (err) {
    console.error('Create donation error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึงประวัติการบริจาคของผู้ใช้
export const getMyDonations = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const result = await query(
      `SELECT 
        dh.*,
        i.title as item_title,
        i.image_url as item_image_url,
        i.category as item_category,
        i.item_condition as item_condition,
        recipient.name as recipient_name,
        recipient.email as recipient_email
       FROM donation_history dh
       JOIN items i ON dh.item_id = i.id
       LEFT JOIN users recipient ON dh.recipient_id = recipient.id
       WHERE dh.donor_id = $1
       ORDER BY dh.donated_at DESC`,
      [req.user.id]
    )

    return res.json(result.rows)
  } catch (err) {
    console.error('Get my donations error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// รับบริจาค (สำหรับคนอื่นที่เห็นของบริจาค)
export const receiveDonation = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { itemId } = req.body

  try {
    // ตรวจสอบว่า item มีอยู่และเป็น donation type
    const itemResult = await query(
      `SELECT items.*, users.name as owner_name, users.email as owner_email
       FROM items
       JOIN users ON items.user_id = users.id
       WHERE items.id=$1 AND items.status='active' AND items.listing_type='donation'`,
      [itemId]
    )

    if (!itemResult.rowCount) {
      return res.status(404).json({ 
        message: 'Item not found or not available for donation' 
      })
    }

    const item = itemResult.rows[0]

    // ตรวจสอบว่าไม่ใช่เจ้าของโพสต์
    if (item.user_id === req.user.id) {
      return res.status(400).json({ 
        message: 'You cannot receive your own donation item' 
      })
    }

    // ตรวจสอบว่ามีคนรับไปแล้วหรือยัง (item status ยังเป็น active อยู่)
    if (item.status !== 'active') {
      return res.status(400).json({ 
        message: 'This item has already been donated' 
      })
    }

    // คำนวณ CO₂ ที่ลดได้จากการบริจาค
    const co2Footprint = calculateItemCO2(item.category, item.item_condition)
    const co2Reduced = co2Footprint * 0.8 // 80% reduction

    // สร้าง donation history
    const donationResult = await query(
      `INSERT INTO donation_history (
        item_id, 
        donor_id,
        recipient_id,
        co2_reduced
      )
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        itemId,
        item.user_id, // donor_id = เจ้าของโพสต์
        req.user.id, // recipient_id = คนที่รับบริจาค
        parseFloat(co2Reduced.toFixed(2))
      ]
    )

    // อัปเดต item status เป็น 'donated'
    await query(
      `UPDATE items 
       SET status='donated', updated_at=NOW()
       WHERE id=$1`,
      [itemId]
    )

    // ส่งอีเมลแจ้งเตือนทั้งสองฝ่าย
    try {
      const recipientResult = await query(
        `SELECT name, email FROM users WHERE id=$1`,
        [req.user.id]
      )
      const recipient = recipientResult.rows[0]

      // ส่งอีเมลไปยังเจ้าของโพสต์
      await sendEmail({
        to: item.owner_email,
        subject: 'มีคนรับบริจาคของคุณแล้ว - CMU ShareCycle',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2D7D3F;">มีคนรับบริจาคของคุณแล้ว!</h2>
            <p>สวัสดี ${item.owner_name},</p>
            <p><strong>${recipient.name}</strong> ได้รับบริจาค <strong>${item.title}</strong> จากคุณแล้ว</p>
            <p>การบริจาคของคุณช่วยลด CO₂ ได้ <strong>${co2Reduced.toFixed(2)} kg</strong></p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              CMU ShareCycle - Green Campus<br>
              <a href="${env.clientOrigin}" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
            </p>
          </div>
        `,
      })

      // ส่งอีเมลไปยังผู้รับบริจาค
      await sendEmail({
        to: recipient.email,
        subject: 'คุณได้รับบริจาคแล้ว - CMU ShareCycle',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2D7D3F;">คุณได้รับบริจาคแล้ว!</h2>
            <p>สวัสดี ${recipient.name},</p>
            <p>คุณได้รับบริจาค <strong>${item.title}</strong> จาก <strong>${item.owner_name}</strong> แล้ว</p>
            <p>กรุณาติดต่อเจ้าของเพื่อนัดรับของ</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              CMU ShareCycle - Green Campus<br>
              <a href="${env.clientOrigin}" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
            </p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Failed to send donation emails:', emailErr)
      // ไม่ throw error เพื่อไม่ให้การรับบริจาคล้มเหลว
    }

    const donation = donationResult.rows[0]

    return res.status(201).json({
      ...donation,
      item_title: item.title,
      item_image_url: item.image_url,
      owner_name: item.owner_name,
      recipient_name: recipient.name,
      co2_reduced: parseFloat(co2Reduced.toFixed(2))
    })
  } catch (err) {
    console.error('Receive donation error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึงประวัติการบริจาคทั้งหมด (สำหรับ statistics)
export const getAllDonations = async (_req, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as total_donations,
              COALESCE(SUM(co2_reduced), 0) as total_co2_reduced
       FROM donation_history`
    )

    return res.json(result.rows[0])
  } catch (err) {
    console.error('Get all donations error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

