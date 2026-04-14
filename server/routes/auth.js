import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import dotenv from 'dotenv'
import pool from '../db.js'
import { authMiddleware, signToken } from '../middleware/auth.js'
import { sendResetOtpEmail } from '../mailer.js'

dotenv.config()

// Khởi tạo sau khi dotenv đã load
const getGoogleClient = () => new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const router = Router()

// POST /api/auth/register
// Tạo tài khoản với is_active=0 và gửi OTP xác thực email
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' })
    }

    const [existing] = await pool.query('SELECT id, is_active FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      if (existing[0].is_active) {
        return res.status(409).json({ message: 'Email đã được sử dụng' })
      }
      // Tài khoản chưa xác thực – xóa để cho phép đăng ký lại
      await pool.query('DELETE FROM users WHERE id = ?', [existing[0].id])
    }

    const hash = await bcrypt.hash(password, 12)
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, phone, role, is_active) VALUES (?, ?, ?, ?, ?, 0)',
      [full_name, email, hash, phone || null, 'customer']
    )
    const userId = result.insertId

    // Generate OTP
    const otp = String(crypto.randomInt(100000, 999999))

    // Invalidate old verify tokens
    await pool.query(
      "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0 AND type = 'verify'",
      [userId]
    )
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, otp, expires_at, type) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 'verify')",
      [userId, otp]
    )

    const sent = await sendResetOtpEmail(email, otp, full_name, 'verify')

    const [local, domain] = email.split('@')
    const maskedEmail = local.slice(0, 2) + '***@' + domain

    const response = { message: 'Vui lòng kiểm tra email để lấy mã OTP xác thực.', userId, maskedEmail }
    if (!sent) response.devOtp = otp

    res.status(201).json(response)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// POST /api/auth/verify-email
// Body: { userId, otp }
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, otp } = req.body
    if (!userId || !otp) return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' })

    const [tokens] = await pool.query(
      "SELECT id FROM password_reset_tokens WHERE user_id = ? AND otp = ? AND used = 0 AND type = 'verify' AND expires_at > NOW() LIMIT 1",
      [userId, otp.trim()]
    )
    if (tokens.length === 0) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' })
    }

    // Mark token used & activate account
    await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [tokens[0].id])
    await pool.query('UPDATE users SET is_active = 1 WHERE id = ?', [userId])

    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, avatar_url, role FROM users WHERE id = ?',
      [userId]
    )
    const user = rows[0]
    const tok = signToken({ id: user.id, email: user.email, role: user.role })

    res.json({ token: tok, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// POST /api/auth/resend-verify
// Body: { userId }
router.post('/resend-verify', async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ message: 'Thiếu userId' })

    const [users] = await pool.query(
      'SELECT full_name, email FROM users WHERE id = ? AND is_active = 0 LIMIT 1',
      [userId]
    )
    if (users.length === 0) return res.status(400).json({ message: 'Tài khoản không tồn tại hoặc đã được kích hoạt' })

    const user = users[0]
    const otp  = String(crypto.randomInt(100000, 999999))

    await pool.query(
      "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0 AND type = 'verify'",
      [userId]
    )
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, otp, expires_at, type) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 'verify')",
      [userId, otp]
    )

    const sent = await sendResetOtpEmail(user.email, otp, user.full_name, 'verify')

    const response = { message: 'Đã gửi lại mã OTP.' }
    if (!sent) response.devOtp = otp
    res.json(response)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})



// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền email và mật khẩu' })
    }

    const [rows] = await pool.query(
      'SELECT id, full_name, email, password_hash, phone, avatar_url, role, is_active FROM users WHERE email = ?',
      [email]
    )

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' })
    }

    const user = rows[0]
    if (!user.is_active) {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hoá' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' })
    }

    const payload = { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
    const token = signToken(payload)

    const { password_hash, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

// POST /api/auth/logout  (stateless JWT – just acknowledge)
router.post('/logout', (req, res) => {
  res.json({ message: 'Đã đăng xuất' })
})

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) return res.status(400).json({ message: 'Thiếu Google credential' })

    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      return res.status(503).json({ message: 'Chức năng đăng nhập Google chưa được cấu hình trên server.' })
    }

    // Verify token with Google
    const ticket = await getGoogleClient().verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    const { sub: google_id, email, name: full_name, picture: avatar_url } = payload

    if (!email) return res.status(400).json({ message: 'Không lấy được email từ Google' })

    // Find existing user by google_id or email
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, avatar_url, role, is_active, google_id FROM users WHERE google_id = ? OR email = ? LIMIT 1',
      [google_id, email]
    )

    let user
    if (rows.length > 0) {
      user = rows[0]
      if (!user.is_active) return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hoá' })

      // Link google_id if not already linked
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?', [google_id, avatar_url, user.id])
        user.google_id = google_id
      }
    } else {
      // Create new account via Google
      const [result] = await pool.query(
        'INSERT INTO users (full_name, email, password_hash, avatar_url, role, google_id) VALUES (?, ?, NULL, ?, ?, ?)',
        [full_name, email, avatar_url || null, 'customer', google_id]
      )
      user = { id: result.insertId, full_name, email, phone: null, avatar_url: avatar_url || null, role: 'customer' }
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role })
    const { is_active, google_id: _, ...safeUser } = user
    res.json({ token, user: { ...safeUser, full_name: safeUser.full_name || full_name, avatar_url: safeUser.avatar_url || avatar_url } })
  } catch (err) {
    console.error('Google auth error:', err)
    res.status(401).json({ message: 'Xác thực Google thất bại. Vui lòng thử lại.' })
  }
})

// POST /api/auth/forgot-password
// Body: { email }
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body
    if (!identifier) return res.status(400).json({ message: 'Vui lòng nhập địa chỉ email' })

    const val = identifier.trim()

    const [rows] = await pool.query(
      'SELECT id, full_name, email FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
      [val]
    )

    // Always respond OK (security: don't reveal if account exists)
    if (rows.length === 0) {
      return res.json({ message: 'Nếu tài khoản tồn tại, mã OTP đã được gửi.' })
    }

    const user = rows[0]

    // Generate 6-digit OTP
    const otp = String(crypto.randomInt(100000, 999999))

    // Invalidate old unused tokens for this user
    await pool.query(
      'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0',
      [user.id]
    )

    // Insert new token — use MySQL's NOW() to avoid JS/MySQL timezone mismatch
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))',
      [user.id, otp]
    )

    // Send OTP via email
    const sent = await sendResetOtpEmail(user.email, otp, user.full_name)

    // Mask email for display e.g. jo***@example.com
    const [local, domain] = user.email.split('@')
    const masked = local.slice(0, 2) + '***@' + domain

    const response = { message: 'Mã OTP đã được gửi.', maskedEmail: masked }
    // Dev mode: return OTP directly when SMTP not configured
    if (!sent) response.devOtp = otp

    return res.json(response)
  } catch (err) {
    console.error('forgot-password error:', err)
    res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' })
  }
})

// POST /api/auth/reset-password
// Body: { identifier, otp, newPassword }
router.post('/reset-password', async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    }

    const val = identifier.trim()

    const [users] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
      [val]
    )
    if (users.length === 0) {
      return res.status(400).json({ message: 'Tài khoản không tồn tại' })
    }

    const userId = users[0].id

    const [tokens] = await pool.query(
      'SELECT id FROM password_reset_tokens WHERE user_id = ? AND otp = ? AND used = 0 AND expires_at > NOW() LIMIT 1',
      [userId, otp.trim()]
    )

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' })
    }

    // Mark token used
    await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [tokens[0].id])

    // Update password
    const hash = await bcrypt.hash(newPassword, 12)
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId])

    res.json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.' })
  } catch (err) {
    console.error('reset-password error:', err)
    res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, avatar_url, role FROM users WHERE id = ?',
      [req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' })
    res.json({ user: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Lỗi server' })
  }
})

export default router
