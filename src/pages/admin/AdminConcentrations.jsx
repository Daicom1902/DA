import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, Droplets } from 'lucide-react'
import { concentrationsAPI } from '../../utils/api'

const EMPTY_FORM = { name: '' }

export default function AdminConcentrations() {
  const [concentrations, setConcentrations] = useState([])
  const [loading, setLoading]               = useState(true)
  const [modal, setModal]                   = useState(false)
  const [editing, setEditing]               = useState(null)
  const [form, setForm]                     = useState(EMPTY_FORM)
  const [saving, setSaving]                 = useState(false)
  const [deletingId, setDeletingId]         = useState(null)
  const [error, setError]                   = useState('')

  const load = () => {
    setLoading(true)
    concentrationsAPI.getAll()
      .then(res => setConcentrations(res.data || []))
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

  const openEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name })
    setError('')
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Tên nồng độ là bắt buộc'); return }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await concentrationsAPI.update(editing.id, form)
      } else {
        await concentrationsAPI.create(form)
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
    if (!window.confirm('Bạn chắc chắn muốn xóa nồng độ này?\nCác sản phẩm liên kết sẽ mất thông tin nồng độ.')) return
    setDeletingId(id)
    try {
      await concentrationsAPI.delete(id)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Nồng độ</h1>
          <p className="text-gray-400 text-sm mt-1">{concentrations.length} nồng độ</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus size={18} /> Thêm nồng độ
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary-500" />
        </div>
      ) : concentrations.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Droplets size={48} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có nồng độ nào. Nhấn "Thêm nồng độ" để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {concentrations.map(c => (
            <div
              key={c.id}
              className="bg-dark-900 border border-dark-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-primary-500/30 transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                  <Droplets size={20} className="text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{c.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{c.slug}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t border-dark-800">
                <button
                  onClick={() => openEdit(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 transition"
                >
                  <Pencil size={13} /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 transition disabled:opacity-50"
                >
                  {deletingId === c.id
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
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
              <h2 className="font-bold text-lg">
                {editing ? 'Chỉnh sửa nồng độ' : 'Thêm nồng độ mới'}
              </h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tên nồng độ *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ name: e.target.value })}
                  placeholder="vd: Eau de Parfum (EDP)"
                  className="w-full px-3 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-1">
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
