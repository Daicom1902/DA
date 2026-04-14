import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, Search, Eye, Globe, FileText } from 'lucide-react'
import { postsAPI } from '../../utils/api'

const EMPTY_FORM = { title: '', excerpt: '', content: '', cover_image: '', status: 'draft' }

export default function AdminPosts() {
  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError]       = useState('')

  const load = () => {
    setLoading(true)
    postsAPI.adminGetAll()
      .then(res => setPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModal(true)
  }

  const openEdit = async (p) => {
    setEditing(p)
    setError('')
    // Fetch full content
    try {
      const res = await postsAPI.adminGetById(p.id)
      setForm({
        title:       res.data.title       || '',
        excerpt:     res.data.excerpt     || '',
        content:     res.data.content     || '',
        cover_image: res.data.cover_image || '',
        status:      res.data.status      || 'draft',
      })
    } catch {
      setForm({
        title: p.title, excerpt: p.excerpt || '', content: '', cover_image: p.cover_image || '', status: p.status
      })
    }
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.content) { setError('Tiêu đề và nội dung là bắt buộc'); return }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await postsAPI.update(editing.id, form)
      } else {
        await postsAPI.create(form)
      }
      setModal(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bài viết này?')) return
    setDeletingId(id)
    try { await postsAPI.delete(id); load() }
    catch (err) { alert(err.message) }
    finally { setDeletingId(null) }
  }

  const filtered = posts.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.author_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bài viết</h1>
          <p className="text-gray-400 text-sm mt-1">{posts.length} bài viết</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={18} /> Viết bài mới
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          placeholder="Tìm kiếm bài viết..."
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
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Tiêu đề</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Tác giả</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Lượt xem</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Bình luận</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Ngày tạo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-dark-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.cover_image ? (
                          <img src={p.cover_image} alt={p.title} className="w-10 h-10 object-cover rounded-lg" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-gray-600">✦</div>
                        )}
                        <span className="font-medium max-w-[220px] truncate">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{p.author_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${
                        p.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {p.status === 'published' ? <Globe size={10} /> : <FileText size={10} />}
                        {p.status === 'published' ? 'Đã đăng' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400"><Eye size={13} className="inline mr-1" />{p.views || 0}</td>
                    <td className="px-4 py-3 text-gray-400">{p.comment_count || 0}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition" title="Chỉnh sửa"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition disabled:opacity-50" title="Xóa">
                          {deletingId === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Không có bài viết nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 sticky top-0 bg-dark-900 z-10">
              <h2 className="font-bold text-lg">{editing ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}

              <Field label="Tiêu đề *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
              <Field label="URL Ảnh bìa" value={form.cover_image} onChange={v => setForm(f => ({ ...f, cover_image: v }))} />
              {form.cover_image && (
                <img src={form.cover_image} alt="cover" className="w-full h-40 object-cover rounded-xl" />
              )}
              <Field label="Tóm tắt / Excerpt" value={form.excerpt} onChange={v => setForm(f => ({ ...f, excerpt: v }))} />

              <div>
                <label className="block text-sm text-gray-400 mb-1">Nội dung *</label>
                <textarea
                  rows={14}
                  required
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-y font-mono"
                  placeholder="Viết nội dung bài viết ở đây..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Trạng thái</label>
                <div className="flex gap-3">
                  {['draft', 'published'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                        form.status === s
                          ? s === 'published' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-gray-500/20 border-gray-500 text-gray-300'
                          : 'border-dark-600 text-gray-500 hover:border-gray-500'
                      }`}
                    >
                      {s === 'published' ? '🌐 Xuất bản' : '📄 Bản nháp'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2.5 border border-dark-600 rounded-lg text-sm hover:bg-dark-700 transition">Hủy</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  {editing ? 'Cập nhật' : 'Đăng bài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
      />
    </div>
  )
}
