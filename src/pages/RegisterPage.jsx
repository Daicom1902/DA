import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/api'

export default function RegisterPage() {
  const { register, completeRegister } = useAuth()
  const navigate = useNavigate()

  // Step 1: form data
  const [form, setForm]       = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)

  // Step 2: OTP verify
  const [step, setStep]           = useState(1)
  const [pendingUserId, setPendingUserId] = useState(null)
  const [maskedEmail, setMaskedEmail]     = useState('')
  const [devOtp, setDevOtp]               = useState('')
  const [otp, setOtp]                     = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // ── Step 1: Submit registration form ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp.'); return }
    if (form.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return }
    setLoading(true)
    try {
      const res = await register({ full_name: form.full_name, email: form.email, phone: form.phone, password: form.password })
      setPendingUserId(res.userId)
      setMaskedEmail(res.maskedEmail || form.email)
      setDevOtp(res.devOtp || '')
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    if (!otp.trim()) { setError('Vui lòng nhập mã OTP'); return }
    setLoading(true)
    try {
      await completeRegister(pendingUserId, otp.trim())
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResend = async () => {
    setError(''); setOtp('')
    setLoading(true)
    try {
      const res = await authAPI.resendVerify(pendingUserId)
      setDevOtp(res.devOtp || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const field = (name, label, type = 'text', placeholder = '', required = false) => (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={form[name]}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
      />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 py-6 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-5 sm:mb-8">
          <Link to="/" className="text-2xl font-serif font-bold text-primary-400">LUMIÈRE</Link>
          <p className="text-gray-400 mt-2 text-sm">
            {step === 1 ? 'Tạo tài khoản mới' : 'Xác thực email'}
          </p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5 sm:p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* ── Step 1: Registration form ── */}
          {step === 1 && (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {field('full_name', 'Họ và tên *', 'text', 'Nguyễn Văn A', true)}
                {field('email',     'Email *',     'email', 'your@email.com', true)}
                {field('phone',     'Số điện thoại', 'tel', '0912 345 678')}

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Mật khẩu *</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full px-4 py-3 pr-12 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Xác nhận mật khẩu *</label>
                  <input
                    type="password"
                    required
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition mt-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                  Đăng ký
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-primary-400 hover:underline">Đăng nhập</Link>
              </p>
            </>
          )}

          {/* ── Step 2: OTP verification ── */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <ShieldCheck size={48} className="text-primary-400 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  Mã OTP đã được gửi đến{' '}
                  <span className="text-primary-400 font-medium">{maskedEmail}</span>.
                </p>
                <p className="text-gray-500 text-xs mt-1">Mã có hiệu lực trong 15 phút.</p>
              </div>

              {devOtp && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm px-4 py-3 rounded-lg mb-5">
                  <strong>[Chế độ dev]</strong> SMTP chưa cấu hình. Mã OTP:{' '}
                  <span className="font-mono text-yellow-200 text-base cursor-pointer hover:underline"
                    onClick={() => setOtp(devOtp)}>
                    {devOtp}
                  </span>{' '}
                  <span className="text-xs text-yellow-500">(bấm để điền)</span>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Mã OTP (6 chữ số)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="______"
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 text-center text-xl tracking-widest font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                  Xác thực & Hoàn tất đăng ký
                </button>
              </form>

              <button type="button" onClick={handleResend} disabled={loading}
                className="w-full text-center text-sm text-gray-500 hover:text-primary-400 mt-4 transition disabled:opacity-40">
                Không nhận được mã? Gửi lại
              </button>

              <button type="button" onClick={() => { setStep(1); setError('') }}
                className="w-full text-center text-xs text-gray-600 hover:text-gray-400 mt-2 transition">
                ← Quay lại sửa thông tin
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
