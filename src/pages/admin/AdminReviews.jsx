import { useEffect, useState } from 'react'
import { Star, Trash2, Check, X, Loader2, Search } from 'lucide-react'
import { reviewsAPI } from '../../utils/api'

export default function AdminReviews() {
  const [reviews, setReviews]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = () => {
    setLoading(true)
    reviewsAPI.adminGetAll()
      .then(res => setReviews(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (review) => {
    setTogglingId(review.id)
    try {
      await reviewsAPI.toggle(review.id, !review.is_approved)
      setReviews(r => r.map(x => x.id === review.id ? { ...x, is_approved: x.is_approved ? 0 : 1 } : x))
    } catch (err) {
      alert(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đánh giá này?')) return
    setDeletingId(id)
    try {
      await reviewsAPI.delete(id)
      setReviews(r => r.filter(x => x.id !== id))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = reviews.filter(r =>
    r.author_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.comment?.toLowerCase().includes(search.toLowerCase())
  )

  const approved   = reviews.filter(r => r.is_approved).length
  const pending    = reviews.filter(r => !r.is_approved).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Đánh giá sản phẩm</h1>
          <p className="text-gray-400 text-sm mt-1">
            {reviews.length} đánh giá &nbsp;·&nbsp;
            <span className="text-green-400">{approved} đã duyệt</span>
            &nbsp;·&nbsp;
            <span className="text-amber-400">{pending} chờ duyệt</span>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          placeholder="Tìm theo tên, sản phẩm, nội dung..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Tác giả</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Sản phẩm</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Rating</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Nội dung</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Ngày</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-dark-700/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.author_name}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-[160px] truncate">{r.product_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[220px]">
                      <p className="truncate">{r.comment || <span className="italic text-gray-600">Không có nhận xét</span>}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : ''}
                    </td>
                    <td className="px-4 py-3">
                      {r.is_approved
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400">Đã duyệt</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">Chờ duyệt</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(r)}
                          disabled={togglingId === r.id}
                          title={r.is_approved ? 'Ẩn đánh giá' : 'Duyệt đánh giá'}
                          className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
                            r.is_approved
                              ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/40'
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/40'
                          }`}
                        >
                          {togglingId === r.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : r.is_approved ? <X size={14} /> : <Check size={14} />
                          }
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition disabled:opacity-50"
                          title="Xóa đánh giá"
                        >
                          {deletingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Không có đánh giá nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
