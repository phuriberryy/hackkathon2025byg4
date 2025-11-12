import path from 'path'
import url from 'url'
import dotenv from 'dotenv'
import { z } from 'zod'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  EMAIL_HOST: z.string().min(1).optional(),
  EMAIL_PORT: z.coerce.number().default(587).optional(),
  EMAIL_USER: z.string().email().optional(),
  EMAIL_PASS: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
})

const parsed = schema.parse(process.env)

const env = {
  port: parsed.PORT,
  clientOrigin: parsed.CLIENT_ORIGIN,
  databaseUrl: parsed.DATABASE_URL,
  jwtSecret: parsed.JWT_SECRET,
  emailHost: parsed.EMAIL_HOST || 'smtp.office365.com',
  emailPort: parsed.EMAIL_PORT || 587,
  emailUser: parsed.EMAIL_USER || '',
  emailPass: parsed.EMAIL_PASS || '',
  emailFrom: parsed.EMAIL_FROM || parsed.EMAIL_USER || '',
}

export default env
