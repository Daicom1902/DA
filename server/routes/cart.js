import { Router } from 'express'
import pool from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// GET /api/cart — Get user's shopping cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [carts] = await pool.query(
      'SELECT id, user_id, items FROM shopping_carts WHERE user_id = ?',
      [req.user.id]
    )

    if (carts.length === 0) {
      return res.json({ data: { items: [] } })
    }

    const items = typeof carts[0].items === 'string' 
      ? JSON.parse(carts[0].items) 
      : carts[0].items

    res.json({ data: { items } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// POST /api/cart — Save/update user's shopping cart
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items phải là một array' })
    }

    // Check if cart exists
    const [existing] = await pool.query(
      'SELECT id FROM shopping_carts WHERE user_id = ?',
      [req.user.id]
    )

    const itemsJson = JSON.stringify(items)

    if (existing.length > 0) {
      // Update existing cart
      await pool.query(
        'UPDATE shopping_carts SET items = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [itemsJson, req.user.id]
      )
    } else {
      // Insert new cart
      await pool.query(
        'INSERT INTO shopping_carts (user_id, items) VALUES (?, ?)',
        [req.user.id, itemsJson]
      )
    }

    res.json({ message: 'Giỏ hàng đã được lưu', data: { items } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// DELETE /api/cart — Clear user's shopping cart
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE shopping_carts SET items = JSON_ARRAY(), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [req.user.id]
    )

    res.json({ message: 'Giỏ hàng đã được xóa' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

export default router
