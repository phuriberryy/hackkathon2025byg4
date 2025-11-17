import express from 'express'
import { getStatistics } from '../controllers/statisticsController.js'

const router = express.Router()

// ดึงสถิติภาพรวม
router.get('/', getStatistics)

export default router

