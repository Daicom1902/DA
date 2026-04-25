import { useEffect, useState } from 'react'
import { Eye, Trash2, X, ChevronDown, Loader2, Search, CheckCircle, Clock, Download, Printer } from 'lucide-react'
import { ordersAPI } from '../../utils/api'
import { formatVND } from '../../utils/currency'

const STATUSES = [
  { value: 'pending',   label: 'Chờ duyệt',  cls: 'bg-amber-500/20   text-amber-400   border-amber-500/30'  },
  { value: 'processing', label: 'Đang xử lý', cls: 'bg-blue-500/20    text-blue-400    border-blue-500/30'   },
  { value: 'shipped',  label: 'Đã gửi',  cls: 'bg-violet-500/20  text-violet-400  border-violet-500/30' },
  { value: 'delivered', label: 'Đã giao',    cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'},
  { value: 'cancelled', label: 'Đã huỷ',    cls: 'bg-red-500/20     text-red-400     border-red-500/30'    },
]

const PAY_METHODS = { cod: 'COD', atm_card: 'Thẻ ATM (VNPay)', vietqr: 'VietQR' }

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

  const handleExportInvoice = (order) => {
    if (!order) return
    
    // Helper function to format currency in HTML
    const fmtVND = (val) => {
      if (!val) return '0 ₫'
      return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0 
      }).format(val)
    }
    
    // Build HTML invoice
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Hóa đơn #${order.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .info-block h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; letter-spacing: 1px; }
          .info-block p { margin: 4px 0; font-size: 14px; }
          
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; font-size: 12px; border-bottom: 2px solid #333; }
          td { padding: 12px; border-bottom: 1px solid #ddd; font-size: 14px; }
          tr:last-child td { border-bottom: 2px solid #333; }
          
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 30px; }
          .summary-item { text-align: right; }
          .summary-item .label { font-size: 12px; color: #666; text-transform: uppercase; }
          .summary-item .value { font-size: 18px; font-weight: bold; margin-top: 5px; }
          .summary-item.total .value { color: #e74c3c; font-size: 24px; }
          
          .note { background: #f9f9f9; padding: 15px; border-left: 4px solid #333; margin-top: 30px; font-size: 13px; }
          .note-label { font-weight: bold; margin-bottom: 5px; }
          
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          
          @media print { body { background: none; } .container { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HÓA ĐƠN THANH TOÁN</h1>
            <p>Mã đơn: #${order.id}</p>
          </div>
          
          <div class="info-section">
            <div class="info-block">
              <h3>Thông tin khách hàng</h3>
              <p><strong>${order.customer_name}</strong></p>
              <p>Email: ${order.customer_email}</p>
              <p>SĐT: ${order.customer_phone || '—'}</p>
            </div>
            <div class="info-block">
              <h3>Thông tin giao hàng</h3>
              <p>${order.shipping_address}</p>
              <p>${order.shipping_ward || ''} ${order.shipping_district || ''}</p>
              <p>${order.shipping_city}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th style="text-align: center;">Dung tích</th>
                <th style="text-align: right;">Đơn giá</th>
                <th style="text-align: center;">Số lượng</th>
                <th style="text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${order.items?.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td style="text-align: center;">${item.size_label || '—'}</td>
                  <td style="text-align: right;">${fmtVND(item.unit_price)}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${fmtVND(item.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-item">
              <div class="label">Tạm tính</div>
              <div class="value">${fmtVND(order.subtotal)}</div>
            </div>
            <div class="summary-item">
              <div class="label">Giảm giá</div>
              <div class="value">-${fmtVND(order.discount_amount)}</div>
            </div>
            <div class="summary-item">
              <div class="label">Vận chuyển</div>
              <div class="value">${fmtVND(order.shipping_fee)}</div>
            </div>
            <div class="summary-item total">
              <div class="label">Tổng cộng</div>
              <div class="value">${fmtVND(order.total)}</div>
            </div>
          </div>
          
          ${order.note ? `
            <div class="note">
              <div class="note-label">Ghi chú:</div>
              <div>${order.note}</div>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Cảm ơn bạn đã mua hàng!</p>
            <p>In ngày ${new Date().toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
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
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 sticky top-0 bg-dark-900">
              <h2 className="font-bold text-lg">Chi tiết đơn #{detail.id}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportInvoice(detail)}
                  className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition"
                  title="Xuất hóa đơn"
                >
                  <Printer size={18} />
                </button>
                <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
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
                  <Info label="SĐT" value={detail.customer_phone || '—'} />
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
                    <span className="text-primary-400 font-bold">{formatVND(detail.total ?? 0)}</span>
                  </Info>
                  <Info label="Ngày tạo" value={new Date(detail.created_at).toLocaleString('vi-VN')} />
                </div>

                {/* Shipping Address */}
                <div className="bg-dark-700/40 border border-dark-700 rounded-lg p-4">
                  <p className="text-gray-400 font-medium mb-2">Địa chỉ giao hàng</p>
                  <div className="space-y-1 text-gray-300">
                    <p>{detail.shipping_address}</p>
                    {detail.shipping_ward && <p>{detail.shipping_ward}</p>}
                    {detail.shipping_district && <p>{detail.shipping_district}</p>}
                    <p className="font-medium">{detail.shipping_city}</p>
                  </div>
                </div>

                {detail.items?.length > 0 && (
                  <div>
                    <p className="text-gray-400 font-medium mb-2">Sản phẩm trong đơn</p>
                    <div className="space-y-2">
                      {detail.items.map((it, idx) => (
                        <div key={idx} className="flex items-start justify-between bg-dark-700/60 px-4 py-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{it.product_name}</p>
                            <p className="text-gray-400 text-xs">
                              {it.size_label && <span>Dung tích: <span className="text-gray-300">{it.size_label}</span></span>}
                              {it.quantity && <span className="ml-3">SL: <span className="text-gray-300">{it.quantity}</span></span>}
                            </p>
                          </div>
                          <p className="text-primary-400 font-semibold ml-4">{formatVND(it.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-dark-800/40 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Tạm tính:</span>
                    <span className="text-white">{formatVND(detail.subtotal)}</span>
                  </div>
                  {detail.discount_amount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Giảm giá:</span>
                      <span>-{formatVND(detail.discount_amount)}</span>
                    </div>
                  )}
                  {detail.shipping_fee > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Vận chuyển:</span>
                      <span className="text-white">{formatVND(detail.shipping_fee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-dark-700">
                    <span>Tổng cộng:</span>
                    <span className="text-primary-400">{formatVND(detail.total ?? 0)}</span>
                  </div>
                </div>

                {detail.note && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-amber-400 text-xs font-medium mb-1">Ghi chú:</p>
                    <p className="text-amber-100 text-sm">{detail.note}</p>
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
