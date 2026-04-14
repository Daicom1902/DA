import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' })
    }

    await pool.query(
      'INSERT INTO contacts (name, email, phone, subject, message) VALUES (?,?,?,?,?)',
      [name, email, phone || null, subject, message]
    )

    res.status(201).json({ message: 'Tin nhắn của bạn đã được gửi thành công!' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

export default router
