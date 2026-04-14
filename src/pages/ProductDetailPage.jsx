import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Heart, Star, Plus, Minus, ShoppingCart,
  Truck, Shield, RotateCcw, Loader2, ChevronLeft, ChevronRight,
  Check, ZoomIn, MessageCircle, Send, ChevronDown,
} from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { formatVND } from '../utils/currency'
import { productsAPI, reviewsAPI } from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function ProductDetailPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { addItem }  = useCart()
  const { user }     = useAuth()

  const [quantity, setQuantity]               = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedImage, setSelectedImage]     = useState(0)
  const [lightbox, setLightbox]               = useState(false)
  const [product, setProduct]                 = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState('')
  const [relatedProducts, setRelatedProducts] = useState([])
  const [added, setAdded]                     = useState(false)

  // Review form state
  const [reviews, setReviews]               = useState([])
  const [reviewRating, setReviewRating]     = useState(5)
  const [reviewHover, setReviewHover]       = useState(0)
  const [reviewComment, setReviewComment]   = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess]   = useState('')
  const [reviewError, setReviewError]       = useState('')

  const [detailsOpen, setDetailsOpen]       = useState(true)

  useEffect(() => {
    setLoading(true)
    setSelectedImage(0)
    setSelectedVariant(null)
    setReviews([])
    setReviewSuccess('')
    setReviewError('')
    setReviewComment('')
    setReviewRating(5)
    productsAPI.getById(id)
      .then(res => {
        setProduct(res.data)
        setReviews(res.data.reviews_list || [])
        if (res.data.variants?.length > 0) setSelectedVariant(res.data.variants[0])
        return productsAPI.getAll({ limit: 8 })
      })
      .then(res => setRelatedProducts(res.data.filter(p => String(p.id) !== String(id)).slice(0, 4)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')
    if (!user) { navigate(`/login?redirect=/product/${id}`); return }
    if (!reviewRating) { setReviewError('Vui lòng chọn điểm đánh giá'); return }
    setReviewSubmitting(true)
    try {
      await reviewsAPI.submit(id, {
        rating:      reviewRating,
        comment:     reviewComment.trim(),
        author_name: user.full_name || user.email || '',
      })
      setReviewSuccess('Cảm ơn bạn đã đánh giá! Đánh giá của bạn đang chờ duyệt.')
      setReviewComment('')
      setReviewRating(5)
    } catch (err) {
      setReviewError(err.message)
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={40} className="animate-spin text-primary-500" />
    </div>
  )

  if (error || !product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error || 'Không tìm thấy sản phẩm'}</p>
        <Link to="/catalog" className="btn-secondary">Quay lại danh mục</Link>
      </div>
    </div>
  )

  const images   = product.images?.length ? product.images : (product.image ? [product.image] : [])
  const displayPrice    = selectedVariant?.price     ?? product.price
  const displayOldPrice = selectedVariant?.old_price ?? product.old_price
  const inStock         = selectedVariant ? selectedVariant.stock > 0 : true

  const prevImage = () => setSelectedImage(i => (i - 1 + images.length) % images.length)
  const nextImage = () => setSelectedImage(i => (i + 1) % images.length)

  const requireAuth = (action) => {
    if (!user) {
      navigate(`/login?redirect=/product/${id}`)
      return false
    }
    return action()
  }

  const handleAddToCart = () => requireAuth(() => {
    addItem({
      product_id:   product.id,
      variant_id:   selectedVariant?.id   ?? null,
      product_name: product.name,
      brand:        product.brand,
      size_label:   selectedVariant?.size_label ?? null,
      unit_price:   displayPrice,
      image_url:    product.image,
      quantity,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  })

  const handleBuyNow = () => requireAuth(() => {
    addItem({
      product_id:   product.id,
      variant_id:   selectedVariant?.id   ?? null,
      product_name: product.name,
      brand:        product.brand,
      size_label:   selectedVariant?.size_label ?? null,
      unit_price:   displayPrice,
      image_url:    product.image,
      quantity,
    })
    navigate('/cart')
  })

  const hasNotes = product.notes?.top?.length || product.notes?.heart?.length || product.notes?.base?.length

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-dark-900 border-b border-dark-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="text-sm text-gray-400">
            <Link to="/" className="hover:text-white transition">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link to="/catalog" className="hover:text-white transition">Nước hoa</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Product name — above image on all screens */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">

          {/* ── Product Images ─────────────────────── */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl overflow-hidden aspect-square group cursor-pointer"
              onClick={() => setLightbox(true)}
            >
              <img
                src={images[selectedImage] || product.image}
                alt={product.name}
                className="w-full h-full object-contain p-10 transition-opacity duration-300"
              />
              <button className="absolute bottom-4 right-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-dark-900 opacity-0 group-hover:opacity-100 transition hover:bg-white">
                <ZoomIn size={18} />
              </button>
              {images.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); prevImage() }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center text-dark-900 opacity-0 group-hover:opacity-100 transition hover:bg-white">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); nextImage() }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center text-dark-900 opacity-0 group-hover:opacity-100 transition hover:bg-white">
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 bg-gradient-to-br from-amber-50 to-rose-50 rounded-xl overflow-hidden border-2 transition ${
                      selectedImage === idx ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-transparent hover:border-dark-600'
                    }`}>
                    <img src={img} alt="" className="w-full h-full object-contain p-2" />
                  </button>
                ))}
              </div>
            )}

            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {images.map((_, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)}
                    className={`rounded-full transition-all ${selectedImage === idx ? 'w-5 h-2 bg-primary-500' : 'w-2 h-2 bg-dark-600 hover:bg-dark-500'}`}
                  />
                ))}
              </div>
            )}

            {/* Product badge — below image */}
            {product.badge && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  product.badge === 'SALE' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : product.badge === 'NEW' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>{product.badge}</span>
              </div>
            )}
          </div>

          {/* ── Product Info ─────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Brand + Name — desktop only (already shown above on mobile) */}
            <div className="hidden lg:block">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-primary-400 border border-primary-500/30 bg-primary-500/10 px-3 py-1 rounded-full">
                  {product.brand}
                </span>
                {product.badge && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    product.badge === 'SALE' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : product.badge === 'NEW' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>{product.badge}</span>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-serif font-bold leading-tight mb-3">{product.name}</h1>

              {/* Rating row */}
              {product.rating ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} className={i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-700'} />
                    ))}
                  </div>
                  <span className="font-bold text-sm">{product.rating}</span>
                  <span className="text-gray-500 text-sm">·</span>
                  <span className="text-gray-400 text-sm">{product.review_count ?? reviews.length} đánh giá</span>
                </div>
              ) : null}
            </div>

            {/* Divider */}
            <div className="border-t border-dark-800" />

            {/* Description */}
            {product.description && (
              <p className="text-gray-400 leading-relaxed text-[15px]">{product.description}</p>
            )}

            {/* Price – standalone (no variants) */}
            {(!product.variants || product.variants.length === 0) && (
              <div className="flex items-end gap-4 bg-dark-800/50 border border-dark-700 rounded-2xl px-5 py-4">
                <div className="text-3xl font-bold text-white">{formatVND(displayPrice)}</div>
                {displayOldPrice && (
                  <>
                    <div className="text-lg text-gray-500 line-through mb-0.5">{formatVND(displayOldPrice)}</div>
                    <span className="mb-0.5 text-sm font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                      -{Math.round((1 - displayPrice / displayOldPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Dung tích</span>
                  {selectedVariant && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      selectedVariant.stock > 0
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-red-500/15 text-red-400 border border-red-500/25'
                    }`}>
                      {selectedVariant.stock > 0 ? `Còn hàng (${selectedVariant.stock})` : 'Hết hàng'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map(v => {
                    const active = selectedVariant?.id === v.id
                    return (
                      <button key={v.id} onClick={() => setSelectedVariant(v)}
                        disabled={v.stock === 0}
                        className={`relative px-5 py-3 rounded-2xl border-2 transition-all duration-200 text-sm min-w-[90px] text-center ${
                          active
                            ? 'border-primary-500 bg-gradient-to-b from-primary-500/20 to-primary-600/10 text-primary-300 shadow-lg shadow-primary-500/10 scale-105'
                            : v.stock === 0
                              ? 'border-dark-700 text-gray-600 cursor-not-allowed opacity-40'
                              : 'border-dark-700 hover:border-dark-500 hover:bg-dark-800 text-white'
                        }`}>
                        <span className="block font-bold text-base">{v.size_label}</span>
                        <span className={`block text-xs mt-0.5 font-medium ${active ? 'text-primary-400' : 'text-gray-500'}`}>{formatVND(v.price)}</span>
                        {v.old_price && (
                          <span className="block text-[10px] text-gray-600 line-through">{formatVND(v.old_price)}</span>
                        )}
                        {active && (
                          <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                            <Check size={10} className="text-white" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Selected variant price highlight */}
                {selectedVariant && (
                  <div className="mt-4 flex items-end gap-3 bg-dark-800/50 border border-dark-700 rounded-2xl px-5 py-3.5">
                    <span className="text-2xl font-bold text-white">{formatVND(selectedVariant.price)}</span>
                    {selectedVariant.old_price && (
                      <>
                        <span className="text-base text-gray-500 line-through mb-0.5">{formatVND(selectedVariant.old_price)}</span>
                        <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full mb-0.5">
                          -{Math.round((1 - selectedVariant.price / selectedVariant.old_price) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quantity + Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 w-20 shrink-0">Số lượng</span>
                <div className="flex items-center bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-700 transition">
                    <Minus size={15} />
                  </button>
                  <span className="w-12 text-center text-base font-bold select-none">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)}
                    className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-700 transition">
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button onClick={handleAddToCart} disabled={!inStock}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    added
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/25'
                      : 'bg-dark-800 border-2 border-dark-600 hover:border-primary-500/50 hover:bg-dark-700 text-white'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}>
                  {added ? <Check size={17} /> : <ShoppingCart size={17} />}
                  {added ? 'Đã thêm!' : 'Thêm vào giỏ'}
                </button>
                <button onClick={handleBuyNow} disabled={!inStock}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-lg shadow-primary-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2">
                  Mua ngay
                </button>
                <button className="w-13 h-13 px-3.5 rounded-2xl border-2 border-dark-700 hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center transition-all duration-200 group flex-shrink-0">
                  <Heart size={20} className="text-gray-400 group-hover:text-red-400 group-hover:fill-red-400 transition-all" />
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 pt-5 border-t border-dark-800">
              {[
                { icon: Truck,     label: 'Miễn phí vận chuyển' },
                { icon: Shield,    label: 'Hàng chính hãng' },
                { icon: RotateCcw, label: 'Đổi trả dễ dàng' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-dark-800/40 border border-dark-800 hover:border-dark-700 transition">
                  <Icon className="text-primary-400" size={20} />
                  <div className="text-[11px] text-gray-400 text-center leading-tight">{label}</div>
                </div>
              ))}
            </div>

            {/* Scent Profile */}
            {(product.scent_intensity || product.longevity || product.sillage) ? (
              <div className="bg-dark-800/40 border border-dark-700 rounded-2xl p-5">
                <h3 className="font-bold mb-4 text-xs uppercase tracking-widest text-gray-400">Hồ sơ hương</h3>
                <div className="space-y-3">
                  {product.scent_intensity ? <ScentBar label="Cường độ" value={product.scent_intensity} /> : null}
                  {product.longevity       ? <ScentBar label="Độ lâu"   value={product.longevity}       /> : null}
                  {product.sillage        ? <ScentBar label="Độ tỏa"   value={product.sillage}          /> : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Fragrance Notes */}
        {hasNotes ? (
          <div className="card p-8 mb-12">
            <h2 className="text-2xl font-serif font-bold mb-6">Nốt hương</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {product.notes.top?.length   > 0 ? <NoteGroup title="Nốt hương đầu"  notes={product.notes.top}   /> : null}
              {product.notes.heart?.length > 0 ? <NoteGroup title="Nốt hương giữa" notes={product.notes.heart} /> : null}
              {product.notes.base?.length  > 0 ? <NoteGroup title="Nốt hương nền"  notes={product.notes.base}  /> : null}
            </div>
          </div>
        ) : null}

        {/* Thông tin chi tiết */}
        {product.details && (
          <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-hidden mb-8 sm:mb-12">
            <button
              type="button"
              onClick={() => setDetailsOpen(v => !v)}
              className="w-full px-5 sm:px-8 py-4 sm:py-5 border-b border-dark-800 bg-dark-800/40 flex items-center gap-3 hover:bg-dark-800/70 transition text-left"
            >
              <div className="w-1 h-5 bg-primary-500 rounded-full shrink-0" />
              <h2 className="text-base sm:text-lg font-bold flex-1">Thông tin chi tiết</h2>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-300 ${detailsOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {detailsOpen && (
              <div className="px-5 sm:px-8 py-5 sm:py-7 text-gray-300 text-sm leading-7 whitespace-pre-wrap">
                {product.details}
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <MessageCircle className="text-primary-400" size={22} />
            <h2 className="text-2xl font-serif font-bold">Đánh giá khách hàng</h2>
            {reviews.length > 0 && (
              <span className="px-2.5 py-0.5 bg-primary-600/20 text-primary-400 text-sm rounded-full font-bold border border-primary-500/20">
                {reviews.length}
              </span>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              {reviews.map(review => (
                <div key={review.id} className="group bg-dark-900 border border-dark-800 hover:border-dark-700 rounded-2xl p-6 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {review.author?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{review.author}</div>
                        <div className="text-xs text-gray-500">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString('vi-VN') : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-700'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-10">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
          )}

          {/* Submit review form */}
          <div className="card p-6 md:p-8 bg-dark-900">
            <h3 className="text-lg font-semibold mb-6 text-white">Viết đánh giá của bạn</h3>

{reviewSuccess ? (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-4 rounded-xl text-sm">
                <Check size={18} />
                {reviewSuccess}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                {reviewError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                    {reviewError}
                  </div>
                )}

                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-wide mb-2 text-white">Điểm đánh giá *</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                        className="p-1 transition"
                      >
                        <Star
                          size={28}
                          className={
                            star <= (reviewHover || reviewRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-600 hover:text-amber-400'
                          }
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-400 self-center">
                      {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][reviewRating]}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-wide mb-2 text-white">Nhận xét</label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                    className="w-full px-4 py-3 bg-black border border-dark-700 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                {!user && (
                  <p className="text-sm text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    Bạn chưa đăng nhập — nhấn gửi để chuyển đến trang đăng nhập.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {reviewSubmitting
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} />}
                  {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 ? (
          <div>
            <h2 className="text-2xl font-serif font-bold mb-8">Bạn cũng có thể thích</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        ) : null}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-6 text-white/60 hover:text-white text-4xl leading-none" onClick={() => setLightbox(false)}>×</button>
          <img src={images[selectedImage]} alt={product.name} className="max-w-full max-h-[90vh] object-contain" onClick={e => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prevImage() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
                <ChevronLeft size={24} />
              </button>
              <button onClick={e => { e.stopPropagation(); nextImage() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ScentBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold">{value}/10</span>
      </div>
      <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  )
}

function NoteGroup({ title, notes }) {
  return (
    <div>
      <h3 className="font-semibold text-primary-400 mb-3 text-sm uppercase tracking-wider">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {notes.map(note => (
          <span key={note} className="px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-full text-sm">{note}</span>
        ))}
      </div>
    </div>
  )
}