import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  LogOut,
  Menu,
  ChevronRight,
  Home,
  Users,
  Bell,
  FileText,
  MessageCircle,
  Star,
  Tag,
  Droplets,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const ROLE_LABEL = {
  admin:   'Quản trị viên',
  manager: 'Quản lý',
  staff:   'Nhân viên',
}

// Nav items visible to all dashboard roles
const navItems = [
  { to: '/admin',          icon: LayoutDashboard, label: 'Tổng quan',     exact: true },
  { to: '/admin/products', icon: Package,         label: 'Sản phẩm'    },
  { to: '/admin/orders',   icon: ShoppingBag,     label: 'Đơn hàng'    },
  { to: '/admin/contacts', icon: MessageSquare,   label: 'Liên hệ'     },
  { to: '/admin/posts',    icon: FileText,        label: 'Bài viết'    },
  { to: '/admin/comments', icon: MessageCircle,   label: 'Bình luận'   },
  { to: '/admin/reviews',        icon: Star,       label: 'Đánh giá SP'  },
  { to: '/admin/brands',         icon: Tag,        label: 'Thương hiệu' },
  { to: '/admin/concentrations', icon: Droplets,   label: 'Nồng độ'     },
]
// Nav items only for admin/manager
const adminNavItems = [
  { to: '/admin/accounts',    icon: Users,           label: 'Tài khoản'  },
  { to: '/admin/reports',     icon: BarChart3,       label: 'Báo cáo & Thống kê'    },
]

export default function AdminLayout() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const [sidebarOpen, setSidebarOpen]       = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { user, loading, logout } = useAuth()

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-dark-950">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const canManageUsers = ['admin', 'manager'].includes(user?.role)
  const visibleAdminNavItems = canManageUsers ? adminNavItems : []

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.to || location.pathname === item.to + '/'
      : location.pathname.startsWith(item.to)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-dark-950 text-white overflow-hidden">
      {/* Mobile overlay backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={[
        'fixed lg:relative inset-y-0 left-0',
        'z-50 lg:z-auto',
        'flex flex-col bg-dark-900 border-r border-dark-800',
        'transition-all duration-300',
        'w-64',
        sidebarOpen ? 'lg:w-64' : 'lg:w-16',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'shrink-0 overflow-hidden',
      ].join(' ')}>

        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-dark-800 gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold">
            L
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-serif font-bold text-sm text-white leading-none">LUMIÈRE</p>
              <p className="text-[10px] text-primary-400 font-medium tracking-widest">ADMIN PANEL</p>
            </div>
          )}
        </div>

        {/* User info */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 p-3 bg-dark-800 rounded-xl border border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{user.full_name}</p>
                <p className="text-xs text-primary-400 font-medium">{ROLE_LABEL[user.role] ?? user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {sidebarOpen && (
            <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              Quản lý
            </p>
          )}
          {navItems.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.to}
                to={item.to}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                  active
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                }`}
              >
                <item.icon size={18} className="shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {active && <ChevronRight size={14} />}
                  </>
                )}
                {/* Tooltip when collapsed */}
                {!sidebarOpen && (
                  <span className="absolute left-full ml-3 px-2 py-1 bg-dark-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}

          {visibleAdminNavItems.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.to}
                to={item.to}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                  active
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                }`}
              >
                <item.icon size={18} className="shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {active && <ChevronRight size={14} />}
                  </>
                )}
                {!sidebarOpen && (
                  <span className="absolute left-full ml-3 px-2 py-1 bg-dark-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}

          {sidebarOpen && (
            <p className="px-3 py-1.5 mt-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              Khác
            </p>
          )}
          <Link
            to="/"
            title={!sidebarOpen ? 'Về trang chính' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-dark-700 hover:text-white transition-all group relative"
          >
            <Home size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Về trang chính</span>}
            {!sidebarOpen && (
              <span className="absolute left-full ml-3 px-2 py-1 bg-dark-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                Về trang chính
              </span>
            )}
          </Link>
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-dark-800">
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Đăng xuất' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all group relative"
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Đăng xuất</span>}
            {!sidebarOpen && (
              <span className="absolute left-full ml-3 px-2 py-1 bg-dark-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                Đăng xuất
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-16 bg-dark-900 border-b border-dark-800 flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => {
              if (window.innerWidth >= 1024) setSidebarOpen(s => !s)
              else setMobileSidebarOpen(s => !s)
            }}
            className="text-gray-400 hover:text-white transition p-1.5 rounded-lg hover:bg-dark-700"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1 text-sm text-gray-400">
            {navItems.find(n => isActive(n))?.label ?? 'Tổng quan'}
          </div>

          {/* Right actions */}
          <button className="relative p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition">
            <Bell size={18} />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-dark-700">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium leading-none">{user.full_name}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{user.email}</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-dark-950">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

