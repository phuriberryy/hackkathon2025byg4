import { query } from '../db/pool.js'

// ดึงข้อมูล profile และ statistics
export const getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    // ดึงข้อมูลผู้ใช้
    const userResult = await query(
      'SELECT id, name, faculty, email, avatar_url, created_at FROM users WHERE id=$1',
      [req.user.id]
    )

    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = userResult.rows[0]

    // นับจำนวน items ที่โพสต์
    const itemsCountResult = await query(
      'SELECT COUNT(*) as count FROM items WHERE user_id=$1',
      [req.user.id]
    )
    const itemsShared = parseInt(itemsCountResult.rows[0].count) || 0

    // คำนวณ CO2 ที่ลดได้ (จาก exchange history)
    const co2Result = await query(
      'SELECT COALESCE(SUM(co2_reduced), 0) as total_co2 FROM exchange_history WHERE owner_id=$1 OR requester_id=$1',
      [req.user.id]
    )
    const co2Reduced = parseFloat(co2Result.rows[0].total_co2) || 0

    return res.json({
      user,
      stats: {
        itemsShared,
        co2Reduced: co2Reduced.toFixed(2),
      },
    })
  } catch (err) {
    console.error('Get profile error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึง items ที่ผู้ใช้โพสต์
export const getMyItems = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    // ใช้ SQL query เพื่อตรวจสอบ expired โดยตรง เพื่อความแม่นยำ
    // available_until <= CURRENT_DATE หมายถึง expired (รวมถึง 0 days remaining)
    const result = await query(
      `SELECT *,
       CASE 
         WHEN available_until IS NOT NULL 
              AND available_until <= CURRENT_DATE 
              AND status != 'exchanged' 
         THEN true 
         ELSE false 
       END as is_expired
       FROM items 
       WHERE user_id=$1 
       ORDER BY created_at DESC`,
      [req.user.id]
    )
    
    const items = result.rows.map(item => ({
      ...item,
      is_expired: item.is_expired === true || item.is_expired === 'true'
    }))

    return res.json(items)
  } catch (err) {
    console.error('Get my items error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// อัปเดต item
export const updateItem = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { itemId } = req.params
  const { title, category, itemCondition, lookingFor, description, availableUntil, imageUrl, pickupLocation, status } = req.body

  try {
    // ตรวจสอบว่า item เป็นของ user นี้หรือไม่
    const itemCheck = await query('SELECT user_id FROM items WHERE id=$1', [itemId])
    if (!itemCheck.rowCount) {
      return res.status(404).json({ message: 'Item not found' })
    }

    if (itemCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own items' })
    }

    const result = await query(
      `UPDATE items 
       SET title=COALESCE($1, title),
           category=COALESCE($2, category),
           item_condition=COALESCE($3, item_condition),
           looking_for=COALESCE($4, looking_for),
           description=COALESCE($5, description),
           available_until=COALESCE($6, available_until),
           image_url=COALESCE($7, image_url),
           pickup_location=COALESCE($8, pickup_location),
           status=COALESCE($9, status),
           updated_at=NOW()
       WHERE id=$10
       RETURNING *`,
      [title, category, itemCondition, lookingFor, description, availableUntil, imageUrl, pickupLocation, status, itemId]
    )

    return res.json(result.rows[0])
  } catch (err) {
    console.error('Update item error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ลบ item
export const deleteItem = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { itemId } = req.params

  try {
    // ตรวจสอบว่า item เป็นของ user นี้หรือไม่
    const itemCheck = await query('SELECT user_id FROM items WHERE id=$1', [itemId])
    if (!itemCheck.rowCount) {
      return res.status(404).json({ message: 'Item not found' })
    }

    if (itemCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own items' })
    }

    // ลบ item (CASCADE จะลบ exchange_requests ที่เกี่ยวข้องด้วย)
    await query('DELETE FROM items WHERE id=$1', [itemId])

    return res.json({ success: true, message: 'Item deleted successfully' })
  } catch (err) {
    console.error('Delete item error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึงประวัติการแลกเปลี่ยน
export const getExchangeHistory = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const result = await query(
      `SELECT 
        eh.*,
        -- Owner item (ของของฉัน หรือ ของที่แลกออกไป)
        i.title as owner_item_title,
        i.image_url as owner_item_image_url,
        i.category as owner_item_category,
        -- Requester item (ของที่ได้รับ หรือ ของที่แลกเข้ามา)
        er.requester_item_name as requester_item_title,
        er.requester_item_image_url as requester_item_image_url,
        er.requester_item_category as requester_item_category,
        -- User info
        owner.name as owner_name,
        owner.email as owner_email,
        requester.name as requester_name,
        requester.email as requester_email,
        CASE 
          WHEN eh.owner_id = $1 THEN 'owner'
          ELSE 'requester'
        END as user_role
       FROM exchange_history eh
       JOIN items i ON eh.item_id = i.id
       LEFT JOIN exchange_requests er ON eh.exchange_request_id = er.id
       JOIN users owner ON eh.owner_id = owner.id
       JOIN users requester ON eh.requester_id = requester.id
       WHERE eh.owner_id = $1 OR eh.requester_id = $1
       ORDER BY eh.exchanged_at DESC`,
      [req.user.id]
    )

    // แปลงข้อมูลให้เหมาะสมกับ frontend
    const formattedResults = result.rows.map(row => {
      // ถ้า user เป็น owner: owner item = ของของฉัน, requester item = ของที่ได้รับ
      // ถ้า user เป็น requester: requester item = ของของฉัน, owner item = ของที่ได้รับ
      if (row.user_role === 'owner') {
        return {
          ...row,
          my_item_title: row.owner_item_title,
          my_item_image_url: row.owner_item_image_url,
          my_item_category: row.owner_item_category,
          received_item_title: row.requester_item_title,
          received_item_image_url: row.requester_item_image_url,
          received_item_category: row.requester_item_category,
          received_from_name: row.requester_name,
          // สำหรับ backward compatibility
          item_title: row.owner_item_title,
          item_image_url: row.owner_item_image_url,
        }
      } else {
        return {
          ...row,
          my_item_title: row.requester_item_title,
          my_item_image_url: row.requester_item_image_url,
          my_item_category: row.requester_item_category,
          received_item_title: row.owner_item_title,
          received_item_image_url: row.owner_item_image_url,
          received_item_category: row.owner_item_category,
          received_from_name: row.owner_name,
          // สำหรับ backward compatibility
          item_title: row.requester_item_title,
          item_image_url: row.requester_item_image_url,
        }
      }
    })

    return res.json(formattedResults)
  } catch (err) {
    console.error('Get exchange history error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// อัปเดต profile
export const updateProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { name, faculty, avatar_url } = req.body

  try {
    // เตรียมค่าสำหรับ update (อัปเดตเฉพาะฟิลด์ที่ส่งมา)
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    if (name !== undefined && name !== null) {
      updateFields.push(`name = $${paramIndex}`)
      updateValues.push(name)
      paramIndex++
    }

    if (faculty !== undefined && faculty !== null) {
      updateFields.push(`faculty = $${paramIndex}`)
      updateValues.push(faculty)
      paramIndex++
    }

    if (avatar_url !== undefined && avatar_url !== null) {
      updateFields.push(`avatar_url = $${paramIndex}`)
      updateValues.push(avatar_url)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' })
    }

    // เพิ่ม updated_at
    updateFields.push(`updated_at = NOW()`)
    
    // เพิ่ม user id เป็น parameter สุดท้าย
    updateValues.push(req.user.id)
    const userIdParamIndex = paramIndex

    const result = await query(
      `UPDATE users 
       SET ${updateFields.join(', ')}
       WHERE id = $${userIdParamIndex}
       RETURNING id, name, faculty, email, avatar_url, created_at`,
      updateValues
    )

    if (!result.rowCount) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json(result.rows[0])
  } catch (err) {
    console.error('Update profile error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}





