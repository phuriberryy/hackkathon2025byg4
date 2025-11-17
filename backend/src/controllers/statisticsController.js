import { query } from '../db/pool.js'

// ดึงสถิติภาพรวมของเว็บ
export const getStatistics = async (req, res) => {
  try {
    // จำนวนผู้ใช้ทั้งหมด
    const usersResult = await query('SELECT COUNT(*) as count FROM users')
    const totalUsers = parseInt(usersResult.rows[0].count) || 0

    // จำนวนสินค้าทั้งหมด
    const itemsResult = await query('SELECT COUNT(*) as count FROM items WHERE status != \'deleted\'')
    const totalItems = parseInt(itemsResult.rows[0].count) || 0

    // จำนวนการแลกเปลี่ยนที่สำเร็จ
    const exchangesResult = await query('SELECT COUNT(*) as count FROM exchange_history')
    const totalExchanges = parseInt(exchangesResult.rows[0].count) || 0

    // CO₂ ที่ลดได้ทั้งหมด (kg)
    const co2Result = await query('SELECT COALESCE(SUM(co2_reduced), 0) as total FROM exchange_history')
    const totalCO2Reduced = parseFloat(co2Result.rows[0].total) || 0

    // จำนวนคำขอแลกเปลี่ยนทั้งหมด
    const requestsResult = await query('SELECT COUNT(*) as count FROM exchange_requests')
    const totalRequests = parseInt(requestsResult.rows[0].count) || 0

    // จำนวนคำขอแลกเปลี่ยนที่รอการตอบรับ
    const pendingRequestsResult = await query('SELECT COUNT(*) as count FROM exchange_requests WHERE status = \'pending\'')
    const pendingRequests = parseInt(pendingRequestsResult.rows[0].count) || 0

    // จำนวนสินค้าที่พร้อมแลกเปลี่ยน (active)
    const activeItemsResult = await query(`
      SELECT COUNT(*) as count 
      FROM items 
      WHERE status = 'active' 
      AND (available_until IS NULL OR available_until >= CURRENT_DATE)
    `)
    const activeItems = parseInt(activeItemsResult.rows[0].count) || 0

    res.json({
      totalUsers,
      totalItems,
      activeItems,
      totalExchanges,
      totalCO2Reduced: parseFloat(totalCO2Reduced.toFixed(2)),
      totalRequests,
      pendingRequests,
    })
  } catch (err) {
    console.error('Get statistics error:', err)
    res.status(500).json({ message: 'Failed to fetch statistics' })
  }
}

