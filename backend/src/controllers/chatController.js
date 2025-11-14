import { randomBytes } from 'crypto'
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

  const isExchangeChat = Boolean(exchangeRequestId)
  const insertResult = await query(
    `INSERT INTO chats (creator_id, participant_id, item_id, exchange_request_id)
     VALUES ($1,$2,$3,$4)
     RETURNING id`,
    [req.user.id, participant, itemId || null, exchangeRequestId || null]
  )

  const chatId = insertResult.rows[0].id

  // --- START: โค้ดที่แก้ไข ---
  // เราจะตั้งค่า status='active' ให้กับ *ทุก* แชททันที
  // แต่จะตั้งค่า accepted เป็น true เฉพาะแชทที่ไม่ใช่ exchange
  const updates = [
    "status='active'",
    "updated_at=NOW()"
  ];

  if (!isExchangeChat) {
    // แชททั่วไป (ที่ไม่ใช่ exchange) ให้ถือว่า "ยอมรับ" ทั้งสองฝ่ายแล้ว
    updates.push("owner_accepted=true");
    updates.push("requester_accepted=true");
  }
  
  await query(
    `UPDATE chats 
     SET ${updates.join(', ')}
     WHERE id=$1`,
    [chatId]
  )
  // --- END: โค้ดที่แก้ไข ---

  const chatRow = await fetchChatById(chatId)
  const chatForCurrentUser = mapChatRow(chatRow, req.user.id)
  const chatForParticipant = mapChatRow(chatRow, participant)

  const io = getChatServer()
  if (io) {
    io.to(participant).emit('chat:created', chatForParticipant)
    io.to(participant).emit('notification:new')
  }

  return res.status(201).json(chatForCurrentUser)
}

export const acceptChat = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { chatId } = req.params
  let chatRow = await fetchChatById(chatId)

  if (!chatRow) {
    return res.status(404).json({ message: 'Chat not found' })
  }

  if (chatRow.status === 'declined' || chatRow.closed_at) {
    return res.status(400).json({ message: 'Chat has been closed' })
  }

  const role = resolveChatRole(chatRow, req.user.id)
  if (!role || role === 'viewer' || role === 'participant' || role === 'creator') {
    return res.status(403).json({ message: 'You are not part of this chat or action not allowed' })
  }

  if (!chatRow.exchange_request_id) {
    return res.status(400).json({ message: 'Chat confirmation is only available for exchange chats' })
  }

  const column = role === 'owner' ? 'owner_accepted' : 'requester_accepted'
  if (chatRow[column]) {
    return res.json(mapChatRow(chatRow, req.user.id))
  }

  await query(
    `UPDATE chats 
     SET ${column}=TRUE,
         updated_at=NOW()
     WHERE id=$1`,
    [chatId]
  )

  chatRow = await fetchChatById(chatId)

  // --- START: โค้ดที่แก้ไข ---
  // เช็คว่าทั้งสองฝ่าย accept และ QR Code ยังไม่เคยถูกสร้าง
  if (chatRow.owner_accepted && chatRow.requester_accepted && !chatRow.qr_code) {
    const qrCode = generateExchangeCode() // สร้าง code ใหม่เลย ไม่ต้อง check `||`
    await query(
      `UPDATE chats 
       SET qr_code=$2,
           updated_at=NOW()
       WHERE id=$1`,
      // ไม่ต้องอัปเดต status='active' เพราะมัน active อยู่แล้ว
      [chatId, qrCode]
    )
    chatRow = await fetchChatById(chatId)
  }
  // --- END: โค้ดที่แก้ไข ---

  broadcastChatUpdate(chatRow)
  return res.json(mapChatRow(chatRow, req.user.id))
}

export const declineChat = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { chatId } = req.params
  let chatRow = await fetchChatById(chatId)

  if (!chatRow) {
    return res.status(404).json({ message: 'Chat not found' })
  }

  const role = resolveChatRole(chatRow, req.user.id)
  if (!role || role === 'viewer') {
    return res.status(403).json({ message: 'You are not part of this chat' })
  }

  if (chatRow.status === 'declined' || chatRow.status === 'closed') {
    return res.json(mapChatRow(chatRow, req.user.id))
  }

  const column = role === 'owner' ? 'owner_accepted' : role === 'requester' ? 'requester_accepted' : null

  const updates = [
    "status='declined'",
    'closed_at=NOW()',
    'updated_at=NOW()',
  ]

  if (column) {
    updates.push(`${column}=FALSE`)
  }

  await query(`UPDATE chats SET ${updates.join(', ')} WHERE id=$1`, [chatId])

  chatRow = await fetchChatById(chatId)
  broadcastChatUpdate(chatRow)
  return res.json(mapChatRow(chatRow, req.user.id))
}

