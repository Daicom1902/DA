import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, User, Menu, X, ChevronDown, ChevronRight, LogOut, Package, History } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { brandsAPI, productsAPI } from '../utils/api'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [giftsOpen, setGiftsOpen] = useState(false)
  const [brands, setBrands] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const searchInputRef = useRef(null)
  const scrollYRef = useRef(0)
  const { user, logout, isAdmin } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      scrollYRef.current = window.scrollY
      document.body.classList.add('menu-open')
      document.body.style.top = `-${scrollYRef.current}px`
    } else {
      document.body.classList.remove('menu-open')
      document.body.style.top = ''
      window.scrollTo(0, scrollYRef.current)
    }
    return () => {
      document.body.classList.remove('menu-open')
      document.body.style.top = ''
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    brandsAPI.getAll()
      .then(res => setBrands(res.data || []))
      .catch(() => setBrands([]))
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setSearchOpen(false)
    setSearchQuery('')
    setMobileMenuOpen(false)
    navigate(`/catalog?q=${encodeURIComponent(q)}`)
  }

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  // Fetch suggestions when query changes
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q || !searchOpen) { setSuggestions([]); return }
    setSuggestLoading(true)
    const timer = setTimeout(() => {
      productsAPI.getAll({ search: q, limit: 6 })
        .then(res => setSuggestions(res.data?.slice(0, 6) || []))
        .catch(() => setSuggestions([]))
        .finally(() => setSuggestLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery, searchOpen])

  return (
    <header className="header-glass sticky top-0 z-[100]">
      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-0 z-[110] search-overlay border-b border-dark-800">
          <div className="flex items-center px-4 py-3.5 gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm sm:text-base"
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); setSuggestions([]) }} className="text-gray-400 hover:text-white transition">
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition shrink-0">
                Tìm
              </button>
            </form>
            <button onClick={() => { setSearchOpen(false); setSearchQuery(''); setSuggestions([]) }} className="text-gray-400 hover:text-white transition p-1">
              <X size={20} />
            </button>
          </div>

          {/* Suggestions dropdown */}
          {(suggestions.length > 0 || suggestLoading) && (
            <div className="border-t border-dark-800 bg-dark-900 max-h-[60vh] overflow-y-auto">
              {suggestLoading && suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">Đang tìm kiếm...</div>
              ) : (
                <>
                  {suggestions.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { navigate(`/product/${p.id}`); setSearchOpen(false); setSearchQuery(''); setSuggestions([]) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-800 transition text-left"
                    >
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-contain rounded-lg bg-gradient-to-br from-amber-50 to-rose-50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{p.name}</div>
                        <div className="text-xs text-gray-400 truncate">{p.brand}</div>
                      </div>
                      {p.price > 0 && (
                        <div className="text-sm font-semibold text-primary-400 shrink-0">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.min_variant_price || p.price)}
                        </div>
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`); setSearchOpen(false); setSearchQuery(''); setSuggestions([]) }}
                    className="w-full px-4 py-3 text-sm text-primary-400 hover:bg-dark-800 transition flex items-center gap-2 border-t border-dark-800"
                  >
                    <Search size={14} />
                    Xem tất cả kết quả cho “{searchQuery}”
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
      {/* Top Bar */}
      <div className="header-topbar text-center py-1.5 sm:py-2 text-xs sm:text-sm">
        <p className="text-white/90 font-medium tracking-wide">✨ Miễn phí vận chuyển cho đơn hàng trên 2.500.000₫ ✨</p>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-2.5 md:py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <div className="logo-icon w-7 h-7 sm:w-8 sm:h-8 rounded-full"></div>
            <span className="logo-text text-base sm:text-xl font-serif font-bold tracking-wider">LUXE FRAGRANCE</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="nav-link text-gray-300 hover:text-white">Trang chủ</Link>
            
            {/* Collections Mega Menu */}
            <div className="relative mega-menu-trigger">
              <Link to="/catalog" className="nav-link text-gray-300 hover:text-white flex items-center gap-1">
                Sản phẩm
                <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              {/* Mega Menu */}
              <div className="mega-menu absolute top-full left-0 mt-2 w-[800px] rounded-xl shadow-2xl z-50">
                <div className="grid grid-cols-4 gap-6 p-6">
                  {/* Column 1 - Thương hiệu */}
                  <div>
                    <h3 className="text-primary-400 font-bold text-sm mb-3 uppercase">Thương hiệu</h3>
                    {brands.slice(0, 5).map(brand => (
                      <Link
                        key={brand.id}
                        to={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                        className="block py-2 text-gray-300 hover:text-white transition text-sm"
                      >
                        {brand.name}
                      </Link>
                    ))}
                    <Link to="/catalog" className="block py-2 text-primary-400 hover:text-primary-300 transition text-sm font-semibold mt-2">
                      Xem tất cả →
                    </Link>
                  </div>

                  {/* Column 2 - Sản phẩm bán chạy */}
                  <div>
                    <h3 className="text-primary-400 font-bold text-sm mb-3 uppercase">Bán chạy nhất</h3>
                    <Link to="/catalog" className="block py-2 text-gray-300 hover:text-white transition text-sm">
                      Top 10 yêu thích
                    </Link>
                    <Link to="/catalog" className="block py-2 text-gray-300 hover:text-white transition text-sm">
                      Xu hướng 2026
                    </Link>
                    <Link to="/catalog" className="block py-2 text-gray-300 hover:text-white transition text-sm">
                      Đánh giá 5 sao
                    </Link>
                    <Link to="/catalog" className="block py-2 text-gray-300 hover:text-white transition text-sm">
                      Sản phẩm mới
                    </Link>
                    <Link to="/catalog" className="block py-2 text-gray-300 hover:text-white transition text-sm">
                      Giảm giá hot
                    </Link>
                  </div>

                  {/* Column 3 - Loại nước hoa */}
                  <div>
                    <h3 className="text-primary-400 font-bold text-sm mb-3 uppercase">Phân loại</h3>
                    <Link to="/catalog" className="block py-2 text-gray-300 hover:text-white transition text-sm">
                      Nước hoa nữ
                    </Link>
                    <Link to="/catalog" className="block py-2 text-gray-300 hover:text-white transition text-sm">
                      Nước hoa nam
                    </Link>
                    <Link to="/catalog" className="block py-2 text-gray-300 hover:text-white transition text-sm">
                      Nước hoa unisex
                    </Link>
                    <Link to="/catalog" className="block py-2 text-gray-300 hover:text-white transition text-sm">
                      Nước hoa niche
                    </Link>
                    <Link to="/catalog" className="block py-2 text-gray-300 hover:text-white transition text-sm">
                      Bộ sưu tập cao cấp
                    </Link>
                  </div>
           </div>

                {/* Featured Banner */}
                <div className="border-t border-dark-700 bg-gradient-to-r from-primary-900/20 to-dark-800 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">Bộ sưu tập mới 2026</p>
                      <p className="text-gray-400 text-sm">Khám phá những hương thơm độc đáo</p>
                    </div>
                    <Link to="/catalog" className="btn-primary text-sm px-4 py-2">
                      Khám phá ngay
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* About Link */}
            <Link to="/about" className="nav-link text-gray-300 hover:text-white">Giới thiệu</Link>

            {/* Blog Link */}
            <Link to="/blog" className="nav-link text-gray-300 hover:text-white">Blog</Link>

            {/* Contact Link */}
            <Link to="/contact" className="nav-link text-gray-300 hover:text-white">Liên hệ</Link>

            {/* Gifts Dropdown */}
            <div className="relative mega-menu-trigger">
              <a href="#" className="nav-link text-gray-300 hover:text-white flex items-center gap-1">
                Quà tặng
                <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              <div className="mega-menu absolute top-full right-0 mt-2 w-56 rounded-xl shadow-2xl z-50">
                <div className="py-2">
                  <Link to="/catalog" className="block px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white transition">
                    <div className="font-semibold">Bộ quà tặng</div>
                    <div className="text-xs text-gray-500">Gói quà sang trọng</div>
                  </Link>
                  <Link to="/catalog" className="block px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white transition">
                    <div className="font-semibold">Quà tặng sinh nhật</div>
                    <div className="text-xs text-gray-500">Ý nghĩa và đặc biệt</div>
                  </Link>
                  <Link to="/catalog" className="block px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white transition">
                    <div className="font-semibold">Quà tặng doanh nghiệp</div>
                    <div className="text-xs text-gray-500">Chuyên nghiệp và lịch sự</div>
                  </Link>
                  <Link to="/catalog" className="block px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white transition">
                    <div className="font-semibold">Bộ khám phá</div>
                    <div className="text-xs text-gray-500">Trải nghiệm đa dạng</div>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={openSearch} className="action-icon">
              <Search size={20} />
            </button>
            <Link to="/cart" className="action-icon relative hidden md:block">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="cart-badge absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">{totalItems > 99 ? '99+' : totalItems}</span>
              )}
            </Link>

            {!user && (
              <Link to="/login" className="md:hidden action-icon">
                <User size={20} />
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <Link to="/admin"
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600/40 border border-primary-500/40 text-primary-400 rounded-lg text-xs sm:text-sm font-medium transition"
                  >
                    <User size={14} /> <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                {!isAdmin && (
                  <>
                    <Link to="/my-orders"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-dark-600 hover:border-primary-500/50 text-gray-400 hover:text-primary-400 rounded-lg text-sm transition"
                    >
                      <Package size={15} /> Đơn hàng
                    </Link>
                  </>
                )}
                <span className="text-sm text-gray-400 hidden lg:block">{user.full_name}</span>
                <button
                  onClick={async () => { await logout(); navigate('/') }}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 border border-dark-600 hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-lg text-xs sm:text-sm transition"
                >
                  <LogOut size={14} /> <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5">
                <Link to="/login" className="btn-auth-outline">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-auth-fill">
                  Đăng ký
                </Link>
              </div>
            )}

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white transition p-2"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-[80vh] overflow-y-auto' : 'max-h-0'}`}>
          <nav className="py-4 border-t border-dark-800">
            {/* Home */}
            <Link 
              to="/" 
              className="block py-3 text-gray-300 hover:text-white hover:bg-dark-800 transition px-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              Trang chủ
            </Link>

            {/* Collections - Link + Dropdown Arrow */}
            <div>
              <div className="flex items-center hover:bg-dark-800 transition">
                <Link
                  to="/catalog"
                  className="flex-1 py-3 text-gray-300 hover:text-white transition px-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sản phẩm
                </Link>
                <button
                  onClick={() => setCollectionsOpen(!collectionsOpen)}
                  className="py-3 px-4 text-gray-400 hover:text-white transition"
                >
                  {collectionsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
              </div>
              {collectionsOpen && (
                <div className="bg-dark-900 py-2">
                  {/* Thương hiệu */}
                  <div className="px-4 py-2">
                    <p className="text-primary-400 text-xs font-bold uppercase mb-2">Thương hiệu</p>
                    {brands.slice(0, 5).map(brand => (
                      <Link
                        key={brand.id}
                        to={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                        className="block py-2 text-sm text-gray-400 hover:text-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {brand.name}
                      </Link>
                    ))}
                    {brands.length === 0 && (
                      <>
                        <Link to="/catalog" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Tom Ford</Link>
                        <Link to="/catalog" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Byredo</Link>
                        <Link to="/catalog" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Le Labo</Link>
                      </>
                    )}
                  </div>

                  {/* Bán chạy */}
                  <div className="px-4 py-2 border-t border-dark-800">
                    <p className="text-primary-400 text-xs font-bold uppercase mb-2">Bán chạy nhất</p>
                    <Link to="/catalog" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                      Top 10 yêu thích
                    </Link>
                    <Link to="/catalog" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                      Xu hướng 2026
                    </Link>
                    <Link to="/catalog" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                      Đánh giá 5 sao
                    </Link>
                  </div>

                  {/* Phân loại */}
                  <div className="px-4 py-2 border-t border-dark-800">
                    <p className="text-primary-400 text-xs font-bold uppercase mb-2">Phân loại</p>
                    <Link to="/catalog" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                      Nước hoa nữ
                    </Link>
                    <Link to="/catalog" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                      Nước hoa nam
                    </Link>
                    <Link to="/catalog" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                      Nước hoa unisex
                    </Link>
                  </div>               
                </div>
              )}
            </div>

            {/* About */}
            <Link 
              to="/about" 
              className="block py-3 text-gray-300 hover:text-white hover:bg-dark-800 transition px-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              Giới thiệu
            </Link>

            {/* Blog */}
            <Link 
              to="/blog" 
              className="block py-3 text-gray-300 hover:text-white hover:bg-dark-800 transition px-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>

            {/* Contact */}
            <Link 
              to="/contact" 
              className="block py-3 text-gray-300 hover:text-white hover:bg-dark-800 transition px-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              Liên hệ
            </Link>

            {/* My Orders + Purchase History (only for non-admin logged in users) */}
            {user && !isAdmin && (
              <>
                <Link 
                  to="/my-orders" 
                  className="block py-3 text-gray-300 hover:text-white hover:bg-dark-800 transition px-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đơn hàng
                </Link>
              </>
            )}

            {/* Gifts - Link + Dropdown Arrow */}
            <div>
              <div className="flex items-center hover:bg-dark-800 transition">
                <Link
                  to="/catalog"
                  className="flex-1 py-3 text-gray-300 hover:text-white transition px-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Quà tặng
                </Link>
                <button
                  onClick={() => setGiftsOpen(!giftsOpen)}
                  className="py-3 px-4 text-gray-400 hover:text-white transition"
                >
                  {giftsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
              </div>
              {giftsOpen && (
                <div className="bg-dark-900 py-2">
                  <Link to="/catalog" className="block py-3 px-6 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                    Bộ quà tặng
                  </Link>
                  <Link to="/catalog" className="block py-3 px-6 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                    Quà tặng sinh nhật
                  </Link>
                  <Link to="/catalog" className="block py-3 px-6 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                    Quà tặng doanh nghiệp
                  </Link>
                  <Link to="/catalog" className="block py-3 px-6 text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                    Bộ khám phá
                  </Link>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="px-4 pt-4">
              <Link 
                to="/catalog" 
                className="block w-full btn-primary text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Khám phá sản phẩm
              </Link>
            </div>

            {/* Mobile account actions */}
            {user ? (
              <div className="px-4 pt-3 pb-2 border-t border-dark-800 mt-3 flex flex-col gap-2">
                {!isAdmin && (
                  <>
                    <Link to="/my-orders"
                      className="flex items-center gap-2 py-2.5 px-3 border border-dark-600 hover:border-primary-500/50 text-gray-300 hover:text-primary-400 rounded-lg text-sm transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package size={16} /> Đơn hàng
                    </Link>
                  </>
                )}
                <button
                  onClick={async () => { await logout(); navigate('/'); setMobileMenuOpen(false) }}
                  className="flex items-center gap-2 py-2.5 px-3 border border-dark-600 hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-lg text-sm transition w-full"
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            ) : (
              <div className="px-4 pt-3 pb-2 border-t border-dark-800 mt-3 flex flex-col gap-2">
                <Link to="/login"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 border border-dark-600 hover:border-primary-500 text-gray-300 hover:text-white rounded-lg text-sm transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={16} /> Đăng nhập
                </Link>
                <Link to="/register"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng ký tài khoản
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
