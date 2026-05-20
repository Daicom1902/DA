import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Heart, Star, Eye, ShoppingCart, Zap, Check, X } from 'lucide-react'
import { formatVND } from '../utils/currency'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { productsAPI } from '../utils/api'

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { user } = useAuth()
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [variants, setVariants] = useState([])
  const [buyMode, setBuyMode] = useState(false) // true = buy now, false = add to cart
  const [loadingVariants, setLoadingVariants] = useState(false)

  // Fetch full product data with variants
  const fetchProductVariants = async () => {
    if (product.variant_count === 0) return
    try {
      setLoadingVariants(true)
      const res = await productsAPI.getById(product.id)
      if (res.data?.variants) {
        setVariants(res.data.variants)
        if (res.data.variants.length > 0) {
          setSelectedVariant(res.data.variants[0])
        }
      }
    } catch (err) {
      console.error('Error fetching variants:', err)
    } finally {
      setLoadingVariants(false)
    }
  }

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate(`/login?redirect=/product/${product.id}`)
      return
    }
    
    // If product has variants, show modal to select
    if (product.variant_count > 0) {
      setBuyMode(false)
      setShowVariantModal(true)
      fetchProductVariants()
      return
    }
    
    // No variants, add directly
    addItem({
      product_id:   product.id,
      variant_id:   null,
      product_name: product.name,
      brand:        product.brand,
      size_label:   null,
      unit_price:   product.price,
      image_url:    product.image,
      quantity:     1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleBuyNow = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate(`/login?redirect=/product/${product.id}`)
      return
    }
    
    // If product has variants, show modal to select
    if (product.variant_count > 0) {
      setBuyMode(true)
      setShowVariantModal(true)
      fetchProductVariants()
      return
    }
    
    // No variants, add directly and go to cart
    addItem({
      product_id:   product.id,
      variant_id:   null,
      product_name: product.name,
      brand:        product.brand,
      size_label:   null,
      unit_price:   product.price,
      image_url:    product.image,
      quantity:     1,
    })
    navigate('/cart')
  }

  const handleConfirmVariant = () => {
    if (!selectedVariant) return
    
    addItem({
      product_id:   product.id,
      variant_id:   selectedVariant.id,
      product_name: product.name,
      brand:        product.brand,
      size_label:   selectedVariant.size_label,
      unit_price:   selectedVariant.price,
      image_url:    product.image,
      quantity:     1,
    })
    
    setShowVariantModal(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    
    if (buyMode) {
      navigate('/cart')
    }
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlisted(v => !v)
  }

  return (
    <div className="group">
      <Link to={`/product/${product.id}`} className="block">
        <div className="bg-dark-900 rounded-xl shadow-xl overflow-hidden border border-dark-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-600/10">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-pink-50">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-contain p-3 xs:p-4 sm:p-6 md:p-8 group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Badges */}
            {product.badge && (
              <span className="absolute top-1 left-1 xs:top-2 xs:left-2 sm:top-3 sm:left-3 bg-primary-600 text-white text-[9px] xs:text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 xs:px-2 xs:py-0.5 sm:px-3 sm:py-1 rounded-full">
                {product.badge === 'SALE' ? 'SALE' : product.badge === 'NEW' ? 'MỚI' : product.badge}
              </span>
            )}
            
            {/* Wishlist Button */}
            <button 
              onClick={handleWishlist}
              className="absolute top-1 right-1 xs:top-2 xs:right-2 sm:top-3 sm:right-3 w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition group/btn z-10 touch-target"
            >
              <Heart 
                size={13} 
                className={`xs:w-4 xs:h-4 sm:w-[15px] sm:h-[15px] transition ${wishlisted ? 'text-red-500 fill-red-500' : 'text-dark-900 group-hover/btn:text-primary-600'}`} 
              />
            </button>

            {/* Hover Action Buttons Overlay - Desktop */}
            <div className="hidden sm:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/product/${product.id}`) }}
                className="w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-full flex items-center justify-center text-dark-900 hover:bg-primary-500 hover:text-white transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 shadow-lg hover:shadow-primary-500/40 hover:scale-110"
                title="Xem chi tiết"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={handleAddToCart}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 shadow-lg hover:scale-110 ${
                  added 
                    ? 'bg-green-500 text-white shadow-green-500/40' 
                    : 'bg-white text-dark-900 hover:bg-primary-500 hover:text-white hover:shadow-primary-500/40'
                }`}
                style={{ transitionDelay: '50ms' }}
                title="Thêm vào giỏ hàng"
              >
                {added ? <Check size={16} /> : <ShoppingCart size={16} />}
              </button>
              <button
                onClick={handleBuyNow}
                className="w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-full flex items-center justify-center text-dark-900 hover:bg-primary-500 hover:text-white transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 shadow-lg hover:shadow-primary-500/40 hover:scale-110"
                style={{ transitionDelay: '100ms' }}
                title="Mua ngay"
              >
                <Zap size={16} />
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-2 xs:p-2.5 sm:p-4">
            <div className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">{product.brand}</div>
            <h3 className="font-serif text-xs xs:text-sm sm:text-base mb-1 xs:mb-1.5 sm:mb-2 text-white group-hover:text-primary-400 transition leading-snug line-clamp-2">{product.name}</h3>

            {/* Rating */}
            {product.rating ? (
              <div className="flex items-center mb-1.5 xs:mb-2 sm:mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={10} 
                      className={`xs:w-[11px] xs:h-[11px] ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
                <span className="text-[9px] xs:text-[10px] text-gray-400 ml-1">{product.rating}</span>
              </div>
            ) : null}

            {/* Price */}
            <div className="flex items-end justify-between gap-1">
              <div>
                {product.variant_count > 0 ? (
                  product.min_variant_price === product.max_variant_price ? (
                    <span className="text-xs xs:text-sm sm:text-base font-bold text-white">{formatVND(product.max_variant_price)}</span>
                  ) : (
                    <span className="text-[11px] xs:text-xs sm:text-sm font-bold text-white">{formatVND(product.min_variant_price)} &ndash; {formatVND(product.max_variant_price)}</span>
                  )
                ) : (
                  <>
                    {(product.old_price || product.oldPrice) && (
                      <span className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 line-through block">{formatVND(product.old_price || product.oldPrice)}</span>
                    )}
                    <span className="text-xs xs:text-sm sm:text-base font-bold text-white">{formatVND(product.price)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Mobile Quick Action Buttons */}
      <div className="sm:hidden flex gap-1.5 mt-1.5">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/product/${product.id}`) }}
          className="flex-1 py-2 px-2 bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center gap-1 text-white transition border border-dark-700 hover:border-primary-500/30 text-xs font-medium touch-target"
          title="Xem chi tiết"
        >
          <Eye size={13} />
          <span className="hidden xs:inline">Xem</span>
        </button>
        <button
          onClick={handleAddToCart}
          className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition border text-xs font-medium touch-target ${
            added 
              ? 'bg-green-600 text-white border-green-500' 
              : 'bg-dark-800 hover:bg-primary-600 text-white border-dark-700 hover:border-primary-500'
          }`}
          title="Thêm vào giỏ hàng"
        >
          {added ? <Check size={13} /> : <ShoppingCart size={13} />}
          <span className="hidden xs:inline">{added ? 'Thêm' : 'Giỏ'}</span>
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 py-2 px-2 bg-primary-600 hover:bg-primary-500 rounded-lg flex items-center justify-center gap-1 text-white transition border border-primary-500 text-xs font-medium touch-target"
          title="Mua ngay"
        >
          <Zap size={13} />
          <span className="hidden xs:inline">Mua</span>
        </button>
      </div>

      {/* Variant Selection Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 xs:p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-4 xs:p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 xs:mb-5 sm:mb-6">
              <h3 className="text-base xs:text-lg font-bold text-white">Chọn dung tích</h3>
              <button
                onClick={() => setShowVariantModal(false)}
                className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 flex items-center justify-center transition touch-target"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Product Image + Name */}
            <div className="mb-4 xs:mb-5 sm:mb-6 flex items-center gap-3 p-2.5 xs:p-3 bg-dark-800 rounded-xl">
              <img
                src={product.image}
                alt={product.name}
                className="w-14 h-14 xs:w-16 xs:h-16 object-contain"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] xs:text-xs text-gray-400 uppercase truncate">{product.brand}</p>
                <p className="text-xs xs:text-sm font-semibold text-white line-clamp-2">{product.name}</p>
              </div>
            </div>

            {/* Variants List */}
            <div className="mb-4 xs:mb-5 sm:mb-6">
              <p className="text-[10px] xs:text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 xs:mb-3">Dung tích</p>
              {loadingVariants ? (
                <div className="py-3 xs:py-4 text-center text-gray-400 text-sm">Đang tải...</div>
              ) : variants.length > 0 ? (
                <div className="space-y-2">
                  {variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      disabled={v.stock === 0}
                      className={`w-full p-2.5 xs:p-3 rounded-lg border-2 transition text-xs xs:text-sm font-medium text-left touch-target ${
                        selectedVariant?.id === v.id
                          ? 'border-primary-500 bg-primary-500/15 text-primary-300'
                          : v.stock === 0
                            ? 'border-dark-700 text-gray-600 cursor-not-allowed opacity-50'
                            : 'border-dark-700 hover:border-primary-500/50 text-white hover:bg-dark-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{v.size_label}</span>
                        <span className="text-[10px] xs:text-xs text-gray-400">
                          {v.stock > 0 ? `${v.stock} cái` : 'Hết'}
                        </span>
                      </div>
                      <div className="text-[10px] xs:text-xs text-gray-400 mt-1">
                        {formatVND(v.price)}
                        {v.old_price && (
                          <span className="line-through ml-2 text-gray-600">{formatVND(v.old_price)}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-3 xs:py-4 text-center text-gray-400 text-xs xs:text-sm">Không có dung tích nào</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowVariantModal(false)}
                className="flex-1 py-2.5 xs:py-3 px-4 rounded-lg border border-dark-700 hover:border-dark-600 text-white font-medium text-sm xs:text-base transition touch-target"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmVariant}
                disabled={!selectedVariant || selectedVariant.stock === 0 || loadingVariants}
                className="flex-1 py-2.5 xs:py-3 px-4 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm xs:text-base transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-target"
              >
                {buyMode ? (
                  <>
                    <Zap size={14} /> <span className="hidden xs:inline">Mua ngay</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={14} /> <span className="hidden xs:inline">Thêm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
