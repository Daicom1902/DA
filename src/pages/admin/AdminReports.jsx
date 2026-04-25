import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, ShoppingBag, Users, DollarSign,
  Download, Calendar, ArrowUpRight, Package, AlertCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'
import { reportsAPI } from '../../utils/api'
import { formatVND } from '../../utils/currency'
import { useAuth } from '../../context/AuthContext'

const RANGES = [
  { key: '7d',  label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: '90d', label: '90 ngày' },
  { key: '12m', label: '12 tháng' },
  { key: 'all', label: 'Tất cả' },
]

const STATUS_COLORS = {
  pending:   '#f59e0b',
  confirmed: '#3b82f6',
  shipping:  '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
}
const STATUS_LABELS = {
  pending:   'Chờ duyệt',
  confirmed: 'Đã duyệt',
  shipping:  'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
}

const BRAND_COLORS = ['#d4af37', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316']

/* ── Tooltip helpers ────────────────────────────────────────── */
const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-primary-400">{formatVND(payload[0].value)}</p>
      {payload[1] && <p className="text-xs text-gray-500">{payload[1].value} đơn</p>}
    </div>
  )
}

const BrandTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{payload[0].payload.brand}</p>
      <p className="font-semibold text-primary-400">{formatVND(payload[0].value)}</p>
    </div>
  )
}

/* ── StatCard ───────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, colorCls }) => (
  <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-dark-700 transition-colors group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-xl border ${colorCls} transition-transform group-hover:scale-110`}>
        <Icon size={20} />
      </div>
    </div>
    <p className="text-2xl font-bold mb-1">{value}</p>
    <p className="text-sm font-medium text-gray-400">{label}</p>
  </div>
)

/* ── CSV Export ──────────────────────────────────────────────── */
function exportCSV(revenueData) {
  if (!revenueData?.length) return
  const header = 'Thời gian,Doanh thu,Số đơn\n'
  const rows = revenueData.map(r => `${r.label},${r.revenue},${r.orderCount}`).join('\n')
  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bao-cao-doanh-thu-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ════════════════════════════════════════════════════════════ */
export default function AdminReports() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  // Only admin and manager can access this page
  if (!authLoading && user && !['admin', 'manager'].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle size={48} className="text-red-400" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-400 mb-4">Chỉ quản trị viên và quản lý mới có thể xem báo cáo.</p>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  const [range, setRange]     = useState('30d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await reportsAPI.getStats(range, startDate || null, endDate || null)
      setData(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [range, startDate, endDate])

  useEffect(() => { fetch() }, [fetch])

  /* ── Loading / Error states ──────────────────────── */
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

  const { kpi, revenueByPeriod, ordersByStatus, topProducts, revenueByBrand } = data

  const pieData = ordersByStatus.map(s => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? '#6b7280',
  }))

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Báo cáo thống kê</h1>
          <p className="text-sm text-gray-500 mt-0.5">Phân tích dữ liệu kinh doanh theo thời gian thực.</p>
        </div>
        <button
          onClick={() => exportCSV(revenueByPeriod)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Download size={16} /> Xuất CSV
        </button>
      </div>

      {/* ── Time range tabs ──────────────────── */}
      <div className="flex gap-1 p-1 bg-dark-900 border border-dark-800 rounded-xl w-fit">
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => {
              setRange(r.key)
              setStartDate('')
              setEndDate('')
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              range === r.key && !startDate && !endDate
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                : 'text-gray-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            <Calendar size={13} />
            {r.label}
          </button>
        ))}
      </div>

      {/* ── Custom date range ──────────────── */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-400 mb-2">Từ ngày</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setRange(null)
            }}
            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-400 mb-2">Đến ngày</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            disabled={!startDate}
            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={() => {
            setStartDate('')
            setEndDate('')
            setRange('30d')
          }}
          className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          Xóa bộ lọc
        </button>
      </div>

      {/* ── KPI cards ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}  label="Tổng doanh thu"    value={formatVND(kpi.totalRevenue)}     colorCls="bg-emerald-600/10 text-emerald-400 border-emerald-600/20" />
        <StatCard icon={ShoppingBag} label="Tổng đơn hàng"    value={kpi.totalOrders}                  colorCls="bg-blue-600/10 text-blue-400 border-blue-600/20" />
        <StatCard icon={TrendingUp}  label="Giá trị TB/đơn"   value={formatVND(kpi.avgOrderValue)}     colorCls="bg-primary-600/10 text-primary-400 border-primary-600/20" />
        <StatCard icon={Users}       label="Khách hàng mới"   value={kpi.newCustomers}                 colorCls="bg-violet-600/10 text-violet-400 border-violet-600/20" />
      </div>

      {/* ── Revenue chart + Pie chart ────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Revenue bar chart */}
        <div className="xl:col-span-2 bg-dark-900 border border-dark-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold">Doanh thu theo thời gian</h2>
              <p className="text-xs text-gray-500 mt-0.5">{revenueByPeriod.length} khoảng thời gian</p>
            </div>
            <span className="text-xs bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 px-3 py-1 rounded-full font-medium">VND</span>
          </div>
          {revenueByPeriod.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-600 text-sm">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueByPeriod} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip content={<RevenueTooltip />} />
                <Bar dataKey="revenue" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order status pie */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-1">Trạng thái đơn hàng</h2>
          <p className="text-xs text-gray-500 mb-4">Tổng {kpi.totalOrders} đơn</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-600 text-sm">Chưa có đơn hàng</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, fontSize: 12 }} itemStyle={{ color: '#e5e7eb' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Top products + Revenue by brand ───── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Top products table */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-800">
            <h2 className="font-semibold">Top sản phẩm bán chạy</h2>
            <span className="text-xs text-gray-500">Top 10</span>
          </div>
          {!topProducts?.length ? (
            <div className="py-12 text-center text-gray-600 text-sm">Chưa có dữ liệu</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-800 bg-dark-800/40">
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">#</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Sản phẩm</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">SL bán</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i} className="border-b border-dark-800/60 hover:bg-dark-800/30 transition-colors">
                      <td className="px-5 py-3 text-primary-400 font-bold">{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.image && (
                            <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-dark-700" />
                          )}
                          <span className="text-gray-200 font-medium truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400">{p.totalQty}</td>
                      <td className="px-5 py-3 text-right font-semibold text-emerald-400">{formatVND(p.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Revenue by brand */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold">Doanh thu theo thương hiệu</h2>
              <p className="text-xs text-gray-500 mt-0.5">Top 10 thương hiệu</p>
            </div>
            <Package size={18} className="text-gray-600" />
          </div>
          {!revenueByBrand?.length ? (
            <div className="flex items-center justify-center h-52 text-gray-600 text-sm">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, revenueByBrand.length * 42)}>
              <BarChart data={revenueByBrand} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                <YAxis type="category" dataKey="brand" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<BrandTooltip />} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {revenueByBrand.map((_, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
