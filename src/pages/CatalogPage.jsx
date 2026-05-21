import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, ChevronLeft, SlidersHorizontal, X, Loader2 } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { productsAPI, brandsAPI, concentrationsAPI } from '../utils/api'

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy]           = useState('newest')
  const [search, setSearch]           = useState(searchParams.get('q') || '')
  const [selectedBrand, setSelectedBrand]               = useState(searchParams.get('brand') || '')
  const [selectedConcentration, setSelectedConcentration] = useState('')
  const [selectedGender, setSelectedGender]               = useState(searchParams.get('gender') || '')
  const [minPrice, setMinPrice]       = useState(0)
  const [maxPrice, setMaxPrice]       = useState(10000000)
  const [products, setProducts]       = useState([])
  const [brands, setBrands]           = useState([])
  const [concentrations, setConcentrations] = useState([])
  const [loading, setLoading]         = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6
  const MAX_PRICE = 10000000

  // Fetch brands + concentrations once
  useEffect(() => {
    brandsAPI.getAll().then(res => setBrands(res.data || [])).catch(() => setBrands([]))
    concentrationsAPI.getAll().then(res => setConcentrations(res.data || [])).catch(() => setConcentrations([]))
  }, [])

  // Sync brand from URL param on mount
  useEffect(() => {
    const paramBrand = searchParams.get('brand') || ''
    setSelectedBrand(paramBrand)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync gender from URL param
  useEffect(() => {
    const paramGender = searchParams.get('gender') || ''
    setSelectedGender(paramGender)
  }, [searchParams])

  const fetchProducts = useCallback(() => {
    setLoading(true)
    const params = { sort: sortBy }
    if (search.trim())          params.search        = search.trim()
    if (selectedBrand)          params.brand         = selectedBrand
    if (selectedConcentration)  params.concentration = selectedConcentration
    if (selectedGender)         params.gender        = selectedGender
    // Always send price range when either value is different from default
    if (minPrice > 0 || maxPrice < MAX_PRICE) {
      params.minPrice = minPrice
      params.maxPrice = maxPrice
    }
    productsAPI.getAll(params)
      .then(res => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [sortBy, search, selectedBrand, selectedConcentration, selectedGender, minPrice, maxPrice])

  useEffect(() => { setCurrentPage(1) }, [sortBy, search, selectedBrand, selectedConcentration, selectedGender, minPrice, maxPrice])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 500)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  const handleBrandToggle = (brandName) => {
    const next = selectedBrand === brandName ? '' : brandName
    setSelectedBrand(next)
    if (next) setSearchParams({ brand: next })
    else setSearchParams({})
  }

  const handleReset = () => {
    setSelectedBrand('')
    setSelectedConcentration('')
    setSelectedGender('')
    setSearch('')
    setSortBy('newest')
    setMinPrice(0)
    setMaxPrice(MAX_PRICE)
    setSearchParams({})
  }

  const FilterSection = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true)
    return (
      <div className="border-b border-dark-800 pb-3 xs:pb-4 mb-3 xs:mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left font-semibold text-xs xs:text-sm mb-2 xs:mb-3 hover:text-primary-400 transition"
        >
          <span>{title}</span>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {isOpen && children}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-dark-900 border-b border-dark-800">
        <div className="container mx-auto px-3 xs:px-4 py-4 xs:py-5 sm:py-6 md:py-8">
          <nav className="text-[11px] xs:text-xs md:text-sm text-gray-400 mb-2 xs:mb-3 md:mb-4">
            <span>Trang chủ / Chương trình / Bộ sưu tập Cao cấp</span>
          </nav>
          <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-serif font-bold mb-1.5 xs:mb-2 md:mb-2">Danh mục Nước hoa</h1>
          <p className="text-xs xs:text-sm md:text-base text-gray-400 leading-snug">Khám phá hương thơm đặc trưng của bạn từ bộ sưu tập nước hoa tinh tế được tuyển chọn, từ những tác phẩm kinh điển vượt thời gian đến những kiệt tác hiện đại.</p>
        </div>
      </div>

      <div className="container mx-auto px-3 xs:px-4 py-4 xs:py-5 sm:py-6 md:py-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-3 xs:mb-4 flex flex-col gap-2 xs:gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm nước hoa..."
            className="w-full px-3 xs:px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-xs xs:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
          <div className="flex items-center justify-between gap-2 xs:gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center text-xs xs:text-sm px-3 xs:px-4 py-2"
            >
              <SlidersHorizontal size={14} className="xs:w-4 xs:h-4 mr-1 xs:mr-2" />
              Bộ lọc
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-dark-800 text-white px-3 xs:px-4 py-2 rounded-lg border border-dark-700 text-xs xs:text-sm flex-1"
            >
              <option value="newest">Hàng mới nhất</option>
              <option value="price-low">Giá: Thấp đến Cao</option>
              <option value="price-high">Giá: Cao đến Thấp</option>
              <option value="popular">Phổ biến nhất</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6 lg:gap-8 relative">
          {/* Mobile overlay backdrop – OUTSIDE aside so z-index works */}
          {showFilters && (
            <div
              className="lg:hidden fixed inset-0 bg-black/60 z-30"
              onClick={() => setShowFilters(false)}
            />
          )}

          {/* Sidebar Filters */}
          <aside className={`
            fixed lg:sticky top-0 left-0 h-screen lg:h-auto
            w-64 xs:w-72 bg-dark-950 lg:bg-transparent
            z-40 lg:z-auto
            transform transition-transform duration-300
            ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            overflow-y-auto flex-shrink-0 lg:w-60
          `}>
            
            <div className="p-3 xs:p-4 lg:p-0 lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-4 xs:mb-5">
                <h2 className="text-sm xs:text-base font-bold">Bộ lọc</h2>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden p-1 xs:p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Gender */}
              <FilterSection title="GIỚI TÍNH">
                <div className="space-y-2">
                  {[{ value: 'male', label: 'Nam' }, { value: 'female', label: 'Nữ' }, { value: 'unisex', label: 'Unisex' }].map(g => (
                    <label key={g.value} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedGender === g.value}
                        onChange={() => setSelectedGender(prev => prev === g.value ? '' : g.value)}
                        className="w-4 h-4 rounded border-dark-700 bg-dark-800 text-primary-600 focus:ring-primary-600 focus:ring-offset-dark-900"
                      />
                      <span className={`ml-3 text-xs xs:text-sm transition group-hover:text-white ${selectedGender === g.value ? 'text-primary-400 font-semibold' : 'text-gray-400'}`}>
                        {g.label}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Concentration */}
              <FilterSection title="NỒNG ĐỘ">
                <div className="space-y-2">
                  {concentrations.map(c => (
                    <label key={c.id} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedConcentration === c.name}
                        onChange={() => setSelectedConcentration(prev => prev === c.name ? '' : c.name)}
                        className="w-4 h-4 rounded border-dark-700 bg-dark-800 text-primary-600 focus:ring-primary-600 focus:ring-offset-dark-900"
                      />
                      <span className={`ml-3 text-xs xs:text-sm transition group-hover:text-white ${selectedConcentration === c.name ? 'text-primary-400 font-semibold' : 'text-gray-400'}`}>
                        {c.name}
                      </span>
                    </label>
                  ))}
                  {concentrations.length === 0 && <p className="text-[10px] text-gray-500">Đang tải...</p>}
                </div>
              </FilterSection>

              {/* Brand */}
              <FilterSection title="THƯƠNG HIỆU">
                <div className="space-y-2">
                  {brands.map(brand => (
                    <label key={brand.id} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedBrand === brand.name}
                        onChange={() => handleBrandToggle(brand.name)}
                        className="w-4 h-4 rounded border-dark-700 bg-dark-800 text-primary-600 focus:ring-primary-600 focus:ring-offset-dark-900"
                      />
                      <span className={`ml-3 text-xs xs:text-sm transition group-hover:text-white ${selectedBrand === brand.name ? 'text-primary-400 font-semibold' : 'text-gray-400'}`}>
                        {brand.name}
                      </span>
                    </label>
                  ))}
                  {brands.length === 0 && (
                    <p className="text-[10px] text-gray-500">Đang tải...</p>
                  )}
                </div>
              </FilterSection>

              {/* Price Range */}
              <FilterSection title="KHOẢNG GIÁ">
                <div className="space-y-3">
                  {/* Quick Presets */}
                  <div className="space-y-2">
                    <button
                      onClick={() => { setMinPrice(0); setMaxPrice(1000000) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs xs:text-sm transition ${minPrice === 0 && maxPrice === 1000000 ? 'bg-primary-600/20 border border-primary-500/40 text-primary-400 font-semibold' : 'bg-dark-800 border border-dark-700 hover:border-primary-500 text-gray-400 hover:text-white'}`}
                    >
                      Dưới ₫1 triệu
                    </button>
                    <button
                      onClick={() => { setMinPrice(1000000); setMaxPrice(2000000) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs xs:text-sm transition ${minPrice === 1000000 && maxPrice === 2000000 ? 'bg-primary-600/20 border border-primary-500/40 text-primary-400 font-semibold' : 'bg-dark-800 border border-dark-700 hover:border-primary-500 text-gray-400 hover:text-white'}`}
                    >
                      ₫1M - ₫2M
                    </button>
                    <button
                      onClick={() => { setMinPrice(2000000); setMaxPrice(5000000) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs xs:text-sm transition ${minPrice === 2000000 && maxPrice === 5000000 ? 'bg-primary-600/20 border border-primary-500/40 text-primary-400 font-semibold' : 'bg-dark-800 border border-dark-700 hover:border-primary-500 text-gray-400 hover:text-white'}`}
                    >
                      ₫2M - ₫5M
                    </button>
                    <button
                      onClick={() => { setMinPrice(5000000); setMaxPrice(10000000) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs xs:text-sm transition ${minPrice === 5000000 && maxPrice === 10000000 ? 'bg-primary-600/20 border border-primary-500/40 text-primary-400 font-semibold' : 'bg-dark-800 border border-dark-700 hover:border-primary-500 text-gray-400 hover:text-white'}`}
                    >
                      ₫5M - ₫10M
                    </button>
                  </div>

                  {/* Price Range Display */}
                  <div className="bg-dark-800/50 rounded-lg p-3 mt-4">
                    <div className="text-xs text-gray-400 mb-2">Khoảng giá:</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-400 font-semibold">₫{minPrice.toLocaleString('vi-VN')}</span>
                      <span className="text-gray-500">—</span>
                      <span className="text-primary-400 font-semibold">₫{maxPrice.toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              </FilterSection>

              <button onClick={handleReset} className="w-full btn-secondary text-xs xs:text-sm py-2 xs:py-3">
              ĐẶT LẠI BỘ LỌC
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Desktop Toolbar */}
            <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-dark-800">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 w-56"
                />
                {selectedBrand && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600/20 border border-primary-500/40 text-primary-400 rounded-lg text-xs font-medium">
                    {selectedBrand}
                    <button onClick={() => handleBrandToggle(selectedBrand)} className="hover:text-white transition">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {!loading && <span className="text-gray-400 text-sm">Hiển thị <span className="text-white font-semibold">{products.length}</span> kết quả</span>}
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-400">Sắp xếp theo:</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-600"
                >
                  <option value="newest">Hàng mới nhất</option>
                  <option value="popular">Phổ biến nhất</option>
                  <option value="price-low">Giá: Thấp đến Cao</option>
                  <option value="price-high">Giá: Cao đến Thấp</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading && products.length === 0 ? (
              <div className="flex justify-center py-16 xs:py-20">
                <Loader2 size={32} className="xs:w-9 xs:h-9 animate-spin text-primary-500" />
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 xs:py-20 text-center text-gray-500 text-sm xs:text-base">Không tìm thấy sản phẩm nào</div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 md:gap-5 mb-5 xs:mb-6 md:mb-8">
                  {products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {Math.ceil(products.length / ITEMS_PER_PAGE) > 1 && (() => {
                  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE)
                  return (
                    <div className="flex justify-center items-center gap-0.5 xs:gap-1 md:gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-7 h-7 xs:w-8 xs:h-8 md:w-10 md:h-10 rounded-lg border border-dark-700 hover:border-primary-600 hover:text-primary-400 transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed touch-target"
                      >
                        <ChevronLeft size={16} className="xs:w-5 xs:h-5" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 xs:w-8 xs:h-8 md:w-10 md:h-10 rounded-lg text-xs xs:text-sm md:text-base font-semibold transition touch-target ${
                            page === currentPage
                              ? 'bg-primary-600 text-white'
                              : 'border border-dark-700 hover:border-primary-600 hover:text-primary-400'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-7 h-7 xs:w-8 xs:h-8 md:w-10 md:h-10 rounded-lg border border-dark-700 hover:border-primary-600 hover:text-primary-400 transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed touch-target"
                      >
                        <ChevronRight size={16} className="xs:w-5 xs:h-5" />
                      </button>
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
