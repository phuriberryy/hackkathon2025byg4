import { validationResult } from 'express-validator'
import { query } from '../db/pool.js'
import { getChatServer } from '../services/chatService.js'

export const getChats = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const rows = await fetchChatsForUser(req.user.id)
  const chats = rows.map((row) => mapChatRow(row, req.user.id))

  return res.json(chats)
}

export const getChatMessages = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { chatId } = req.params

  const membership = await query(
    `SELECT 1 FROM chats WHERE id=$1 AND (creator_id=$2 OR participant_id=$2)`,
    [chatId, req.user.id]
  )

  if (!membership.rowCount) {
    return res.status(403).json({ message: 'You do not have access to this chat' })
  }

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

  const { participantId, participantEmail, itemId, exchangeRequestId } = req.body

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
    `SELECT id FROM chats 
     WHERE ((creator_id=$1 AND participant_id=$2) OR (creator_id=$2 AND participant_id=$1))
       AND ($3::uuid IS NULL OR item_id=$3)
       AND ($4::uuid IS NULL OR exchange_request_id=$4)`,
    [req.user.id, participant, itemId || null, exchangeRequestId || null]
  )

  if (existing.rowCount) {
    const chatRow = await fetchChatById(existing.rows[0].id)
    return res.json(mapChatRow(chatRow, req.user.id))
  }

  const insertResult = await query(
    `INSERT INTO chats (creator_id, participant_id, item_id, exchange_request_id)
     VALUES ($1,$2,$3,$4)
     RETURNING id`,
    [req.user.id, participant, itemId || null, exchangeRequestId || null]
  )

  const chatRow = await fetchChatById(insertResult.rows[0].id)
  const chatForCurrentUser = mapChatRow(chatRow, req.user.id)
  const chatForParticipant = mapChatRow(chatRow, participant)

  const io = getChatServer()
  if (io) {
    io.to(participant).emit('chat:created', chatForParticipant)
    io.to(participant).emit('notification:new')
  }

  return res.status(201).json(chatForCurrentUser)
}

async function fetchChatById(chatId) {
  const result = await query(
    `
    SELECT 
      c.*,
      creator.name AS creator_name,
      creator.email AS creator_email,
      creator.avatar_url AS creator_avatar_url,
      participant.name AS participant_name,
      participant.email AS participant_email,
      participant.avatar_url AS participant_avatar_url,
      last_message.id AS last_message_id,
      last_message.body AS last_message_body,
      last_message.sender_id AS last_message_sender_id,
      last_message.created_at AS last_message_created_at
    FROM chats c
    JOIN users creator ON c.creator_id = creator.id
    JOIN users participant ON c.participant_id = participant.id
    LEFT JOIN LATERAL (
      SELECT m.id, m.body, m.sender_id, m.created_at
      FROM messages m
      WHERE m.chat_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) last_message ON TRUE
    WHERE c.id = $1
    `,
    [chatId]
  )

  return result.rows[0]
}

async function fetchChatsForUser(userId) {
  const result = await query(
    `
    SELECT 
      c.*,
      creator.name AS creator_name,
      creator.email AS creator_email,
      creator.avatar_url AS creator_avatar_url,
      participant.name AS participant_name,
      participant.email AS participant_email,
      participant.avatar_url AS participant_avatar_url,
      last_message.id AS last_message_id,
      last_message.body AS last_message_body,
      last_message.sender_id AS last_message_sender_id,
      last_message.created_at AS last_message_created_at
    FROM chats c
    JOIN users creator ON c.creator_id = creator.id
    JOIN users participant ON c.participant_id = participant.id
    LEFT JOIN LATERAL (
      SELECT m.id, m.body, m.sender_id, m.created_at
      FROM messages m
      WHERE m.chat_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) last_message ON TRUE
    WHERE c.creator_id = $1 OR c.participant_id = $1
    ORDER BY COALESCE(last_message.created_at, c.created_at) DESC
    `,
    [userId]
  )

  return result.rows
}

function mapChatRow(row, currentUserId) {
  if (!row) return null

  const isCreator = row.creator_id === currentUserId
  const participant = isCreator
    ? {
        id: row.participant_id,
        name: row.participant_name,
        email: row.participant_email,
        avatar_url: row.participant_avatar_url,
      }
    : {
        id: row.creator_id,
        name: row.creator_name,
        email: row.creator_email,
        avatar_url: row.creator_avatar_url,
      }

  return {
    id: row.id,
    creator_id: row.creator_id,
    participant_id: row.participant_id,
    item_id: row.item_id,
    exchange_request_id: row.exchange_request_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    participant_name: participant.name,
    participant_email: participant.email,
    participant_avatar_url: participant.avatar_url,
    last_message: row.last_message_id
      ? {
          id: row.last_message_id,
          body: row.last_message_body,
          sender_id: row.last_message_sender_id,
          created_at: row.last_message_created_at,
        }
      : null,
  }
}
