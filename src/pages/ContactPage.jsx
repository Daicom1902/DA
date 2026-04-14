import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send, Loader2, CheckCircle } from 'lucide-react'
import { contactAPI } from '../utils/api'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await contactAPI.send(formData)
      setSuccess(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-dark-900 border-b border-dark-800 py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy gửi tin nhắn và chúng tôi sẽ phản hồi trong thời gian sớm nhất.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold mb-6">Thông tin liên hệ</h2>
              
              <div className="space-y-6">
                {/* Address */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-primary-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm md:text-base">Địa chỉ</h3>
                    <p className="text-sm md:text-base text-gray-400">123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh, Việt Nam</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="text-primary-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm md:text-base">Điện thoại</h3>
                    <p className="text-sm md:text-base text-gray-400">+84 123 456 789</p>
                    <p className="text-sm md:text-base text-gray-400">+84 987 654 321</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="text-primary-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm md:text-base">Email</h3>
                    <p className="text-sm md:text-base text-gray-400">info@luxefragrance.vn</p>
                    <p className="text-sm md:text-base text-gray-400">support@luxefragrance.vn</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="text-primary-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm md:text-base">Giờ làm việc</h3>
                    <p className="text-sm md:text-base text-gray-400">Thứ 2 - Thứ 6: 9:00 - 21:00</p>
                    <p className="text-sm md:text-base text-gray-400">Thứ 7 - Chủ nhật: 10:00 - 22:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="pt-6 border-t border-dark-800">
              <h3 className="font-semibold mb-4 text-sm md:text-base">Theo dõi chúng tôi</h3>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-dark-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-dark-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-dark-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="card p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-serif font-bold mb-6">Gửi tin nhắn cho chúng tôi</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Họ và tên</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-primary-600 transition text-sm md:text-base"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email của bạn</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-primary-600 transition text-sm md:text-base"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-primary-600 transition text-sm md:text-base"
                      placeholder="+84 123 456 789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tiêu đề</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-primary-600 transition text-sm md:text-base"
                      placeholder="Tôi muốn hỏi về..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nội dung</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-primary-600 transition resize-none text-sm md:text-base"
                    placeholder="Viết tin nhắn của bạn tại đây..."
                  ></textarea>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto inline-flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </button>

                {success && (
                  <div className="flex items-center gap-2 text-green-400 text-sm mt-2">
                    <CheckCircle size={16} /> Tin nhắn đã được gửi thành công!
                  </div>
                )}
                {error && (
                  <div className="text-red-400 text-sm mt-2">{error}</div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <section className="h-[300px] md:h-[400px] bg-dark-800">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.325743120321!2d106.66408931533432!3d10.786346192314928!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752ed23c800000%3A0x302feb869ca48d!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBLaG9hIGjhu41jIFThu7Egbmhpw6puIC0gxJDhuqFpIGjhu41jIFF14buRYyBnaWEgVFAuSENN!5e0!3m2!1svi!2s!4v1234567890"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </section>
    </div>
  )
}
