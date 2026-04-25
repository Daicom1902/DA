import jwt from 'jsonwebtoken'
import pool from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'luxe_fragrance_secret_key'

// Roles có quyền truy cập dashboard
export const DASHBOARD_ROLES = ['admin', 'manager', 'staff']

/**
 * Verify JWT from Authorization header.
 * Sets req.user = { id, email, role } on success.
 * Also verifies that user account is still active.
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Không có token xác thực' })
  }

  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Check if user account is still active
    const [user] = await pool.query('SELECT is_active FROM users WHERE id = ?', [decoded.id])
    if (user.length === 0 || !user[0].is_active) {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hoá hoặc không tồn tại' })
    }
    
    req.user = decoded
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' })
    }
    console.error(err)
    return res.status(500).json({ message: 'Lỗi server' })
  }
}

/**
 * Require admin or manager role (full access). Must be used after authMiddleware.
 */
export function adminOnly(req, res, next) {
  if (!['admin', 'manager'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' })
  }
  next()
}

/**
 * Require admin, manager, or staff role (dashboard access). Must be used after authMiddleware.
 */
export function staffOrAbove(req, res, next) {
  if (!DASHBOARD_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập dashboard' })
  }
  next()
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Optional auth — sets req.user if a valid token is provided, but does NOT block.
 * Also checks if user account is active.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null
    return next()
  }
  const tok = authHeader.slice(7)
  try {
    const decoded = jwt.verify(tok, JWT_SECRET)
    
    // Check if user account is still active
    const [user] = await pool.query('SELECT is_active FROM users WHERE id = ?', [decoded.id])
    if (user.length > 0 && user[0].is_active) {
      req.user = decoded
    } else {
      req.user = null
    }
  } catch {
    req.user = null
  }
  next()
}
