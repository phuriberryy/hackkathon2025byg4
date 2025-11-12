import http from 'http'
import app from './app.js'
import env from './config/env.js'
import { initChatServer } from './services/chatService.js'

const server = http.createServer(app)
initChatServer(server)

server.listen(env.port, () => {
  console.log(`Backend listening on port ${env.port}`)
})

