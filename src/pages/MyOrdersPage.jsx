import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Package, ChevronDown, ChevronUp, Truck, QrCode, Landmark,
  CheckCircle, Loader2, ShoppingBag, Calendar, CreditCard,
  Receipt, Star, RefreshCw, History, Clock, XCircle, MapPin
} from 'lucide-react'
import { ordersAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { formatVND } from '../utils/currency'

// ── Status badge maps ─────────────────────────────────────────────────────
const ORDER_STATUS = {
  pending:    { label: 'Chờ xác nhận', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  processing: { label: 'Đang xử lý',   color: 'bg-blue-500/20   text-blue-300   border-blue-500/40'   },
  shipped:    { label: 'Đã gửi',       color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  delivered:  { label: 'Đã giao',      color: 'bg-green-500/20  text-green-300  border-green-500/40'  },
  cancelled:  { label: 'Đã huỷ',       color: 'bg-red-500/20    text-red-300    border-red-500/40'    },
}
const PAYMENT_METHOD = {
  cod:      { label: 'COD',              Icon: Truck    },
  atm_card: { label: 'Thẻ ATM (MoMo)',   Icon: Landmark },
  vietqr:   { label: 'VietQR',           Icon: QrCode   },
}
const PAY_STATUS = {
  unpaid: { label: 'Chưa thanh toán', color: 'text-orange-400', Icon: Clock },
  paid:   { label: 'Đã thanh toán',   color: 'text-green-400',  Icon: CheckCircle },
}

const ORDER_STEPS = [
  { status: 'pending',    label: 'Xác nhận' },
  { status: 'processing', label: 'Xử lý' },
  { status: 'shipped',    label: 'Gửi' },
  { status: 'delivered',  label: 'Giao' },
]

// ── Order Timeline Component ─────────────────────────────────────────────
function OrderTimeline({ status }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Trạng thái giao hàng</p>
      <div className="flex items-center justify-between gap-2">
        {ORDER_STEPS.map((step, idx) => {
          const currentIdx = ORDER_STEPS.findIndex(s => s.status === status)
          const isActive = currentIdx >= idx
          const isCurrent = step.status === status
          return (
            <div key={step.status} className="flex-1">
              <div className="flex flex-col items-center">
                {/* Step circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition mb-1.5 ${
                  isActive
                    ? isCurrent
                      ? 'bg-primary-500 text-white ring-2 ring-primary-400/30'
                      : 'bg-primary-500/40 text-primary-200'
                    : 'bg-dark-700 text-gray-600'
                }`}>
                  {idx + 1}
                </div>
                {/* Step label */}
                <p className={`text-[10px] font-medium text-center ${
                  isActive ? 'text-primary-300' : 'text-gray-600'
                }`}>
                  {step.label}
                </p>
              </div>
              {/* Connector line */}
              {idx < ORDER_STEPS.length - 1 && (
                <div className={`h-1 -mx-1 mt-3 transition ${
                  currentIdx > idx ? 'bg-primary-500' : 'bg-dark-700'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Order card (for active/pending orders) ────────────────────────────────
function OrderCard({ order }) {
  const [open, setOpen] = useState(false)
  const status  = ORDER_STATUS[order.status] || { label: order.status, color: 'bg-gray-500/20 text-gray-300 border-gray-500/40' }
  const pMethod = PAYMENT_METHOD[order.payment_method] || { label: order.payment_method, Icon: CreditCard }
  const pStatus = PAY_STATUS[order.payment_status] || PAY_STATUS.unpaid
  const PMethodIcon = pMethod.Icon
  const PStatusIcon = pStatus.Icon

  const canPay = ['atm_card', 'vietqr'].includes(order.payment_method) && order.payment_status === 'unpaid' && order.status !== 'cancelled'

  return (
    <div className="card overflow-hidden">
      {/* Header row */}
      <div className="p-4 md:p-5 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
            <Package className="text-primary-400" size={20} />
          </div>
          <div>
            <p className="font-semibold text-sm">Đơn hàng <span className="text-primary-300">#{order.id}</span></p>
            <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Order status */}
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
            {status.label}
          </span>
          {/* Payment status */}
          <span className={`flex items-center gap-1 text-xs font-medium ${pStatus.color}`}>
            <PStatusIcon size={12} /> {pStatus.label}
          </span>
          {/* Payment method */}
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <PMethodIcon size={12} /> {pMethod.label}
          </span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="font-bold text-lg text-primary-300">{formatVND(order.total)}</span>
          <button
            onClick={() => setOpen(v => !v)}
            className="text-gray-400 hover:text-white transition"
            title="Chi tiết"
          >
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expandable detail */}
      {open && (
        <div className="border-t border-dark-700 px-4 md:px-5 pt-4 pb-5 space-y-4">
          {/* Timeline */}
          {order.status !== 'cancelled' && <OrderTimeline status={order.status} />}
          
          {/* Shipping Address */}
          {(order.shipping_address || order.shipping_ward || order.shipping_district || order.shipping_city) && (
            <div className="bg-dark-800/40 border border-dark-700 rounded-lg p-3.5">
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin size={16} className="text-primary-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-300 mb-1">Địa chỉ giao hàng</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{order.shipping_address}</p>
                  {(order.shipping_ward || order.shipping_district || order.shipping_city) && (
                    <p className="text-gray-500 text-sm mt-1.5">
                      {[order.shipping_ward, order.shipping_district, order.shipping_city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Items */}
          <div className="space-y-3 mb-4">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {item.image_url && (
                  <img src={item.image_url} alt={item.product_name}
                    className="w-14 h-14 object-contain rounded-lg bg-gradient-to-br from-amber-50 to-pink-50 p-1 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product_name}</p>
                  {item.size_label && <p className="text-xs text-gray-500">{item.size_label}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{item.quantity} × {formatVND(item.unit_price)}</p>
                </div>
                <p className="font-semibold text-sm flex-shrink-0">{formatVND(item.subtotal)}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t border-dark-700 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Tạm tính</span><span>{formatVND(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Giảm giá</span><span>-{formatVND(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span>Phí vận chuyển</span><span>{order.shipping_fee > 0 ? formatVND(order.shipping_fee) : 'Miễn phí'}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-dark-700">
              <span>Tổng cộng</span>
              <span className="text-primary-300">{formatVND(order.total)}</span>
            </div>
          </div>

          {/* Order note */}
          {order.note && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-amber-400 text-xs font-semibold mb-1">Ghi chú</p>
              <p className="text-amber-100 text-sm">{order.note}</p>
            </div>
          )}

          {/* Pay now button for vnpay pending */}
          {canPay && (
            <Link
              to={`/payment/${order.id}?method=${order.payment_method}&total=${order.total}`}
              className={`mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition
                ${order.payment_method === 'atm_card'
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-teal-600 hover:bg-teal-500'}`}
            >
              <PMethodIcon size={16} />
              Thanh toán ngay qua {pMethod.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ── History card (for completed orders) ───────────────────────────────────
function HistoryCard({ order }) {
  const [open, setOpen] = useState(false)
  const pMethod = PAYMENT_METHOD[order.payment_method] || { label: order.payment_method, Icon: CreditCard }
  const PMethodIcon = pMethod.Icon

  const dateStr = new Date(order.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const timeStr = new Date(order.created_at).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
  })

  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) || 0

  return (
    <div className="card group hover:border-primary-500/30 transition-all duration-300">
      {/* Header row */}
      <div className="p-4 md:p-5">
        <div className="flex flex-wrap items-start gap-3 justify-between">
          {/* Left side – order info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
              <CheckCircle className="text-emerald-400" size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">Đơn hàng <span className="text-primary-300">#{order.id}</span></p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Hoàn thành
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {dateStr} • {timeStr}
                </span>
                <span className="flex items-center gap-1">
                  <Package size={11} /> {totalItems} sản phẩm
                </span>
              </div>
            </div>
          </div>

          {/* Right side – total + toggle */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="font-bold text-lg text-primary-300">{formatVND(order.total)}</p>
              <p className="text-[10px] text-gray-500 flex items-center gap-1 justify-end">
                <PMethodIcon size={10} /> {pMethod.label}
              </p>
            </div>
            <button
              onClick={() => setOpen(v => !v)}
              className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 flex items-center justify-center text-gray-400 hover:text-white transition"
              title="Chi tiết"
            >
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Mini product preview (collapsed) */}
        {!open && order.items?.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-800">
            <div className="flex -space-x-2">
              {order.items.slice(0, 4).map((item, idx) => (
                item.image_url ? (
                  <img key={idx} src={item.image_url} alt={item.product_name}
                    className="w-8 h-8 rounded-lg object-contain bg-gradient-to-br from-amber-50 to-pink-50 p-0.5 border-2 border-dark-900 flex-shrink-0" />
                ) : (
                  <div key={idx} className="w-8 h-8 rounded-lg bg-dark-800 border-2 border-dark-900 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={12} className="text-gray-600" />
                  </div>
                )
              ))}
              {order.items.length > 4 && (
                <div className="w-8 h-8 rounded-lg bg-dark-800 border-2 border-dark-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-gray-400">+{order.items.length - 4}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate flex-1">
              {order.items.map(i => i.product_name).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Expandable detail */}
      {open && (
        <div className="border-t border-dark-700 px-4 md:px-5 pt-4 pb-5 animate-in space-y-4">
          {/* Shipping Address */}
          {(order.shipping_address || order.shipping_ward || order.shipping_district || order.shipping_city) && (
            <div className="bg-dark-800/40 border border-dark-700 rounded-lg p-3.5">
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin size={16} className="text-primary-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-300 mb-1">Địa chỉ giao hàng</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{order.shipping_address}</p>
                  {(order.shipping_ward || order.shipping_district || order.shipping_city) && (
                    <p className="text-gray-500 text-sm mt-1.5">
                      {[order.shipping_ward, order.shipping_district, order.shipping_city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Items */}
          <div className="space-y-3 mb-4">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 group/item">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_name}
                    className="w-14 h-14 object-contain rounded-lg bg-gradient-to-br from-amber-50 to-pink-50 p-1 flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-dark-800 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={20} className="text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product_name}</p>
                  {item.size_label && <p className="text-xs text-gray-500">{item.size_label}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{item.quantity} × {formatVND(item.unit_price)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="font-semibold text-sm">{formatVND(item.subtotal)}</p>
                  {item.product_id && (
                    <Link
                      to={`/product/${item.product_id}`}
                      className="hidden group-hover/item:flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-primary-600/10 text-primary-400 hover:bg-primary-600/20 transition"
                    >
                      <RefreshCw size={10} /> Mua lại
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t border-dark-700 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Tạm tính</span><span>{formatVND(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Giảm giá</span><span>-{formatVND(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span>Phí vận chuyển</span>
              <span>{order.shipping_fee > 0 ? formatVND(order.shipping_fee) : 'Miễn phí'}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-dark-700">
              <span>Tổng cộng</span>
              <span className="text-primary-300">{formatVND(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-dark-800 p-4 md:p-5 bg-dark-900`}>
      <div className={`absolute inset-0 opacity-[0.07] bg-gradient-to-br ${gradient}`} />
      <div className="relative flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          <Icon className="text-white" size={18} />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-lg font-bold mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  )
}


// ── Page ──────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [view, setView] = useState('all') // 'all' or 'completed'

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login?redirect=/my-orders'); return }
    
    // Always fetch all orders first
    ordersAPI.myOrders()
      .then(res => setOrders(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, authLoading, navigate])

  // Filter orders based on view
  const displayedOrders = view === 'all' 
    ? orders 
    : orders.filter(o => o.status === 'delivered')

  // Calculate stats for completed orders
  const completedOrders = orders.filter(o => o.status === 'delivered')
  const totalSpent = completedOrders.reduce((s, o) => s + Number(o.total), 0)
  const totalProducts = completedOrders.reduce((s, o) => s + (o.items?.reduce((ss, i) => ss + i.quantity, 0) || 0), 0)

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Page header */}
      <div className="bg-dark-900 border-b border-dark-800">
        <div className="container mx-auto px-3 xs:px-4 py-4 xs:py-6 md:py-8">
          <nav className="text-[11px] xs:text-xs md:text-sm text-gray-400 mb-2 xs:mb-3">
            <Link to="/" className="hover:text-white transition">Trang chủ</Link>
            <span className="mx-1.5 xs:mx-2">/</span>
            <span>Đơn hàng</span>
          </nav>
          <div className="flex items-center gap-2.5 xs:gap-3">
            <div className="w-9 h-9 xs:w-10 xs:h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-amber-500/10 flex items-center justify-center border border-primary-500/20 flex-shrink-0">
              <History className="text-primary-400 w-5 h-5 xs:w-[22px] xs:h-[22px]" />
            </div>
            <div>
              <h1 className="text-xl xs:text-2xl md:text-3xl font-serif font-bold">Đơn hàng</h1>
              {!loading && !error && (
                <p className="text-gray-400 text-xs xs:text-sm mt-0.5">{orders.length} đơn hàng</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 xs:px-4 py-5 xs:py-8 md:py-12 max-w-3xl">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary-400" size={40} />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-300">
            <XCircle size={20} /> {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-20">
            <Package className="mx-auto text-gray-600 mb-4" size={64} />
            <p className="text-gray-400 text-lg mb-6">Bạn chưa có đơn hàng nào</p>
            <Link to="/catalog" className="btn-primary inline-flex">Mua sắm ngay</Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <>
            {/* View tabs */}
            <div className="flex gap-1 xs:gap-2 mb-4 xs:mb-6 border-b border-dark-800 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setView('all')}
                className={`px-3 xs:px-4 py-2.5 xs:py-3 text-xs xs:text-sm font-medium transition border-b-2 whitespace-nowrap ${
                  view === 'all'
                    ? 'text-primary-300 border-primary-500'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-1.5 xs:gap-2">
                  <Package size={14} className="xs:w-4 xs:h-4" />
                  Tất cả ({orders.length})
                </span>
              </button>
              <button
                onClick={() => setView('completed')}
                className={`px-3 xs:px-4 py-2.5 xs:py-3 text-xs xs:text-sm font-medium transition border-b-2 whitespace-nowrap ${
                  view === 'completed'
                    ? 'text-primary-300 border-primary-500'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-1.5 xs:gap-2">
                  <CheckCircle size={14} className="xs:w-4 xs:h-4" />
                  Hoàn thành ({completedOrders.length})
                </span>
              </button>
            </div>

            {/* Stats for completed view */}
            {view === 'completed' && completedOrders.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
                <StatCard
                  icon={Receipt}
                  label="Đơn hoàn thành"
                  value={completedOrders.length}
                  gradient="from-blue-500 to-cyan-500"
                />
                <StatCard
                  icon={ShoppingBag}
                  label="Sản phẩm"
                  value={totalProducts}
                  gradient="from-violet-500 to-purple-500"
                />
                <div className="col-span-2 md:col-span-1">
                  <StatCard
                    icon={Star}
                    label="Tổng chi tiêu"
                    value={formatVND(totalSpent)}
                    gradient="from-primary-500 to-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Orders list */}
            {displayedOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto text-gray-600 mb-3" size={48} />
                <p className="text-gray-400">
                  {view === 'completed' ? 'Không có đơn hàng hoàn thành' : 'Không có đơn hàng nào'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedOrders.map(order => 
                  view === 'completed' 
                    ? <HistoryCard key={order.id} order={order} />
                    : <OrderCard key={order.id} order={order} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
