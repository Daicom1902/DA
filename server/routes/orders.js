import { Router } from 'express'
import crypto from 'crypto'
import axios from 'axios'
import pool from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// POST /api/orders  — create order (guest or logged-in customer)
router.post('/', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const {
      customer_name, customer_email, customer_phone,
      shipping_address, shipping_ward, shipping_district, shipping_city,
      payment_method = 'cod',
      note,
      items,          // [{ product_id, variant_id, product_name, size_label, unit_price, quantity, image_url }]
      promo_code,
      discount_amount = 0,
      shipping_fee    = 0,
    } = req.body

    if (!customer_name || !customer_email || !shipping_address || !shipping_city) {
      await conn.rollback()
      conn.release()
      return res.status(400).json({ message: 'Thiếu thông tin giao hàng bắt buộc' })
    }

    // Validate complete shipping address
    if (!shipping_ward || !shipping_district) {
      await conn.rollback()
      conn.release()
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ phường/xã và quận/huyện' })
    }

    if (!items?.length) {
      await conn.rollback()
      conn.release()
      return res.status(400).json({ message: 'Giỏ hàng trống' })
    }

    // Validate all items have size_label (dung tích)
    const itemsWithoutSize = items.filter(i => !i.size_label)
    if (itemsWithoutSize.length > 0) {
      await conn.rollback()
      conn.release()
      return res.status(400).json({ message: 'Tất cả sản phẩm phải có dung tích. Vui lòng chọn lại.' })
    }

    // Resolve user id from JWT (optional)
    let userId = null
    const auth = req.headers['authorization']
    if (auth?.startsWith('Bearer ')) {
      try {
        const { default: jwt } = await import('jsonwebtoken')
        const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET || 'luxe_fragrance_secret_key')
        userId = decoded.id
      } catch {}
    }

    // Promo code lookup
    let promoId  = null
    let discount = Number(discount_amount) || 0
    if (promo_code) {
      const [promoRows] = await conn.query(
        'SELECT id, discount_type, discount_value, min_order_value, max_uses, used_count, expires_at, is_active FROM promo_codes WHERE code = ?',
        [promo_code]
      )
      if (promoRows.length > 0) {
        promoId = promoRows[0].id
      }
    }

    const subtotal   = items.reduce((s, i) => s + (Number(i.unit_price) * Number(i.quantity)), 0)
    const tax_amount = 0
    const total      = subtotal - discount + Number(shipping_fee) + tax_amount

    const [orderResult] = await conn.query(`
      INSERT INTO orders
        (user_id, customer_name, customer_email, customer_phone,
         shipping_address, shipping_ward, shipping_district, shipping_city,
         subtotal, discount_amount, shipping_fee, tax_amount, total,
         promo_code_id, promo_code_used, payment_method, payment_status, status, note)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      userId, customer_name, customer_email, customer_phone || null,
      shipping_address, shipping_ward || null, shipping_district || null, shipping_city,
      subtotal, discount, Number(shipping_fee), tax_amount, total,
      promoId, promo_code || null,
      payment_method, 'unpaid', 'pending', note || null
    ])

    const orderId = orderResult.insertId

    // Insert order items
    for (const item of items) {
      await conn.query(`
        INSERT INTO order_items
          (order_id, product_id, variant_id, product_name, size_label, unit_price, quantity, subtotal, image_url)
        VALUES (?,?,?,?,?,?,?,?,?)
      `, [
        orderId,
        item.product_id  || null,
        item.variant_id  || null,
        item.product_name,
        item.size_label  || null,
        item.unit_price,
        item.quantity,
        Number(item.unit_price) * Number(item.quantity),
        item.image_url   || null,
      ])
    }

    // Increment promo used_count
    if (promoId) {
      await conn.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [promoId])
    }

    await conn.commit()
    conn.release()

    res.status(201).json({ message: 'Đặt hàng thành công', data: { id: orderId } })
  } catch (err) {
    await conn.rollback()
    conn.release()
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// PUT /api/orders/:id/pay  — confirm payment (momo)
// Note: Allows both guest (no auth) and authenticated users to confirm payment
router.put('/:id/pay', async (req, res) => {
  try {
    const orderId = Number(req.params.id)
    // Allow both guest orders (user_id=null) and authenticated orders
    const [rows] = await pool.query(
      'SELECT id, payment_status, payment_method FROM orders WHERE id = ?',
      [orderId]
    )
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    if (rows[0].payment_status === 'paid') {
      return res.json({ message: 'Đơn hàng đã được thanh toán', data: rows[0] })
    }
    await pool.query(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      ['paid', orderId]
    )
    res.json({ message: 'Thanh toán thành công', data: { id: orderId, payment_status: 'paid' } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// GET /api/orders/my  — get orders for authenticated user
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT id, customer_name, customer_email, customer_phone,
             shipping_address, shipping_ward, shipping_district, shipping_city,
             subtotal, discount_amount, shipping_fee, total, 
             payment_method, payment_status, status, note, created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id])

    // Attach items for each order
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT 
           oi.product_name,
           COALESCE(NULLIF(oi.size_label, ''), pv.size_label) AS size_label,
           oi.unit_price,
           oi.quantity,
           oi.subtotal,
           oi.image_url
         FROM order_items oi
         LEFT JOIN product_variants pv ON pv.id = oi.variant_id
         WHERE oi.order_id = ?`,
        [order.id]
      )
      order.items = items
    }

    res.json({ data: orders })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// GET /api/orders/history  — purchase history (delivered orders only)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT id, customer_name, customer_email, customer_phone,
             shipping_address, shipping_ward, shipping_district, shipping_city,
             subtotal, discount_amount, shipping_fee, total,
             payment_method, payment_status, status, note, created_at
      FROM orders
      WHERE user_id = ? AND status = 'delivered'
      ORDER BY created_at DESC
    `, [req.user.id])

    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT 
           oi.product_id,
           oi.product_name,
           COALESCE(NULLIF(oi.size_label, ''), pv.size_label) AS size_label,
           oi.unit_price,
           oi.quantity,
           oi.subtotal,
           oi.image_url
         FROM order_items oi
         LEFT JOIN product_variants pv ON pv.id = oi.variant_id
         WHERE oi.order_id = ?`,
        [order.id]
      )
      order.items = items
    }

    res.json({ data: orders })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// POST /api/orders/:id/momo-init  — tạo MoMo payment URL (ATM test)
