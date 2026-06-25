const BASE_URL = '/api'

// ── Token helpers ─────────────────────────────────────────────────────────
export const token = {
  get:    ()      => localStorage.getItem('token'),
  set:    (t)     => localStorage.setItem('token', t),
  remove: ()      => localStorage.removeItem('token'),
}

export async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const jwt = token.get()
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra server đang chạy.')
  }

  // Handle empty body (204 No Content, etc.)
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}

  if (!res.ok) throw new Error(data.message || `Lỗi ${res.status}: ${res.statusText}`)
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (body)       => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verifyEmail:    (body)       => request('/auth/verify-email', { method: 'POST', body: JSON.stringify(body) }),
  resendVerify:   (userId)     => request('/auth/resend-verify', { method: 'POST', body: JSON.stringify({ userId }) }),
  login:          (body)       => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  logout:         ()           => request('/auth/logout',   { method: 'POST' }),
  me:             ()           => request('/auth/me'),
  googleLogin:    (credential) => request('/auth/google',   { method: 'POST', body: JSON.stringify({ credential }) }),
  forgotPassword: (identifier) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identifier }) }),
  resetPassword:  (body)       => request('/auth/reset-password',  { method: 'POST', body: JSON.stringify(body) }),
}

// ── Products ──────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll:       (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/products${qs ? '?' + qs : ''}`)
  },
  getBestSellers: (limit = 8) => request(`/products/best-sellers?limit=${limit}`),
  adminGetAll:  () => request('/admin/products'),
  getById:      (id)          => request(`/products/${id}`),
  create:       (body)        => request('/admin/products',        { method: 'POST',   body: JSON.stringify(body) }),
  update:       (id, body)    => request(`/admin/products/${id}`,  { method: 'PUT',    body: JSON.stringify(body) }),
  delete:       (id)          => request(`/admin/products/${id}`,  { method: 'DELETE' }),
}

// ── Orders ────────────────────────────────────────────────────────────────
export const ordersAPI = {
  // Admin
  getAll:       ()                              => request('/admin/orders'),
  getById:      (id)                            => request(`/admin/orders/${id}`),
  updateStatus: (id, status, payment_status)    => request(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status, payment_status }) }),
  delete:       (id)                            => request(`/admin/orders/${id}`, { method: 'DELETE' }),
  // Customer / Guest
  create:          (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  myOrders:        ()     => request('/orders/my'),
  purchaseHistory: ()     => request('/orders/history'),
  confirmPayment:  (id)   => request(`/orders/${id}/pay`, { method: 'PUT' }),
  momoInit:        (id)   => request(`/orders/${id}/momo-init`,  { method: 'POST' }),
}

// ── Contact ───────────────────────────────────────────────────────────────
export const contactAPI = {
  send:    (body) => request('/contact', { method: 'POST', body: JSON.stringify(body) }),
  getAll:  ()     => request('/admin/contact'),
  getById: (id)   => request(`/admin/contact/${id}`),
  delete:  (id)   => request(`/admin/contact/${id}`, { method: 'DELETE' }),
}

// ── Dashboard stats ───────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: async () => {
    const res = await request('/admin/dashboard')
    return res.data
  },
}

