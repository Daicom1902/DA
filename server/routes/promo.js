import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// POST /api/promo/validate
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body
    if (!code) return res.status(400).json({ message: 'Chưa nhập mã giảm giá' })

    const [rows] = await pool.query(
      `SELECT id, code, discount_type, discount_value, min_order_value,
              max_uses, used_count, expires_at, is_active
       FROM promo_codes WHERE code = ?`,
      [code.trim().toUpperCase()]
    )

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(404).json({ message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' })
    }

    const promo = rows[0]

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết hạn' })
    }
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return res.status(400).json({ message: 'Mã giảm giá đã được sử dụng hết' })
    }
    if (promo.min_order_value && Number(subtotal) < Number(promo.min_order_value)) {
      return res.status(400).json({
        message: `Đơn hàng tối thiểu ${Number(promo.min_order_value).toLocaleString('vi-VN')}₫ để áp dụng mã này`
      })
    }

    let discountAmount = 0
    if (promo.discount_type === 'percent') {
      discountAmount = Math.round(Number(subtotal) * Number(promo.discount_value) / 100)
    } else {
      discountAmount = Number(promo.discount_value)
    }

    res.json({
      data: {
        code:           promo.code,
        discount_type:  promo.discount_type,
        discount_value: promo.discount_value,
        discount_amount: discountAmount,
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

export default router
