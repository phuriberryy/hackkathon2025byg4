import { validationResult } from 'express-validator'
import { query } from '../db/pool.js'
import { sendEmail } from '../utils/email.js'
import { calculateItemCO2 } from '../utils/co2Calculator.js'
import { getChatServer } from '../services/chatService.js'

// สร้างคำขอรับบริจาค
export const createDonationRequest = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    })
  }

  const { itemId, recipientName, recipientContact, message } = req.body

  try {
    // ตรวจสอบว่า item มีอยู่และเป็น donation type
    const itemResult = await query(
      `SELECT items.title, items.user_id, items.listing_type, items.status, users.email, users.name
       FROM items
       JOIN users ON items.user_id = users.id
       WHERE items.id=$1`,
      [itemId]
    )

    if (!itemResult.rowCount) {
      return res.status(404).json({ message: 'Item not found' })
    }

    const item = itemResult.rows[0]
    
    // ตรวจสอบว่าเป็น donation item
    if (item.listing_type !== 'donation') {
      return res.status(400).json({ message: 'This item is not available for donation' })
    }

    // ตรวจสอบว่า item ยัง active อยู่
    if (item.status !== 'active') {
      return res.status(400).json({ message: 'This item is no longer available' })
    }

    // ตรวจสอบว่าไม่ใช่เจ้าของโพสต์
    if (item.user_id === req.user.id) {
      return res.status(400).json({ message: 'You cannot request your own donation item' })
    }

    // ตรวจสอบว่ามีคำขอรับบริจาคอยู่แล้วหรือไม่ (pending, chatting, in_progress)
    const existingRequest = await query(
      `SELECT id, status FROM donation_requests 
       WHERE item_id=$1 AND requester_id=$2 AND status IN ('pending', 'chatting', 'in_progress')`,
      [itemId, req.user.id]
    )

    if (existingRequest.rowCount > 0) {
      const existing = existingRequest.rows[0]
      const statusMap = {
        'pending': 'รอการตอบรับ',
        'chatting': 'กำลังแชท',
        'in_progress': 'กำลังดำเนินการ'
      }
      return res.status(400).json({ 
        message: `คุณได้ส่งคำขอรับบริจาคสำหรับสินค้านี้ไปแล้ว (สถานะ: ${statusMap[existing.status] || existing.status})`,
        existingRequestId: existing.id
      })
    }

    // Validate required fields
    if (!recipientName || !recipientName.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อผู้รับบริจาค' })
    }
    if (!recipientContact || !recipientContact.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลติดต่อผู้รับบริจาค' })
    }

    // สร้าง donation request
    const donationResult = await query(
      `INSERT INTO donation_requests (item_id, requester_id, recipient_name, recipient_contact, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [itemId, req.user.id, recipientName.trim(), recipientContact.trim(), message?.trim() || null]
    )

    const donationRequest = donationResult.rows[0]

    // สร้าง notification สำหรับเจ้าของโพสต์
    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        item.user_id,
        'มีคำขอรับบริจาคใหม่',
        `${req.user.name} ขอรับบริจาค "${item.title}"`,
        'donation_request',
        JSON.stringify({ donationRequestId: donationRequest.id, itemId, requesterId: req.user.id }),
      ]
    )

    // ส่งอีเมลไปยังเจ้าของโพสต์
    try {
      await sendEmail({
        to: item.email,
        subject: 'มีคำขอรับบริจาคใหม่บน CMU ShareCycle',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2D7D3F;">มีคำขอรับบริจาคใหม่</h2>
            <p>สวัสดี ${item.name},</p>
            <p><strong>${req.user.name}</strong> ขอรับบริจาคสินค้า "<strong>${item.title}</strong>"</p>
            <p><strong>ชื่อผู้รับบริจาค:</strong> ${recipientName.trim()}</p>
            <p><strong>ข้อมูลติดต่อ:</strong> ${recipientContact.trim()}</p>
            ${message?.trim() ? `<p><strong>ข้อความเพิ่มเติม:</strong> ${message.trim()}</p>` : ''}
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
    }

    // สร้างแชทที่เชื่อมโยงกับ donation request นี้ทันที
    const chatResult = await query(
      `INSERT INTO chats (creator_id, participant_id, item_id, donation_request_id, status, owner_accepted, requester_accepted)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        req.user.id, // ผู้สร้างแชท (ผู้ขอรับบริจาค)
        item.user_id, // ผู้เข้าร่วม (เจ้าของ)
        itemId,
        donationRequest.id,
        'pending', // status เริ่มต้นเป็น pending
        false, // owner_accepted เริ่มต้นเป็น false
        false  // requester_accepted เริ่มต้นเป็น false
      ]
    )
    const chatId = chatResult.rows[0].id

    // ส่ง Socket.io event
    const io = getChatServer()
    if (io) {
      io.to(item.user_id).emit('notification:new')
    }

    return res.status(201).json({ ...donationRequest, chatId })
  } catch (err) {
    console.error('Create donation request error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึงรายละเอียดคำขอรับบริจาค
export const getDonationRequest = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { requestId } = req.params

  try {
    const result = await query(
      `SELECT 
        dr.*,
        dr.recipient_name,
        dr.recipient_contact,
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
       FROM donation_requests dr
       JOIN items i ON dr.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON dr.requester_id = requester.id
       WHERE dr.id=$1`,
      [requestId, req.user.id]
    )

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Donation request not found' })
    }

    const donationRequest = result.rows[0]

    // ตรวจสอบสิทธิ์ (เจ้าของโพสต์หรือผู้ขอรับบริจาคเท่านั้นที่ดูได้)
    if (donationRequest.item_owner_id !== req.user.id && donationRequest.requester_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to view this donation request' })
    }

    return res.json(donationRequest)
  } catch (err) {
    console.error('Get donation request error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// เจ้าของโพสต์ยอมรับคำขอรับบริจาค
export const acceptDonationRequestByOwner = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { requestId } = req.params

  try {
    // ดึงข้อมูล donation request
    const requestResult = await query(
      `SELECT dr.*, items.user_id as owner_id, items.title as item_title,
              owner.email as owner_email, owner.name as owner_name,
              requester.email as requester_email, requester.name as requester_name
       FROM donation_requests dr
       JOIN items ON dr.item_id = items.id
       JOIN users owner ON items.user_id = owner.id
       JOIN users requester ON dr.requester_id = requester.id
       WHERE dr.id=$1`,
      [requestId]
    )

    if (!requestResult.rowCount) {
      return res.status(404).json({ message: 'Donation request not found' })
    }

    const donationRequest = requestResult.rows[0]

    // ตรวจสอบว่าเป็นเจ้าของโพสต์หรือไม่
    if (donationRequest.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only accept requests for your own items' })
    }

    // ตรวจสอบว่ายัง pending อยู่หรือไม่
    if (donationRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Donation request is not pending' })
    }

    // อัปเดต owner_accepted เป็น true
    await query(
      `UPDATE donation_requests 
       SET owner_accepted=true, updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )

    // ตรวจสอบว่าทั้งสองฝ่าย accept แล้วหรือยัง
    const updatedRequest = await query(
      'SELECT * FROM donation_requests WHERE id=$1',
      [requestId]
    )

    const updated = updatedRequest.rows[0]

    // สร้าง notification สำหรับผู้ขอรับบริจาค
    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        donationRequest.requester_id,
        'เจ้าของโพสต์ยอมรับคำขอรับบริจาค',
        `${donationRequest.owner_name} ยอมรับคำขอรับบริจาค "${donationRequest.item_title}"`,
        'donation_accepted',
        JSON.stringify({ donationRequestId: requestId, itemId: donationRequest.item_id }),
      ]
    )

    // ส่งอีเมลไปยังผู้ขอรับบริจาค
    try {
      await sendEmail({
        to: donationRequest.requester_email,
        subject: 'เจ้าของโพสต์ยอมรับคำขอรับบริจาค',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2D7D3F;">คำขอรับบริจาคของคุณได้รับการยอมรับ</h2>
            <p>สวัสดี ${donationRequest.requester_name},</p>
            <p><strong>${donationRequest.owner_name}</strong> ยอมรับคำขอรับบริจาคสำหรับสินค้า "<strong>${donationRequest.item_title}</strong>"</p>
            <p>กรุณาเข้าสู่ระบบเพื่อยอมรับคำขอรับบริจาคของคุณ</p>
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

    // ถ้าทั้งสองฝ่าย accept แล้ว ให้สร้าง chat และเปลี่ยน status
    if (updated.owner_accepted && updated.requester_accepted) {
      await completeDonation(requestId, donationRequest)
    }

    // ดึงข้อมูล donation request ที่อัปเดตแล้ว
    const finalResult = await query(
      `SELECT 
        dr.*,
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
       FROM donation_requests dr
       JOIN items i ON dr.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON dr.requester_id = requester.id
       WHERE dr.id=$1`,
      [requestId, req.user.id]
    )

    const donationRequestData = finalResult.rows[0]
    
    return res.json({ 
      success: true, 
      message: 'Donation request accepted', 
      donationRequest: donationRequestData,
      bothAccepted: donationRequestData.owner_accepted && donationRequestData.requester_accepted,
      status: donationRequestData.status
    })
  } catch (err) {
    console.error('Accept donation request error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ผู้ขอรับบริจาคยอมรับคำขอ
export const acceptDonationRequestByRequester = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { requestId } = req.params

  try {
    // ดึงข้อมูล donation request
    const requestResult = await query(
      `SELECT dr.*, items.user_id as owner_id, items.title as item_title,
              owner.email as owner_email, owner.name as owner_name,
              requester.email as requester_email, requester.name as requester_name
       FROM donation_requests dr
       JOIN items ON dr.item_id = items.id
       JOIN users owner ON items.user_id = owner.id
       JOIN users requester ON dr.requester_id = requester.id
       WHERE dr.id=$1`,
      [requestId]
    )

    if (!requestResult.rowCount) {
      return res.status(404).json({ message: 'Donation request not found' })
    }

    const donationRequest = requestResult.rows[0]

    // ตรวจสอบว่าเป็นผู้ขอรับบริจาคหรือไม่
    if (donationRequest.requester_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only accept your own donation requests' })
    }

    // ตรวจสอบว่า owner accept แล้วหรือยัง
    if (!donationRequest.owner_accepted) {
      return res.status(400).json({ message: 'Owner has not accepted the request yet' })
    }

    // ตรวจสอบว่ายัง pending อยู่หรือไม่
    if (donationRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Donation request is not pending' })
    }

    // อัปเดต requester_accepted เป็น true
    await query(
      `UPDATE donation_requests 
       SET requester_accepted=true, updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )

    // ตรวจสอบว่าทั้งสองฝ่าย accept แล้วหรือยัง
    const updatedRequest = await query(
      'SELECT * FROM donation_requests WHERE id=$1',
      [requestId]
    )

    const updated = updatedRequest.rows[0]

    // ถ้าทั้งสองฝ่าย accept แล้ว ให้สร้าง chat และเปลี่ยน status
    if (updated.owner_accepted && updated.requester_accepted) {
      await completeDonation(requestId, donationRequest)
    }

    // ดึงข้อมูล donation request ที่อัปเดตแล้ว
    const finalResult = await query(
      `SELECT 
        dr.*,
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
       FROM donation_requests dr
       JOIN items i ON dr.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON dr.requester_id = requester.id
       WHERE dr.id=$1`,
      [requestId, req.user.id]
    )

    const donationRequestData = finalResult.rows[0]
    
    return res.json({ 
      success: true, 
      message: 'Donation request accepted', 
      donationRequest: donationRequestData,
      bothAccepted: donationRequestData.owner_accepted && donationRequestData.requester_accepted,
      status: donationRequestData.status
    })
  } catch (err) {
    console.error('Accept donation request by requester error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ปฏิเสธคำขอรับบริจาค
export const rejectDonationRequest = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { requestId } = req.params

  try {
    // ดึงข้อมูล donation request
    const requestResult = await query(
      `SELECT dr.*, items.user_id as owner_id, items.title as item_title,
              owner.email as owner_email, owner.name as owner_name,
              requester.email as requester_email, requester.name as requester_name
       FROM donation_requests dr
       JOIN items ON dr.item_id = items.id
       JOIN users owner ON items.user_id = owner.id
       JOIN users requester ON dr.requester_id = requester.id
       WHERE dr.id=$1`,
      [requestId]
    )

    if (!requestResult.rowCount) {
      return res.status(404).json({ message: 'Donation request not found' })
    }

    const donationRequest = requestResult.rows[0]

    // ตรวจสอบสิทธิ์ (เจ้าของโพสต์หรือผู้ขอรับบริจาคเท่านั้นที่ปฏิเสธได้)
    const isOwner = donationRequest.owner_id === req.user.id
    const isRequester = donationRequest.requester_id === req.user.id

    if (!isOwner && !isRequester) {
      return res.status(403).json({ message: 'You can only reject your own donation requests' })
    }

    // อัปเดต status เป็น rejected
    await query(
      `UPDATE donation_requests 
       SET status='rejected', updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )

    // สร้าง notification สำหรับอีกฝ่าย
    const targetUserId = isOwner ? donationRequest.requester_id : donationRequest.owner_id
    const targetUserEmail = isOwner ? donationRequest.requester_email : donationRequest.owner_email
    const targetUserName = isOwner ? donationRequest.requester_name : donationRequest.owner_name
    const rejecterName = isOwner ? donationRequest.owner_name : donationRequest.requester_name

    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        targetUserId,
        'คำขอรับบริจาคถูกปฏิเสธ',
        `${rejecterName} ปฏิเสธคำขอรับบริจาค "${donationRequest.item_title}"`,
        'donation_rejected',
        JSON.stringify({ donationRequestId: requestId, itemId: donationRequest.item_id }),
      ]
    )

    // ส่งอีเมล
    try {
      await sendEmail({
        to: targetUserEmail,
        subject: 'คำขอรับบริจาคถูกปฏิเสธ',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">คำขอรับบริจาคถูกปฏิเสธ</h2>
            <p>สวัสดี ${targetUserName},</p>
            <p><strong>${rejecterName}</strong> ปฏิเสธคำขอรับบริจาคสำหรับสินค้า "<strong>${donationRequest.item_title}</strong>"</p>
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

    return res.json({ success: true, message: 'Donation request rejected' })
  } catch (err) {
    console.error('Reject donation request error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึงคำขอรับบริจาคที่เกี่ยวข้องกับผู้ใช้
export const getMyDonationRequests = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const result = await query(
      `SELECT 
        dr.*,
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
       FROM donation_requests dr
       JOIN items i ON dr.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON dr.requester_id = requester.id
       WHERE i.user_id = $1 OR dr.requester_id = $1
       ORDER BY dr.created_at DESC`,
      [req.user.id]
    )

    return res.json(result.rows)
  } catch (err) {
    console.error('Get my donation requests error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// Helper function: สร้าง chat และเปลี่ยน status เมื่อทั้งสองฝ่าย accept
async function completeDonation(requestId, donationRequest) {
  try {
    // อัปเดต status เป็น 'chatting' เมื่อทั้งสองฝ่าย accept แล้ว
    await query(
      `UPDATE donation_requests 
       SET status='chatting', updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )
    
    // อัปเดต item status เป็น 'in_progress'
    await query(
      `UPDATE items 
       SET status='in_progress', updated_at=NOW()
       WHERE id=$1`,
      [donationRequest.item_id]
    )

    // ค้นหาแชทเดิมที่ถูกสร้างไว้แล้ว
    const chatResult = await query(
      `SELECT id FROM chats WHERE donation_request_id=$1`,
      [requestId]
    )

    if (!chatResult.rowCount) {
      console.error(`Chat not found for completed donation request ${requestId}`)
      throw new Error('Associated chat not found')
    }
    
    const chatId = chatResult.rows[0].id
    
    // อัปเดต chat ให้ status='active', owner_accepted=TRUE, requester_accepted=TRUE
    await query(
      `UPDATE chats 
       SET status='active',
           owner_accepted=TRUE,
           requester_accepted=TRUE,
           closed_at=NULL,
           updated_at=NOW()
       WHERE id=$1`,
      [chatId]
    )

    const io = getChatServer()
    if (io) {
      io.to(donationRequest.owner_id).emit('notification:new')
      io.to(donationRequest.requester_id).emit('notification:new')
    }

    // ส่งอีเมลไปยังทั้งสองฝ่าย
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2D7D3F;">การบริจาคสำเร็จ!</h2>
          <p>การบริจาคสินค้า "<strong>${donationRequest.item_title}</strong>" สำเร็จแล้ว</p>
          <p>แชทได้เปิดให้แล้วเพื่อให้คุณทั้งสองสามารถติดต่อกันได้</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            CMU ShareCycle - Green Campus<br>
            <a href="http://localhost:3000" style="color: #2D7D3F;">เข้าสู่ระบบ</a>
          </p>
        </div>
      `

      await Promise.all([
        sendEmail({
          to: donationRequest.owner_email,
          subject: 'การบริจาคสำเร็จ - CMU ShareCycle',
          html: emailHtml,
        }),
        sendEmail({
          to: donationRequest.requester_email,
          subject: 'การบริจาคสำเร็จ - CMU ShareCycle',
          html: emailHtml,
        }),
      ])
    } catch (emailErr) {
      console.error('Failed to send completion emails:', emailErr)
    }
  } catch (err) {
    console.error('Complete donation error:', err)
    throw err
  }
}

