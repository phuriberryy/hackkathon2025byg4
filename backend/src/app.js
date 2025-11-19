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
import donationRoutes from './routes/donation.routes.js'
import donationRequestRoutes from './routes/donationRequest.routes.js'

const app = express()

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list
    if (env.allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true 
}))
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
app.use('/api/donations', donationRoutes)
app.use('/api/donation-requests', donationRequestRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

export default app
