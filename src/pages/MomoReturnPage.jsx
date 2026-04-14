import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { ordersAPI } from '../utils/api'
import { useCart } from '../context/CartContext'

export default function MomoReturnPage() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const { clearCart } = useCart()
  const [status, setStatus] = useState('loading') // loading | success | fail
  const [msg,    setMsg]    = useState('')
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    const resultCode = Number(params.get('resultCode'))
    const extraData  = params.get('extraData') || ''
    const message    = params.get('message') || ''

    let internalOrderId = null
    try {
      const decoded = JSON.parse(atob(extraData))
      internalOrderId = decoded.internalOrderId
      setOrderId(internalOrderId)
    } catch {
      // fallback: try to parse orderId from MoMo's orderId param
      const momoOrderId = params.get('orderId') || ''
      const match = momoOrderId.match(/_?(\d+)_/)
      if (match) internalOrderId = Number(match[1])
    }

    if (resultCode === 0 && internalOrderId) {
      // Mark order as paid in our system
      ordersAPI.confirmPayment(internalOrderId)
        .then(async () => { 
          await clearCart()
          setStatus('success')
          setOrderId(internalOrderId) 
        })
        .catch(async err => { 
          await clearCart()
          setStatus('success')
          setOrderId(internalOrderId)
          console.warn(err) 
        })
        // Even if confirmPayment fails (already paid, network), show success since MoMo confirmed
    } else {
      setMsg(message)
      setStatus('fail')
    }
  }, [params])

  // Auto-redirect to my-orders after success
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => navigate('/my-orders'), 4000)
      return () => clearTimeout(t)
    }
  }, [status, navigate])

  if (status === 'loading') return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-pink-400" size={48} />
    </div>
  )

  if (status === 'success') return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-28 h-28 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="text-green-400" size={56} />
        </div>
        <div className="inline-flex items-center gap-2 bg-pink-500/20 border border-pink-500/30 rounded-full px-4 py-1 mb-4">
          <span className="text-2xl">💳</span>
          <span className="text-pink-300 font-semibold text-sm">Thanh toán qua MoMo</span>
        </div>
        <h1 className="text-3xl font-serif font-bold mb-2 text-green-300">Thanh toán thành công!</h1>
        {orderId && (
          <p className="text-gray-400 mb-1">
            Đơn hàng <span className="font-bold text-white">#{orderId}</span> đã được thanh toán.
          </p>
        )}
        <p className="text-gray-500 text-sm mb-6">Đang chuyển đến lịch sử đơn hàng…</p>
        <Link to="/my-orders" className="btn-primary">Xem đơn hàng của tôi</Link>
      </div>
    </div>
  )

  // Fail
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-28 h-28 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="text-red-400" size={56} />
        </div>
        <h1 className="text-2xl font-serif font-bold mb-2 text-red-300">Thanh toán thất bại</h1>
        {msg && <p className="text-gray-400 mb-4">{msg}</p>}
        <p className="text-gray-500 text-sm mb-6">Đơn hàng của bạn vẫn được lưu. Vui lòng thử thanh toán lại.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/my-orders" className="btn-primary">Đơn hàng của tôi</Link>
          <Link to="/cart" className="px-4 py-2 border border-dark-600 hover:border-primary-500 text-gray-300 hover:text-white rounded-lg text-sm transition">
            Giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  )
}
