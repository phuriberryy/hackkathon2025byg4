import fs from 'fs'
import path from 'path'
import url from 'url'
import { Pool } from 'pg'
import dotenv from 'dotenv'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const sqlPath = path.resolve(__dirname, '..', 'sql', 'migrate_donation_requests.sql')
const sql = fs.readFileSync(sqlPath, 'utf-8')

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined')
  }

  const pool = new Pool({ connectionString: databaseUrl })
  try {
    console.log('🔄 Running donation requests migration...')
    await pool.query(sql)
    console.log('✅ Migration completed successfully!')
    console.log('   - Added listing_type column to items table')
    console.log('   - Created donation_requests table')
    console.log('   - Added donation_request_id to chats table')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})

