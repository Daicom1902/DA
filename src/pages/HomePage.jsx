import { Link } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import {
  ArrowRight, Shield, Truck, Loader2,
  ChevronLeft, ChevronRight, Tag, Flame, Clock, Package, Phone,
  Crown, Sparkles, Heart
} from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { productsAPI, brandsAPI, postsAPI } from '../utils/api'

// ── Countdown Timer ──────────────────────────────────────────────────────
function useCountdown(targetHours = 8) {
  const [time, setTime] = useState({ h: targetHours, m: 0, s: 0 })
  useEffect(() => {
    const end = Date.now() + targetHours * 3600 * 1000
    const tick = () => {
      const diff = Math.max(0, end - Date.now())
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetHours])
  return time
}

// ── Hero Slides ──────────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1600',
    badge: 'BỘ SƯU TẬP MỚI 2025',
    title: 'Tinh túy của',
    titleHighlight: 'Sang trọng',
    sub: 'Đắm chìm trong thế giới nước hoa cao cấp. Hương thơm kinh điển vượt thời gian.',
    cta: 'KHÁM PHÁ NGAY',
    ctaLink: '/catalog',
  },
  {
    image: 'https://images.unsplash.com/photo-1592945403407-9caf930a0498?w=1600',
    badge: 'ƯU ĐÃI ĐẶC BIỆT',
    title: 'Hương thơm',
    titleHighlight: 'Đỉnh cao',
    sub: 'Giảm đến 30% cho các sản phẩm được yêu thích nhất. Số lượng có hạn.',
    cta: 'MUA NGAY',
    ctaLink: '/catalog',
  },
  {
    image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1600',
    badge: 'HÀNG CHÍNH HÃNG',
    title: 'Trải nghiệm',
    titleHighlight: 'Độc đáo',
    sub: '100% nước hoa nhập khẩu chính hãng từ các thương hiệu nổi tiếng thế giới.',
    cta: 'XEM BỘ SƯU TẬP',
    ctaLink: '/catalog',
  },
]