// ── Users (staff management) ──────────────────────────────────────────────
export const usersAPI = {
  getAll:  ()             => request('/admin/users'),
  create:  (body)         => request('/admin/users',      { method: 'POST',   body: JSON.stringify(body) }),
  update:  (id, body)     => request(`/admin/users/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  delete:  (id)           => request(`/admin/users/${id}`, { method: 'DELETE' }),
  getAllCustomers: ()     => request('/admin/customers'),
  updateCustomer: (id, body) => request(`/admin/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCustomer: (id)    => request(`/admin/customers/${id}`, { method: 'DELETE' }),
}

// ── Brands ───────────────────────────────────────────────────────────────────
export const brandsAPI = {
  getAll:  ()            => request('/brands'),
  create:  (body)        => request('/brands',       { method: 'POST',   body: JSON.stringify(body) }),
  update:  (id, body)    => request(`/brands/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  delete:  (id)          => request(`/brands/${id}`, { method: 'DELETE' }),
}

// ── Concentrations (nồng độ) ──────────────────────────────────────────────────────
export const concentrationsAPI = {
  getAll:  ()            => request('/concentrations'),
  create:  (body)        => request('/concentrations',       { method: 'POST',   body: JSON.stringify(body) }),
  update:  (id, body)    => request(`/concentrations/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  delete:  (id)          => request(`/concentrations/${id}`, { method: 'DELETE' }),
}

// ── Product Variants (dung tích) ──────────────────────────────────────────
export const variantsAPI = {
  getAll:  (productId)                    => request(`/admin/products/${productId}/variants`),
  add:     (productId, body)              => request(`/admin/products/${productId}/variants`,             { method: 'POST',   body: JSON.stringify(body) }),
  update:  (productId, variantId, body)   => request(`/admin/products/${productId}/variants/${variantId}`, { method: 'PUT',    body: JSON.stringify(body) }),
  remove:  (productId, variantId)         => request(`/admin/products/${productId}/variants/${variantId}`, { method: 'DELETE' }),
}

// ── Product Reviews ───────────────────────────────────────────────────────
export const reviewsAPI = {
  submit:      (productId, body) => request(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  // Admin - Hierarchy
  adminGetAll: (params = {})     => request(`/admin/reviews?${new URLSearchParams(params)}`),
  toggle:      (id, is_approved) => request(`/admin/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ is_approved }) }),
  delete:      (id)              => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
  
  // Hierarchical workflow actions
  flag:        (id, reason)      => request(`/admin/reviews/${id}/flag`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  unflag:      (id)              => request(`/admin/reviews/${id}/unflag`, { method: 'PUT' }),
  approve:     (id, notes)       => request(`/admin/reviews/${id}/approve`, { method: 'PUT', body: JSON.stringify({ notes }) }),
  reject:      (id, reason)      => request(`/admin/reviews/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  
  // Audit and stats
  getAudit:    (id)              => request(`/admin/reviews/${id}/audit`),
  getStats:    ()                => request('/admin/reviews/stats/summary'),
}

// ── Product Images (gallery) ───────────────────────────────────────────────
export const productImagesAPI = {
  getAll:  (productId)              => request(`/admin/products/${productId}/images`),
  add:     (productId, body)        => request(`/admin/products/${productId}/images`,        { method: 'POST',   body: JSON.stringify(body) }),
  update:  (productId, imageId, body) => request(`/admin/products/${productId}/images/${imageId}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove:  (productId, imageId)     => request(`/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' }),
}
// ── Blog Posts ───────────────────────────────────────────────────────────────
export const postsAPI = {
  getAll:       (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/posts${qs ? '?' + qs : ''}`)
  },
  getBySlug:    (slug)        => request(`/posts/${slug}`),
  addComment:   (id, body)    => request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  // Admin
  adminGetAll:  ()            => request('/admin/posts'),
  adminGetById: (id)          => request(`/admin/posts/${id}`),
  create:       (body)        => request('/admin/posts',       { method: 'POST',   body: JSON.stringify(body) }),
  update:       (id, body)    => request(`/admin/posts/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  delete:       (id)          => request(`/admin/posts/${id}`, { method: 'DELETE' }),
}

// ── Comments (admin) ────────────────────────────────────────────────────────
export const commentsAPI = {
  getAll:       ()            => request('/admin/comments'),
  toggle:       (id, is_approved) => request(`/admin/comments/${id}`, { method: 'PUT', body: JSON.stringify({ is_approved }) }),
  delete:       (id)          => request(`/admin/comments/${id}`, { method: 'DELETE' }),
}

// ── Reports / Statistics ────────────────────────────────────────────────────
export const reportsAPI = {
  getStats: async (range = '30d', startDate = null, endDate = null) => {
    let url = `/admin/reports?range=${range}`
    if (startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`
    }
    const res = await request(url)
    return res.data
  },
}

// ── File Upload ──────────────────────────────────────────────────────────────
export const uploadAPI = {
  uploadImage: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const jwt = token.get()
    const headers = {}
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`
    
    try {
      const res = await fetch(`${BASE_URL}/upload/image`, {
        method: 'POST',
        headers,
        body: formData,
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Lỗi ${res.status}: ${res.statusText}`)
      return data
    } catch (err) {
      throw new Error(err.message || 'Lỗi tải lên ảnh')
    }
  },

  uploadMultipleImages: async (files) => {
    const formData = new FormData()
    Array.from(files).forEach(file => formData.append('files', file))
    
    const jwt = token.get()
    const headers = {}
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`
    
    try {
      const res = await fetch(`${BASE_URL}/upload/multiple`, {
        method: 'POST',
        headers,
        body: formData,
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Lỗi ${res.status}: ${res.statusText}`)
      return data
    } catch (err) {
      throw new Error(err.message || 'Lỗi tải lên các ảnh')
    }
  },
}