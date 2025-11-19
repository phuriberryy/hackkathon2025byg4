import { validationResult } from 'express-validator'
import { query } from '../db/pool.js'
import { calculateItemCO2 } from '../utils/co2Calculator.js'
import { detectSpam, validateImage, checkDuplicateContent } from '../utils/contentModeration.js'
import { getChatServer } from '../services/chatService.js'

// ดึง items ทั้งหมด (public)
export const getItems = async (_req, res) => {
  try {
    const result = await query(
      `SELECT items.*, users.name as owner_name, users.faculty as owner_faculty
       FROM items
       JOIN users ON items.user_id = users.id
       WHERE (status='active' OR status='in_progress')
         AND status != 'donated'
         AND (available_until IS NULL OR available_until > CURRENT_DATE)
       ORDER BY created_at DESC`
    )

    // คำนวณ CO₂ footprint สำหรับแต่ละ item
    const itemsWithCO2 = result.rows.map((item) => ({
      ...item,
      co2_footprint: calculateItemCO2(item.category, item.item_condition),
    }))

    return res.json(itemsWithCO2)
  } catch (err) {
    console.error('Get items error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึง item โดย ID
export const getItemById = async (req, res) => {
  const { itemId } = req.params

  try {
    const result = await query(
      `SELECT items.*, users.name as owner_name, users.faculty as owner_faculty, users.email as owner_email
       FROM items
       JOIN users ON items.user_id = users.id
       WHERE items.id=$1`,
      [itemId]
    )

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Item not found' })
    }

    const item = result.rows[0]
    
    // คำนวณ CO₂ footprint
    item.co2_footprint = calculateItemCO2(item.category, item.item_condition)

    return res.json(item)
  } catch (err) {
    console.error('Get item by id error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// สร้าง item ใหม่
export const createItem = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { title, category, itemCondition, lookingFor, description, availableUntil, imageUrl, pickupLocation, listingType } =
    req.body

  try {
    // Content moderation checks
    const titleSpamCheck = detectSpam(title)
    if (titleSpamCheck.isSpam) {
      return res.status(400).json({ 
        message: 'Title contains inappropriate content',
        reason: titleSpamCheck.reason 
      })
    }

    if (description) {
      const descSpamCheck = detectSpam(description)
      if (descSpamCheck.isSpam) {
        return res.status(400).json({ 
          message: 'Description contains inappropriate content',
          reason: descSpamCheck.reason 
        })
      }
    }

    if (lookingFor) {
      const lookingForSpamCheck = detectSpam(lookingFor)
      if (lookingForSpamCheck.isSpam) {
        return res.status(400).json({ 
          message: 'Looking for contains inappropriate content',
          reason: lookingForSpamCheck.reason 
        })
      }
    }

    // Image validation
    if (imageUrl) {
      const imageValidation = validateImage(imageUrl)
      if (!imageValidation.isValid) {
        return res.status(400).json({ 
          message: 'Invalid image',
          reason: imageValidation.reason 
        })
      }
    }

    // Check for duplicate content
    const duplicateCheck = await checkDuplicateContent(query, req.user.id, title, description)
    if (duplicateCheck.isDuplicate) {
      return res.status(400).json({ 
        message: duplicateCheck.reason 
      })
    }

    // Validate expiration date - cannot be in the past
    if (availableUntil) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const expiryDate = new Date(availableUntil)
      expiryDate.setHours(0, 0, 0, 0)
      
      if (expiryDate < today) {
        return res.status(400).json({ 
          message: 'Expiration date cannot be in the past' 
        })
      }
    }

    // Validate listingType
    const validListingType = listingType === 'donation' ? 'donation' : 'exchange'
    
    const result = await query(
      `INSERT INTO items (user_id, title, category, item_condition, looking_for, description, available_until, image_url, pickup_location, listing_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        req.user.id,
        title,
        category,
        itemCondition,
        lookingFor || null,
        description || null,
        availableUntil || null,
        imageUrl || null,
        pickupLocation || null,
        validListingType,
      ]
    )

    const item = result.rows[0]
    
    // คำนวณ CO₂ footprint
    item.co2_footprint = calculateItemCO2(item.category, item.item_condition)

    // Emit socket event for real-time update
    const io = getChatServer()
    if (io) {
      io.emit('item:created')
    }

    return res.status(201).json(item)
  } catch (err) {
    console.error('Create item error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// อัปเดต item
export const updateItem = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { itemId } = req.params
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { title, category, itemCondition, lookingFor, description, availableUntil, imageUrl, pickupLocation, status, listingType } =
    req.body

  try {
    // Content moderation checks for updates
    if (title) {
      const titleSpamCheck = detectSpam(title)
      if (titleSpamCheck.isSpam) {
        return res.status(400).json({ 
          message: 'Title contains inappropriate content',
          reason: titleSpamCheck.reason 
        })
      }
    }

    if (description) {
      const descSpamCheck = detectSpam(description)
      if (descSpamCheck.isSpam) {
        return res.status(400).json({ 
          message: 'Description contains inappropriate content',
          reason: descSpamCheck.reason 
        })
      }
    }

    if (lookingFor) {
      const lookingForSpamCheck = detectSpam(lookingFor)
      if (lookingForSpamCheck.isSpam) {
        return res.status(400).json({ 
          message: 'Looking for contains inappropriate content',
          reason: lookingForSpamCheck.reason 
        })
      }
    }

    // Image validation
    if (imageUrl) {
      const imageValidation = validateImage(imageUrl)
      if (!imageValidation.isValid) {
        return res.status(400).json({ 
          message: 'Invalid image',
          reason: imageValidation.reason 
        })
      }
    }

    // ตรวจสอบว่า item เป็นของ user นี้หรือไม่
    const itemCheck = await query('SELECT user_id FROM items WHERE id=$1', [itemId])
    if (!itemCheck.rowCount) {
      return res.status(404).json({ message: 'Item not found' })
    }

    if (itemCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own items' })
    }

    // Validate expiration date - cannot be in the past
    if (availableUntil) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const expiryDate = new Date(availableUntil)
      expiryDate.setHours(0, 0, 0, 0)
      
      if (expiryDate < today) {
        return res.status(400).json({ 
          message: 'Expiration date cannot be in the past' 
        })
      }
    }

    // Validate listingType if provided
    const validListingType = listingType === 'donation' ? 'donation' : (listingType === 'exchange' ? 'exchange' : null)
    
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
           listing_type=COALESCE($10, listing_type),
           updated_at=NOW()
       WHERE id=$11
       RETURNING *`,
      [title, category, itemCondition, lookingFor, description, availableUntil, imageUrl, pickupLocation, status, validListingType, itemId]
    )

    const item = result.rows[0]
    
    // คำนวณ CO₂ footprint
    item.co2_footprint = calculateItemCO2(item.category, item.item_condition)

    // Emit socket event for real-time update
    const io = getChatServer()
    if (io) {
      io.emit('item:updated', { itemId: item.id })
    }

    return res.json(item)
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

    // Emit socket event for real-time update
    const io = getChatServer()
    if (io) {
      io.emit('item:deleted', { itemId })
    }

    return res.json({ success: true, message: 'Item deleted successfully' })
  } catch (err) {
    console.error('Delete item error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึง exchange requests ของ item
export const getItemExchangeRequests = async (req, res) => {
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
      return res.status(403).json({ message: 'You can only view exchange requests for your own items' })
    }

    const result = await query(
      `SELECT 
        er.*,
        u.name as requester_name,
        u.email as requester_email,
        u.faculty as requester_faculty,
        i.title as item_title
       FROM exchange_requests er
       JOIN users u ON er.requester_id = u.id
       JOIN items i ON er.item_id = i.id
       WHERE er.item_id = $1
       ORDER BY er.created_at DESC`,
      [itemId]
    )

    return res.json(result.rows)
  } catch (err) {
    console.error('Get item exchange requests error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ดึง items ของผู้ใช้
export const getUserItems = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { userId } = req.params
  const targetUserId = userId || req.user.id

  try {
    const result = await query(
      `SELECT * FROM items 
       WHERE user_id=$1 
       ORDER BY created_at DESC`,
      [targetUserId]
    )

    // คำนวณ CO₂ footprint สำหรับแต่ละ item
    const itemsWithCO2 = result.rows.map((item) => ({
      ...item,
      co2_footprint: calculateItemCO2(item.category, item.item_condition),
    }))

    return res.json(itemsWithCO2)
  } catch (err) {
    console.error('Get user items error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
