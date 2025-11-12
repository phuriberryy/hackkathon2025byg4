import { validationResult } from 'express-validator'
import { query } from '../db/pool.js'

export const getItems = async (_req, res) => {
  const result = await query(
    `SELECT items.*, users.name as owner_name, users.faculty as owner_faculty
     FROM items
     JOIN users ON items.user_id = users.id
     WHERE status='active'
     ORDER BY created_at DESC`
  )

  return res.json(result.rows)
}

export const createItem = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { title, category, itemCondition, lookingFor, description, availableUntil, imageUrl, pickupLocation } =
    req.body

  const result = await query(
    `INSERT INTO items (user_id, title, category, item_condition, looking_for, description, available_until, image_url, pickup_location)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      req.user.id,
      title,
      category,
      itemCondition,
      lookingFor,
      description,
      availableUntil || null,
      imageUrl || null,
      pickupLocation || null,
    ]
  )

  return res.status(201).json(result.rows[0])
}

