import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Minus, X, Tag, Lock, ArrowRight, Loader2, CheckCircle, Truck, QrCode, Landmark } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { formatVND } from '../utils/currency'
import { promoAPI, ordersAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const PAYMENT_METHODS = [
  { value: 'cod',      label: 'Thanh toán khi nhận hàng', sub: 'COD',                     Icon: Truck,    color: 'text-amber-400'  },
  { value: 'atm_card', label: 'Thẻ ATM (qua MoMo)',       sub: 'Chuyển hướng sang MoMo để thanh toán', Icon: Landmark, color: 'text-pink-400'   },
  { value: 'vietqr',   label: 'VietQR',                   sub: 'Quét mã QR ngân hàng',    Icon: QrCode,   color: 'text-teal-400'   },
]

function PaymentInstructions() { return null }

export default function ShoppingCartPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { items: cartItems, updateQty, removeItem, clearCart } = useCart()

  const [promoCode, setPromoCode]   = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState('')

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [orderForm, setOrderForm]       = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    shipping_address: '', shipping_ward: '', shipping_district: '', shipping_city: '',
    payment_method: 'cod', note: ''
  })
  const [ordering, setOrdering]         = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [orderError, setOrderError]     = useState('')
  const [paidMethod, setPaidMethod]     = useState('cod')

  const updateQuantity = (id, newQty) => updateQty(id, newQty)

  const subtotal = cartItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const shipping = 0
  const discount = appliedPromo ? appliedPromo.discount_amount : 0
  const total    = subtotal - discount + shipping

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const res = await promoAPI.validate(promoCode.trim(), subtotal)
      setAppliedPromo(res.data)
    } catch (err) {
      setPromoError(err.message)
      setAppliedPromo(null)
    } finally {
      setPromoLoading(false)
    }
  }

  const openCheckout = () => {
    if (!user) { navigate('/login?redirect=/cart'); return }
    setOrderForm(f => ({
      ...f,
      customer_name:  user?.full_name || '',
      customer_email: user?.email     || '',
      customer_phone: user?.phone     || '',
    }))
    setOrderError('')
    setOrderSuccess(null)
    setCheckoutOpen(true)
  }

  const handleOrder = async (e) => {
    e.preventDefault()
    if (cartItems.length === 0) return
    
    // Validate that all items have size_label
    const itemsWithoutSize = cartItems.filter(i => !i.size_label)
    if (itemsWithoutSize.length > 0) {
      setOrderError('Tất cả sản phẩm phải có dung tích. Vui lòng kiểm tra lại giỏ hàng.')
      return
    }
    
    setOrdering(true)
    setOrderError('')
    try {
      const payload = {
        ...orderForm,
        items: cartItems.map(i => ({
          product_id:   i.product_id,
          variant_id:   i.variant_id,
          product_name: i.product_name,
          size_label:   i.size_label,
          unit_price:   i.unit_price,
          quantity:     i.quantity,
          image_url:    i.image_url,
        })),
        subtotal,
        discount_amount: discount,
        shipping_fee:    shipping,
        promo_code: appliedPromo?.code || undefined,
      }
      const res = await ordersAPI.create(payload)
      const newOrderId = res.data.id
      clearCart()
      setAppliedPromo(null)
      // For ATM / VietQR → redirect to dedicated payment page
      if (['atm_card', 'vietqr'].includes(orderForm.payment_method)) {
        navigate(
          `/payment/${newOrderId}?method=${orderForm.payment_method}&total=${total}&name=${encodeURIComponent(orderForm.customer_name)}&phone=${encodeURIComponent(orderForm.customer_phone || '')}`
        )
        return
      }
      setOrderSuccess(newOrderId)
      setPaidMethod(orderForm.payment_method)
    } catch (err) {
      setOrderError(err.message)
    } finally {
      setOrdering(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="bg-dark-900 border-b border-dark-800">
        <div className="container mx-auto px-3 xs:px-4 py-4 xs:py-5 sm:py-6 md:py-8">
          <nav className="text-xs xs:text-sm text-gray-400 mb-2 xs:mb-3">
            <Link to="/" className="hover:text-white transition">Trang chủ</Link>
            <span className="mx-1.5 xs:mx-2">/</span>
            <span>Giỏ hàng</span>
          </nav>
          <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-serif font-bold">Giỏ hàng của bạn</h1>
          <p className="text-gray-400 mt-1.5 xs:mt-2 text-xs xs:text-sm">{cartItems.length} sản phẩm</p>
        </div>
      </div>

      <div className="container mx-auto px-3 xs:px-4 py-4 xs:py-6 sm:py-8 md:py-12">
        {cartItems.length === 0 ? (
          <div className="text-center py-16 xs:py-20">
            <p className="text-gray-400 text-base xs:text-lg mb-4 xs:mb-6">Giỏ hàng của bạn đang trống</p>
            <Link to="/catalog" className="btn-primary inline-flex items-center text-sm xs:text-base">
              Mua sắm ngay <ArrowRight className="ml-2 w-4 h-4 xs:w-5 xs:h-5" />
            </Link>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-2 xs:space-y-3 sm:space-y-4">
            {cartItems.map(item => (
                <div key={item.id} className="card p-2.5 xs:p-3 sm:p-4 md:p-5">
                <div className="flex gap-2 xs:gap-3 sm:gap-4 items-start sm:items-center">
                    <img src={item.image_url} alt={item.product_name} className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 object-contain rounded-lg bg-gradient-to-br from-amber-50 to-pink-50 p-1 xs:p-1.5 sm:p-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-xs xs:text-sm sm:text-base truncate">{item.product_name}</h3>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-gray-400">{item.brand}</p>
                        {item.size_label && <p className="text-[10px] xs:text-xs text-gray-500">{item.size_label}</p>}
                      </div>
                      <button onClick={() => removeItem(item.id)} className="shrink-0 text-gray-400 hover:text-red-400 transition p-0.5 xs:p-1 touch-target">
                        <X size={14} className="xs:w-4 xs:h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 xs:gap-3 mt-1.5 xs:mt-2 sm:mt-3">
                      <div className="flex items-center">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded border border-dark-700 hover:border-primary-600 flex items-center justify-center transition touch-target">
                          <Minus size={11} className="xs:w-3 xs:h-3" />
                        </button>
                        <span className="w-6 xs:w-7 sm:w-8 text-center text-xs xs:text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded border border-dark-700 hover:border-primary-600 flex items-center justify-center transition touch-target">
                          <Plus size={11} className="xs:w-3 xs:h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-xs xs:text-sm sm:text-base text-primary-400">{formatVND(item.unit_price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-4 xs:p-5 sm:p-6 sticky top-20 sm:top-24">
              <h2 className="text-lg xs:text-xl font-serif font-bold mb-4 xs:mb-6">Tóm tắt đơn hàng</h2>
              <div className="space-y-2 xs:space-y-3 mb-4 xs:mb-6">
                <div className="flex justify-between text-xs xs:text-sm text-gray-400">
                  <span>Tạm tính:</span>
                  <span className="text-white font-semibold">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs xs:text-sm text-gray-400">
                  <span>Vận chuyển:</span>
                  <span className="text-green-400 font-semibold">MIỄN PHÍ</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-xs xs:text-sm text-green-400">
                    <span>Giảm giá ({appliedPromo.code}):</span>
                    <span className="font-semibold">-{formatVND(discount)}</span>
                  </div>
                )}
              </div>

              {/* Promo Code */}
              <div className="border-t border-dark-800 pt-3 xs:pt-4 mb-4 xs:mb-4">
                <label className="block text-xs xs:text-sm font-semibold mb-1.5 xs:mb-2">MÃ KHUYẾN MÃI</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value); setPromoError('') }}
                    placeholder="Nhập mã"
                    className="flex-1 px-2.5 xs:px-3 py-1.5 xs:py-2 bg-dark-800 border border-dark-700 rounded-lg text-xs xs:text-sm focus:outline-none focus:border-primary-600"
                  />
                  <button
                    onClick={applyPromo}
                    disabled={promoLoading}
                    className="px-2.5 xs:px-3 py-1.5 xs:py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg text-xs xs:text-sm font-semibold transition disabled:opacity-50 flex items-center gap-1 touch-target"
                  >
                    {promoLoading ? <Loader2 size={12} className="xs:w-3 xs:h-3 animate-spin" /> : null}
                    <span className="hidden xs:inline">ÁP DỤNG</span>
                  </button>
                </div>
                {promoError && <p className="text-red-400 text-[10px] xs:text-xs mt-1">{promoError}</p>}
                {appliedPromo && <p className="text-green-400 text-[10px] xs:text-xs mt-1">Đã áp dụng mã {appliedPromo.code}!</p>}
              </div>

              <div className="border-t border-dark-800 pt-3 xs:pt-4 mb-4 xs:mb-6">
                <div className="flex justify-between items-center text-base xs:text-lg sm:text-xl font-bold">
                  <span>TỔNG</span>
                  <span className="text-primary-400">{formatVND(total)}</span>
                </div>
              </div>

              <button onClick={openCheckout} className="w-full btn-primary flex items-center justify-center text-sm xs:text-base touch-target">
                <Lock className="mr-2 w-4 h-4 xs:w-5 xs:h-5" />
                THANH TOÁN
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 xs:px-5 sm:px-6 py-3 xs:py-4 border-b border-dark-800 sticky top-0 bg-dark-900/95">
              <h2 className="font-bold text-base xs:text-lg">Thông tin giao hàng</h2>
              <button onClick={() => setCheckoutOpen(false)} className="text-gray-400 hover:text-white transition touch-target">
                <X size={20} />
              </button>
            </div>

            {orderSuccess ? (
              <div className="p-6 xs:p-8 text-center">
                <CheckCircle size={48} className="xs:w-14 xs:h-14 text-green-400 mx-auto mb-4 xs:mb-6" />
                <h3 className="text-lg xs:text-xl font-bold mb-2">Đặt hàng thành công!</h3>
                <p className="text-gray-400 mb-1 text-sm xs:text-base">Mã đơn hàng: <span className="text-primary-400 font-bold">#{orderSuccess}</span></p>
                <p className="text-gray-500 text-xs xs:text-sm">Chúng tôi sẽ liên hệ xác nhận đơn hàng sớm nhất.</p>
                <PaymentInstructions method={paidMethod} orderId={orderSuccess} />
                <button onClick={() => setCheckoutOpen(false)} className="btn-secondary mt-4 xs:mt-6 text-sm xs:text-base">Đóng</button>
              </div>
            ) : (
              <form onSubmit={handleOrder} className="p-4 xs:p-5 sm:p-6 space-y-3 xs:space-y-4">
                {orderError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs xs:text-sm px-3 xs:px-4 py-2 xs:py-3 rounded-lg">{orderError}</div>
                )}

                <div className="grid grid-cols-2 gap-2.5 xs:gap-3 sm:gap-4">
                  <CField label="Họ *"      name="customer_name"  value={orderForm.customer_name}  onChange={setOrderForm} required />
                  <CField label="Email *"        name="customer_email" value={orderForm.customer_email} onChange={setOrderForm} type="email" required />
                </div>
                <CField label="Số điện thoại" name="customer_phone" value={orderForm.customer_phone} onChange={setOrderForm} />
                <CField label="Địa chỉ *"       name="shipping_address" value={orderForm.shipping_address} onChange={setOrderForm} required />
                <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 xs:gap-3">
                  <CField label="Phường/Xã *"  name="shipping_ward"     value={orderForm.shipping_ward}     onChange={setOrderForm} required />
                  <CField label="Quận/Huyện *" name="shipping_district" value={orderForm.shipping_district} onChange={setOrderForm} required />
                  <CField label="Tỉnh/TP *"  name="shipping_city"     value={orderForm.shipping_city}     onChange={setOrderForm} required />
                </div>

                <div>
                  <label className="block text-xs xs:text-sm text-gray-400 mb-1.5 xs:mb-2">Phương thức thanh toán</label>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3">
                    {PAYMENT_METHODS.map(({ value, label, sub, Icon, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setOrderForm(f => ({ ...f, payment_method: value }))}
                        className={`flex items-center gap-2 xs:gap-3 px-2.5 xs:px-3 py-2 xs:py-2.5 rounded-xl border text-left transition text-xs xs:text-sm ${
                          orderForm.payment_method === value
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                        }`}
                      >
                        <Icon size={16} className={`xs:w-5 xs:h-5 ${color}`} />
                        <div className="min-w-0">
                          <p className="text-xs xs:text-sm font-semibold text-white leading-tight">{label}</p>
                          <p className="text-[10px] xs:text-xs text-gray-500 truncate">{sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ghi chú</label>
                  <textarea
                    rows={2}
                    value={orderForm.note}
                    onChange={e => setOrderForm(f => ({ ...f, note: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white resize-none focus:outline-none focus:border-primary-500"
                    placeholder="Ghi chu cho don hang..."
                  />
                </div>

                <div className="bg-dark-800 rounded-xl p-4 text-sm">
                  <div className="flex justify-between mb-1 text-gray-400"><span>Tam tinh:</span><span>{formatVND(subtotal)}</span></div>
                  {discount > 0 && <div className="flex justify-between mb-1 text-green-400"><span>Giam gia:</span><span>-{formatVND(discount)}</span></div>}
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-dark-700">
                    <span>Tong cong:</span><span className="text-primary-400">{formatVND(total)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setCheckoutOpen(false)} className="flex-1 px-4 py-2.5 border border-dark-600 rounded-lg text-sm hover:bg-dark-700 transition">Huy</button>
                  <button type="submit" disabled={ordering} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                    {ordering && <Loader2 size={15} className="animate-spin" />}
                    Xac nhan dat hang
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CField({ label, name, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(f => ({ ...f, [name]: e.target.value }))}
        className="w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
      />
    </div>
  )
}