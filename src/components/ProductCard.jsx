import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Heart, Star, Eye, ShoppingCart, Zap, Check } from 'lucide-react'
import { formatVND } from '../utils/currency'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { user } = useAuth()
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate(`/login?redirect=/product/${product.id}`)
      return
    }
    if (product.variant_count > 0) {
      navigate(`/product/${product.id}`)
      return
    }
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
    if (product.variant_count > 0) {
      navigate(`/product/${product.id}`)
      return
    }
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

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlisted(v => !v)
  }

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-dark-900 rounded-xl shadow-xl overflow-hidden border border-dark-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-600/10">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-pink-50">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-contain p-4 sm:p-8 group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Badges */}
          {product.badge && (
            <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-primary-600 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
              {product.badge === 'SALE' ? 'SALE' : product.badge === 'NEW' ? 'MỚI' : product.badge}
            </span>
          )}
          
          {/* Wishlist Button */}
          <button 
            onClick={handleWishlist}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition group/btn z-10"
          >
            <Heart 
              size={15} 
              className={`transition ${wishlisted ? 'text-red-500 fill-red-500' : 'text-dark-900 group-hover/btn:text-primary-600'}`} 
            />
          </button>

          {/* Hover Action Buttons Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3">
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
        <div className="p-2.5 sm:p-4">
          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">{product.brand}</div>
          <h3 className="font-serif text-sm sm:text-base mb-1 sm:mb-2 text-white group-hover:text-primary-400 transition leading-snug line-clamp-2">{product.name}</h3>

          {/* Rating */}
          {product.rating ? (
            <div className="flex items-center mb-2 sm:mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={11} 
                    className={`${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-400 ml-1">{product.rating}</span>
            </div>
          ) : null}

          {/* Price */}
          <div className="flex items-end justify-between gap-1">
            <div>
              {product.variant_count > 0 ? (
                product.min_variant_price === product.max_variant_price ? (
                  <span className="text-sm sm:text-base font-bold text-white">{formatVND(product.max_variant_price)}</span>
                ) : (
                  <span className="text-xs sm:text-sm font-bold text-white">{formatVND(product.min_variant_price)} &ndash; {formatVND(product.max_variant_price)}</span>
                )
              ) : (
                <>
                  {(product.old_price || product.oldPrice) && (
                    <span className="text-[10px] sm:text-xs text-gray-500 line-through block">{formatVND(product.old_price || product.oldPrice)}</span>
                  )}
                  <span className="text-sm sm:text-base font-bold text-white">{formatVND(product.price)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
