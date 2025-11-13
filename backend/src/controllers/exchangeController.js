import { validationResult } from 'express-validator'
import { query } from '../db/pool.js'
import { sendEmail } from '../utils/email.js'
import { calculateItemCO2, calculateExchangeCO2Reduction } from '../utils/co2Calculator.js'
import { getChatServer } from '../services/chatService.js'

// สร้างคำขอแลกเปลี่ยน
export const createExchangeRequest = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { itemId, message } = req.body

  try {
    const itemResult = await query(
      `SELECT items.title, items.user_id, users.email, users.name
       FROM items
       JOIN users ON items.user_id = users.id
       WHERE items.id=$1 AND items.status='active'`,
      [itemId]
    )

    if (!itemResult.rowCount) {
      return res.status(404).json({ message: 'Item not found' })
    }

    const item = itemResult.rows[0]
    if (item.user_id === req.user.id) {
      return res.status(400).json({ message: 'You cannot exchange your own item' })
    }

    // ตรวจสอบว่ามีคำขอแลกเปลี่ยนอยู่แล้วหรือไม่
    const existingRequest = await query(
      'SELECT id FROM exchange_requests WHERE item_id=$1 AND requester_id=$2 AND status=$3',
      [itemId, req.user.id, 'pending']
    )

    if (existingRequest.rowCount > 0) {
      return res.status(400).json({ message: 'You have already sent an exchange request for this item' })
    }

    const exchangeResult = await query(
      `INSERT INTO exchange_requests (item_id, requester_id, message)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [itemId, req.user.id, message || null]
    )

    const exchangeRequest = exchangeResult.rows[0]

    // สร้าง notification สำหรับเจ้าของโพสต์
    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        item.user_id,
        'มีคำขอแลกเปลี่ยนใหม่',
        `${req.user.name} ขอแลกเปลี่ยนสำหรับ "${item.title}"`,
        'exchange_request',
        JSON.stringify({ exchangeRequestId: exchangeRequest.id, itemId, requesterId: req.user.id }),
      ]
    )

    // ส่งอีเมลไปยังเจ้าของโพสต์
    try {
      await sendEmail({
        to: item.email,
        subject: 'มีคำขอแลกเปลี่ยนใหม่บน CMU ShareCycle',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2D7D3F;">มีคำขอแลกเปลี่ยนใหม่</h2>
            <p>สวัสดี ${item.name},</p>
            <p><strong>${req.user.name}</strong> ขอแลกเปลี่ยนสำหรับสินค้า "<strong>${item.title}</strong>"</p>
            ${message ? `<p><strong>ข้อความ:</strong> ${message}</p>` : ''}
            <p>กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดและยอมรับ/ปฏิเสธคำขอ</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              CMU ShareCycle - Green Campus<br>
              <a href="http://localhost:3000" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
            </p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr)
      // ไม่ throw error เพื่อไม่ให้การสร้าง exchange request ล้มเหลว
    }

    return res.status(201).json(exchangeRequest)
  } catch (err) {
    console.error('Create exchange request error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึงรายละเอียดคำขอแลกเปลี่ยน
export const getExchangeRequest = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { requestId } = req.params

  try {
    const result = await query(
      `SELECT 
        er.*,
        i.id as item_id,
        i.title as item_title,
        i.category as item_category,
        i.item_condition as item_condition,
        i.description as item_description,
        i.image_url as item_image_url,
        i.pickup_location as item_pickup_location,
        i.user_id as item_owner_id,
        owner.id as owner_id,
        owner.name as owner_name,
        owner.email as owner_email,
        owner.faculty as owner_faculty,
        owner.avatar_url as owner_avatar_url,
        requester.id as requester_id,
        requester.name as requester_name,
        requester.email as requester_email,
        requester.faculty as requester_faculty,
        requester.avatar_url as requester_avatar_url,
        CASE 
          WHEN i.user_id = $2 THEN 'owner'
          ELSE 'requester'
        END as user_role
       FROM exchange_requests er
       JOIN items i ON er.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON er.requester_id = requester.id
       WHERE er.id=$1`,
      [requestId, req.user.id]
    )

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Exchange request not found' })
    }

    const exchangeRequest = result.rows[0]

    // ตรวจสอบสิทธิ์ (เจ้าของโพสต์หรือผู้ขอแลกเท่านั้นที่ดูได้)
    if (exchangeRequest.item_owner_id !== req.user.id && exchangeRequest.requester_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to view this exchange request' })
    }

    // ดึงข้อมูล item ที่ผู้ขอแลกต้องการแลก (ถ้ามี)
    // หมายเหตุ: ตอนนี้ยังไม่มี field เก็บ item ที่ต้องการแลก เราจะใช้ message แทน

    return res.json(exchangeRequest)
  } catch (err) {
    console.error('Get exchange request error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// เจ้าของโพสต์ยอมรับคำขอแลกเปลี่ยน
export const acceptExchangeRequestByOwner = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { requestId } = req.params

  try {
    // ดึงข้อมูล exchange request
    const requestResult = await query(
      `SELECT er.*, items.user_id as owner_id, items.title as item_title, items.category as item_category, items.item_condition as item_condition,
              owner.email as owner_email, owner.name as owner_name,
              requester.email as requester_email, requester.name as requester_name
       FROM exchange_requests er
       JOIN items ON er.item_id = items.id
       JOIN users owner ON items.user_id = owner.id
       JOIN users requester ON er.requester_id = requester.id
       WHERE er.id=$1`,
      [requestId]
    )

    if (!requestResult.rowCount) {
      return res.status(404).json({ message: 'Exchange request not found' })
    }

    const exchangeRequest = requestResult.rows[0]

    // ตรวจสอบว่าเป็นเจ้าของโพสต์หรือไม่
    if (exchangeRequest.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only accept requests for your own items' })
    }

    // ตรวจสอบว่ายัง pending อยู่หรือไม่
    if (exchangeRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Exchange request is not pending' })
    }

    // อัปเดต owner_accepted เป็น true
    await query(
      `UPDATE exchange_requests 
       SET owner_accepted=true, updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )

    // ตรวจสอบว่าทั้งสองฝ่าย accept แล้วหรือยัง
    const updatedRequest = await query(
      'SELECT * FROM exchange_requests WHERE id=$1',
      [requestId]
    )

    const updated = updatedRequest.rows[0]

    // สร้าง notification สำหรับผู้ขอแลก
    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        exchangeRequest.requester_id,
        'เจ้าของโพสต์ยอมรับคำขอแลกเปลี่ยน',
        `${exchangeRequest.owner_name} ยอมรับคำขอแลกเปลี่ยนสำหรับ "${exchangeRequest.item_title}"`,
        'exchange_accepted',
        JSON.stringify({ exchangeRequestId: requestId, itemId: exchangeRequest.item_id }),
      ]
    )

    // ส่งอีเมลไปยังผู้ขอแลก
    try {
      await sendEmail({
        to: exchangeRequest.requester_email,
        subject: 'เจ้าของโพสต์ยอมรับคำขอแลกเปลี่ยน',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2D7D3F;">คำขอแลกเปลี่ยนของคุณได้รับการยอมรับ</h2>
            <p>สวัสดี ${exchangeRequest.requester_name},</p>
            <p><strong>${exchangeRequest.owner_name}</strong> ยอมรับคำขอแลกเปลี่ยนสำหรับสินค้า "<strong>${exchangeRequest.item_title}</strong>"</p>
            <p>กรุณาเข้าสู่ระบบเพื่อยอมรับคำขอแลกเปลี่ยนของคุณ</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              CMU ShareCycle - Green Campus<br>
              <a href="http://localhost:3000" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
            </p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr)
    }

    // ถ้าทั้งสองฝ่าย accept แล้ว ให้สร้าง chat และ exchange history
    if (updated.owner_accepted && updated.requester_accepted) {
      await completeExchange(requestId, exchangeRequest)
    }

    // ดึงข้อมูล exchange request ที่อัปเดตแล้ว
    const finalResult = await query(
      `SELECT 
        er.*,
        i.title as item_title,
        owner.name as owner_name,
        requester.name as requester_name
       FROM exchange_requests er
       JOIN items i ON er.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON er.requester_id = requester.id
       WHERE er.id=$1`,
      [requestId]
    )

    return res.json({ success: true, message: 'Exchange request accepted', exchangeRequest: finalResult.rows[0] })
  } catch (err) {
    console.error('Accept exchange request error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ผู้ขอแลกยอมรับคำขอแลกเปลี่ยน
export const acceptExchangeRequestByRequester = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { requestId } = req.params

  try {
    // ดึงข้อมูล exchange request
    const requestResult = await query(
      `SELECT er.*, items.user_id as owner_id, items.title as item_title, items.category as item_category, items.item_condition as item_condition,
              owner.email as owner_email, owner.name as owner_name,
              requester.email as requester_email, requester.name as requester_name
       FROM exchange_requests er
       JOIN items ON er.item_id = items.id
       JOIN users owner ON items.user_id = owner.id
       JOIN users requester ON er.requester_id = requester.id
       WHERE er.id=$1`,
      [requestId]
    )

    if (!requestResult.rowCount) {
      return res.status(404).json({ message: 'Exchange request not found' })
    }

    const exchangeRequest = requestResult.rows[0]

    // ตรวจสอบว่าเป็นผู้ขอแลกหรือไม่
    if (exchangeRequest.requester_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only accept your own exchange requests' })
    }

    // ตรวจสอบว่า owner accept แล้วหรือยัง
    if (!exchangeRequest.owner_accepted) {
      return res.status(400).json({ message: 'Owner has not accepted the request yet' })
    }

    // ตรวจสอบว่ายัง pending อยู่หรือไม่
    if (exchangeRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Exchange request is not pending' })
    }

    // อัปเดต requester_accepted เป็น true
    await query(
      `UPDATE exchange_requests 
       SET requester_accepted=true, updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )

    // ตรวจสอบว่าทั้งสองฝ่าย accept แล้วหรือยัง
    const updatedRequest = await query(
      'SELECT * FROM exchange_requests WHERE id=$1',
      [requestId]
    )

    const updated = updatedRequest.rows[0]

    // ถ้าทั้งสองฝ่าย accept แล้ว ให้สร้าง chat และ exchange history
    if (updated.owner_accepted && updated.requester_accepted) {
      await completeExchange(requestId, exchangeRequest)
    }

    // ดึงข้อมูล exchange request ที่อัปเดตแล้ว
    const finalResult = await query(
      `SELECT 
        er.*,
        i.title as item_title,
        owner.name as owner_name,
        requester.name as requester_name
       FROM exchange_requests er
       JOIN items i ON er.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON er.requester_id = requester.id
       WHERE er.id=$1`,
      [requestId]
    )

    return res.json({ success: true, message: 'Exchange request accepted', exchangeRequest: finalResult.rows[0] })
  } catch (err) {
    console.error('Accept exchange request by requester error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ปฏิเสธคำขอแลกเปลี่ยน
export const rejectExchangeRequest = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { requestId } = req.params

  try {
    // ดึงข้อมูล exchange request
    const requestResult = await query(
      `SELECT er.*, items.user_id as owner_id, items.title as item_title,
              owner.email as owner_email, owner.name as owner_name,
              requester.email as requester_email, requester.name as requester_name
       FROM exchange_requests er
       JOIN items ON er.item_id = items.id
       JOIN users owner ON items.user_id = owner.id
       JOIN users requester ON er.requester_id = requester.id
       WHERE er.id=$1`,
      [requestId]
    )

    if (!requestResult.rowCount) {
      return res.status(404).json({ message: 'Exchange request not found' })
    }

    const exchangeRequest = requestResult.rows[0]

    // ตรวจสอบสิทธิ์ (เจ้าของโพสต์หรือผู้ขอแลกเท่านั้นที่ปฏิเสธได้)
    const isOwner = exchangeRequest.owner_id === req.user.id
    const isRequester = exchangeRequest.requester_id === req.user.id

    if (!isOwner && !isRequester) {
      return res.status(403).json({ message: 'You can only reject your own exchange requests' })
    }

    // อัปเดต status เป็น rejected
    await query(
      `UPDATE exchange_requests 
       SET status='rejected', updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )

    // สร้าง notification สำหรับอีกฝ่าย
    const targetUserId = isOwner ? exchangeRequest.requester_id : exchangeRequest.owner_id
    const targetUserEmail = isOwner ? exchangeRequest.requester_email : exchangeRequest.owner_email
    const targetUserName = isOwner ? exchangeRequest.requester_name : exchangeRequest.owner_name
    const rejecterName = isOwner ? exchangeRequest.owner_name : exchangeRequest.requester_name

    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        targetUserId,
        'คำขอแลกเปลี่ยนถูกปฏิเสธ',
        `${rejecterName} ปฏิเสธคำขอแลกเปลี่ยนสำหรับ "${exchangeRequest.item_title}"`,
        'exchange_rejected',
        JSON.stringify({ exchangeRequestId: requestId, itemId: exchangeRequest.item_id }),
      ]
    )

    // ส่งอีเมล
    try {
      await sendEmail({
        to: targetUserEmail,
        subject: 'คำขอแลกเปลี่ยนถูกปฏิเสธ',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">คำขอแลกเปลี่ยนถูกปฏิเสธ</h2>
            <p>สวัสดี ${targetUserName},</p>
            <p><strong>${rejecterName}</strong> ปฏิเสธคำขอแลกเปลี่ยนสำหรับสินค้า "<strong>${exchangeRequest.item_title}</strong>"</p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              CMU ShareCycle - Green Campus<br>
              <a href="http://localhost:3000" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
            </p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr)
    }

    return res.json({ success: true, message: 'Exchange request rejected' })
  } catch (err) {
    console.error('Reject exchange request error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึงคำขอแลกเปลี่ยนที่เกี่ยวข้องกับผู้ใช้
export const getMyExchangeRequests = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const result = await query(
      `SELECT 
        er.*,
        i.title as item_title,
        i.image_url as item_image_url,
        i.category as item_category,
        owner.name as owner_name,
        owner.email as owner_email,
        requester.name as requester_name,
        requester.email as requester_email,
        CASE 
          WHEN i.user_id = $1 THEN 'owner'
          ELSE 'requester'
        END as user_role
       FROM exchange_requests er
       JOIN items i ON er.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON er.requester_id = requester.id
       WHERE i.user_id = $1 OR er.requester_id = $1
       ORDER BY er.created_at DESC`,
      [req.user.id]
    )

    return res.json(result.rows)
  } catch (err) {
    console.error('Get my exchange requests error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// Helper function: สร้าง chat และ exchange history เมื่อทั้งสองฝ่าย accept
async function completeExchange(requestId, exchangeRequest) {
  try {
    // อัปเดต status เป็น accepted
    await query(
      `UPDATE exchange_requests 
       SET status='accepted', updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )

    // ดึงข้อมูล item ของ owner
    const ownerItemResult = await query(
      `SELECT id, category, item_condition, title FROM items WHERE id=$1`,
      [exchangeRequest.item_id]
    )

    if (!ownerItemResult.rowCount) {
      throw new Error('Owner item not found')
    }

    const ownerItem = ownerItemResult.rows[0]

    // คำนวณ CO₂ footprint ของ item ของ owner
    const co2OwnerItem = calculateItemCO2(ownerItem.category, ownerItem.item_condition)

    // TODO: ถ้าในอนาคตมี requester_item_id จะคำนวณจากทั้งสอง items
    // ตอนนี้คำนวณจาก item ของ owner เท่านั้น โดยประมาณว่า
    // การแลกเปลี่ยนช่วยลด CO₂ ได้ 75% ของค่า footprint ของ item
    const co2Reduced = co2OwnerItem * 0.75

    // สร้าง exchange history
    const historyResult = await query(
      `INSERT INTO exchange_history (exchange_request_id, item_id, owner_id, requester_id, co2_reduced)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [requestId, exchangeRequest.item_id, exchangeRequest.owner_id, exchangeRequest.requester_id, parseFloat(co2Reduced.toFixed(2))]
    )

    // อัปเดต item status เป็น exchanged
    await query(
      `UPDATE items 
       SET status='exchanged', updated_at=NOW()
       WHERE id=$1`,
      [exchangeRequest.item_id]
    )

    // สร้าง chat อัตโนมัติ
    const chatResult = await query(
      `INSERT INTO chats (creator_id, participant_id, item_id, exchange_request_id)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [exchangeRequest.owner_id, exchangeRequest.requester_id, exchangeRequest.item_id, requestId]
    )

    const chat = chatResult.rows[0]
    const chatId = chat.id
    const metadata = JSON.stringify({ exchangeRequestId: requestId, chatId, itemId: exchangeRequest.item_id })

    const io = getChatServer()
    let ownerUser = null
    let requesterUser = null

    if (io) {
      const [ownerUserResult, requesterUserResult] = await Promise.all([
        query('SELECT id, name, email, avatar_url FROM users WHERE id=$1', [exchangeRequest.owner_id]),
        query('SELECT id, name, email, avatar_url FROM users WHERE id=$1', [exchangeRequest.requester_id]),
      ])
      ownerUser = ownerUserResult.rows[0]
      requesterUser = requesterUserResult.rows[0]
    }

    // สร้าง notifications สำหรับทั้งสองฝ่าย
    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1,$2,$3,$4,$5), ($6,$7,$8,$4,$5)`,
      [
        exchangeRequest.owner_id,
        'การแลกเปลี่ยนสำเร็จ',
        `การแลกเปลี่ยน "${exchangeRequest.item_title}" สำเร็จแล้ว แชทได้เปิดให้แล้ว`,
        'exchange_completed',
        metadata,
        exchangeRequest.requester_id,
        'การแลกเปลี่ยนสำเร็จ',
        `การแลกเปลี่ยน "${exchangeRequest.item_title}" สำเร็จแล้ว แชทได้เปิดให้แล้ว`,
        metadata,
      ]
    )

    if (io) {
      const chatForOwner = {
        ...chat,
        participant_name: requesterUser?.name || 'CMU Student',
        participant_email: requesterUser?.email || '',
        participant_avatar_url: requesterUser?.avatar_url || null,
      }

      const chatForRequester = {
        ...chat,
        participant_name: ownerUser?.name || 'CMU Student',
        participant_email: ownerUser?.email || '',
        participant_avatar_url: ownerUser?.avatar_url || null,
      }

      io.to(exchangeRequest.owner_id).emit('chat:created', chatForOwner)
      io.to(exchangeRequest.requester_id).emit('chat:created', chatForRequester)
      io.to(exchangeRequest.owner_id).emit('notification:new')
      io.to(exchangeRequest.requester_id).emit('notification:new')
    }

    // ส่งอีเมลไปยังทั้งสองฝ่าย
    try {
      const co2ReducedFormatted = parseFloat(co2Reduced.toFixed(2))
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2D7D3F;">การแลกเปลี่ยนสำเร็จ!</h2>
          <p>การแลกเปลี่ยนสินค้า "<strong>${exchangeRequest.item_title}</strong>" สำเร็จแล้ว</p>
          <p>แชทได้เปิดให้แล้วเพื่อให้คุณทั้งสองสามารถติดต่อกันได้</p>
          <p>CO₂ ที่ลดได้จากการแลกเปลี่ยนนี้: <strong>${co2ReducedFormatted} kg</strong></p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            CMU ShareCycle - Green Campus<br>
            <a href="http://localhost:3000" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
          </p>
        </div>
      `

      await Promise.all([
        sendEmail({
          to: exchangeRequest.owner_email,
          subject: 'การแลกเปลี่ยนสำเร็จ - CMU ShareCycle',
          html: emailHtml,
        }),
        sendEmail({
          to: exchangeRequest.requester_email,
          subject: 'การแลกเปลี่ยนสำเร็จ - CMU ShareCycle',
          html: emailHtml,
        }),
      ])
    } catch (emailErr) {
      console.error('Failed to send completion emails:', emailErr)
    }

    return historyResult.rows[0]
  } catch (err) {
    console.error('Complete exchange error:', err)
    throw err
  }
}
