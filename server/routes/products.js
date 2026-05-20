import { Router } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// Optional auth middleware - doesn't fail if user not logged in
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7)
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'luxe_fragrance_secret_key')
      req.user = decoded
    } catch (err) {
      // Token invalid, just continue without user
    }
  }
  next()
}

// ── Helper: get or create brand by name ──────────────────────────────────
async function getOrCreateBrand(name) {
  if (!name?.trim()) return null
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const [rows] = await pool.query('SELECT id FROM brands WHERE name = ?', [name.trim()])
  if (rows.length > 0) return rows[0].id
  const [result] = await pool.query(
    'INSERT INTO brands (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
    [name.trim(), slug]
  )
  return result.insertId
}

// ── GET /api/products  ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, brand, category, concentration, gender, minPrice, maxPrice, sort = 'newest', limit, is_featured } = req.query

    let sql = `
      SELECT p.id, p.name, p.slug, p.description, p.price, p.old_price,
             p.image, p.badge, p.rating, p.review_count, p.gender,
             p.is_active, p.is_featured, p.created_at,
             b.name AS brand,
             c.name AS category,
             co.name AS concentration,
             (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = 1) AS variant_count,
             (SELECT MIN(pv2.price) FROM product_variants pv2 WHERE pv2.product_id = p.id AND pv2.is_active = 1) AS min_variant_price,
             (SELECT MAX(pv3.price) FROM product_variants pv3 WHERE pv3.product_id = p.id AND pv3.is_active = 1) AS max_variant_price
      FROM products p
      LEFT JOIN brands         b  ON b.id  = p.brand_id
      LEFT JOIN categories     c  ON c.id  = p.category_id
      LEFT JOIN concentrations co ON co.id = p.concentration_id
      WHERE p.is_active = 1
    `
    const params = []

    if (search) {
      sql += ' AND (p.name LIKE ? OR b.name LIKE ? OR p.description LIKE ?)'
      const q = `%${search}%`
      params.push(q, q, q)
    }
    if (brand) {
      sql += ' AND b.name = ?'
      params.push(brand)
    }
    if (category) {
      sql += ' AND c.name = ?'
      params.push(category)
    }
    if (concentration) {
      sql += ' AND co.name = ?'
      params.push(concentration)
    }
    if (gender) {
      sql += ' AND p.gender = ?'
      params.push(gender)
    }
    if (minPrice !== undefined && minPrice !== '') {
      sql += ' AND p.price >= ?'
      params.push(Number(minPrice))
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      sql += ' AND p.price <= ?'
      params.push(Number(maxPrice))
    }
    if (is_featured === 'true' || is_featured === '1') {
      sql += ' AND p.is_featured = 1'
    }

    const orderMap = {
      newest:     'p.created_at DESC',
      'price-low':  'p.price ASC',
      'price-high': 'p.price DESC',
      popular:    'p.rating DESC, p.review_count DESC',
    }
    sql += ` ORDER BY ${orderMap[sort] ?? 'p.created_at DESC'}`

    if (limit) {
      sql += ' LIMIT ?'
      params.push(Number(limit))
    }

    const [rows] = await pool.query(sql, params)
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── GET /api/products/best-sellers  ────────────────────────────────────────
router.get('/best-sellers', async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 8

    const [rows] = await pool.query(`
      SELECT 
        p.id, p.name, p.slug, p.description, p.price, p.old_price,
        p.image, p.badge, p.rating, p.review_count, p.gender,
        p.is_active, p.is_featured, p.created_at,
        b.name AS brand,
        c.name AS category,
        co.name AS concentration,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = 1) AS variant_count,
        (SELECT MIN(pv2.price) FROM product_variants pv2 WHERE pv2.product_id = p.id AND pv2.is_active = 1) AS min_variant_price,
        (SELECT MAX(pv3.price) FROM product_variants pv3 WHERE pv3.product_id = p.id AND pv3.is_active = 1) AS max_variant_price,
        COALESCE(SUM(oi.quantity), 0) AS total_sold
      FROM products p
      LEFT JOIN brands         b  ON b.id  = p.brand_id
      LEFT JOIN categories     c  ON c.id  = p.category_id
      LEFT JOIN concentrations co ON co.id = p.concentration_id
      LEFT JOIN order_items    oi ON oi.product_id = p.id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY total_sold DESC, p.rating DESC, p.created_at DESC
      LIMIT ?
    `, [limit])

    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── GET /api/products/:id  ────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.slug, p.description, p.details, p.price, p.old_price,
             p.image, p.badge, p.rating, p.review_count, p.gender,
             p.scent_intensity, p.longevity, p.sillage,
             p.is_active, p.is_featured, p.created_at,
             b.name AS brand,
             c.name AS category
      FROM products p
      LEFT JOIN brands     b ON b.id = p.brand_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = ? AND p.is_active = 1
    `, [req.params.id])

    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })

    const product = rows[0]

    // Fragrance notes
    const [notes] = await pool.query(
      'SELECT layer, note FROM fragrance_notes WHERE product_id = ?',
      [product.id]
    )
    product.notes = {
      top:   notes.filter(n => n.layer === 'top').map(n => n.note),
      heart: notes.filter(n => n.layer === 'heart').map(n => n.note),
      base:  notes.filter(n => n.layer === 'base').map(n => n.note),
    }

    // Gallery images
    const [images] = await pool.query(
      'SELECT url, alt_text FROM product_images WHERE product_id = ? ORDER BY sort_order',
      [product.id]
    )
    product.images = images.map(i => i.url)
    if (product.image && !product.images.includes(product.image)) {
      product.images.unshift(product.image)
    }

    // Variants
    const [variants] = await pool.query(
      'SELECT id, size_label, price, old_price, stock, sku FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY price',
      [product.id]
    )
    product.variants = variants

    // Reviews - separate user's review from others' approved reviews
    product.my_review = null
    product.reviews_list = []

    // If user is logged in, get their review (even if not approved)
    if (req.user) {
      const [myReviews] = await pool.query(
        'SELECT id, author_name AS author, rating, comment, created_at, is_approved FROM reviews WHERE product_id = ? AND user_id = ?',
        [product.id, req.user.id]
      )
      if (myReviews.length > 0) {
        product.my_review = myReviews[0]
      }
    }

    // Get approved reviews from others
    const [reviews] = await pool.query(
      'SELECT id, author_name AS author, rating, comment, created_at FROM reviews WHERE product_id = ? AND is_approved = 1 ORDER BY created_at DESC',
      [product.id]
    )
    product.reviews_list = reviews

    res.json({ data: product })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ── POST /api/products/:id/reviews  ───────────────────────────────────────
router.post('/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment, author_name } = req.body
    if (!rating) return res.status(400).json({ message: 'Điểm đánh giá là bắt buộc' })
    if (Number(rating) < 1 || Number(rating) > 5)
      return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5' })

    const finalName = author_name?.trim() || req.user.full_name || req.user.email || 'Khách hàng'

    // Check product exists
    const [product] = await pool.query(
      'SELECT id FROM products WHERE id = ? AND is_active = 1',
      [req.params.id]
    )
    if (product.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' })

    // Prevent duplicate review from same user
    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (existing.length > 0)
      return res.status(409).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' })

    await pool.query(
      'INSERT INTO reviews (product_id, user_id, author_name, rating, comment, is_approved) VALUES (?, ?, ?, ?, ?, 1)',
      [req.params.id, req.user.id, finalName, Number(rating), comment?.trim() || null]
    )

    res.status(201).json({ message: 'Đánh giá đã được gửi và đang chờ duyệt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

export default router
