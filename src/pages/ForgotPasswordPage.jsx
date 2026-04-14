import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../utils/api'

// Step 1: Enter email → request OTP
// Step 2: Enter OTP + new password → confirm reset

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep]               = useState(1)
  const [email, setEmail]             = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otp, setOtp]                 = useState('')
  const [devOtp, setDevOtp]           = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPw, setConfirmPw]     = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [showCPw, setShowCPw]         = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  // ── Step 1: Request OTP ─────────────────────────────────────────────────
  const handleRequestOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Vui lòng nhập địa chỉ email')
    setLoading(true)
    try {
      const data = await authAPI.forgotPassword(email.trim())
      setMaskedEmail(data.maskedEmail || '')
      setDevOtp(data.devOtp || '')
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Reset password ──────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    if (!otp.trim()) return setError('Vui lòng nhập mã OTP')
    if (newPassword.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự')
    if (newPassword !== confirmPw) return setError('Mật khẩu xác nhận không khớp')
    setLoading(true)
    try {
      await authAPI.resetPassword({ identifier: email.trim(), otp: otp.trim(), newPassword })
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP – called without a form event
  const handleResend = async () => {
    setError('')
    setOtp('')
    setLoading(true)
    try {
      const data = await authAPI.forgotPassword(email.trim())
      setMaskedEmail(data.maskedEmail || maskedEmail)
      setDevOtp(data.devOtp || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-serif font-bold text-primary-400">
            LUMIÈRE
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Đặt lại mật khẩu</p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <h2 className="text-white text-lg font-semibold mb-1">Quên mật khẩu?</h2>
              <p className="text-gray-400 text-sm mb-6">
                Nhập email đã đăng ký – chúng tôi sẽ gửi mã OTP 6 chữ số để xác nhận.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Địa chỉ Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                  Gửi mã OTP
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Đã nhớ mật khẩu?{' '}
                <Link to="/login" className="text-primary-400 hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setOtp(''); setDevOtp('') }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-5 transition"
              >
                <ArrowLeft size={15} /> Quay lại
              </button>

              <h2 className="text-white text-lg font-semibold mb-1">Nhập mã OTP</h2>
              <p className="text-gray-400 text-sm mb-1">
                Mã xác nhận đã được gửi đến{' '}
                <span className="text-primary-400">{maskedEmail || email}</span>.
              </p>
              <p className="text-gray-500 text-xs mb-5">Mã có hiệu lực trong 15 phút.</p>

              {/* Dev mode notice – only shown when SMTP is not configured */}
              {devOtp && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm px-4 py-3 rounded-lg mb-5">
                  <strong>[Chế độ dev]</strong> SMTP chưa cấu hình.{' '}
                  Mã OTP:{' '}
                  <span
                    className="font-mono text-yellow-200 text-base cursor-pointer hover:underline"
                    onClick={() => setOtp(devOtp)}
                  >
                    {devOtp}
                  </span>{' '}
                  <span className="text-xs text-yellow-500">(bấm để điền)</span>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
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

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
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
                  <label className="block text-sm text-gray-400 mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showCPw ? 'text' : 'password'}
                      required
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full px-4 py-3 pr-12 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                    />
                    <button type="button" onClick={() => setShowCPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                      {showCPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition mt-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                  Đặt lại mật khẩu
                </button>
              </form>

              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="w-full text-center text-sm text-gray-500 hover:text-primary-400 mt-4 transition disabled:opacity-40"
              >
                Không nhận được mã? Gửi lại
              </button>
            </>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="text-center py-4">
              <CheckCircle2 size={56} className="text-green-400 mx-auto mb-4" />
              <h2 className="text-white text-xl font-semibold mb-2">Đặt lại thành công!</h2>
              <p className="text-gray-400 text-sm mb-8">
                Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