export default function HomePage() {
  const [heroIdx, setHeroIdx] = useState(0)
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newProducts, setNewProducts]           = useState([])
  const [saleProducts, setSaleProducts]         = useState([])
  const [maleProducts, setMaleProducts]         = useState([])
  const [femaleProducts, setFemaleProducts]     = useState([])
  const [unisexProducts, setUnisexProducts]     = useState([])
  const [brands, setBrands]                     = useState([])
  const [posts, setPosts]                       = useState([])
  const [activeTab, setActiveTab]               = useState('featured')
  const [loading, setLoading]                   = useState(true)
  const heroTimer = useRef(null)
  const brandSliderRef = useRef(null)
  const brandTimer = useRef(null)
  const countdown = useCountdown(8)

  // Auto-advance hero
  const nextSlide = useCallback(() => setHeroIdx(i => (i + 1) % HERO_SLIDES.length), [])
  const prevSlide = useCallback(() => setHeroIdx(i => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), [])

  useEffect(() => {
    heroTimer.current = setInterval(nextSlide, 5000)
    return () => clearInterval(heroTimer.current)
  }, [nextSlide])

  const goSlide = (idx) => {
    clearInterval(heroTimer.current)
    setHeroIdx(idx)
    heroTimer.current = setInterval(nextSlide, 5000)
  }

  // Fetch data
  useEffect(() => {
    Promise.all([
      productsAPI.getBestSellers(8),
      productsAPI.getAll({ limit: 8, sort: 'newest' }),
      productsAPI.getAll({ badge: 'SALE', limit: 8 }),
      productsAPI.getAll({ gender: 'male', limit: 8 }),
      productsAPI.getAll({ gender: 'female', limit: 8 }),
      productsAPI.getAll({ gender: 'unisex', limit: 8 }),
      brandsAPI.getAll(),
      postsAPI.getAll({ limit: 3 }),
    ])
      .then(([bestsellers, newest, sale, male, female, unisex, br, ps]) => {
        setFeaturedProducts(bestsellers.data || [])
        setNewProducts(newest.data || [])
        setSaleProducts(sale.data || [])
        setMaleProducts(male.data || [])
        setFemaleProducts(female.data || [])
        setUnisexProducts(unisex.data || [])
        setBrands(br.data || [])
        setPosts(ps.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Auto-scroll brands
  const startBrandTimer = useCallback(() => {
    clearInterval(brandTimer.current)
    brandTimer.current = setInterval(() => {
      const el = brandSliderRef.current
      if (!el) return
      // loop back to start when near end
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: 176, behavior: 'smooth' })
      }
    }, 2500)
  }, [])

  useEffect(() => {
    startBrandTimer()
    return () => clearInterval(brandTimer.current)
  }, [startBrandTimer])

  const scrollBrands = (dir) => {
    const el = brandSliderRef.current
    if (el) el.scrollBy({ left: dir * 220, behavior: 'smooth' })
    startBrandTimer()
  }

  const tabProducts = activeTab === 'featured' ? featuredProducts : activeTab === 'new' ? newProducts : saleProducts

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="overflow-x-hidden">

      {/* ── 1. Hero Slider ─────────────────────────────────────────────── */}
      <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[85vh] overflow-hidden mt-1 sm:mt-2 md:mt-3">
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === heroIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[8000ms]"
              style={{ backgroundImage: `url(${slide.image})`, filter: 'brightness(0.35)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-950/85 via-dark-950/60 to-dark-950/40" />
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 h-full flex items-center md:items-center">
          <div className="container mx-auto px-4 sm:px-6 md:px-12">
            <div className="max-w-xl">
              <span className="inline-block bg-primary-600/20 border border-primary-500/50 text-primary-400 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-2 sm:mb-4 animate-pulse">
                {HERO_SLIDES[heroIdx].badge}
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-2 sm:mb-3 leading-tight">
                {HERO_SLIDES[heroIdx].title}{' '}
                <span className="italic text-primary-400">{HERO_SLIDES[heroIdx].titleHighlight}</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-300 mb-4 sm:mb-6 max-w-lg leading-relaxed">
                {HERO_SLIDES[heroIdx].sub}
              </p>
              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
                <Link to={HERO_SLIDES[heroIdx].ctaLink} className="btn-primary inline-flex items-center justify-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                  {HERO_SLIDES[heroIdx].cta}
                  <ArrowRight size={16} className="hidden sm:inline" />
                </Link>
                <Link to="/catalog" className="btn-secondary inline-flex items-center justify-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                  XEM TẤT CẢ
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Arrows - smaller on mobile */}
        <button onClick={prevSlide} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 bg-dark-900/60 hover:bg-dark-800 rounded-full flex items-center justify-center transition touch-target">
          <ChevronLeft size={18} />
        </button>
        <button onClick={nextSlide} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 bg-dark-900/60 hover:bg-dark-800 rounded-full flex items-center justify-center transition touch-target">
          <ChevronRight size={18} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-500 ease-out ${i === heroIdx ? 'w-7 sm:w-8 h-2 sm:h-2.5 bg-primary-500 shadow-lg shadow-primary-500/40' : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="hidden md:flex absolute bottom-8 right-12 z-20 flex-col items-center gap-2 opacity-60">
          <span className="text-xs tracking-widest uppercase rotate-90 origin-center">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-gray-400 to-transparent" />
        </div>
      </section>

      {/* ── 2. Trust Bar ───────────────────────────────────────────────── */}
      <section className="bg-dark-900 border-y border-dark-800">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-dark-800">
            {[
              { icon: <Truck size={20} className="text-primary-400" />, title: 'Miễn phí vận chuyển', sub: 'Từ 2.500.000₫' },
              { icon: <Shield size={20} className="text-primary-400" />, title: '100% Chính hãng', sub: 'Hoàn tiền' },
              { icon: <Package size={20} className="text-primary-400" />, title: 'Đổi trả 7 ngày', sub: 'Không cần lý do' },
              { icon: <Phone size={20} className="text-primary-400" />, title: 'Hỗ trợ 24/7', sub: 'Tư vấn miễn phí' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-2 sm:px-3 py-3 sm:py-4 md:py-5 md:px-6">
                <div className="flex-shrink-0 w-7 h-7 sm:w-9 sm:h-9 bg-primary-900/30 rounded-full flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] sm:text-sm md:text-base text-white leading-tight whitespace-normal">{item.title}</div>
                  <div className="text-[9px] sm:text-xs text-gray-400 leading-tight">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Luxury Brands Slider (từ DB) ───────────────────────────── */}
      {brands.length > 0 && (
        <section className="py-6 sm:py-8 md:py-10 bg-dark-950">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-end justify-between mb-4 sm:mb-5 gap-2 sm:gap-3">
              <div className="min-w-0">
                <span className="text-primary-400 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Phân phối chính thức</span>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold mt-1 sm:mt-2">Thương Hiệu Cao Cấp</h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Đại lý chính hãng tại Việt Nam</p>
              </div>
              {/* Prev / Next buttons */}
              <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => scrollBrands(-1)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-dark-800 border border-dark-700 hover:bg-dark-700 hover:border-primary-600/60 flex items-center justify-center transition-all duration-200 touch-target"
                  aria-label="Trước"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => scrollBrands(1)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-dark-800 border border-dark-700 hover:bg-dark-700 hover:border-primary-600/60 flex items-center justify-center transition-all duration-200 touch-target"
                  aria-label="Tiếp theo"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable track — hide scrollbar */}
            <div
              ref={brandSliderRef}
              id="brand-slider"
              className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {brands.map((b) => (
                <Link
                  key={b.id}
                  to={`/catalog?brand=${b.name}`}
                  className="group flex-shrink-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2 md:gap-3 bg-dark-900 border border-dark-800 hover:border-primary-600/60 rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 w-24 sm:w-32 md:w-40 lg:w-44 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-900/30 touch-target"
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg sm:rounded-xl overflow-hidden bg-white flex items-center justify-center p-1 sm:p-1.5 md:p-2 shadow-md group-hover:shadow-primary-600/20 group-hover:scale-105 transition-all duration-300">
                    {b.logo_url ? (
                      <img
                        src={b.logo_url}
                        alt={b.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement.innerHTML = `<span style="font-size:9px;font-weight:700;letter-spacing:0.1em;color:#111;text-align:center;padding:3px;line-height:1.2">${b.name}</span>`
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: '#111', textAlign: 'center', padding: '3px', lineHeight: 1.2 }}>{b.name}</span>
                    )}
                  </div>
                  <span className="text-[9px] sm:text-xs md:text-sm text-gray-500 group-hover:text-primary-400 uppercase tracking-[0.15em] font-semibold text-center leading-tight transition-colors line-clamp-2">{b.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Flash Sale Banner ──────────────────────────────────────── */}
      <section className="py-3 sm:py-4 bg-gradient-to-r from-red-950 via-red-900 to-orange-950 border-y border-red-800/40">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 text-white flex-1">
              <Flame className="text-orange-400 animate-pulse flex-shrink-0 mt-1 sm:mt-0" size={24} />
              <div className="min-w-0">
                <div className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-wide leading-tight">FLASH SALE — Giảm 40%</div>
                <div className="text-[10px] sm:text-xs text-red-300">Hạn có hạn!</div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-white text-xs sm:text-sm flex-shrink-0">
              <Clock size={16} className="text-orange-300" />
              <span className="text-red-300">Kết thúc:</span>
              <div className="flex gap-1 tabular-nums">
                {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((v, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    <span className="bg-red-900 border border-red-700 rounded w-6 sm:w-7 h-6 sm:h-7 flex items-center justify-center font-mono font-bold text-xs sm:text-sm">{v}</span>
                    {i < 2 && <span className="text-orange-400 font-bold">:</span>}
                  </span>
                ))}
              </div>
            </div>
            <Link to="/catalog?badge=SALE" className="btn-primary bg-orange-600 hover:bg-orange-700 whitespace-nowrap text-xs sm:text-sm inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 flex-shrink-0 touch-target">
              <Tag size={14} /> XEM NGAY
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Products Tabs (Best Seller / New / Sale) ───────────────── */}
      <section className="py-6 sm:py-10 md:py-12 container mx-auto px-3 sm:px-4">
        {/* Header + Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-6 gap-3">
          <div className="min-w-0">
            <span className="text-primary-400 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Sản phẩm</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold mt-1 sm:mt-2">Nước Hoa Nổi Bật</h2>
          </div>
          <div className="flex bg-dark-900 rounded-lg sm:rounded-xl p-1 gap-1 border border-dark-800 self-start sm:self-auto overflow-x-auto">
            {[
              { key: 'featured', label: '🔥 Bán chạy' },
              { key: 'new',      label: '✨ Mới nhất' },
              { key: 'sale',     label: '🏷️ Giảm giá' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap touch-target ${
                  activeTab === t.key
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 sm:py-16">
            <Loader2 size={40} className="animate-spin text-primary-500" />
          </div>
        ) : tabProducts.length === 0 ? (
          <div className="text-center py-12 sm:py-16 text-gray-500">Không có sản phẩm</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
            {tabProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        <div className="text-center mt-4 sm:mt-6">
          <Link to="/catalog" className="btn-secondary inline-flex items-center justify-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 touch-target">
            XEM TẤT CẢ SẢN PHẨM <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── 5b. Nước Hoa Nam ──────────────────────────────────────────── */}
      {maleProducts.length > 0 && (
        <section className="py-6 sm:py-10 md:py-12 bg-gradient-to-b from-dark-950 via-dark-900/50 to-dark-950 border-t border-dark-800/50">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-2 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-blue-900/30 border border-blue-700/30 flex items-center justify-center flex-shrink-0">
                <Crown size={20} className="text-blue-400" />
              </div>
              <div className="min-w-0">
                <span className="text-blue-400 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Dành cho phái mạnh</span>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold">Nước Hoa Nam</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
              {maleProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="text-center mt-4 sm:mt-6">
              <Link to="/catalog?gender=male" className="btn-secondary inline-flex items-center justify-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 touch-target">
                Xem tất cả <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 5c. Nước Hoa Nữ ──────────────────────────────────────────── */}
      {femaleProducts.length > 0 && (
        <section className="py-6 sm:py-10 md:py-12 bg-dark-950">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-2 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-pink-900/30 border border-pink-700/30 flex items-center justify-center flex-shrink-0">
                <Heart size={20} className="text-pink-400" />
              </div>
              <div className="min-w-0">
                <span className="text-pink-400 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Dành cho phái đẹp</span>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold">Nước Hoa Nữ</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
              {femaleProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="text-center mt-4 sm:mt-6">
              <Link to="/catalog?gender=female" className="btn-secondary inline-flex items-center justify-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 touch-target">
                Xem tất cả <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 5d. Nước Hoa Unisex ───────────────────────────────────────── */}
      {unisexProducts.length > 0 && (
        <section className="py-6 sm:py-10 md:py-12 bg-gradient-to-b from-dark-950 via-dark-900/50 to-dark-950 border-t border-dark-800/50">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-2 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-900/30 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-amber-400" />
              </div>
              <div className="min-w-0">
                <span className="text-amber-400 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Dành cho cả hai</span>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold">Nước Hoa Unisex</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
              {unisexProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="text-center mt-4 sm:mt-6">
              <Link to="/catalog?gender=unisex" className="btn-secondary inline-flex items-center justify-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 touch-target">
                Xem tất cả <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 7. Blog Preview ──────────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="py-6 sm:py-10 md:py-12 bg-dark-900 border-t border-dark-800">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-end justify-between mb-4 sm:mb-5 gap-3">
              <div className="min-w-0">
                <span className="text-primary-400 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Tin tức & Kiến thức</span>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold mt-1 sm:mt-2">Bài Viết Mới Nhất</h2>
              </div>
              <Link to="/blog" className="text-xs sm:text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1 transition flex-shrink-0 touch-target">
                Xem tất cả <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
              {posts.map(post => (
                <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="group card overflow-hidden hover:-translate-y-1 transition-transform duration-300 touch-target">
                  <div className="h-36 sm:h-40 md:h-44 overflow-hidden">
                    <img
                      src={post.cover_image || post.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600'}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <span className="text-xs text-primary-400 uppercase tracking-wider">{post.category || 'Nước hoa'}</span>
                    <h3 className="font-serif font-semibold text-sm sm:text-base mt-1 mb-2 line-clamp-2 group-hover:text-primary-400 transition">{post.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{post.excerpt || post.summary || ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
