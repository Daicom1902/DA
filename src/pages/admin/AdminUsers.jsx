import { useEffect, useState } from 'react'
import { UserPlus, Pencil, UserX, UserCheck, X, Loader2, ShieldCheck, Users, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { usersAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABEL  = { admin: 'Quản trị viên', manager: 'Quản lý', staff: 'Nhân viên' }
const ROLE_COLOR  = {
  admin:   'bg-red-500/10 text-red-400 border border-red-500/20',
  manager: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  staff:   'bg-blue-500/10 text-blue-400 border border-blue-500/20',
}
const ROLE_ICON   = { admin: ShieldCheck, manager: Users, staff: User }

const empty = { full_name: '', email: '', password: '', phone: '', role: 'staff' }

export default function AdminUsers() {
  const { user: me, isAdmin } = useAuth()
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [modal,   setModal]   = useState(null)   // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null)   // user object being edited
  const [form,    setForm]    = useState(empty)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  const load = () => {
    setLoading(true)
    usersAPI.getAll()
      .then(res => setUsers(res.data))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openCreate = () => {
    setForm(empty)
    setEditing(null)
    setModal('create')
    setMsg('')
  }

  const openEdit = (u) => {
    setForm({ full_name: u.full_name, email: u.email, password: '', phone: u.phone || '', role: u.role })
    setEditing(u)
    setModal('edit')
    setMsg('')
  }

  const closeModal = () => { setModal(null); setEditing(null); setMsg('') }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      if (modal === 'create') {
        await usersAPI.create(form)
        setMsg('✓ Tạo tài khoản thành công')
      } else {
        const body = { ...form }
        if (!body.password) delete body.password
        await usersAPI.update(editing.id, body)
        setMsg('✓ Cập nhật thành công')
      }
      load()
      setTimeout(closeModal, 800)
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (u) => {
    try {
      await usersAPI.update(u.id, { is_active: u.is_active ? 0 : 1 })
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý nhân viên</h1>
          <p className="text-sm text-gray-400 mt-1">Tạo và quản lý tài khoản nhân viên, quản lý</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <UserPlus size={16} />
          Thêm tài khoản
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-dark-900 rounded-2xl border border-dark-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>Chưa có tài khoản nhân viên nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Họ tên</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Vai trò</th>
                  <th className="px-5 py-3 text-left">Trạng thái</th>
                  <th className="px-5 py-3 text-left">Ngày tạo</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(u => {
                  const RoleIcon = ROLE_ICON[u.role] ?? User
                  const isSelf   = u.id === me?.id
                  return (
                    <tr key={u.id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {u.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">
                            {u.full_name}
                            {isSelf && <span className="ml-2 text-[10px] text-primary-400">(bạn)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-400">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLOR[u.role]}`}>
                          <RoleIcon size={11} />
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}>
                          {u.is_active ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={14} />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => toggleActive(u)}
                              className={`p-1.5 rounded-lg transition ${
                                u.is_active
                                  ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                                  : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title={u.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            >
                              {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && users.length > ITEMS_PER_PAGE && (() => {
        const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE)
        return (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-400">
              Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, users.length)} / {users.length} tài khoản
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-gray-400 hover:text-white hover:bg-dark-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition ${
                    page === currentPage
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-800 border border-dark-700 text-gray-400 hover:text-white hover:bg-dark-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-gray-400 hover:text-white hover:bg-dark-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )
      })()}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
              <h2 className="text-lg font-bold">
                {modal === 'create' ? 'Thêm tài khoản mới' : 'Chỉnh sửa tài khoản'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white transition p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Họ và tên *</label>
                <input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                  className="input-field w-full"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  disabled={modal === 'edit'}
                  className="input-field w-full disabled:opacity-50"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Mật khẩu {modal === 'edit' && <span className="text-gray-600">(để trống nếu không đổi)</span>}
                  {modal === 'create' && ' *'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required={modal === 'create'}
                  className="input-field w-full"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Số điện thoại</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="input-field w-full"
                  placeholder="0901234567"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Vai trò *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="input-field w-full"
                >
                  {isAdmin && <option value="manager">Quản lý</option>}
                  <option value="staff">Nhân viên</option>
                </select>
              </div>

              {msg && (
                <p className={`text-sm ${msg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {modal === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
