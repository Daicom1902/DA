import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  History, ChevronDown, ChevronUp, Truck, QrCode, Landmark,
  CheckCircle, Loader2, ShoppingBag, Calendar, CreditCard,
  Receipt, Star, RefreshCw, Package
} from 'lucide-react'
import { ordersAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { formatVND } from '../utils/currency'

// ── Status / Payment maps ─────────────────────────────────────────────────
const PAYMENT_METHOD = {
  cod:      { label: 'COD',             Icon: Truck    },
  atm_card: { label: 'Thẻ ATM (MoMo)',   Icon: Landmark },
  vietqr:   { label: 'VietQR',          Icon: QrCode   },
}

// ── History item card ─────────────────────────────────────────────────────
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
        <div className="border-t border-dark-700 px-4 md:px-5 pt-4 pb-5 animate-in">
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
export default function PurchaseHistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login?redirect=/purchase-history'); return }
    ordersAPI.purchaseHistory()
      .then(res => setOrders(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, authLoading, navigate])

  const totalSpent = orders.reduce((s, o) => s + Number(o.total), 0)
  const totalProducts = orders.reduce((s, o) => s + (o.items?.reduce((ss, i) => ss + i.quantity, 0) || 0), 0)

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Page header */}
      <div className="bg-dark-900 border-b border-dark-800">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <nav className="text-xs md:text-sm text-gray-400 mb-3">
            <Link to="/" className="hover:text-white transition">Trang chủ</Link>
            <span className="mx-2">/</span>
            <span>Lịch sử mua hàng</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-amber-500/10 flex items-center justify-center border border-primary-500/20">
              <History className="text-primary-400" size={22} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold">Lịch sử mua hàng</h1>
              {!loading && !error && (
                <p className="text-gray-400 text-sm mt-0.5">Các đơn hàng đã giao thành công</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary-400" size={40} />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-300">
            <Star size={20} /> {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-center mx-auto mb-5">
              <History className="text-gray-600" size={40} />
            </div>
            <p className="text-gray-400 text-lg mb-2">Chưa có lịch sử mua hàng</p>
            <p className="text-gray-500 text-sm mb-6">Khi đơn hàng được giao thành công, chúng sẽ xuất hiện ở đây</p>
            <Link to="/catalog" className="btn-primary inline-flex items-center gap-2">
              <ShoppingBag size={16} /> Mua sắm ngay
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <>
            {/* Stats overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
              <StatCard
                icon={Receipt}
                label="Đơn hoàn thành"
                value={orders.length}
                gradient="from-blue-500 to-cyan-500"
              />
              <StatCard
                icon={ShoppingBag}
                label="Sản phẩm đã mua"
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

            {/* Order list */}
            <div className="space-y-4">
              {orders.map(order => <HistoryCard key={order.id} order={order} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
