import { useEffect, useState } from 'react'
import {
  Package, ShoppingBag, MessageSquare, TrendingUp,
  Clock, CheckCircle, Truck, XCircle,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { dashboardAPI } from '../../utils/api'
import { formatVND } from '../../utils/currency'

// --- Static demo chart data ---
const revenueData = [
  { month: 'T1', revenue: 12400000 },
  { month: 'T2', revenue: 18700000 },
  { month: 'T3', revenue: 15200000 },
  { month: 'T4', revenue: 22800000 },
  { month: 'T5', revenue: 19500000 },
  { month: 'T6', revenue: 28300000 },
  { month: 'T7', revenue: 24100000 },
  { month: 'T8', revenue: 31600000 },
  { month: 'T9', revenue: 27900000 },
  { month: 'T10', revenue: 35200000 },
  { month: 'T11', revenue: 42800000 },
  { month: 'T12', revenue: 38100000 },
]

const ORDER_STATUS_COLORS = {
  pending:    '#f59e0b',
  confirmed:  '#3b82f6',
  shipping:   '#8b5cf6',
  delivered:  '#10b981',
  cancelled:  '#ef4444',
}
const ORDER_STATUS_LABELS = {
  pending:   'Chờ duyệt',
  confirmed: 'Đã duyệt',
  shipping:  'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
}
const STATUS_ICON = {
  pending:   <Clock size={12} />,
  confirmed: <CheckCircle size={12} />,
  shipping:  <Truck size={12} />,
  delivered: <CheckCircle size={12} />,
  cancelled: <XCircle size={12} />,
}

// ---  helpers ---
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-primary-400">{formatVND(payload[0].value)}</p>
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, sub, trend, colorCls }) => (
  <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-dark-700 transition-colors">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-xl border ${colorCls}`}>
        <Icon size={20} />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold mb-1">{value}</p>
    <p className="text-sm font-medium text-gray-400">{label}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </div>
)

const statusBadge = (status) => {
  const colorMap = {
    pending:   'bg-amber-500/10   text-amber-400',
    confirmed: 'bg-blue-500/10    text-blue-400',
    shipping:  'bg-violet-500/10  text-violet-400',
    delivered: 'bg-emerald-500/10 text-emerald-400',
    cancelled: 'bg-red-500/10     text-red-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[status] ?? 'bg-gray-700 text-gray-300'}`}>
      {STATUS_ICON[status]}
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  )
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    dashboardAPI.getStats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
      Lỗi tải dữ liệu: {error}
    </div>
  )

  const orderPieData = [
    { name: 'Chờ duyệt', value: stats?.pendingOrders ?? 0,   color: ORDER_STATUS_COLORS.pending },
    { name: 'Đã giao',   value: Math.max(0, (stats?.totalOrders ?? 0) - (stats?.pendingOrders ?? 0)), color: ORDER_STATUS_COLORS.delivered },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Chào mừng trở lại — đây là tình trạng cửa hàng hôm nay.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Package}     label="Sản phẩm"  value={stats?.totalProducts ?? 0}          sub="Đang bán"                                    trend={5}  colorCls="bg-primary-600/10 text-primary-400 border-primary-600/20" />
        <StatCard icon={ShoppingBag} label="Đơn hàng"  value={stats?.totalOrders ?? 0}             sub={`${stats?.pendingOrders ?? 0} chờ xử lý`}   trend={12} colorCls="bg-blue-600/10   text-blue-400   border-blue-600/20"    />
        <StatCard icon={TrendingUp}  label="Doanh thu" value={formatVND(stats?.totalRevenue ?? 0)} sub="Tổng tất cả đơn"                             trend={8}  colorCls="bg-emerald-600/10 text-emerald-400 border-emerald-600/20" />
        <StatCard icon={MessageSquare} label="Tin nhắn" value={stats?.totalContacts ?? 0}          sub="Từ khách hàng"                                          colorCls="bg-amber-600/10  text-amber-400  border-amber-600/20"    />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Revenue area chart */}
        <div className="xl:col-span-2 bg-dark-900 border border-dark-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold">Doanh thu theo tháng</h2>
              <p className="text-xs text-gray-500 mt-0.5">Năm 2024 (dữ liệu demo)</p>
            </div>
            <span className="text-xs bg-primary-600/10 text-primary-400 border border-primary-600/20 px-3 py-1 rounded-full font-medium">VND</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#d4af37" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#d4af37' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order status pie */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-1">Trạng thái đơn hàng</h2>
          <p className="text-xs text-gray-500 mb-4">Tổng {stats?.totalOrders ?? 0} đơn</p>
          {orderPieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-600 text-sm">Chưa có đơn hàng</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={orderPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {orderPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, fontSize: 12 }} itemStyle={{ color: '#e5e7eb' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent orders table */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-800">
          <h2 className="font-semibold">Đơn hàng gần đây</h2>
          <a href="/admin/orders" className="text-xs text-primary-400 hover:underline">Xem tất cả →</a>
        </div>
        {!stats?.recentOrders?.length ? (
          <div className="py-12 text-center text-gray-600 text-sm">Chưa có đơn hàng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800 bg-dark-800/40">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Mã đơn</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Khách hàng</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Ngày đặt</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Tổng tiền</th>
                  <th className="text-center px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order, i) => (
                  <tr key={order.id} className={`border-b border-dark-800/60 hover:bg-dark-800/30 transition-colors ${i === stats.recentOrders.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-3.5 font-mono text-primary-400 font-medium">#{order.id}</td>
                    <td className="px-5 py-3.5 text-gray-300">{order.customer_name ?? order.shipping_name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : '—'}</td>
                    <td className="px-5 py-3.5 text-right font-semibold">{formatVND(order.total_amount ?? order.total ?? 0)}</td>
                    <td className="px-5 py-3.5 text-center">{statusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
