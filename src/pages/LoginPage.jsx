import { useState, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const redirectTo = new URLSearchParams(location.search).get('redirect') || null

  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleRedirect = (user) => {
    const dashRoles = ['admin', 'manager', 'staff']
    if (dashRoles.includes(user.role)) { navigate('/admin'); return }
    navigate(redirectTo || '/')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      handleRedirect(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = useCallback(async (credential) => {
    setError('')
    const user = await loginWithGoogle(credential)
    handleRedirect(user)
  }, [loginWithGoogle])

  const handleGoogleError = useCallback((msg) => setError(msg), [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 py-6 sm:py-0">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-5 sm:mb-8">
          <Link to="/" className="text-2xl font-serif font-bold text-primary-400">
            LUMIÈRE
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Đăng nhập vào tài khoản của bạn</p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 sm:p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-2">
              <Link to="/forgot-password" className="text-xs text-primary-400 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
              Đăng nhập
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-dark-600" />
            <span className="text-xs text-gray-500">hoặc</span>
            <div className="flex-1 h-px bg-dark-600" />
          </div>

          <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

          <p className="text-center text-sm text-gray-400 mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary-400 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
