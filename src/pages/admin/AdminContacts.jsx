import { useEffect, useState } from 'react'
import { Eye, Trash2, X, Search, Loader2, Mail } from 'lucide-react'
import { contactAPI } from '../../utils/api'

export default function AdminContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = () => {
    setLoading(true)
    contactAPI.getAll()
      .then(res => setContacts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa tin nhắn liên hệ này?')) return
    setDeletingId(id)
    try {
      await contactAPI.delete(id)
      if (detail?.id === id) setDetail(null)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.subject?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tin nhắn liên hệ</h1>
          <p className="text-gray-400 text-sm mt-1">{contacts.length} tin nhắn</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          placeholder="Tìm theo tên, email, chủ đề..."
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
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Người gửi</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Chủ đề</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">SĐT</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Thời gian</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-dark-700/40 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono">#{c.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.name || '—'}</div>
                      <div className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                        <Mail size={11} />
                        {c.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[250px]">
                      <p className="truncate font-medium">{c.subject || '—'}</p>
                      <p className="text-gray-500 text-xs truncate mt-0.5">{c.message}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(c.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetail(c)}
                          className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition disabled:opacity-50"
                          title="Xóa"
                        >
                          {deletingId === c.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      Không có tin nhắn nào
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
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
              <h2 className="font-bold text-lg">Chi tiết liên hệ #{detail.id}</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Họ tên</p>
                  <p className="font-medium">{detail.name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Email</p>
                  <a href={`mailto:${detail.email}`} className="text-primary-400 hover:underline">
                    {detail.email}
                  </a>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Số điện thoại</p>
                  <p className="font-medium">{detail.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Thời gian</p>
                  <p className="text-gray-300">{new Date(detail.created_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Chủ đề</p>
                <p className="font-semibold text-base">{detail.subject || '—'}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Nội dung</p>
                <div className="bg-dark-700/60 rounded-lg px-4 py-3 text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {detail.message || '—'}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href={`mailto:${detail.email}?subject=Re: ${detail.subject}&body=Xin chào ${detail.name},%0A%0A`}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium text-center transition"
                >
                  Trả lời qua Email
                </a>
                <button
                  onClick={() => { handleDelete(detail.id); setDetail(null) }}
                  className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
