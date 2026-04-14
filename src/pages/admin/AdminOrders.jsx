import { useEffect, useState } from 'react'
import { Eye, Trash2, X, ChevronDown, Loader2, Search, CheckCircle, Clock } from 'lucide-react'
import { ordersAPI } from '../../utils/api'
import { formatVND } from '../../utils/currency'

const STATUSES = [
  { value: 'pending',   label: 'Chờ duyệt',  cls: 'bg-amber-500/20   text-amber-400   border-amber-500/30'  },
  { value: 'confirmed', label: 'Đã duyệt',   cls: 'bg-blue-500/20    text-blue-400    border-blue-500/30'   },
  { value: 'shipping',  label: 'Đang giao',  cls: 'bg-violet-500/20  text-violet-400  border-violet-500/30' },
  { value: 'delivered', label: 'Đã giao',    cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'},
  { value: 'cancelled', label: 'Đã huỷ',    cls: 'bg-red-500/20     text-red-400     border-red-500/30'    },
]

const PAY_METHODS = { cod: 'COD', atm_card: 'Thẻ ATM (MoMo)', vietqr: 'VietQR' }

const getStatus = (val) => STATUSES.find(s => s.value === val) || STATUSES[0]

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [updatingId, setUpdatingId]             = useState(null)
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null)

  const load = () => {
    setLoading(true)
    ordersAPI.getAll()
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openDetail = async (id) => {
    setDetailLoading(true)
    setDetail({ id })
    try {
      const res = await ordersAPI.getById(id)
      setDetail(res.data)
    } catch (err) {
      alert(err.message)
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id)
    try {
      await ordersAPI.updateStatus(id, status)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
      if (detail?.id === id) setDetail(d => ({ ...d, status }))
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePaymentStatusToggle = async (id, current) => {
    const next = current === 'paid' ? 'unpaid' : 'paid'
    setUpdatingPaymentId(id)
    try {
      await ordersAPI.updateStatus(id, undefined, next)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, payment_status: next } : o))
      if (detail?.id === id) setDetail(d => ({ ...d, payment_status: next }))
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdatingPaymentId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đơn hàng này?')) return
    setDeletingId(id)
    try {
      await ordersAPI.delete(id)
      if (detail?.id === id) setDetail(null)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = orders.filter(o => {
    const matchSearch =
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search)
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng</h1>
          <p className="text-gray-400 text-sm mt-1">{orders.length} đơn hàng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            placeholder="Tìm theo tên, email, mã đơn..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500"
        >
          <option value="all">Tất cả trạng thái</option>
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800 bg-dark-800/40">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Khách hàng</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">SĐT</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Tổng tiền</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Thanh toán</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Ngày tạo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filtered.map(order => {
                  const st = getStatus(order.status)
                  return (
                    <tr key={order.id} className="hover:bg-dark-700/40 transition-colors">
                      <td className="px-4 py-3 text-gray-300 font-mono">#{order.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{order.customer_name || '—'}</div>
                        <div className="text-gray-500 text-xs">{order.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{order.customer_phone || '—'}</td>
                      <td className="px-4 py-3 text-primary-400 font-semibold">{formatVND(order.total_amount ?? order.total ?? 0)}</td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            disabled={updatingId === order.id}
                            className={`appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none disabled:opacity-50 ${st.cls}`}
                          >
                            {STATUSES.map(s => (
                              <option key={s.value} value={s.value} className="bg-dark-900 text-white font-normal">
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handlePaymentStatusToggle(order.id, order.payment_status)}
                          disabled={updatingPaymentId === order.id}
                          title={`Phương thức: ${PAY_METHODS[order.payment_method] || order.payment_method}`}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold border transition disabled:opacity-50 ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:border-primary-500'
                          }`}
                        >
                          {updatingPaymentId === order.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : order.payment_status === 'paid'
                              ? <CheckCircle size={11} />
                              : <Clock size={11} />}
                          {order.payment_status === 'paid' ? 'Đã TT' : 'Chưa TT'}
                        </button>
                        <p className="text-[10px] text-gray-600 mt-0.5">{PAY_METHODS[order.payment_method] || order.payment_method}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(order.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetail(order.id)}
                            className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            disabled={deletingId === order.id}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition disabled:opacity-50"
                            title="Xóa"
                          >
                            {deletingId === order.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Không có đơn hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
              <h2 className="font-bold text-lg">Chi tiết đơn #{detail.id}</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            {detailLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={28} className="animate-spin text-primary-500" />
              </div>
            ) : (
              <div className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <Info label="Khách hàng" value={detail.customer_name} />
                  <Info label="Email" value={detail.customer_email} />
                  <Info label="SĐT" value={detail.customer_phone} />
                  <Info label="Trạng thái">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatus(detail.status).cls}`}>
                      {getStatus(detail.status).label}
                    </span>
                  </Info>
                  <Info label="Thanh toán">
                    <div className="space-y-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        detail.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>{detail.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
                      <p className="text-xs text-gray-500">{PAY_METHODS[detail.payment_method] || detail.payment_method}</p>
                    </div>
                  </Info>
                  <Info label="Tổng tiền">
                    <span className="text-primary-400 font-bold">{formatVND(detail.total_amount ?? detail.total ?? 0)}</span>
                  </Info>
                  <Info label="Ngày tạo" value={new Date(detail.created_at).toLocaleString('vi-VN')} />
                </div>

                {detail.items?.length > 0 && (
                  <div>
                    <p className="text-gray-400 font-medium mb-2">Sản phẩm trong đơn</p>
                    <div className="space-y-2">
                      {detail.items.map(it => (
                        <div key={it.id} className="flex items-center justify-between bg-dark-700/60 px-4 py-3 rounded-lg">
                          <div>
                            <p className="font-medium">{it.product_name}</p>
                            <p className="text-gray-400 text-xs">SL: {it.quantity}</p>
                          </div>
                          <p className="text-primary-400 font-semibold">{formatVND(it.price * it.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, value, children }) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      {children || <p className="text-white">{value || '—'}</p>}
    </div>
  )
}
