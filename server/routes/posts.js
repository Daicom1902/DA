import { Router } from 'express'
import pool from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// ── Public: list published posts ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 9 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const [rows]  = await pool.query(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image,
             p.views, p.created_at,
             u.full_name AS author_name,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.is_approved = 1) AS comment_count
      FROM posts p
      LEFT JOIN users u ON u.id = p.author_id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [Number(limit), offset])

    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM posts WHERE status = 'published'"
    )

    res.json({ data: rows, pagination: { total, page: Number(page), limit: Number(limit) } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── Public: single post by slug ──────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.cover_image,
             p.views, p.status, p.created_at, p.updated_at,
             u.full_name AS author_name, u.avatar_url AS author_avatar
      FROM posts p
      LEFT JOIN users u ON u.id = p.author_id
      WHERE p.slug = ? AND p.status = 'published'
    `, [req.params.slug])

    if (rows.length === 0) return res.status(404).json({ message: 'Bài viết không tồn tại' })

    const post = rows[0]

    // Increment view count
    await pool.query('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id])
    post.views = (post.views || 0) + 1

    // Fetch approved comments
    const [comments] = await pool.query(`
      SELECT c.id, c.content, c.created_at, c.guest_name, c.guest_email,
             u.full_name AS user_name, u.avatar_url AS user_avatar
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ? AND c.is_approved = 1
      ORDER BY c.created_at ASC
    `, [post.id])

    post.comments = comments

    res.json({ data: post })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── Add comment (logged-in or guest) ─────────────────────────────────────
router.post('/:id/comments', async (req, res) => {
  try {
    const { content, guest_name, guest_email } = req.body
    if (!content?.trim()) return res.status(400).json({ message: 'Nội dung bình luận không được để trống' })

    // Check if post exists
    const [postRows] = await pool.query(
      "SELECT id FROM posts WHERE id = ? AND status = 'published'",
      [req.params.id]
    )
    if (postRows.length === 0) return res.status(404).json({ message: 'Bài viết không tồn tại' })

    // Resolve user from JWT (optional)
    let userId = null
    const auth = req.headers['authorization']
    if (auth?.startsWith('Bearer ')) {
      try {
        const { default: jwt } = await import('jsonwebtoken')
        const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET || 'luxe_fragrance_secret_key')
        userId = decoded.id
      } catch {}
    }

    // If not logged in, guest_name is required
    if (!userId && !guest_name?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập tên của bạn' })
    }

    const [result] = await pool.query(
      `INSERT INTO comments (post_id, user_id, guest_name, guest_email, content, is_approved)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [req.params.id, userId, userId ? null : guest_name.trim(), userId ? null : (guest_email?.trim() || null), content.trim()]
    )

    res.status(201).json({
      data: { id: result.insertId },
      message: 'Bình luận đã được thêm'
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

export default router
