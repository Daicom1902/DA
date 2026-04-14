import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'luxe_fragrance_secret_key'

// Roles có quyền truy cập dashboard
export const DASHBOARD_ROLES = ['admin', 'manager', 'staff']

/**
 * Verify JWT from Authorization header.
 * Sets req.user = { id, email, role } on success.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Không có token xác thực' })
  }

  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' })
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
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null
    return next()
  }
  const tok = authHeader.slice(7)
  try {
    req.user = jwt.verify(tok, JWT_SECRET)
  } catch {
    req.user = null
  }
  next()
}