export const confirmChatQr = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { chatId } = req.params
  const { code } = req.body

  if (!code) {
    return res.status(400).json({ message: 'QR code is required' })
  }

  let chatRow = await fetchChatById(chatId)

  if (!chatRow) {
    return res.status(404).json({ message: 'Chat not found' })
  }

  const role = resolveChatRole(chatRow, req.user.id)
  if (role !== 'requester') {
    return res.status(403).json({ message: 'Only the requester can confirm the QR code' })
  }

  if (chatRow.status !== 'active') {
    return res.status(400).json({ message: 'Chat is not ready for QR confirmation' })
  }

  if (!chatRow.qr_code) {
    return res.status(400).json({ message: 'QR code not generated yet' })
  }

  if (chatRow.qr_confirmed) {
    return res.json(mapChatRow(chatRow, req.user.id))
  }

  if (chatRow.qr_code !== code.trim()) {
    return res.status(400).json({ message: 'รหัสไม่ถูกต้อง กรุณาลองใหม่' })
  }

  await query(
    `UPDATE chats 
     SET qr_confirmed=TRUE,
         qr_confirmed_at=NOW(),
         closed_at=NOW(),
         updated_at=NOW()
     WHERE id=$1`,
    [chatId]
  )

  chatRow = await fetchChatById(chatId)
  broadcastChatUpdate(chatRow)
  return res.json(mapChatRow(chatRow, req.user.id))
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
      item.id AS item_resolved_id,
      item.title AS item_title,
      item.image_url AS item_image_url,
      item.user_id AS item_owner_id,
      er.requester_id AS exchange_request_requester_id,
      er.status AS exchange_request_status,
      last_message.id AS last_message_id,
      last_message.body AS last_message_body,
      last_message.sender_id AS last_message_sender_id,
      last_message.created_at AS last_message_created_at
    FROM chats c
    JOIN users creator ON c.creator_id = creator.id
    JOIN users participant ON c.participant_id = participant.id
    LEFT JOIN exchange_requests er ON c.exchange_request_id = er.id
    LEFT JOIN items item ON COALESCE(c.item_id, er.item_id) = item.id
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
      item.id AS item_resolved_id,
      item.title AS item_title,
      item.image_url AS item_image_url,
      item.user_id AS item_owner_id,
      er.requester_id AS exchange_request_requester_id,
      er.status AS exchange_request_status,
      last_message.id AS last_message_id,
      last_message.body AS last_message_body,
      last_message.sender_id AS last_message_sender_id,
      last_message.created_at AS last_message_created_at
    FROM chats c
    JOIN users creator ON c.creator_id = creator.id
    JOIN users participant ON c.participant_id = participant.id
    LEFT JOIN exchange_requests er ON c.exchange_request_id = er.id
    LEFT JOIN items item ON COALESCE(c.item_id, er.item_id) = item.id
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

  const itemOwnerId = row.item_owner_id || row.creator_id
  const requesterId =
    row.exchange_request_requester_id ||
    (row.creator_id === itemOwnerId ? row.participant_id : row.creator_id)

  const isCreator = row.creator_id === currentUserId
  const participant =
    row.creator_id === currentUserId
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

  const role = resolveChatRole(row, currentUserId)
  const status = row.status || 'pending'
  const isExchangeChat = Boolean(row.exchange_request_id)
  const canSendMessages = status !== 'declined' && !row.closed_at

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
    status,
    ownerAccepted: row.owner_accepted,
    requesterAccepted: row.requester_accepted,
    qrCode: row.qr_code,
    qrConfirmed: row.qr_confirmed,
    qrConfirmedAt: row.qr_confirmed_at,
    closedAt: row.closed_at,
    itemId: row.item_resolved_id,
    itemTitle: row.item_title,
    itemImageUrl: row.item_image_url,
    exchangeRequestId: row.exchange_request_id,
    exchangeStatus: row.exchange_request_status,
    role,
    isExchangeChat,
    canSendMessages,
    last_message: row.last_message_id
      ? {
          id: row.last_message_id,
          body: row.last_message_body,
          sender_id: row.last_message_sender_id,
          created_at: row.last_message_created_at,
        }
      : null,
    updatedAt: row.updated_at,
  }
}

function resolveChatRole(row, userId) {
  const itemOwnerId = row.item_owner_id || row.creator_id
  const requesterId =
    row.exchange_request_requester_id ||
    (row.creator_id === itemOwnerId ? row.participant_id : row.creator_id)

  if (row.exchange_request_id) {
    if (userId === itemOwnerId) return 'owner'
    if (userId === requesterId) return 'requester'
    if (userId === row.creator_id) return 'creator'
    if (userId === row.participant_id) return 'participant'
    return 'viewer'
  }

  if (userId === row.creator_id) return 'creator'
  if (userId === row.participant_id) return 'participant'
  return 'viewer'
}

function broadcastChatUpdate(chatRow) {
  if (!chatRow) return
  const io = getChatServer()
  if (!io) return

  io.to(chatRow.creator_id).emit('chat:updated', mapChatRow(chatRow, chatRow.creator_id))
  io.to(chatRow.participant_id).emit('chat:updated', mapChatRow(chatRow, chatRow.participant_id))
}

function generateExchangeCode() {
  const random = randomBytes(4).readUInt32BE(0) % 100000000
  return `EX${random.toString().padStart(8, '0')}`
}
