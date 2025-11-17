import { Pool } from 'pg'
import env from '../config/env.js'

const pool = new Pool({ connectionString: env.databaseUrl })

// 💡 เพิ่มฟังก์ชันตรวจสอบสถานะการเชื่อมต่อ
export async function verifyDatabaseConnection() {
    try {
        // ทดสอบการเชื่อมต่อโดยการรันคำสั่ง SQL ง่าย ๆ
        await pool.query('SELECT NOW()')
        return true
    } catch (err) {
        // ไม่ต้อง console.error ที่นี่ เพราะจะให้ server.js จัดการแสดงผล
        return false
    }
}

export const query = (text, params) => pool.query(text, params)
export default pool









