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
    const result = await query(
      `SELECT * FROM items 
       WHERE user_id=$1 
       ORDER BY created_at DESC`,
      [req.user.id]
    )

    return res.json(result.rows)
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
        i.title as item_title,
        i.image_url as item_image_url,
        i.category as item_category,
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
       JOIN users owner ON eh.owner_id = owner.id
       JOIN users requester ON eh.requester_id = requester.id
       WHERE eh.owner_id = $1 OR eh.requester_id = $1
       ORDER BY eh.exchanged_at DESC`,
      [req.user.id]
    )

    return res.json(result.rows)
  } catch (err) {
    console.error('Get exchange history error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

