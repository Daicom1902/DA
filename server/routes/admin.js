import { Router } from 'express'
import pool from '../db.js'
import { authMiddleware, adminOnly, staffOrAbove } from '../middleware/auth.js'
import { Anthropic } from '@anthropic-ai/sdk'

const router = Router()
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null

// All admin routes require auth + dashboard role (admin/manager/staff)
router.use(authMiddleware, staffOrAbove)

// ═══════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════
router.get('/dashboard', async (req, res) => {
  try {
    const [[{ totalProducts }]]  = await pool.query('SELECT COUNT(*) AS totalProducts  FROM products WHERE is_active = 1')
    const [[{ totalOrders   }]]  = await pool.query('SELECT COUNT(*) AS totalOrders    FROM orders')
    const [[{ pendingOrders }]]  = await pool.query("SELECT COUNT(*) AS pendingOrders  FROM orders WHERE status = 'pending'")
    const [[{ totalRevenue  }]]  = await pool.query("SELECT COALESCE(SUM(total),0) AS totalRevenue FROM orders WHERE status NOT IN ('cancelled')")
    const [[{ totalContacts }]]  = await pool.query('SELECT COUNT(*) AS totalContacts  FROM contacts')

    const [recentOrders] = await pool.query(`
      SELECT id, customer_name, customer_email, total, status, created_at
      FROM orders ORDER BY created_at DESC LIMIT 10
    `)

    res.json({
      data: { totalProducts, totalOrders, pendingOrders, totalRevenue, totalContacts, recentOrders }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  PRODUCTS – admin CRUD
// ═══════════════════════════════════════

// GET /api/admin/products
router.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.description, p.details, p.price, p.old_price,
             p.image, p.badge, p.rating, p.review_count, p.gender,
             p.is_active, p.is_featured, p.created_at,
             b.name AS brand, c.name AS category, co.name AS concentration,
             (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = 1) AS variant_count,
             (SELECT MIN(pv2.price) FROM product_variants pv2 WHERE pv2.product_id = p.id AND pv2.is_active = 1) AS min_variant_price,
             (SELECT MAX(pv3.price) FROM product_variants pv3 WHERE pv3.product_id = p.id AND pv3.is_active = 1) AS max_variant_price
      FROM products p
      LEFT JOIN brands         b  ON b.id  = p.brand_id
      LEFT JOIN categories     c  ON c.id  = p.category_id
      LEFT JOIN concentrations co ON co.id = p.concentration_id
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
    `)
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// Helper: generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    + '-' + Date.now()
}

// Helper: get or create brand
async function getOrCreateBrand(name) {
  if (!name?.trim()) return null
  const clean = name.trim()
  const slug  = clean.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const [rows] = await pool.query('SELECT id FROM brands WHERE name = ?', [clean])
  if (rows.length > 0) return rows[0].id
  const [r] = await pool.query(
    'INSERT INTO brands (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
    [clean, slug]
  )
  return r.insertId
}

// Helper: get or create concentration
async function getOrCreateConcentration(name) {
  if (!name?.trim()) return null
  const clean = name.trim()
  const slug  = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
  // Try by name first, then by slug (handles encoding/collation edge cases)
  const [rows] = await pool.query('SELECT id FROM concentrations WHERE name = ? OR slug = ?', [clean, slug])
  if (rows.length > 0) return rows[0].id
  const [r] = await pool.query(
    'INSERT INTO concentrations (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
    [clean, slug]
  )
  // If insertId is 0 (duplicate triggered), fetch by slug
  if (!r.insertId) {
    const [[row]] = await pool.query('SELECT id FROM concentrations WHERE slug = ?', [slug])
    return row?.id ?? null
  }
  return r.insertId
}

// POST /api/admin/products
router.post('/products', async (req, res) => {
  try {
    const { name, brand, concentration, description, details, price, old_price, rating, image, badge, is_featured, gender } = req.body
    if (!name) return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc' })

    const brandId         = await getOrCreateBrand(brand)
    const concentrationId = await getOrCreateConcentration(concentration)
    const slug = generateSlug(name)

    const [result] = await pool.query(`
      INSERT INTO products (name, slug, brand_id, concentration_id, description, details, price, old_price, rating, image, badge, is_featured, gender)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      name, slug, brandId, concentrationId, description || null, details || null,
      Number(price), old_price ? Number(old_price) : null,
      rating ? Number(rating) : null,
      image || null, badge || null,
      is_featured ? 1 : 0,
      gender || null
    ])

    res.status(201).json({ data: { id: result.insertId }, message: 'Thêm sản phẩm thành công' })
  } catch (err) {
    console.error('[POST /admin/products]', err.message, err.sql || '', err.sqlMessage || '')
    res.status(500).json({ message: err.sqlMessage || err.message || 'Lỗi server' })
  }
})

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const { name, brand, concentration, description, details, price, old_price, rating, image, badge, is_featured, is_active, gender } = req.body
    if (!name) return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc' })

    const brandId         = await getOrCreateBrand(brand)
    const concentrationId = await getOrCreateConcentration(concentration)
    
    // Generate new slug if name changed
    const [existing] = await pool.query('SELECT name FROM products WHERE id = ?', [req.params.id])
    let slug = undefined
    if (existing.length > 0 && existing[0].name !== name) {
      slug = generateSlug(name)
    }

    const fields = ['name = ?', 'brand_id = ?', 'concentration_id = ?', 'description = ?', 'details = ?', 
                    'price = ?', 'old_price = ?', 'rating = ?', 'image = ?', 'badge = ?', 
                    'is_featured = ?', 'is_active = ?', 'gender = ?']
    const params = [name, brandId, concentrationId, description || null, details || null,
                    Number(price), old_price ? Number(old_price) : null,
                    rating ? Number(rating) : null,
                    image || null, badge || null,
                    is_featured ? 1 : 0,
                    is_active !== undefined ? (is_active ? 1 : 0) : 1,
                    gender || null]
    
    if (slug) {
      fields.unshift('slug = ?')
      params.unshift(slug)
    }

    params.push(req.params.id)

    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params)

    res.json({ message: 'Cập nhật sản phẩm thành công' })
  } catch (err) {
    console.error('[PUT /admin/products]', err.message, err.sql || '', err.sqlMessage || '')
    res.status(500).json({ message: err.sqlMessage || err.message || 'Lỗi server' })
  }
})

