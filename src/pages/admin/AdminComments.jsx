import { useEffect, useState } from 'react'
import { Trash2, Loader2, Search, CheckCircle, XCircle, MessageCircle } from 'lucide-react'
import { commentsAPI } from '../../utils/api'

export default function AdminComments() {
  const [comments, setComments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = () => {
    setLoading(true)
    commentsAPI.getAll()
      .then(res => setComments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id, current) => {
    setTogglingId(id)
    try {
      await commentsAPI.toggle(id, !current)
      setComments(prev => prev.map(c => c.id === id ? { ...c, is_approved: current ? 0 : 1 } : c))
    } catch (err) {
      alert(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bình luận này?')) return
    setDeletingId(id)
    try { await commentsAPI.delete(id); setComments(prev => prev.filter(c => c.id !== id)) }
    catch (err) { alert(err.message) }
    finally { setDeletingId(null) }
  }

  const filtered = comments.filter(c =>
    c.content?.toLowerCase().includes(search.toLowerCase()) ||
    (c.user_name || c.guest_name || '').toLowerCase().includes(search.toLowerCase()) ||
    c.post_title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle size={24} className="text-primary-400" /> Bình luận
        </h1>
        <p className="text-gray-400 text-sm mt-1">{comments.length} bình luận</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          placeholder="Tìm kiếm bình luận, tên, bài viết..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800 bg-dark-800/40">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Người dùng</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Nội dung</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Bài viết</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Ngày</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-dark-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.user_name || c.guest_name || 'Khách'}</p>
                      {c.guest_email && <p className="text-xs text-gray-500">{c.guest_email}</p>}
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <p className="text-gray-300 truncate">{c.content}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[150px]">
                      <span className="truncate block">{c.post_title || `#${c.post_id}`}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(c.id, c.is_approved)}
                        disabled={togglingId === c.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border transition disabled:opacity-50 ${
                          c.is_approved
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                        }`}
                      >
                        {togglingId === c.id
                          ? <Loader2 size={11} className="animate-spin" />
                          : c.is_approved ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        {c.is_approved ? 'Hiển thị' : 'Ẩn'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(c.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition disabled:opacity-50"
                        title="Xóa"
                      >
                        {deletingId === c.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Không có bình luận nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
