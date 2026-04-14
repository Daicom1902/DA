import { Router } from 'express'
import pool from '../db.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

// ── GET /api/brands  (public – for header mega menu & catalog filter) ──────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, slug, logo_url FROM brands ORDER BY name ASC'
    )
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── GET /api/brands/:id  (public) ───────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, slug, logo_url, description FROM brands WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy thương hiệu' })
    res.json({ data: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── POST /api/brands  (admin only) ──────────────────────────────────────────
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, description, logo_url } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Tên thương hiệu là bắt buộc' })
    const slug = name.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    const [result] = await pool.query(
      'INSERT INTO brands (name, slug, logo_url, description) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), logo_url=VALUES(logo_url), description=VALUES(description)',
      [name.trim(), slug, logo_url || null, description || null]
    )
    res.status(201).json({ data: { id: result.insertId }, message: 'Thêm thương hiệu thành công' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── PUT /api/brands/:id  (admin only) ──────────────────────────────────────
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, description, logo_url } = req.body
    const fields = []
    const params = []
    if (name)                      { fields.push('name = ?');        params.push(name.trim()) }
    if (description !== undefined) { fields.push('description = ?'); params.push(description || null) }
    if (logo_url !== undefined)    { fields.push('logo_url = ?');    params.push(logo_url || null) }
    if (!fields.length) return res.status(400).json({ message: 'Không có trường cần cập nhật' })
    params.push(req.params.id)
    await pool.query(`UPDATE brands SET ${fields.join(', ')} WHERE id = ?`, params)
    res.json({ message: 'Cập nhật thương hiệu thành công' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── DELETE /api/brands/:id  (admin only) ────────────────────────────────────
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM brands WHERE id = ?', [req.params.id])
    res.json({ message: 'Đã xóa thương hiệu' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

export default router