// DELETE /api/admin/products/:id  (admin/manager only)
router.delete('/products/:id', adminOnly, async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id])
    res.json({ message: 'Đã xóa sản phẩm' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  PRODUCT IMAGES – gallery management
// ═══════════════════════════════════════

// GET /api/admin/products/:id/images
router.get('/products/:id/images', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, url, alt_text, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
      [req.params.id]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// POST /api/admin/products/:id/images  – add image url to gallery
router.post('/products/:id/images', adminOnly, async (req, res) => {
  try {
    const { url, alt_text, sort_order } = req.body
    if (!url) return res.status(400).json({ message: 'URL ảnh là bắt buộc' })
    const [result] = await pool.query(
      'INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?)',
      [req.params.id, url, alt_text || null, sort_order ?? 0]
    )
    res.status(201).json({ data: { id: result.insertId }, message: 'Thêm ảnh thành công' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// DELETE /api/admin/products/:productId/images/:imageId
router.delete('/products/:productId/images/:imageId', adminOnly, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM product_images WHERE id = ? AND product_id = ?',
      [req.params.imageId, req.params.productId]
    )
    res.json({ message: 'Đã xóa ảnh' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// PUT /api/admin/products/:productId/images/:imageId  – update sort order / alt text
router.put('/products/:productId/images/:imageId', adminOnly, async (req, res) => {
  try {
    const { sort_order, alt_text } = req.body
    await pool.query(
      'UPDATE product_images SET sort_order = ?, alt_text = ? WHERE id = ? AND product_id = ?',
      [sort_order ?? 0, alt_text || null, req.params.imageId, req.params.productId]
    )
    res.json({ message: 'Đã cập nhật ảnh' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  PRODUCT VARIANTS – dung tích
// ═══════════════════════════════════════

// GET /api/admin/products/:id/variants
router.get('/products/:id/variants', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, size_label, price, old_price, stock, sku, is_active FROM product_variants WHERE product_id = ? ORDER BY price ASC',
      [req.params.id]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// POST /api/admin/products/:id/variants
router.post('/products/:id/variants', adminOnly, async (req, res) => {
  try {
    const { size_label, price, old_price, stock, sku } = req.body
    if (!size_label?.trim() || !price)
      return res.status(400).json({ message: 'Nhãn dung tích và giá là bắt buộc' })
    const [result] = await pool.query(
      'INSERT INTO product_variants (product_id, size_label, price, old_price, stock, sku) VALUES (?,?,?,?,?,?)',
      [req.params.id, size_label.trim(), Number(price), old_price ? Number(old_price) : null, Number(stock) || 0, sku?.trim() || null]
    )
    res.status(201).json({ data: { id: result.insertId }, message: 'Thêm dung tích thành công' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// PUT /api/admin/products/:productId/variants/:variantId
router.put('/products/:productId/variants/:variantId', adminOnly, async (req, res) => {
  try {
    const { size_label, price, old_price, stock, sku, is_active } = req.body
    if (!size_label?.trim() || !price)
      return res.status(400).json({ message: 'Nhãn dung tích và giá là bắt buộc' })
    await pool.query(
      'UPDATE product_variants SET size_label=?, price=?, old_price=?, stock=?, sku=?, is_active=? WHERE id=? AND product_id=?',
      [
        size_label.trim(), Number(price), old_price ? Number(old_price) : null,
        Number(stock) || 0, sku?.trim() || null,
        is_active !== false ? 1 : 0,
        req.params.variantId, req.params.productId,
      ]
    )
    res.json({ message: 'Cập nhật dung tích thành công' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// DELETE /api/admin/products/:productId/variants/:variantId
router.delete('/products/:productId/variants/:variantId', adminOnly, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM product_variants WHERE id = ? AND product_id = ?',
      [req.params.variantId, req.params.productId]
    )
    res.json({ message: 'Đã xóa dung tích' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  PRODUCT REVIEWS – moderation
// ═══════════════════════════════════════

// GET /api/admin/reviews
router.get('/reviews', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.product_id, r.author_name, r.rating, r.comment,
             r.is_approved, r.created_at,
             p.name AS product_name
      FROM reviews r
      LEFT JOIN products p ON p.id = r.product_id
      ORDER BY r.created_at DESC
    `)
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// PUT /api/admin/reviews/:id – toggle approval and recalculate rating
router.put('/reviews/:id', async (req, res) => {
  try {
    const { is_approved } = req.body
    const [rev] = await pool.query('SELECT product_id FROM reviews WHERE id = ?', [req.params.id])
    if (rev.length === 0) return res.status(404).json({ message: 'Không tìm thấy đánh giá' })

    await pool.query('UPDATE reviews SET is_approved = ? WHERE id = ?', [is_approved ? 1 : 0, req.params.id])

    // Recalculate product aggregate rating
    const productId = rev[0].product_id
    const [[stats]] = await pool.query(
      'SELECT AVG(rating) AS avg_r, COUNT(*) AS cnt FROM reviews WHERE product_id = ? AND is_approved = 1',
      [productId]
    )
    await pool.query(
      'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
      [stats.avg_r ? Number(stats.avg_r).toFixed(2) : null, stats.cnt, productId]
    )

    res.json({ message: 'Đã cập nhật trạng thái đánh giá' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', adminOnly, async (req, res) => {
  try {
    const [rev] = await pool.query('SELECT product_id FROM reviews WHERE id = ?', [req.params.id])
    await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id])

    if (rev.length > 0) {
      const productId = rev[0].product_id
      const [[stats]] = await pool.query(
        'SELECT AVG(rating) AS avg_r, COUNT(*) AS cnt FROM reviews WHERE product_id = ? AND is_approved = 1',
        [productId]
      )
      await pool.query(
        'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
        [stats.avg_r ? Number(stats.avg_r).toFixed(2) : null, stats.cnt, productId]
      )
    }

    res.json({ message: 'Đã xóa đánh giá' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  BRANDS – admin CRUD
// ═══════════════════════════════════════

// GET /api/admin/brands
router.get('/brands', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, slug, logo_url, description FROM brands ORDER BY name ASC')
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  ORDERS – admin
// ═══════════════════════════════════════

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT id, customer_name, customer_email, customer_phone,
             subtotal, discount_amount, shipping_fee, total,
             payment_method, payment_status, status, created_at
      FROM orders ORDER BY created_at DESC
    `)
    res.json({ data: orders })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// GET /api/admin/orders/:id
router.get('/orders/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, customer_name, customer_email, customer_phone,
              shipping_address, shipping_ward, shipping_district, shipping_city,
              subtotal, discount_amount, shipping_fee, tax_amount, total,
              promo_code_used, payment_method, payment_status, status, note, created_at
       FROM orders WHERE id = ?`,
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })

    const order = rows[0]
    const [items] = await pool.query(
      'SELECT product_name, size_label, unit_price, quantity, subtotal, image_url FROM order_items WHERE order_id = ?',
      [order.id]
    )
    order.items = items

    res.json({ data: order })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// PUT /api/admin/orders/:id  — update status (and optional payment_status)
router.put('/orders/:id', async (req, res) => {
  try {
    const { status, payment_status } = req.body
    const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled']

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' })
    }

    const fields = []
    const params = []
    if (status)         { fields.push('status = ?');         params.push(status) }
    if (payment_status) { fields.push('payment_status = ?'); params.push(payment_status) }

    if (!fields.length) return res.status(400).json({ message: 'Không có trường nào để cập nhật' })

    params.push(req.params.id)
    await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, params)

    res.json({ message: 'Cập nhật đơn hàng thành công' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// DELETE /api/admin/orders/:id  (admin/manager only)
router.delete('/orders/:id', adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id])
    res.json({ message: 'Đã xóa đơn hàng' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  CONTACTS – admin
// ═══════════════════════════════════════

// GET /api/admin/contact
router.get('/contact', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC')
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// GET /api/admin/contact/:id
router.get('/contact/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contacts WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy' })

    // Mark as read
    await pool.query('UPDATE contacts SET is_read = 1 WHERE id = ?', [req.params.id])
    res.json({ data: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// DELETE /api/admin/contact/:id  (admin/manager only)
router.delete('/contact/:id', adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM contacts WHERE id = ?', [req.params.id])
    res.json({ message: 'Đã xóa tin nhắn' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  USERS – quản lý nhân viên (admin/manager only)
// ═══════════════════════════════════════

// GET /api/admin/users
router.get('/users', adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, role, is_active, created_at
       FROM users WHERE role IN ('admin','manager','staff')
       ORDER BY created_at DESC`
    )
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// POST /api/admin/users  – tạo tài khoản nhân viên/quản lý
router.post('/users', adminOnly, async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs')
    const { full_name, email, password, phone, role } = req.body
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' })
    }
    const validRoles = ['manager', 'staff']
    // Only admin can create manager accounts
    if (role === 'admin' || !validRoles.includes(role)) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin mới có thể tạo tài khoản quản lý' })
      }
    }
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email đã được sử dụng' })
    }
    const hash = await bcrypt.default.hash(password, 12)
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, hash, phone || null, role || 'staff']
    )
    res.status(201).json({ data: { id: result.insertId }, message: 'Tạo tài khoản thành công' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// PUT /api/admin/users/:id  – cập nhật thông tin / trạng thái
router.put('/users/:id', adminOnly, async (req, res) => {
  try {
    const { full_name, phone, role, is_active } = req.body
    const fields = []
    const params = []
    if (full_name)            { fields.push('full_name = ?');  params.push(full_name) }
    if (phone !== undefined)  { fields.push('phone = ?');      params.push(phone || null) }
    if (role)                 { fields.push('role = ?');       params.push(role) }
    if (is_active !== undefined) { fields.push('is_active = ?'); params.push(is_active ? 1 : 0) }
    if (!fields.length) return res.status(400).json({ message: 'Không có trường nào để cập nhật' })
    params.push(req.params.id)
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params)
    res.json({ message: 'Cập nhật tài khoản thành công' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// DELETE /api/admin/users/:id  (admin only – cannot delete self)
router.delete('/users/:id', adminOnly, async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Không thể xóa tài khoản đang đăng nhập' })
    }
    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id])
    res.json({ message: 'Đã vô hiệu hóa tài khoản' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  POSTS – admin CRUD
// ═══════════════════════════════════════

// GET /api/admin/posts
router.get('/posts', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.status, p.views, p.created_at,
             u.full_name AS author_name,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
      FROM posts p
      LEFT JOIN users u ON u.id = p.author_id
      ORDER BY p.created_at DESC
    `)
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// GET /api/admin/posts/:id
router.get('/posts/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy bài viết' })
    res.json({ data: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// POST /api/admin/posts
router.post('/posts', async (req, res) => {
  try {
    const { title, content, excerpt, cover_image, status = 'draft' } = req.body
    if (!title || !content) return res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc' })

    const slug = title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
      + '-' + Date.now()

    const [result] = await pool.query(
      'INSERT INTO posts (title, slug, content, excerpt, cover_image, author_id, status) VALUES (?,?,?,?,?,?,?)',
      [title, slug, content, excerpt || null, cover_image || null, req.user.id, status]
    )
    res.status(201).json({ data: { id: result.insertId, slug }, message: 'Tạo bài viết thành công' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// PUT /api/admin/posts/:id
router.put('/posts/:id', async (req, res) => {
  try {
    const { title, content, excerpt, cover_image, status } = req.body
    const fields = []
    const params = []
    if (title)                 { fields.push('title = ?');        params.push(title) }
    if (content)               { fields.push('content = ?');      params.push(content) }
    if (excerpt !== undefined) { fields.push('excerpt = ?');      params.push(excerpt || null) }
    if (cover_image !== undefined) { fields.push('cover_image = ?'); params.push(cover_image || null) }
    if (status)                { fields.push('status = ?');       params.push(status) }
    if (!fields.length) return res.status(400).json({ message: 'Không có trường nào để cập nhật' })
    params.push(req.params.id)
    await pool.query(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`, params)
    res.json({ message: 'Cập nhật bài viết thành công' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// DELETE /api/admin/posts/:id  (admin/manager only)
router.delete('/posts/:id', adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id])
    res.json({ message: 'Đã xóa bài viết' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  COMMENTS – admin moderation
// ═══════════════════════════════════════

// GET /api/admin/comments
router.get('/comments', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.post_id, c.content, c.is_approved, c.created_at,
             c.guest_name, c.guest_email,
             u.full_name AS user_name,
             p.title AS post_title
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      LEFT JOIN posts p ON p.id = c.post_id
      ORDER BY c.created_at DESC
    `)
    res.json({ data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// PUT /api/admin/comments/:id  – toggle approval
router.put('/comments/:id', async (req, res) => {
  try {
    const { is_approved } = req.body
    await pool.query('UPDATE comments SET is_approved = ? WHERE id = ?', [is_approved ? 1 : 0, req.params.id])
    res.json({ message: 'Đã cập nhật trạng thái bình luận' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// DELETE /api/admin/comments/:id  (admin/manager only)
router.delete('/comments/:id', adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id])
    res.json({ message: 'Đã xóa bình luận' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  AI VALIDATION & AUTO IMPORT
// ═══════════════════════════════════════

// POST /api/admin/ai/analyze-excel - AI analyzes and auto-imports products
router.post('/ai/analyze-excel', async (req, res) => {
  try {
    const { products } = req.body

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ message: 'Invalid request' })
    }

    // Prepare product data for Claude analysis
    const productsJson = JSON.stringify(products, null, 2)
    
    let normalizedProducts = products
    
    // If Claude API is available, use AI to enhance validation
    if (anthropic) {
      try {
        console.log('📊 Sending to Claude AI for analysis, product count:', products.length)
        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `You are a perfume product data specialist. Analyze and normalize these products exported from Excel.

STRICT VALIDATION RULES:
1. Product name: REQUIRED, non-empty
2. Brand: Should exist or create new one (normalize to proper case)
3. Concentration: Should exist or create new one
4. Price: REQUIRED, must be number > 0
5. Old price: Optional, must be > price if provided
6. Rating: 0-5 range, must be number
7. Gender: Normalize to "male"/"female"/"unisex" (from Vietnamese: "nam"/"nữ"/"unisex")
8. Image URL: Must be valid URL if provided
9. Badge: Only allow "NEW", "SALE", "HOT", or empty
10. Variants: Group same product, normalize prices/stock/SKU

IMPORTANT:
- Remove duplicates (same brand + name = duplicate)
- Combine variants of same product
- Remove null/empty fields
- Ensure every product has at least price OR variants
- Return ONLY valid JSON array, no markdown/extra text

Input data:
${productsJson}

Return JSON array of cleaned products with this structure:
[{
  "name": "string",
  "brand": "string",
  "concentration": "string", 
  "price": number,
  "old_price": number or null,
  "rating": number,
  "image": "string",
  "badge": "string or null",
  "gender": "male"|"female"|"unisex"|"",
  "description": "string",
  "details": "string",
  "variants": [{"size_label": "string", "price": number, "old_price": number or null, "stock": number, "sku": "string"}] or null
}]`,
            },
          ],
        })

        const jsonMatch = message.content[0].type === 'text' ? message.content[0].text : ''
        // More robust JSON extraction
        let jsonStr = ''
        try {
          // Try to extract JSON array
          const jsonArray = jsonMatch.match(/\[[\s\S]*?\]/)?.[0]
          if (jsonArray) {
            // Validate JSON is parseable
            JSON.parse(jsonArray)
            jsonStr = jsonArray
          }
        } catch {
          console.warn('JSON parsing error from Claude, falling back to basic validation')
        }
        
        if (!jsonStr) {
          normalizedProducts = normalizeProductsBasic(products)
        } else {
          normalizedProducts = JSON.parse(jsonStr)
          // Validate AI output structure
          normalizedProducts = validateAIOutput(normalizedProducts)
        }
      } catch (aiErr) {
        console.warn('⚠️  Claude API error, using basic validation:', aiErr.message)
        // Fallback to basic validation
        normalizedProducts = normalizeProductsBasic(products)
      }
    } else {
      console.warn('⚠️  No Claude API key, using basic validation')
      // No Claude API key, use basic validation
      normalizedProducts = normalizeProductsBasic(products)
    }

    // Detect duplicates within imported data
    console.log('🔍 Checking for duplicates, normalized product count:', normalizedProducts.length)
    const seenProducts = new Set()
    const deduplicatedProducts = []
    const duplicateWarnings = []
    
    for (const product of normalizedProducts) {
      const key = `${product.brand || 'NOBRAND'}_${product.name}`.toLowerCase()
      if (seenProducts.has(key)) {
        duplicateWarnings.push(`Duplicate detected: ${product.name} (${product.brand})`)
      } else {
        seenProducts.add(key)
        deduplicatedProducts.push(product)
      }
    }

    // Now auto-import all products
    const importResults = {
      created: [],
      failed: [],
      duplicates: duplicateWarnings,
      total: deduplicatedProducts.length,
    }

    for (const product of deduplicatedProducts) {
      try {
        if (!product.name) {
          importResults.failed.push({ name: 'Unknown', reason: 'Missing product name' })
          continue
        }

        // Validate price exists
        if (!product.price && (!product.variants || product.variants.length === 0)) {
          importResults.failed.push({ name: product.name, reason: 'No valid price or variants' })
          continue
        }

        // Get or create brand (need brandId early for duplicate check)
        let brandId = null
        if (product.brand) {
          brandId = await getOrCreateBrand(product.brand)
        }

        // Check if product already exists in DB (by name + brand)
        const [existingInDB] = await pool.query(
          'SELECT id FROM products WHERE LOWER(name) = LOWER(?) AND (brand_id = ? OR (brand_id IS NULL AND ? IS NULL)) AND is_active = 1',
          [product.name, brandId, brandId]
        )
        if (existingInDB.length > 0) {
          importResults.duplicates.push(product.name)
          continue
        }

        // brandId already resolved above for duplicate check

        // Get or create concentration using shared helper
        const concentrationId = await getOrCreateConcentration(product.concentration)

        // Determine main price - use highest variant price if available
        let mainPrice = product.price || 0
        if (product.variants && product.variants.length > 0) {
          mainPrice = Math.max(...product.variants.map(v => Number(v.price) || 0))
        }

        // Create product with slug
        const slug = generateSlug(product.name || 'Unnamed')
        const [productResult] = await pool.query(
          `INSERT INTO products (name, slug, brand_id, concentration_id, description, details, price, old_price, rating, image, badge, gender)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.name || 'Unnamed',
            slug,
            brandId,
            concentrationId,
            product.description || '',
            product.details || '',
            mainPrice,
            product.old_price || null,
            product.rating || 0,
            product.image || '',
            product.badge || '',
            product.gender || '',
          ]
        )

        const productId = productResult.insertId

        // Add variants
        if (product.variants && Array.isArray(product.variants)) {
          for (const variant of product.variants) {
            await pool.query(
              `INSERT INTO product_variants (product_id, size_label, price, old_price, stock, sku, is_active)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                productId,
                variant.size_label || 'Standard',
                variant.price || 0,
                variant.old_price || null,
                variant.stock || 0,
                variant.sku || null,
                true,
              ]
            )
          }
        }

        importResults.created.push({
          id: productId,
          name: product.name,
          variants: product.variants?.length || 0,
        })
        console.log(`✅ Product created: ${product.name} (ID: ${productId})`)
      } catch (err) {
        console.error('❌ Error importing product:', product.name, err.message)
        importResults.failed.push({
          name: product.name || 'Unknown',
          reason: err.message,
        })
      }
    }

    console.log(`📦 Import summary: Created ${importResults.created.length}, Failed ${importResults.failed.length}, Duplicates ${importResults.duplicates.length}`)

    res.json({
      success: true,
      message: `Imported ${importResults.created.length}/${normalizedProducts.length} products${duplicateWarnings.length > 0 ? ` (${duplicateWarnings.length} duplicates skipped)` : ''}`,
      results: importResults,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server: ' + err.message })
  }
})

// Helper: validate AI output structure
function validateAIOutput(products) {
  return products.filter(p => {
    // Must have name
    if (!p.name || !String(p.name).trim()) return false
    
    // Must have either price or variants with prices
    const hasPrice = p.price && Number(p.price) > 0
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0 && p.variants.some(v => Number(v.price) > 0)
    
    if (!hasPrice && !hasVariants) return false
    
    // Rating range check
    if (p.rating && (Number(p.rating) < 0 || Number(p.rating) > 5)) {
      p.rating = Math.max(0, Math.min(5, Number(p.rating)))
    }
    
    // Image URL validation if exists
    if (p.image && !isValidImageUrl(p.image)) {
      p.image = null
    }
    
    // Badge whitelist
    if (p.badge && !['NEW', 'SALE', 'HOT'].includes(String(p.badge).toUpperCase())) {
      p.badge = null
    }
    
    return true
  }).map(p => ({
    name: String(p.name).trim(),
    brand: p.brand ? String(p.brand).trim() : null,
    concentration: p.concentration ? String(p.concentration).trim() : null,
    price: p.price ? Number(p.price) : null,
    old_price: p.old_price ? Number(p.old_price) : null,
    rating: p.rating ? Number(p.rating) : 0,
    image: p.image ? String(p.image).trim() : null,
    badge: p.badge ? String(p.badge).toUpperCase() : null,
    gender: ['male', 'female', 'unisex'].includes(String(p.gender).toLowerCase()) ? String(p.gender).toLowerCase() : '',
    description: p.description ? String(p.description).trim() : '',
    details: p.details ? String(p.details).trim() : '',
    variants: Array.isArray(p.variants) && p.variants.length > 0 ? p.variants.map(v => ({
      size_label: String(v.size_label).trim() || 'Standard',
      price: Number(v.price) || 0,
      old_price: v.old_price ? Number(v.old_price) : null,
      stock: Number(v.stock) || 0,
      sku: v.sku ? String(v.sku).trim() : null,
    })).filter(v => Number(v.price) > 0) : null,
  }))
}

// Helper: check if URL is valid image
function isValidImageUrl(url) {
  try {
    if (!url || typeof url !== 'string') return false
    const urlObj = new URL(url)
    const validProtocols = ['http:', 'https:']
    if (!validProtocols.includes(urlObj.protocol)) return false
    const pathLower = urlObj.pathname.toLowerCase()
    const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    return validExts.some(ext => pathLower.endsWith(ext)) || 
           urlObj.hostname.includes('cdn') || 
           urlObj.hostname.includes('cloudinary') ||
           urlObj.hostname.includes('imgur')
  } catch {
    return false
  }
}

// Helper: normalize products (basic validation)
function normalizeProductsBasic(products) {
  return products.map((p) => {
    const normalized = { ...p }

    if (normalized.gender) {
      const gender = String(normalized.gender).toLowerCase()
      if (gender.includes('nam')) normalized.gender = 'male'
      else if (gender.includes('nữ')) normalized.gender = 'female'
      else if (gender.includes('unisex')) normalized.gender = 'unisex'
      else normalized.gender = ''
    }

    if (normalized.price) normalized.price = Number(normalized.price)
    if (normalized.old_price) normalized.old_price = Number(normalized.old_price)

    if (normalized.rating) {
      let rating = Number(normalized.rating)
      rating = Math.max(0, Math.min(5, rating))
      normalized.rating = Math.round(rating * 10) / 10
    }

    if (normalized.variants && Array.isArray(normalized.variants)) {
      normalized.variants = normalized.variants.map((v) => ({
        ...v,
        price: Number(v.price) || 0,
        old_price: v.old_price ? Number(v.old_price) : null,
        stock: Number(v.stock) || 0,
      }))
    }

    return normalized
  })
}

// POST /api/admin/ai/validate-products (deprecated, use analyze-excel instead)
router.post('/ai/validate-products', async (req, res) => {
  try {
    const { products } = req.body

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ message: 'Invalid request' })
    }

    const normalizedProducts = normalizeProductsBasic(products)

    res.json({
      isValid: true,
      normalizedProducts,
      message: 'Validation completed',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// ═══════════════════════════════════════
//  REPORTS / STATISTICS
// ═══════════════════════════════════════

router.get('/reports', async (req, res) => {
  try {
    const range = req.query.range || '30d'

    // Build date filter
    let dateCondition = ''
    let groupBy = 'DATE(created_at)'
    let dateLabel = "DATE_FORMAT(created_at, '%d/%m')"

    switch (range) {
      case '7d':
        dateCondition = "AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
        break
      case '30d':
        dateCondition = "AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        break
      case '90d':
        dateCondition = "AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)"
        groupBy = 'YEARWEEK(created_at, 1)'
        dateLabel = "CONCAT('Tuần ', WEEK(created_at, 1))"
        break
      case '12m':
        dateCondition = "AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)"
        groupBy = "DATE_FORMAT(created_at, '%Y-%m')"
        dateLabel = "DATE_FORMAT(created_at, '%m/%Y')"
        break
      case 'all':
        dateCondition = ''
        groupBy = "DATE_FORMAT(created_at, '%Y-%m')"
        dateLabel = "DATE_FORMAT(created_at, '%m/%Y')"
        break
    }

    // 1. KPI Summary
    const [[kpi]] = await pool.query(`
      SELECT
        COALESCE(SUM(total), 0) AS totalRevenue,
        COUNT(*) AS totalOrders,
        COALESCE(AVG(total), 0) AS avgOrderValue
      FROM orders
      WHERE status != 'cancelled' ${dateCondition}
    `)

    const [[customerKpi]] = await pool.query(`
      SELECT COUNT(*) AS newCustomers
      FROM users
      WHERE role = 'customer' ${dateCondition.replace('created_at', 'users.created_at') || ''}
    `)

    // 2. Revenue by period
    const [revenueByPeriod] = await pool.query(`
      SELECT
        ${dateLabel} AS label,
        ${groupBy} AS period,
        COALESCE(SUM(total), 0) AS revenue,
        COUNT(*) AS orderCount
      FROM orders
      WHERE status != 'cancelled' ${dateCondition}
      GROUP BY period, label
      ORDER BY period ASC
    `)

    // 3. Order status breakdown
    const [ordersByStatus] = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM orders
      WHERE 1=1 ${dateCondition}
      GROUP BY status
    `)

    // 4. Top 10 best-selling products
    const [topProducts] = await pool.query(`
      SELECT
        oi.product_name AS name,
        SUM(oi.quantity) AS totalQty,
        SUM(oi.subtotal) AS totalRevenue,
        MIN(oi.image_url) AS image
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled' ${dateCondition.replace('created_at', 'o.created_at')}
      GROUP BY oi.product_name
      ORDER BY totalRevenue DESC
      LIMIT 10
    `)

    // 5. Revenue by brand
    const [revenueByBrand] = await pool.query(`
      SELECT
        COALESCE(b.name, 'Không rõ') AS brand,
        COALESCE(SUM(oi.subtotal), 0) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.name = oi.product_name
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE o.status != 'cancelled' ${dateCondition.replace('created_at', 'o.created_at')}
      GROUP BY b.name
      ORDER BY revenue DESC
      LIMIT 10
    `)

    // 6. New customers by period
    const [customersByPeriod] = await pool.query(`
      SELECT
        ${dateLabel.replace(/created_at/g, 'users.created_at')} AS label,
        ${groupBy.replace(/created_at/g, 'users.created_at')} AS period,
        COUNT(*) AS count
      FROM users
      WHERE role = 'customer' ${dateCondition.replace('created_at', 'users.created_at')}
      GROUP BY period, label
      ORDER BY period ASC
    `)

    res.json({
      data: {
        kpi: {
          totalRevenue: kpi.totalRevenue,
          totalOrders: kpi.totalOrders,
          avgOrderValue: Math.round(kpi.avgOrderValue),
          newCustomers: customerKpi.newCustomers,
        },
        revenueByPeriod,
        ordersByStatus,
        topProducts,
        revenueByBrand,
        customersByPeriod,
      }
    })
  } catch (err) {
    console.error('[GET /admin/reports]', err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

export default router
