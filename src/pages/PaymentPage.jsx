import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Clock, AlertCircle, ArrowLeft, Loader2, CreditCard, Eye, EyeOff } from 'lucide-react'
import { ordersAPI } from '../utils/api'
import { formatVND } from '../utils/currency'
import { useCart } from '../context/CartContext'

// ── Simulated QR code ──────────────────────────────────────────────────────
function FakeQR({ color }) {
  // A 7×7 grid of deterministic squares that looks like a QR code
  const seed = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,0,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
  ]
  const inner = [
    [0,1,0,1,0,1],
    [1,0,1,0,1,0],
    [0,1,1,0,0,1],
    [1,0,0,1,1,0],
    [0,1,0,0,1,1],
    [1,0,1,1,0,0],
  ]

  return (
    <div className="inline-block bg-white p-3 rounded-xl shadow-xl">
      {/* Top finder pattern */}
      <div className="grid gap-0.5 mb-0.5">
        {seed.map((row, r) => (
          <div key={r} className="flex gap-0.5">
            {row.map((cell, c) => (
              <div key={c} className={`w-4 h-4 rounded-sm ${cell ? color : 'bg-white'}`} />
            ))}
          </div>
        ))}
      </div>
      {/* Inner data modules */}
      <div className="grid gap-0.5 mt-0.5">
        {inner.map((row, r) => (
          <div key={r} className="flex gap-0.5">
            {row.map((cell, c) => (
              <div key={c} className={`w-4 h-4 rounded-sm ${cell ? color : 'bg-white'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Countdown ─────────────────────────────────────────────────────────────
function Countdown({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) { onExpire?.(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left, onExpire])

  const m = String(Math.floor(left / 60)).padStart(2, '0')
  const s = String(left % 60).padStart(2, '0')
  const pct = (left / seconds) * 100
  const isLow = left < 120

  return (
    <div className="text-center">
      <p className="text-gray-400 text-sm mb-1">Thời gian còn lại</p>
      <p className={`text-3xl font-mono font-bold ${isLow ? 'text-red-400 animate-pulse' : 'text-white'}`}>
        {m}:{s}
      </p>
      <div className="w-full bg-dark-700 rounded-full h-1.5 mt-2">
        <div
          className={`h-1.5 rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : 'bg-primary-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── ATM OTP countdown (2 min) ─────────────────────────────────────────────
function OtpCountdown({ onExpire }) {
  const [left, setLeft] = useState(120)
  useEffect(() => {
    if (left <= 0) { onExpire?.(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left, onExpire])
  const m = String(Math.floor(left / 60)).padStart(2, '0')
  const s = String(left % 60).padStart(2, '0')
  return (
    <span className={`font-mono font-bold ${left < 30 ? 'text-red-400 animate-pulse' : 'text-violet-300'}`}>
      {m}:{s}
    </span>
  )
}

// ── ATM Card input form ───────────────────────────────────────────────────
function AtmCardForm({ total, orderId, onSuccess, onError }) {
  const [step,       setStep]       = useState('card') // card | otp | processing
  const [showNum,    setShowNum]    = useState(false)
  const [card,       setCard]       = useState({ number: '', holder: '', expiry: '', issued: '' })
  const [otp,        setOtp]        = useState(['', '', '', '', '', ''])
  const [otpExpired, setOtpExpired] = useState(false)
  const [formErr,    setFormErr]    = useState('')
  const otpRefs = useRef([])

  const handleCardNumber = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 16)
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim()
    setCard(c => ({ ...c, number: formatted }))
  }
  const handleExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4)
    setCard(c => ({ ...c, expiry: d.length > 2 ? d.slice(0,2) + '/' + d.slice(2) : d }))
  }
  const handleIssued = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 8)
    let f = d
    if (d.length > 4) f = d.slice(0,2) + '/' + d.slice(2,4) + '/' + d.slice(4)
    else if (d.length > 2) f = d.slice(0,2) + '/' + d.slice(2)
    setCard(c => ({ ...c, issued: f }))
  }

  const validateCard = () => {
    if (card.number.replace(/\s/g, '').length < 9) return 'Số thẻ phải có ít nhất 9 chữ số'
    if (!card.holder.trim())    return 'Vui lòng nhập tên chủ thẻ'
    if (card.expiry.length !== 5) return 'Ngày hết hạn không hợp lệ (MM/YY)'
    if (card.issued.length !== 10) return 'Ngày phát hành không hợp lệ (DD/MM/YYYY)'
    return ''
  }

  const handleCardSubmit = (e) => {
    e.preventDefault()
    const err = validateCard()
    if (err) { setFormErr(err); return }
    setFormErr('')
    setOtpExpired(false)
    setOtp(['','','','','',''])
    setStep('otp')
  }

  const handleOtpInput = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]; next[idx] = digit; setOtp(next)
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus()
  }
  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }
  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus() }
    e.preventDefault()
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (otp.join('').length < 6) { setFormErr('Nhập đủ 6 chữ số OTP'); return }
    setFormErr('')
    setStep('processing')
    try {
      await ordersAPI.confirmPayment(Number(orderId))
      onSuccess()
    } catch (err) {
      onError(err.message)
    }
  }

  const inputCls = 'w-full bg-dark-800 border border-dark-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none transition text-sm'

  if (step === 'processing') return (
    <div className="text-center py-8">
      <Loader2 className="animate-spin text-violet-400 mx-auto mb-4" size={48} />
      <p className="text-gray-400">Đang xử lý thanh toán…</p>
    </div>
  )

  if (step === 'otp') return (
    <div>
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">📱</span>
        </div>
        <h2 className="font-semibold text-white mb-1">Xác nhận OTP</h2>
        <p className="text-gray-400 text-sm">Mã OTP đã được gửi đến số điện thoại đăng ký thẻ</p>
        <p className="text-gray-500 text-xs mt-1">Còn hiệu lực: <OtpCountdown onExpire={() => setOtpExpired(true)} /></p>
      </div>
      {otpExpired ? (
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">Mã OTP đã hết hạn. Vui lòng thử lại.</p>
          <button onClick={() => { setOtpExpired(false); setOtp(['','','','','','']) }}
            className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition">
            Gửi lại OTP
          </button>
        </div>
      ) : (
        <form onSubmit={handleOtpSubmit}>
          <div className="flex justify-center gap-2 mb-5" onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input key={idx}
                ref={el => { otpRefs.current[idx] = el }}
                type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleOtpInput(idx, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(idx, e)}
                className="w-11 h-14 text-center text-xl font-bold font-mono bg-dark-800 border-2 border-dark-600 focus:border-violet-500 rounded-lg text-white outline-none transition"
              />
            ))}
          </div>
          {formErr && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-sm mb-4">
              <AlertCircle size={15} /> {formErr}
            </div>
          )}
          <button type="submit"
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition flex items-center justify-center gap-2">
            <CheckCircle size={18} /> Xác nhận thanh toán
          </button>
          <button type="button" onClick={() => { setStep('card'); setFormErr('') }}
            className="mt-3 w-full text-sm text-gray-500 hover:text-gray-300 transition">
            ← Quay lại nhập thông tin thẻ
          </button>
        </form>
      )}
    </div>
  )

  // step === 'card'
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
          <CreditCard className="text-violet-400" size={20} />
        </div>
        <div>
          <p className="font-semibold text-white">Nhập thông tin thẻ ATM</p>
          <p className="text-xs text-gray-500">Thẻ ATM / thẻ nội địa ngân hàng</p>
        </div>
      </div>

      {/* Visual card preview */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-800 via-violet-700 to-indigo-900 p-5 mb-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <div className="flex justify-between items-start mb-4">
            <span className="text-white/60 text-xs font-medium tracking-widest uppercase">ATM Card</span>
            <span className="text-white font-bold text-lg">🏦</span>
          </div>
          <p className="font-mono text-xl tracking-widest text-white mb-4 min-h-[28px]">
            {card.number || '•••• •••• •••• ••••'}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-white/50 text-[10px] uppercase mb-0.5">Tên chủ thẻ</p>
              <p className="text-white text-sm font-semibold tracking-wide uppercase truncate max-w-[160px]">
                {card.holder || 'HỌ TÊN CHỦ THẺ'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase mb-0.5">Hết hạn</p>
              <p className="text-white text-sm font-mono">{card.expiry || 'MM/YY'}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleCardSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Số thẻ <span className="text-red-400">*</span></label>
          <div className="relative">
            <input type={showNum ? 'text' : 'password'} value={card.number}
              onChange={e => handleCardNumber(e.target.value)}
              placeholder="•••• •••• •••• ••••" maxLength={19}
              className={inputCls + ' pr-10 font-mono tracking-widest'}
              autoComplete="cc-number"
            />
            <button type="button" onClick={() => setShowNum(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
              {showNum ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Tên chủ thẻ (như trên thẻ) <span className="text-red-400">*</span></label>
          <input type="text" value={card.holder}
            onChange={e => setCard(c => ({ ...c, holder: e.target.value.toUpperCase() }))}
            placeholder="VD: NGUYEN VAN A"
            className={inputCls + ' uppercase tracking-wide'}
            autoComplete="cc-name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Ngày hết hạn <span className="text-red-400">*</span></label>
            <input type="text" value={card.expiry} onChange={e => handleExpiry(e.target.value)}
              placeholder="MM/YY" maxLength={5} className={inputCls + ' font-mono'} autoComplete="cc-exp" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Ngày phát hành <span className="text-red-400">*</span></label>
            <input type="text" value={card.issued} onChange={e => handleIssued(e.target.value)}
              placeholder="DD/MM/YYYY" maxLength={10} className={inputCls + ' font-mono'} />
          </div>
        </div>
        {formErr && (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-sm">
            <AlertCircle size={15} /> {formErr}
          </div>
        )}
        <div className="bg-dark-800 rounded-xl px-4 py-3 flex justify-between text-sm text-gray-400">
          <span>Số tiền thanh toán</span>
          <span className="font-bold text-violet-300">{formatVND(total)}</span>
        </div>
        <button type="submit"
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition flex items-center justify-center gap-2">
          <CreditCard size={18} /> Tiếp tục — Nhận mã OTP
        </button>
      </form>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PaymentPage() {
  const { orderId } = useParams()
  const [params]    = useSearchParams()
  const navigate    = useNavigate()
  const { clearCart } = useCart()

  const method = params.get('method') || 'vietqr'
  const total  = Number(params.get('total') || 0)
  const name   = params.get('name') || ''

  const [status,  setStatus]  = useState('pending') // pending | paying | success | error | expired
  const [errMsg,  setErrMsg]  = useState('')
  const [momoLoading, setMomoLoading] = useState(false)
  const [momoRetry,   setMomoRetry]   = useState(0)

  const isAtm    = method === 'atm_card'
  const isVietQR = method === 'vietqr'

  // For ATM/MoMo: automatically redirect to MoMo payment page
  useEffect(() => {
    if (!isAtm || !orderId) return
    setMomoLoading(true)
    setErrMsg('')
    ordersAPI.momoInit(Number(orderId))
      .then(res => {
        if (res?.payUrl) window.location.href = res.payUrl
        else { setErrMsg('Không nhận được link thanh toán từ MoMo'); setMomoLoading(false) }
      })
      .catch(err => {
        setErrMsg(err.message || 'Không thể kết nối MoMo')
        setMomoLoading(false)
      })
  }, [isAtm, orderId, momoRetry])

  const brand      = isAtm ? 'Thẻ ATM (MoMo)' : 'VietQR'
  const logo       = isAtm ? '🏧' : '📱'
  const qrColor    = 'bg-teal-600'
  const headerCls  = isAtm
    ? 'bg-gradient-to-r from-pink-700 to-pink-900'
    : 'bg-gradient-to-r from-teal-700 to-cyan-900'

  const handleConfirm = useCallback(async () => {
    setStatus('paying')
    setErrMsg('')
    try {
      await ordersAPI.confirmPayment(Number(orderId))
      // Clear cart after successful payment
      await clearCart()
      setStatus('success')
    } catch (err) {
      setErrMsg(err.message)
      setStatus('error')
    }
  }, [orderId, clearCart])

  // Auto-redirect after success
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => navigate('/my-orders'), 3500)
      return () => clearTimeout(t)
    }
  }, [status, navigate])

  // ─── Success screen ──────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="text-green-400" size={48} />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2 text-green-300">Thanh toán thành công!</h1>
          <p className="text-gray-400 mb-1">Đơn hàng <span className="font-bold text-white">#{orderId}</span> đã được thanh toán qua <span className="font-bold text-white">{brand}</span>.</p>
          <p className="text-gray-500 text-sm mb-6">Đang chuyển đến lịch sử đơn hàng…</p>
          <Link to="/my-orders" className="btn-primary">Xem đơn hàng của tôi</Link>
        </div>
      </div>
    )
  }

  // ─── Expired screen ──────────────────────────────────────────────────────
  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="text-red-400" size={48} />
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2 text-red-300">Phiên thanh toán hết hạn</h1>
          <p className="text-gray-400 mb-6">Vui lòng quay lại giỏ hàng và đặt hàng lại.</p>
          <Link to="/cart" className="btn-primary">Quay lại giỏ hàng</Link>
        </div>
      </div>
    )
  }

  // ─── Payment screen ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className={`rounded-2xl mb-6 p-5 flex items-center gap-4 ${headerCls}`}>
          <span className="text-4xl">{logo}</span>
          <div>
            <p className="text-white/70 text-sm">Thanh toán qua</p>
            <h1 className="text-2xl font-bold text-white">{brand}</h1>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white/70 text-sm">Đơn hàng</p>
            <p className="text-white font-bold">#{orderId}</p>
          </div>
        </div>

        <div className="card p-6">

          {/* ATM card flow: redirect to MoMo */}
          {isAtm ? (
            <div className="text-center py-8">
              {momoLoading ? (
                <>
                  <Loader2 className="animate-spin text-pink-400 mx-auto mb-4" size={48} />
                  <p className="text-gray-300 font-semibold">Đang chuyển đến MoMo...</p>
                  <p className="text-gray-500 text-sm mt-1">Vui lòng không đóng trang này</p>
                </>
              ) : (
                <>
                  <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
                  <p className="text-red-300 font-semibold mb-2">{errMsg || 'Đã xảy ra lỗi'}</p>
                  <button onClick={() => setMomoRetry(c => c + 1)} className="btn-primary text-sm">
                    Thử lại
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
          {/* Amount */}
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-1">Số tiền thanh toán</p>
              <p className={`text-4xl font-bold ${isVietQR ? 'text-teal-400' : 'text-pink-400'}`}>
              {formatVND(total)}
            </p>
            {name && <p className="text-gray-500 text-sm mt-1">Khách hàng: {name}</p>}
          </div>

<div className="flex flex-col items-center gap-4 mb-6">
                <FakeQR color={qrColor} />
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Quét mã QR bằng app ngân hàng bất kỳ</p>
                  <p className="text-gray-500 text-xs mt-1">hoặc chuyển khoản theo thông tin bên dưới</p>
                </div>
              </div>

              {/* VietQR bank details */}
              <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-4 text-sm mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📱</span>
                  <span className="font-semibold text-teal-300">Thông tin VietQR</span>
                </div>
                <div className="space-y-1.5 text-gray-300">
                  <div className="flex justify-between"><span>Ngân hàng:</span><span className="font-bold text-white">MB Bank</span></div>
                  <div className="flex justify-between"><span>Số tài khoản:</span><span className="font-bold text-white">0393306437</span></div>
                  <div className="flex justify-between"><span>Tên tài khoản:</span><span className="font-bold text-white">Đào Khả Đại</span></div>
                  <div className="flex justify-between"><span>Nội dung CK:</span><span className="font-bold text-teal-300">DH-{orderId}</span></div>
                </div>
              </div>

          {/* Countdown */}
          <div className="mb-6">
            <Countdown seconds={15 * 60} onExpire={() => setStatus('expired')} />
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm">
              <AlertCircle size={16} />
              <span>{errMsg}</span>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={status === 'paying'}
            className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'paying'
              ? <><Loader2 className="animate-spin" size={18} /> Đang xử lý…</>
              : <><CheckCircle size={18} /> Tôi đã thanh toán xong</>
            }
          </button>
            </>
          )}

          <Link
            to="/cart"
            className="mt-4 flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm transition"
          >
            <ArrowLeft size={16} /> Huỷ và quay lại giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  )
}
