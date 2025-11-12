import { validationResult } from 'express-validator'
import { query } from '../db/pool.js'

export const getChats = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const result = await query(
    `SELECT c.*, u.name AS participant_name, u.email AS participant_email, u.avatar_url AS participant_avatar_url
     FROM chats c
     JOIN users u ON (CASE WHEN c.creator_id = $1 THEN c.participant_id ELSE c.creator_id END) = u.id
     WHERE c.creator_id = $1 OR c.participant_id = $1
     ORDER BY c.created_at DESC`,
    [req.user.id]
  )

  return res.json(result.rows)
}

export const getChatMessages = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { chatId } = req.params
  const result = await query(
    `SELECT * FROM messages WHERE chat_id=$1 ORDER BY created_at ASC`,
    [chatId]
  )

  return res.json(result.rows)
}

export const createChat = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { participantId, participantEmail, itemId } = req.body

  let participant = participantId
  if (!participant && participantEmail) {
    const userResult = await query('SELECT id FROM users WHERE email=$1', [participantEmail])
    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'Participant not found' })
    }
    participant = userResult.rows[0].id
  }

  if (!participant) {
    return res.status(400).json({ message: 'Participant is required' })
  }

  if (participant === req.user.id) {
    return res.status(400).json({ message: 'Cannot chat with yourself' })
  }

  const existing = await query(
    `SELECT * FROM chats WHERE ((creator_id=$1 AND participant_id=$2) OR (creator_id=$2 AND participant_id=$1)) AND ($3::uuid IS NULL OR item_id=$3)`,
    [req.user.id, participant, itemId || null]
  )

  if (existing.rowCount) {
    return res.json(existing.rows[0])
  }

  const result = await query(
    `INSERT INTO chats (creator_id, participant_id, item_id)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [req.user.id, participant, itemId || null]
  )

  return res.status(201).json(result.rows[0])
}

