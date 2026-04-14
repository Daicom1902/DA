import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, token, request } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, try to restore session from stored token
  useEffect(() => {
    const jwt = token.get()
    if (jwt) {
      authAPI.me()
        .then(res => setUser(res.user))
        .catch(() => token.remove())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    token.set(res.token)
    setUser(res.user)
    return res.user
  }

  const loginWithGoogle = async (credential) => {
    const res = await authAPI.googleLogin(credential)
    token.set(res.token)
    setUser(res.user)
    return res.user
  }

  const register = async (data) => {
    // Returns { userId, maskedEmail, devOtp? } — account NOT yet active
    return await authAPI.register(data)
  }

  const completeRegister = async (userId, otp) => {
    const res = await authAPI.verifyEmail({ userId, otp })
    token.set(res.token)
    setUser(res.user)
    return res.user
  }

  const logout = async () => {
    try { await authAPI.logout() } catch {}
    // Clear cart when logging out to prevent mixing carts between accounts
    localStorage.removeItem('luxe_cart')
    token.remove()
    setUser(null)
  }

  const role = user?.role
  const isAdmin     = role === 'admin'
  const isManager   = role === 'manager'
  const isStaff     = role === 'staff'
  // Tất cả role có quyền vào dashboard
  const canDashboard = ['admin', 'manager', 'staff'].includes(role)
  // Chỉ admin và manager được xóa dữ liệu
  const canDelete    = ['admin', 'manager'].includes(role)

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, completeRegister, logout,
      isAdmin, isManager, isStaff, canDashboard, canDelete }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