router.post('/:id/momo-init', async (req, res) => {
  try {
    const orderId = Number(req.params.id)
    const [rows] = await pool.query(
      'SELECT id, total, payment_status, customer_name FROM orders WHERE id = ?',
      [orderId]
    )
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    if (rows[0].payment_status === 'paid') return res.json({ message: 'Đã thanh toán', alreadyPaid: true })

    const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO'
    const accessKey   = process.env.MOMO_ACCESS_KEY   || 'F8BBA842ECF85'
    const secretKey   = process.env.MOMO_SECRET_KEY   || 'K951B6PE1waDMi640xX08PD3vg6EkVlz'
    const endpoint    = process.env.MOMO_ENDPOINT      || 'https://test-payment.momo.vn/v2/gateway/api/create'
    const returnUrl   = process.env.MOMO_RETURN_URL   || 'http://localhost:3000/payment/momo-return'
    const ipnUrl      = process.env.MOMO_IPN_URL       || 'http://localhost:5000/api/orders/momo-ipn'

    const amount      = String(Math.round(rows[0].total))
    const requestId   = `${partnerCode}_${orderId}_${Date.now()}`
    const momoOrderId = `${partnerCode}_${orderId}_${Date.now()}`
    const orderInfo   = `Thanh toan don hang #${orderId} - Luxe Fragrance`
    const requestType = 'payWithATM'    // ATM test mode
    const extraData   = Buffer.from(JSON.stringify({ internalOrderId: orderId })).toString('base64')
    const lang        = 'vi'

    // Build rawSignature theo đúng thứ tự MoMo yêu cầu
    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${momoOrderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${partnerCode}`,
      `redirectUrl=${returnUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&')

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex')

    const body = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl: returnUrl,
      ipnUrl,
      lang,
      extraData,
      requestType,
      signature,
    }

    const response = await axios.post(endpoint, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    })

    const data = response.data
    console.log('MoMo response:', data)

    if (data.resultCode === 0 && data.payUrl) {
      return res.json({ payUrl: data.payUrl })
    } else {
      return res.status(400).json({
        message: data.message || data.localMessage || 'MoMo từ chối tạo đơn hàng',
        momoCode: data.resultCode,
      })
    }
  } catch (err) {
    console.error('MoMo init error:', err?.response?.data || err.message)
    res.status(500).json({ message: 'Lỗi kết nối MoMo: ' + (err?.response?.data?.message || err.message) })
  }
})

// POST /api/orders/momo-ipn  — MoMo IPN webhook (server-to-server)
router.post('/momo-ipn', async (req, res) => {
  try {
    const {
      partnerCode, orderId, requestId, amount, orderInfo,
      orderType, transId, resultCode, message, payType,
      responseTime, extraData, signature,
    } = req.body

    const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz'
    const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85'

    // Xác minh chữ ký
    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `message=${message}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `orderType=${orderType}`,
      `partnerCode=${partnerCode}`,
      `payType=${payType}`,
      `requestId=${requestId}`,
      `responseTime=${responseTime}`,
      `resultCode=${resultCode}`,
      `transId=${transId}`,
    ].join('&')

    const expectedSig = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex')

    if (signature !== expectedSig) {
      console.warn('MoMo IPN: chữ ký không khớp')
      return res.status(200).json({ message: 'invalid signature' })
    }

    // Lấy internalOrderId từ extraData hoặc orderId
    let internalOrderId = null
    try {
      const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf-8'))
      internalOrderId = decoded.internalOrderId
    } catch {
      const match = orderId.match(/_?(\d+)_/)
      if (match) internalOrderId = Number(match[1])
    }

    if (resultCode === 0 && internalOrderId) {
      await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', ['paid', internalOrderId])
      console.log(`MoMo IPN: Đơn hàng #${internalOrderId} đã thanh toán thành công`)
    }

    res.status(200).json({ message: 'success' })
  } catch (err) {
    console.error('MoMo IPN error:', err)
    res.status(200).json({ message: 'error' })
  }
})

export default router
