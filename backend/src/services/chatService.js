import { Server } from 'socket.io'
import env from '../config/env.js'
import { verifyToken } from '../utils/token.js'
import { query } from '../db/pool.js'
import { sendEmail } from '../utils/email.js'

let ioInstance = null

export const initChatServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
      return next(new Error('Unauthorized'))
    }

    try {
      const user = verifyToken(token)
      socket.user = user
      next()
    } catch (err) {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.user
    socket.join(user.id)

    socket.on('chat:join', ({ chatId }) => {
      if (chatId) {
        socket.join(chatId)
      }
    })

    socket.on('chat:message', async ({ chatId, body }) => {
      if (!body || !chatId) return

      const membership = await query(
        `SELECT c.*, er.owner_accepted, er.requester_accepted
         FROM chats c
         LEFT JOIN exchange_requests er ON c.exchange_request_id = er.id
         WHERE c.id=$1 AND (c.creator_id=$2 OR c.participant_id=$2)`,
        [chatId, user.id]
      )

      if (!membership.rowCount) return
      
      const chat = membership.rows[0]
      
      // สำหรับ exchange chat ต้องทั้งสองฝ่ายยอมรับแล้วถึงจะส่งข้อความได้
      if (chat.exchange_request_id) {
        const bothAccepted = chat.owner_accepted && chat.requester_accepted
        if (!bothAccepted) {
          socket.emit('chat:error', { message: 'กรุณารอให้ทั้งสองฝ่ายยอมรับก่อนส่งข้อความ' })
          return
        }
      }
      
      if (chat.status !== 'active') {
        return
      }

      // หลังจากยืนยัน QR แล้วไม่สามารถส่งข้อความได้อีก
      if (chat.qr_confirmed) {
        socket.emit('chat:error', { message: 'ไม่สามารถส่งข้อความได้ เนื่องจากยืนยันการแลกเปลี่ยนแล้ว' })
        return
      }

      const messageResult = await query(
        `INSERT INTO messages (chat_id, sender_id, body)
         VALUES ($1,$2,$3)
         RETURNING *`,
        [chatId, user.id, body]
      )

      const message = messageResult.rows[0]
      // เพิ่มข้อมูลสถานะการอ่าน (ข้อความที่เพิ่งส่งยังไม่อ่าน)
      const messageWithStatus = {
        ...message,
        is_sent_by_me: true,
        is_read: false,
        read_at: null
      }
      io.to(chatId).emit('chat:message', messageWithStatus)

      const recipientId = chat.creator_id === user.id ? chat.participant_id : chat.creator_id

      await query(
        `INSERT INTO notifications (user_id, title, body, metadata)
         VALUES ($1,$2,$3,$4)`,
        [
          recipientId,
          'ข้อความใหม่',
          `${user.name} ส่งข้อความใหม่ถึงคุณ`,
          JSON.stringify({ chatId }),
        ]
      )

      const recipientResult = await query('SELECT email FROM users WHERE id=$1', [recipientId])
      const recipient = recipientResult.rows[0]
      if (recipient?.email) {
        try {
          await sendEmail({
            to: recipient.email,
            subject: 'คุณมีข้อความใหม่บน CMU ShareCycle',
            html: `<p>${user.name} ส่งข้อความใหม่ถึงคุณ:</p><p>${body}</p>`,
          })
        } catch (err) {
          console.error('Failed to send chat email', err)
        }
      }

      io.to(recipientId).emit('notification:new')
      await query(`UPDATE chats SET updated_at=NOW() WHERE id=$1`, [chatId])
    })
  })

  ioInstance = io
  return io
}

export const getChatServer = () => ioInstance


