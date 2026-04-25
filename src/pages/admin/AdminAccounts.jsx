import { useEffect, useState } from 'react'
import { UserPlus, Pencil, Eye, UserX, UserCheck, X, Loader2, ShieldCheck, Users, User, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Trash2 } from 'lucide-react'
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

export default function AdminAccounts() {
  const { user: me, isAdmin } = useAuth()
  const [tab, setTab] = useState('staff') // 'staff' | 'users'
  const [staffList, setStaffList] = useState([])
  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)   // null | 'create' | 'edit' | 'view'
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, fullName }
  const [deleting, setDeleting] = useState(false)

  // Pagination for staff
  const [currentStaffPage, setCurrentStaffPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  // Pagination for users
  const [currentUsersPage, setCurrentUsersPage] = useState(1)

  const loadStaff = () => {
    setLoading(true)
    usersAPI.getAll()
      .then(res => setStaffList(res.data || []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false))
  }

  const loadUsers = () => {
    setLoading(true)
    usersAPI.getAllCustomers()
      .then(res => setUsersList(res.data || []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab === 'staff') loadStaff()
    else loadUsers()
  }, [tab])

  const openCreate = () => {
    setForm(empty)
    setEditing(null)
    setModal('create')
    setMsg('')
  }

  const openEdit = (u) => {
    setForm({ full_name: u.full_name, email: u.email, password: '', phone: u.phone || '', role: u.role || '' })
    setEditing(u)
    setModal('edit')
    setMsg('')
  }

  const openView = (u) => {
    setForm({ full_name: u.full_name, email: u.email, password: '', phone: u.phone || '', role: u.role || '' })
    setEditing(u)
    setModal('view')
    setMsg('')
  }

  const closeModal = () => { setModal(null); setEditing(null); setMsg('') }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      if (modal === 'create') {
        if (tab === 'staff') {
          await usersAPI.create(form)
        } else {
          // For users, we don't typically create through admin
          setMsg('❌ Không thể tạo người dùng từ đây')
          setSaving(false)
          return
        }
        setMsg('✓ Tạo tài khoản thành công')
      } else {
        const body = { ...form }
        if (!body.password) delete body.password
        if (tab === 'staff') {
          await usersAPI.update(editing.id, body)
        } else {
          await usersAPI.updateCustomer(editing.id, body)
        }
        setMsg('✓ Cập nhật thành công')
      }
      if (tab === 'staff') loadStaff()
      else loadUsers()
      setTimeout(closeModal, 800)
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (u) => {
    try {
      if (tab === 'staff') {
        await usersAPI.update(u.id, { is_active: u.is_active ? 0 : 1 })
        loadStaff()
      } else {
        await usersAPI.updateCustomer(u.id, { is_active: u.is_active ? 0 : 1 })
        loadUsers()
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      if (tab === 'staff') {
        await usersAPI.delete(deleteConfirm.id)
        loadStaff()
      } else {
        await usersAPI.deleteCustomer(deleteConfirm.id)
        loadUsers()
      }
      setDeleteConfirm(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const currentList = tab === 'staff' ? staffList : usersList
  const currentPage = tab === 'staff' ? currentStaffPage : currentUsersPage
  const setCurrentPage = tab === 'staff' ? setCurrentStaffPage : setCurrentUsersPage

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Quản Lý Tài Khoản</h1>
          <p className="text-sm text-gray-500 mt-2">Quản lý nhân viên và người dùng hệ thống</p>
        </div>
        {tab === 'staff' && (
          <button 
            onClick={openCreate} 
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
          >
            <UserPlus size={18} />
            Thêm Nhân Viên
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 bg-dark-900/50 rounded-lg p-1.5 border border-dark-800">
        <button
          onClick={() => setTab('staff')}
          className={`flex-1 px-4 py-2.5 font-medium text-sm transition-all rounded-md ${
            tab === 'staff'
              ? 'bg-gradient-to-r from-emerald-600/80 to-emerald-700/80 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
          }`}
        >
          👨‍💼 Nhân Viên
        </button>
        <button
          onClick={() => setTab('users')}
          className={`flex-1 px-4 py-2.5 font-medium text-sm transition-all rounded-md ${
            tab === 'users'
              ? 'bg-gradient-to-r from-blue-600/80 to-blue-700/80 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
          }`}
        >
          👤 Người Dùng
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3.5 bg-red-500/15 border border-red-500/30 text-red-300 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-850 rounded-2xl border border-dark-700/50 overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-emerald-400" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>{tab === 'staff' ? 'Chưa có tài khoản nhân viên nào' : 'Chưa có người dùng nào'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/50 bg-gradient-to-r from-dark-800/50 to-dark-700/25 text-gray-400 text-xs font-semibold uppercase tracking-widest">
                  <th className="px-5 py-4 text-left">Họ Tên</th>
                  <th className="px-5 py-4 text-left">Email</th>
                  {tab === 'staff' && <th className="px-5 py-4 text-left">Vai Trò</th>}
                  <th className="px-5 py-4 text-left">Trạng Thái</th>
                  <th className="px-5 py-4 text-left">Ngày Tạo</th>
                  <th className="px-5 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/30">
                {currentList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(u => {
                  const RoleIcon = ROLE_ICON[u.role] ?? User
                  const isSelf   = u.id === me?.id
                  return (
                    <tr key={u.id} className="hover:bg-dark-800/40 transition-all duration-200 border-b border-dark-800/20">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                            isSelf
                              ? 'from-emerald-500 to-emerald-700'
                              : 'from-primary-500 to-primary-700'
                          } flex items-center justify-center text-xs font-bold shrink-0 text-white shadow-lg`}>
                            {u.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-white">
                              {u.full_name}
                            </span>
                            {isSelf && <span className="ml-2 text-[10px] text-emerald-400 font-semibold">(Bạn)</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-400">{u.email}</td>
                      {tab === 'staff' && (
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${ROLE_COLOR[u.role]}`}>
                            <RoleIcon size={13} />
                            {ROLE_LABEL[u.role] ?? u.role}
                          </span>
                        </td>
                      )}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                          u.is_active
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-300 border border-red-500/30'
                        }`}>
                          {u.is_active ? '✓ Đang hoạt động' : '✕ Đã vô hiệu hóa'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs font-medium">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => tab === 'staff' ? openEdit(u) : openView(u)}
                            className={`p-2 rounded-lg transition-all ${
                              tab === 'staff'
                                ? 'text-gray-400 hover:text-purple-400 hover:bg-purple-500/15 border border-transparent hover:border-purple-500/30'
                                : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/15 border border-transparent hover:border-blue-500/30'
                            }`}
                            title={tab === 'staff' ? 'Chỉnh sửa' : 'Xem thông tin'}
                          >
                            {tab === 'staff' ? <Pencil size={16} /> : <Eye size={16} />}
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => toggleActive(u)}
                              className={`p-2 rounded-lg transition-all border border-transparent ${
                                u.is_active
                                  ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/15 hover:border-red-500/30'
                                  : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30'
                              }`}
                              title={u.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            >
                              {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                          )}
                          {tab === 'staff' && !isSelf && (
                            <button
                              onClick={() => setDeleteConfirm({ id: u.id, fullName: u.full_name })}
                              className="p-2 rounded-lg transition-all border border-transparent text-gray-400 hover:text-red-400 hover:bg-red-500/15 hover:border-red-500/30"
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={16} />
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
      {!loading && currentList.length > ITEMS_PER_PAGE && (() => {
        const totalPages = Math.ceil(currentList.length / ITEMS_PER_PAGE)
        return (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-400">
              Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, currentList.length)} / {currentList.length} {tab === 'staff' ? 'nhân viên' : 'người dùng'}
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900 border border-dark-700/50 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-primary-600/20 via-primary-500/10 to-transparent border-b border-dark-700/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    modal === 'create' ? 'bg-emerald-500/20 text-emerald-400' :
                    modal === 'view' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {modal === 'create' ? <UserPlus size={20} /> : modal === 'view' ? <Eye size={20} /> : <Pencil size={20} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {modal === 'create' ? 'Thêm Nhân Viên Mới' : modal === 'view' ? 'Xem Thông Tin Tài Khoản' : 'Chỉnh Sửa Thông Tin'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {modal === 'create' ? 'Tạo tài khoản nhân viên mới' : modal === 'view' ? 'Xem chi tiết tài khoản người dùng' : 'Cập nhật thông tin tài khoản'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeModal} 
                  className="text-gray-400 hover:text-white hover:bg-dark-700 transition-all p-2 rounded-lg hover:scale-110"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={modal === 'view' ? (e) => { e.preventDefault(); closeModal() } : handleSave} className="px-6 py-6 space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">Họ và Tên <span className="text-red-400">*</span></label>
                <input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                  disabled={modal === 'view'}
                  className={`w-full px-4 py-2.5 rounded-lg bg-dark-800/50 border transition-all focus:outline-none ${
                    modal === 'view'
                      ? 'border-dark-700 text-gray-500 cursor-not-allowed'
                      : 'border-dark-700 text-white focus:border-primary-500 focus:bg-dark-800 focus:ring-2 focus:ring-primary-500/20 hover:border-dark-600'
                  }`}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  disabled={modal === 'edit' || modal === 'view'}
                  className={`w-full px-4 py-2.5 rounded-lg bg-dark-800/50 border transition-all focus:outline-none ${
                    (modal === 'edit' || modal === 'view')
                      ? 'border-dark-700 text-gray-500 cursor-not-allowed'
                      : 'border-dark-700 text-white focus:border-primary-500 focus:bg-dark-800 focus:ring-2 focus:ring-primary-500/20 hover:border-dark-600'
                  }`}
                  placeholder="email@example.com"
                />
                {(modal === 'edit' || modal === 'view') && (
                  <p className="text-xs text-gray-500">Email không thể thay đổi</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Mật Khẩu {modal === 'create' && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required={modal === 'create'}
                  disabled={modal === 'view'}
                  className={`w-full px-4 py-2.5 rounded-lg bg-dark-800/50 border transition-all focus:outline-none ${
                    modal === 'view'
                      ? 'border-dark-700 text-gray-500 cursor-not-allowed'
                      : 'border-dark-700 text-white focus:border-primary-500 focus:bg-dark-800 focus:ring-2 focus:ring-primary-500/20 hover:border-dark-600'
                  }`}
                  placeholder="••••••••"
                />
                {modal === 'edit' && (
                  <p className="text-xs text-gray-500">Để trống nếu không muốn đổi mật khẩu</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">Số Điện Thoại</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  disabled={modal === 'view'}
                  className={`w-full px-4 py-2.5 rounded-lg bg-dark-800/50 border transition-all focus:outline-none ${
                    modal === 'view'
                      ? 'border-dark-700 text-gray-500 cursor-not-allowed'
                      : 'border-dark-700 text-white focus:border-primary-500 focus:bg-dark-800 focus:ring-2 focus:ring-primary-500/20 hover:border-dark-600'
                  }`}
                  placeholder="0901234567"
                />
              </div>

              {/* Role */}
              {tab === 'staff' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300">Vai Trò <span className="text-red-400">*</span></label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    disabled={modal === 'view'}
                    className={`w-full px-4 py-2.5 rounded-lg bg-dark-800/50 border transition-all focus:outline-none ${
                      modal === 'view'
                        ? 'border-dark-700 text-gray-500 cursor-not-allowed'
                        : 'border-dark-700 text-white focus:border-primary-500 focus:bg-dark-800 focus:ring-2 focus:ring-primary-500/20 hover:border-dark-600'
                    }`}
                  >
                    {isAdmin && <option value="manager">Quản Lý</option>}
                    <option value="staff">Nhân Viên</option>
                  </select>
                </div>
              )}

              {/* Message */}
              {msg && (
                <div className={`flex items-center gap-2.5 p-3.5 rounded-lg ${
                  msg.startsWith('✓')
                    ? 'bg-emerald-500/15 border border-emerald-500/30'
                    : 'bg-red-500/15 border border-red-500/30'
                }`}>
                  {msg.startsWith('✓') ? (
                    <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="text-red-400 shrink-0" />
                  )}
                  <p className={`text-sm ${msg.startsWith('✓') ? 'text-emerald-300' : 'text-red-300'}`}>
                    {msg.replace(/^[✓❌]\s*/, '')}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                    modal === 'view'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-primary-500/25'
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600 border border-dark-600 hover:border-dark-500'
                  }`}
                >
                  {modal === 'view' ? 'Đóng' : 'Hủy'}
                </button>
                {modal !== 'view' && (
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {modal === 'create' ? 'Tạo Tài Khoản' : 'Lưu Thay Đổi'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900 border border-red-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-red-600/20 via-red-500/10 to-transparent border-b border-red-500/30">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-red-500/20 text-red-400">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Xóa Tài Khoản?</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Thao tác này không thể hoàn tác</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-gray-300 mb-4">
                Bạn có chắc chắn muốn xóa tài khoản <span className="font-semibold text-white">"{deleteConfirm.fullName}"</span> không?
              </p>
              <p className="text-xs text-gray-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                ⚠️ Xóa tài khoản sẽ làm mất vĩnh viễn tất cả dữ liệu liên quan đến nhân viên này.
              </p>
            </div>

            {/* Buttons */}
            <div className="px-6 py-4 bg-dark-800/50 border-t border-dark-700 flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all bg-dark-700 text-gray-300 hover:bg-dark-600 border border-dark-600 hover:border-dark-500 disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/25 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                Xóa Tài Khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
