import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import env from './config/env.js'
import authRoutes from './routes/auth.routes.js'
import itemRoutes from './routes/item.routes.js'
import exchangeRoutes from './routes/exchange.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import chatRoutes from './routes/chat.routes.js'
import profileRoutes from './routes/profile.routes.js'
import emailRoutes from './routes/email.routes.js'
import statisticsRoutes from './routes/statistics.routes.js'

const app = express()

app.use(cors({ origin: env.clientOrigin, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/items', itemRoutes)
app.use('/api/exchange', exchangeRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/statistics', statisticsRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

export default app
