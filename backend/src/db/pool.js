import { Pool } from 'pg'
import env from '../config/env.js'

const pool = new Pool({ connectionString: env.databaseUrl })

export const query = (text, params) => pool.query(text, params)
export default pool

