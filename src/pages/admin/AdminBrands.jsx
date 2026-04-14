import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Search, Loader2, Tag } from 'lucide-react'
import { brandsAPI } from '../../utils/api'

const EMPTY_FORM = { name: '', logo_url: '', description: '' }

export default function AdminBrands() {
  const [brands, setBrands]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError]         = useState('')

  const load = () => {
    setLoading(true)
    brandsAPI.getAll()
      .then(res => setBrands(res.data || []))
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

  const openEdit = (b) => {
    setEditing(b)
    setForm({
      name:        b.name        || '',
      logo_url:    b.logo_url    || '',
      description: b.description || '',
    })
    setError('')
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Tên thương hiệu là bắt buộc'); return }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await brandsAPI.update(editing.id, form)
      } else {
        await brandsAPI.create(form)
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
    if (!window.confirm('Xóa thương hiệu này? Các sản phẩm thuộc thương hiệu sẽ không bị xóa.')) return
    setDeletingId(id)
    try {
      await brandsAPI.delete(id)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = brands.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Thương hiệu</h1>
          <p className="text-gray-400 text-sm mt-1">{brands.length} thương hiệu</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={18} /> Thêm thương hiệu
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          placeholder="Tìm kiếm thương hiệu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          {search ? 'Không tìm thấy thương hiệu nào' : 'Chưa có thương hiệu nào'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(b => (
            <div key={b.id} className="bg-dark-900 border border-dark-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-dark-700 transition">
              {/* Logo / Icon */}
              <div className="flex items-center gap-3">
                {b.logo_url ? (
                  <img
                    src={b.logo_url}
                    alt={b.name}
                    className="w-12 h-12 object-contain rounded-xl bg-dark-800 p-1.5 border border-dark-700"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                  />
                ) : null}
                <div
                  className={`w-12 h-12 rounded-xl bg-primary-600/15 border border-primary-500/25 items-center justify-center ${b.logo_url ? 'hidden' : 'flex'}`}
                >
                  <Tag size={20} className="text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{b.name}</p>
                  <p className="text-xs text-gray-500 truncate">{b.slug}</p>
                </div>
              </div>

              {b.description && (
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{b.description}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-dark-800">
                <button
                  onClick={() => openEdit(b)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/30 transition text-xs font-medium"
                >
                  <Pencil size={13} /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  disabled={deletingId === b.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 transition text-xs font-medium disabled:opacity-50"
                >
                  {deletingId === b.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Trash2 size={13} />}
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
              <h2 className="font-bold text-lg">
                {editing ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}
              </h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <Field label="Tên thương hiệu *" value={form.name}
                onChange={v => setForm(f => ({ ...f, name: v }))} />

              <div>
                <Field label="URL Logo (tùy chọn)" value={form.logo_url}
                  onChange={v => setForm(f => ({ ...f, logo_url: v }))} />
                {form.logo_url && (
                  <img
                    src={form.logo_url}
                    alt="preview"
                    className="mt-2 w-16 h-16 object-contain rounded-xl border border-dark-600 bg-dark-800 p-1.5"
                    onError={e => (e.target.style.opacity = '0.2')}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Mô tả (tùy chọn)</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Giới thiệu ngắn về thương hiệu..."
                  className="w-full px-3 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="flex-1 px-4 py-2.5 border border-dark-600 rounded-lg text-sm hover:bg-dark-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  {editing ? 'Cập nhật' : 'Thêm mới'}
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
        className="w-full px-3 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
      />
    </div>
  )
}
