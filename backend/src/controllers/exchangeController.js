import { validationResult } from 'express-validator'
import { query } from '../db/pool.js'
import { sendEmail } from '../utils/email.js'
import { calculateItemCO2, calculateExchangeCO2Reduction } from '../utils/co2Calculator.js'

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

    // นับจำนวนคำขอแลกเปลี่ยนทั้งหมดที่ยัง pending สำหรับ item นี้
    const pendingCountResult = await query(
      `SELECT COUNT(*) as count FROM exchange_requests 
       WHERE item_id=$1 AND status='pending'`,
      [itemId]
    )
    const pendingCount = parseInt(pendingCountResult.rows[0].count) || 0

    // สร้าง notification สำหรับเจ้าของโพสต์
    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        item.user_id,
        'มีคำขอแลกเปลี่ยนใหม่',
        `${req.user.name} ขอแลกเปลี่ยนสำหรับ "${item.title}"${pendingCount > 1 ? ` (มี ${pendingCount} คำขอทั้งหมด)` : ''}`,
        'exchange_request',
        JSON.stringify({ exchangeRequestId: exchangeRequest.id, itemId, requesterId: req.user.id }),
      ]
    )

    // ส่งอีเมลไปยังเจ้าของโพสต์
    try {
      await sendEmail({
        to: item.email,
        subject: `[CMU ShareCycle] มีคำขอแลกเปลี่ยนใหม่ - ${item.title}${pendingCount > 1 ? ` (${pendingCount} คำขอ)` : ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #2D7D3F; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">CMU ShareCycle</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Green Campus Exchange Platform</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
              <h2 style="color: #2D7D3F; margin-top: 0;">มีคำขอแลกเปลี่ยนใหม่</h2>
              <p style="font-size: 16px; line-height: 1.6;">สวัสดี <strong>${item.name}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.6;">
                <strong>${req.user.name}</strong> สนใจแลกเปลี่ยนสินค้า "<strong>${item.title}</strong>" กับคุณ
              </p>
              ${pendingCount > 1 ? `
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #856404; font-weight: 600;">
                    📬 คุณมีคำขอแลกเปลี่ยนทั้งหมด <strong>${pendingCount} คำขอ</strong> สำหรับสินค้านี้
                  </p>
                  <p style="margin: 5px 0 0 0; font-size: 13px; color: #856404;">
                    กรุณาเข้าสู่ระบบเพื่อดูและเลือกคำขอที่คุณต้องการ
                  </p>
                </div>
              ` : ''}
              ${message ? `
                <div style="background-color: #fff; border-left: 4px solid #2D7D3F; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #666;"><strong>ข้อความจากผู้ขอแลกเปลี่ยน:</strong></p>
                  <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.6;">${message}</p>
                </div>
              ` : ''}
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000" style="display: inline-block; background-color: #2D7D3F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">เข้าสู่ระบบเพื่อดูและเลือกคำขอ</a>
              </div>
              <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 20px;">
                💡 <strong>คำแนะนำ:</strong> คุณสามารถดูคำขอแลกเปลี่ยนทั้งหมดและเลือกได้ว่าต้องการแลกเปลี่ยนกับใคร โดยกดปุ่ม "จัดการ" ในโพสต์ของคุณ
              </p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                อีเมลนี้ส่งจากระบบ CMU ShareCycle - Green Campus Initiative<br>
                Chiang Mai University | sharecycle@cmu.ac.th
              </p>
            </div>
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
        i.title as item_title,
        i.image_url as item_image_url,
        i.category as item_category,
        i.item_condition as item_condition,
        i.user_id as item_owner_id,
        owner.name as owner_name,
        owner.email as owner_email,
        owner.faculty as owner_faculty,
        owner.avatar_url as owner_avatar_url,
        requester.name as requester_name,
        requester.email as requester_email,
        requester.faculty as requester_faculty,
        requester.avatar_url as requester_avatar_url,
        CASE 
          WHEN i.user_id = $1 THEN 'owner'
          ELSE 'requester'
        END as user_role
       FROM exchange_requests er
       JOIN items i ON er.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON er.requester_id = requester.id
       WHERE er.id = $1`,
      [requestId]
    )

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Exchange request not found' })
    }

    const exchangeRequest = result.rows[0]

    // ตรวจสอบว่า user มีสิทธิ์ดูคำขอนี้หรือไม่
    if (exchangeRequest.item_owner_id !== req.user.id && exchangeRequest.requester_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to view this exchange request' })
    }

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
    const exchangeResult = await query(
      `SELECT 
        er.*,
        i.title as item_title,
        i.user_id as owner_id,
        owner.name as owner_name,
        owner.email as owner_email,
        requester.name as requester_name,
        requester.email as requester_email
       FROM exchange_requests er
       JOIN items i ON er.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON er.requester_id = requester.id
       WHERE er.id = $1`,
      [requestId]
    )

    if (!exchangeResult.rowCount) {
      return res.status(404).json({ message: 'Exchange request not found' })
    }

    const exchangeRequest = exchangeResult.rows[0]

    // ตรวจสอบว่า user เป็นเจ้าของ item หรือไม่
    if (exchangeRequest.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the item owner can accept this request' })
    }

    // อัปเดต owner_accepted
    await query(
      `UPDATE exchange_requests 
       SET owner_accepted=TRUE, updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )

    // ดึงคำขออื่นๆ ที่ยัง pending สำหรับ item เดียวกันก่อนที่จะปฏิเสธ
    const otherRequestsResult = await query(
      `SELECT er.id, er.requester_id, u.name as requester_name, u.email as requester_email
       FROM exchange_requests er
       JOIN users u ON er.requester_id = u.id
       WHERE er.item_id=$1 AND er.id!=$2 AND er.status='pending'`,
      [exchangeRequest.item_id, requestId]
    )

    // ปฏิเสธคำขออื่นๆ สำหรับ item เดียวกัน (ให้เจ้าของโพสต์เลือกได้ว่าอยากแลกกับใคร)
    if (otherRequestsResult.rowCount > 0) {
      await query(
        `UPDATE exchange_requests 
         SET status='rejected', updated_at=NOW()
         WHERE item_id=$1 AND id!=$2 AND status='pending'`,
        [exchangeRequest.item_id, requestId]
      )

      // สร้าง notification สำหรับผู้ขอแลกที่ถูกปฏิเสธ
      for (const rejected of otherRequestsResult.rows) {
        await query(
          `INSERT INTO notifications (user_id, title, body, type, metadata)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            rejected.requester_id,
            'คำขอแลกเปลี่ยนถูกปฏิเสธ',
            `เจ้าของโพสต์เลือกคำขอแลกเปลี่ยนอื่นสำหรับ "${exchangeRequest.item_title}"`,
            'exchange_rejected',
            JSON.stringify({ exchangeRequestId: rejected.id, itemId: exchangeRequest.item_id }),
          ]
        )

        // ส่งอีเมลแจ้งผู้ขอแลกที่ถูกปฏิเสธ
        try {
          await sendEmail({
            to: rejected.requester_email,
            subject: `[CMU ShareCycle] คำขอแลกเปลี่ยนถูกปฏิเสธ - ${exchangeRequest.item_title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #2D7D3F; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">CMU ShareCycle</h1>
                  <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Green Campus Exchange Platform</p>
                </div>
                <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                  <h2 style="color: #2D7D3F; margin-top: 0;">คำขอแลกเปลี่ยนถูกปฏิเสธ</h2>
                  <p style="font-size: 16px; line-height: 1.6;">สวัสดี <strong>${rejected.requester_name}</strong>,</p>
                  <p style="font-size: 16px; line-height: 1.6;">
                    เจ้าของโพสต์ได้เลือกคำขอแลกเปลี่ยนอื่นสำหรับสินค้า "<strong>${exchangeRequest.item_title}</strong>"
                  </p>
                  <p style="font-size: 16px; line-height: 1.6;">
                    คำขอแลกเปลี่ยนของคุณจึงถูกปฏิเสธ แต่อย่าลืมว่ายังมีสินค้าอื่นๆ อีกมากมายที่รอคุณอยู่
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000" style="display: inline-block; background-color: #2D7D3F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">ดูสินค้าอื่นๆ</a>
                  </div>
                </div>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #666;">
                    อีเมลนี้ส่งจากระบบ CMU ShareCycle - Green Campus Initiative<br>
                    Chiang Mai University | sharecycle@cmu.ac.th
                  </p>
                </div>
              </div>
            `,
          })
        } catch (emailErr) {
          console.error('Failed to send rejection email:', emailErr)
        }
      }
    }

    // ตรวจสอบว่าทั้งสองฝ่ายยอมรับแล้วหรือไม่
    const updatedRequest = await query(
      'SELECT * FROM exchange_requests WHERE id=$1',
      [requestId]
    )

    const updated = updatedRequest.rows[0]

    if (updated.owner_accepted && updated.requester_accepted) {
      // ทั้งสองฝ่ายยอมรับแล้ว - สร้าง exchange history และ chat
      await completeExchange(requestId, exchangeRequest)
    } else {
      // สร้าง notification สำหรับ requester
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

      // ส่งอีเมลไปยัง requester
      try {
        await sendEmail({
          to: exchangeRequest.requester_email,
          subject: `[CMU ShareCycle] เจ้าของโพสต์ยอมรับคำขอแลกเปลี่ยน - ${exchangeRequest.item_title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #2D7D3F; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">CMU ShareCycle</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Green Campus Exchange Platform</p>
              </div>
              <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                <h2 style="color: #2D7D3F; margin-top: 0;">เจ้าของโพสต์ยอมรับคำขอแลกเปลี่ยน</h2>
                <p style="font-size: 16px; line-height: 1.6;">สวัสดี <strong>${exchangeRequest.requester_name}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.6;">
                  <strong>${exchangeRequest.owner_name}</strong> ยอมรับคำขอแลกเปลี่ยนสำหรับสินค้า "<strong>${exchangeRequest.item_title}</strong>"
                </p>
                <p style="font-size: 16px; line-height: 1.6;">กรุณาเข้าสู่ระบบเพื่อยอมรับคำขอแลกเปลี่ยนของคุณ</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="http://localhost:3000" style="display: inline-block; background-color: #2D7D3F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">เข้าสู่ระบบ</a>
                </div>
              </div>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr)
      }
    }

    // ดึงข้อมูล exchange request ที่อัปเดตแล้ว
    const finalResult = await query(
      `SELECT 
        er.*,
        i.title as item_title,
        i.image_url as item_image_url,
        i.category as item_category,
        i.item_condition as item_condition,
        i.user_id as item_owner_id,
        owner.name as owner_name,
        owner.email as owner_email,
        owner.faculty as owner_faculty,
        owner.avatar_url as owner_avatar_url,
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
       WHERE er.id = $1`,
      [requestId, req.user.id]
    )

    return res.json(finalResult.rows[0])
  } catch (err) {
    console.error('Accept exchange request by owner error:', err)
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
    const exchangeResult = await query(
      `SELECT 
        er.*,
        i.title as item_title,
        i.user_id as owner_id,
        owner.name as owner_name,
        owner.email as owner_email,
        requester.name as requester_name,
        requester.email as requester_email
       FROM exchange_requests er
       JOIN items i ON er.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON er.requester_id = requester.id
       WHERE er.id = $1`,
      [requestId]
    )

    if (!exchangeResult.rowCount) {
      return res.status(404).json({ message: 'Exchange request not found' })
    }

    const exchangeRequest = exchangeResult.rows[0]

    // ตรวจสอบว่า user เป็น requester หรือไม่
    if (exchangeRequest.requester_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the requester can accept this request' })
    }

    // อัปเดต requester_accepted
    await query(
      `UPDATE exchange_requests 
       SET requester_accepted=TRUE, updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )

    // ตรวจสอบว่าทั้งสองฝ่ายยอมรับแล้วหรือไม่
    const updatedRequest = await query(
      'SELECT * FROM exchange_requests WHERE id=$1',
      [requestId]
    )

    const updated = updatedRequest.rows[0]

    if (updated.owner_accepted && updated.requester_accepted) {
      // ทั้งสองฝ่ายยอมรับแล้ว - สร้าง exchange history และ chat
      await completeExchange(requestId, exchangeRequest)
    }

    // ดึงข้อมูล exchange request ที่อัปเดตแล้ว
    const finalResult = await query(
      `SELECT 
        er.*,
        i.title as item_title,
        i.image_url as item_image_url,
        i.category as item_category,
        i.item_condition as item_condition,
        i.user_id as item_owner_id,
        owner.name as owner_name,
        owner.email as owner_email,
        owner.faculty as owner_faculty,
        owner.avatar_url as owner_avatar_url,
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
       WHERE er.id = $1`,
      [requestId, req.user.id]
    )

    return res.json(finalResult.rows[0])
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
    const exchangeResult = await query(
      `SELECT 
        er.*,
        i.title as item_title,
        i.user_id as owner_id,
        owner.name as owner_name,
        owner.email as owner_email,
        requester.name as requester_name,
        requester.email as requester_email
       FROM exchange_requests er
       JOIN items i ON er.item_id = i.id
       JOIN users owner ON i.user_id = owner.id
       JOIN users requester ON er.requester_id = requester.id
       WHERE er.id = $1`,
      [requestId]
    )

    if (!exchangeResult.rowCount) {
      return res.status(404).json({ message: 'Exchange request not found' })
    }

    const exchangeRequest = exchangeResult.rows[0]

    // ตรวจสอบว่า user เป็นเจ้าของ item หรือ requester
    const isOwner = exchangeRequest.owner_id === req.user.id
    const isRequester = exchangeRequest.requester_id === req.user.id

    if (!isOwner && !isRequester) {
      return res.status(403).json({ message: 'You do not have permission to reject this request' })
    }

    // อัปเดต status เป็น rejected
    await query(
      `UPDATE exchange_requests 
       SET status='rejected', updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )

    // สร้าง notification สำหรับอีกฝ่าย
    const notifyUserId = isOwner ? exchangeRequest.requester_id : exchangeRequest.owner_id
    const rejecterName = isOwner ? exchangeRequest.owner_name : exchangeRequest.requester_name

    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        notifyUserId,
        'คำขอแลกเปลี่ยนถูกปฏิเสธ',
        `${rejecterName} ปฏิเสธคำขอแลกเปลี่ยนสำหรับ "${exchangeRequest.item_title}"`,
        'exchange_rejected',
        JSON.stringify({ exchangeRequestId: requestId, itemId: exchangeRequest.item_id }),
      ]
    )

    // ส่งอีเมลไปยังอีกฝ่าย
    try {
      const recipientEmail = isOwner ? exchangeRequest.requester_email : exchangeRequest.owner_email
      await sendEmail({
        to: recipientEmail,
        subject: `[CMU ShareCycle] คำขอแลกเปลี่ยนถูกปฏิเสธ - ${exchangeRequest.item_title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #2D7D3F; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">CMU ShareCycle</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Green Campus Exchange Platform</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
              <h2 style="color: #2D7D3F; margin-top: 0;">คำขอแลกเปลี่ยนถูกปฏิเสธ</h2>
              <p style="font-size: 16px; line-height: 1.6;">สวัสดี,</p>
              <p style="font-size: 16px; line-height: 1.6;">
                <strong>${rejecterName}</strong> ปฏิเสธคำขอแลกเปลี่ยนสำหรับสินค้า "<strong>${exchangeRequest.item_title}</strong>"
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000" style="display: inline-block; background-color: #2D7D3F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">เข้าสู่ระบบ</a>
              </div>
            </div>
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

// Helper function: สร้าง chat เมื่อทั้งสองฝ่าย accept (ยังไม่สร้าง exchange_history)
async function completeExchange(requestId, exchangeRequest) {
  try {
    // อัปเดต status เป็น chatting (รอให้ยอมรับในแชท)
    await query(
      `UPDATE exchange_requests 
       SET status='chatting', updated_at=NOW()
       WHERE id=$1`,
      [requestId]
    )

    // ตรวจสอบว่ามี chat อยู่แล้วหรือไม่
    const existingChat = await query(
      `SELECT id FROM chats WHERE exchange_request_id=$1`,
      [requestId]
    )

    let chatId
    if (existingChat.rowCount > 0) {
      chatId = existingChat.rows[0].id
    } else {
      // สร้าง chat อัตโนมัติ
      const chatResult = await query(
        `INSERT INTO chats (creator_id, participant_id, item_id, exchange_request_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [exchangeRequest.owner_id, exchangeRequest.requester_id, exchangeRequest.item_id, requestId]
      )
      chatId = chatResult.rows[0].id
    }

    const metadata = JSON.stringify({ exchangeRequestId: requestId, chatId, itemId: exchangeRequest.item_id })

    // สร้าง notifications สำหรับทั้งสองฝ่าย
    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $4, $5)`,
      [
        exchangeRequest.owner_id,
        'แชทเปิดให้แล้ว',
        `การแลกเปลี่ยน "${exchangeRequest.item_title}" - แชทได้เปิดให้แล้ว กรุณายอมรับหรือปฏิเสธในแชท`,
        'chat_opened',
        metadata,
        exchangeRequest.requester_id,
        'แชทเปิดให้แล้ว',
        `การแลกเปลี่ยน "${exchangeRequest.item_title}" - แชทได้เปิดให้แล้ว กรุณายอมรับหรือปฏิเสธในแชท`,
        metadata,
      ]
    )

    // ส่งอีเมลไปยังทั้งสองฝ่าย
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2D7D3F; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">CMU ShareCycle</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Green Campus Exchange Platform</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <h2 style="color: #2D7D3F; margin-top: 0;">แชทเปิดให้แล้ว!</h2>
            <p style="font-size: 16px; line-height: 1.6;">การแลกเปลี่ยนสินค้า "<strong>${exchangeRequest.item_title}</strong>" - แชทได้เปิดให้แล้ว</p>
            <p style="font-size: 16px; line-height: 1.6;">กรุณาเข้าสู่ระบบเพื่อยอมรับหรือปฏิเสธการแลกเปลี่ยนในแชท</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" style="display: inline-block; background-color: #2D7D3F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">เข้าสู่ระบบ</a>
            </div>
          </div>
        </div>
      `

      await Promise.all([
        sendEmail({
          to: exchangeRequest.owner_email,
          subject: 'แชทเปิดให้แล้ว - CMU ShareCycle',
          html: emailHtml,
        }),
        sendEmail({
          to: exchangeRequest.requester_email,
          subject: 'แชทเปิดให้แล้ว - CMU ShareCycle',
          html: emailHtml,
        }),
      ])
    } catch (emailErr) {
      console.error('Failed to send chat opened emails:', emailErr)
    }

    return { chatId }
  } catch (err) {
    console.error('Complete exchange error:', err)
    throw err
  }
}

// ยอมรับการแลกเปลี่ยนในแชท
export const acceptInChat = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { chatId } = req.params

  try {
    // ดึงข้อมูล chat และ exchange request
    const chatResult = await query(
      `SELECT c.*, er.status as exchange_request_status, er.id as exchange_request_id, i.user_id as owner_id, i.title as item_title, i.status as item_status, i.id as item_id
       FROM chats c
       JOIN exchange_requests er ON c.exchange_request_id = er.id
       JOIN items i ON er.item_id = i.id
       WHERE c.id=$1`,
      [chatId]
    )

    if (!chatResult.rowCount) {
      return res.status(404).json({ message: 'Chat not found' })
    }

    const chat = chatResult.rows[0]

    // ตรวจสอบว่าเป็นผู้ใช้ที่เกี่ยวข้องกับ exchange request หรือไม่
    if (chat.creator_id !== req.user.id && chat.participant_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not part of this exchange' })
    }

    // ตรวจสอบว่า exchange request อยู่ในสถานะ chatting หรือไม่
    if (chat.exchange_request_status !== 'chatting') {
      return res.status(400).json({ message: 'Exchange request is not in chatting status' })
    }

    // อัปเดต exchange request status เป็น in_progress
    await query(
      `UPDATE exchange_requests 
       SET status='in_progress', updated_at=NOW()
       WHERE id=$1`,
      [chat.exchange_request_id]
    )

    // อัปเดต item status เป็น in_progress
    await query(
      `UPDATE items 
       SET status='in_progress', updated_at=NOW()
       WHERE id=$1`,
      [chat.item_id]
    )

    // สร้าง notification สำหรับอีกฝ่าย
    const otherUserId = chat.creator_id === req.user.id ? chat.participant_id : chat.creator_id
    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        otherUserId,
        'การแลกเปลี่ยนได้รับการยอมรับ',
        `การแลกเปลี่ยน "${chat.item_title}" ได้รับการยอมรับแล้ว กำลังดำเนินการ`,
        'exchange_in_progress',
        JSON.stringify({ exchangeRequestId: chat.exchange_request_id, chatId, itemId: chat.item_id }),
      ]
    )

    return res.json({ success: true, message: 'Exchange accepted in chat' })
  } catch (err) {
    console.error('Accept in chat error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ปฏิเสธการแลกเปลี่ยนในแชท
export const rejectInChat = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { chatId } = req.params

  try {
    // ดึงข้อมูล chat และ exchange request
    const chatResult = await query(
      `SELECT c.*, er.status as exchange_request_status, er.id as exchange_request_id, i.user_id as owner_id, i.title as item_title, i.status as item_status, i.id as item_id
       FROM chats c
       JOIN exchange_requests er ON c.exchange_request_id = er.id
       JOIN items i ON er.item_id = i.id
       WHERE c.id=$1`,
      [chatId]
    )

    if (!chatResult.rowCount) {
      return res.status(404).json({ message: 'Chat not found' })
    }

    const chat = chatResult.rows[0]

    // ตรวจสอบว่าเป็นผู้ใช้ที่เกี่ยวข้องกับ exchange request หรือไม่
    if (chat.creator_id !== req.user.id && chat.participant_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not part of this exchange' })
    }

    // ตรวจสอบว่า exchange request อยู่ในสถานะ chatting หรือ in_progress หรือไม่
    if (chat.exchange_request_status !== 'chatting' && chat.exchange_request_status !== 'in_progress') {
      return res.status(400).json({ message: 'Exchange request cannot be rejected in current status' })
    }

    // อัปเดต exchange request status เป็น rejected
    await query(
      `UPDATE exchange_requests 
       SET status='rejected', updated_at=NOW()
       WHERE id=$1`,
      [chat.exchange_request_id]
    )

    // อัปเดต item status กลับเป็น active
    await query(
      `UPDATE items 
       SET status='active', updated_at=NOW()
       WHERE id=$1`,
      [chat.item_id]
    )

    // สร้าง notification สำหรับอีกฝ่าย
    const otherUserId = chat.creator_id === req.user.id ? chat.participant_id : chat.creator_id
    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        otherUserId,
        'การแลกเปลี่ยนถูกปฏิเสธ',
        `การแลกเปลี่ยน "${chat.item_title}" ถูกปฏิเสธ`,
        'exchange_rejected',
        JSON.stringify({ exchangeRequestId: chat.exchange_request_id, chatId, itemId: chat.item_id }),
      ]
    )

    return res.json({ success: true, message: 'Exchange rejected in chat' })
  } catch (err) {
    console.error('Reject in chat error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// สแกน QR code ปิดงาน (finalize exchange) - สร้าง exchange_history และอัปเดต item status
export const finalizeExchange = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { chatId } = req.params

  try {
    // ดึงข้อมูล chat และ exchange request
    const chatResult = await query(
      `SELECT c.*, er.status as exchange_request_status, er.id as exchange_request_id, er.requester_id, i.user_id as owner_id, i.title as item_title, i.category, i.item_condition, i.id as item_id
       FROM chats c
       JOIN exchange_requests er ON c.exchange_request_id = er.id
       JOIN items i ON er.item_id = i.id
       WHERE c.id=$1`,
      [chatId]
    )

    if (!chatResult.rowCount) {
      return res.status(404).json({ message: 'Chat not found' })
    }

    const chat = chatResult.rows[0]

    // ตรวจสอบว่าเป็นผู้ใช้ที่เกี่ยวข้องกับ exchange request หรือไม่
    if (chat.creator_id !== req.user.id && chat.participant_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not part of this exchange' })
    }

    // ตรวจสอบว่า exchange request อยู่ในสถานะ in_progress หรือไม่
    if (chat.exchange_request_status !== 'in_progress') {
      return res.status(400).json({ message: 'Exchange request must be in_progress to finalize' })
    }

    // ตรวจสอบว่ามี exchange_history อยู่แล้วหรือไม่
    const existingHistory = await query(
      `SELECT id FROM exchange_history WHERE exchange_request_id=$1`,
      [chat.exchange_request_id]
    )

    if (existingHistory.rowCount > 0) {
      return res.status(400).json({ message: 'Exchange already finalized' })
    }

    // คำนวณ CO₂ footprint ของ item ของ owner
    const co2OwnerItem = calculateItemCO2(chat.category, chat.item_condition)

    // การแลกเปลี่ยนช่วยลด CO₂ ได้ 75% ของค่า footprint ของ item
    const co2Reduced = co2OwnerItem * 0.75

    // สร้าง exchange history
    const historyResult = await query(
      `INSERT INTO exchange_history (exchange_request_id, item_id, owner_id, requester_id, co2_reduced)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [chat.exchange_request_id, chat.item_id, chat.owner_id, chat.requester_id, parseFloat(co2Reduced.toFixed(2))]
    )

    // อัปเดต exchange request status เป็น completed
    await query(
      `UPDATE exchange_requests 
       SET status='completed', updated_at=NOW()
       WHERE id=$1`,
      [chat.exchange_request_id]
    )

    // อัปเดต item status เป็น exchanged
    await query(
      `UPDATE items 
       SET status='exchanged', updated_at=NOW()
       WHERE id=$1`,
      [chat.item_id]
    )

    const co2ReducedFormatted = parseFloat(co2Reduced.toFixed(2))
    const metadata = JSON.stringify({ exchangeRequestId: chat.exchange_request_id, chatId, itemId: chat.item_id })

    // สร้าง notifications สำหรับทั้งสองฝ่าย
    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $4, $5)`,
      [
        chat.owner_id,
        'การแลกเปลี่ยนสำเร็จ',
        `การแลกเปลี่ยน "${chat.item_title}" สำเร็จแล้ว CO₂ ที่ลดได้: ${co2ReducedFormatted} kg`,
        'exchange_completed',
        metadata,
        chat.requester_id,
        'การแลกเปลี่ยนสำเร็จ',
        `การแลกเปลี่ยน "${chat.item_title}" สำเร็จแล้ว CO₂ ที่ลดได้: ${co2ReducedFormatted} kg`,
        metadata,
      ]
    )

    // ส่งอีเมลไปยังทั้งสองฝ่าย
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2D7D3F; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">CMU ShareCycle</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Green Campus Exchange Platform</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <h2 style="color: #2D7D3F; margin-top: 0;">การแลกเปลี่ยนสำเร็จ!</h2>
            <p style="font-size: 16px; line-height: 1.6;">การแลกเปลี่ยนสินค้า "<strong>${chat.item_title}</strong>" สำเร็จแล้ว</p>
            <p style="font-size: 16px; line-height: 1.6;">CO₂ ที่ลดได้จากการแลกเปลี่ยนนี้: <strong>${co2ReducedFormatted} kg</strong></p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" style="display: inline-block; background-color: #2D7D3F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">เข้าสู่ระบบ</a>
            </div>
          </div>
        </div>
      `

      const ownerEmailResult = await query('SELECT email FROM users WHERE id=$1', [chat.owner_id])
      const requesterEmailResult = await query('SELECT email FROM users WHERE id=$1', [chat.requester_id])

      await Promise.all([
        sendEmail({
          to: ownerEmailResult.rows[0].email,
          subject: 'การแลกเปลี่ยนสำเร็จ - CMU ShareCycle',
          html: emailHtml,
        }),
        sendEmail({
          to: requesterEmailResult.rows[0].email,
          subject: 'การแลกเปลี่ยนสำเร็จ - CMU ShareCycle',
          html: emailHtml,
        }),
      ])
    } catch (emailErr) {
      console.error('Failed to send completion emails:', emailErr)
    }

    return res.json({ 
      success: true, 
      message: 'Exchange finalized successfully',
      exchangeHistory: historyResult.rows[0],
      co2Reduced: co2ReducedFormatted
    })
  } catch (err) {
    console.error('Finalize exchange error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
