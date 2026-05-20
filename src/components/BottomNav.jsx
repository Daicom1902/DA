import { Link, useLocation } from 'react-router-dom'
import { Home, Search, ShoppingCart, Package, Menu } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function BottomNav() {
  const location = useLocation()
  const { totalItems } = useCart()
  const { user } = useAuth()
  const [visible, setVisible] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const lastScrollY = useRef(0)

  // Smart hide: hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY < 100) {
        setVisible(true)
      } else if (currentY > lastScrollY.current + 10) {
        setVisible(false)
      } else if (currentY < lastScrollY.current - 10) {
        setVisible(true)
      }
      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Listen for mobile menu open/close
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setMenuOpen(document.body.classList.contains('menu-open'))
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Add class to body
  useEffect(() => {
    document.body.classList.add('has-bottom-nav')
    return () => document.body.classList.remove('has-bottom-nav')
  }, [])

  // Don't show on admin pages or payment pages
  const hiddenPaths = ['/admin', '/payment']
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null

  const tabs = [
    { to: '/',        icon: Home,         label: 'Trang chủ' },
    { to: '/catalog', icon: Search,       label: 'Sản phẩm' },
    { to: '/cart',    icon: ShoppingCart,  label: 'Giỏ hàng', badge: totalItems },
    { to: '/my-orders', icon: Package,    label: 'Đơn hàng', auth: true },
  ]

  return (
    <nav className={`bottom-nav md:hidden ${!visible ? 'hidden-nav' : ''} ${menuOpen ? 'hidden' : ''}`}>
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map(tab => {
          // Skip auth-required tabs if not logged in
          if (tab.auth && !user) return null

          const Icon = tab.icon
          const isActive = location.pathname === tab.to || 
            (tab.to !== '/' && location.pathname.startsWith(tab.to))

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`bottom-nav-item flex-1 ${isActive ? 'active' : ''}`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {tab.badge > 0 && (
                  <span className="bottom-nav-badge">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
