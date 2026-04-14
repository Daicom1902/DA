import { Router } from 'express'
import pool from '../db.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

// ── GET /api/concentrations  (public) ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, slug FROM concentrations ORDER BY name ASC'
    )
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── POST /api/concentrations  (admin only) ──────────────────────────────────
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Tên nồng độ là bắt buộc' })
    const slug = name.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    const [result] = await pool.query(
      'INSERT INTO concentrations (name, slug) VALUES (?, ?)',
      [name.trim(), slug]
    )
    res.status(201).json({ data: { id: result.insertId }, message: 'Thêm nồng độ thành công' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Tên nồng độ đã tồn tại' })
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── PUT /api/concentrations/:id  (admin only) ────────────────────────────────
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Tên nồng độ là bắt buộc' })
    const slug = name.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    await pool.query(
      'UPDATE concentrations SET name = ?, slug = ? WHERE id = ?',
      [name.trim(), slug, req.params.id]
    )
    res.json({ message: 'Cập nhật nồng độ thành công' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Tên nồng độ đã tồn tại' })
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── DELETE /api/concentrations/:id  (admin only) ────────────────────────────
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM concentrations WHERE id = ?', [req.params.id])
    res.json({ message: 'Đã xóa nồng độ' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

export default router
