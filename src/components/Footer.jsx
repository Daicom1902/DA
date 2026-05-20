import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

export default function Footer() {

  return (
    <footer className="bg-dark-950 border-t border-dark-800 mt-12 sm:mt-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="xs:col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-full"></div>
              <span className="text-base sm:text-lg font-serif font-bold">LUXE FRAGRANCE</span>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mb-4 leading-relaxed">
              Định nghĩa sự sang trọng thông qua sự xuất sắc về khứu giác. Khám phá bộ sưu tập nước hoa tinh tế được tuyển chọn.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Cửa Hàng</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
              <li><Link to="/catalog" className="hover:text-white transition">Hàng mới về</Link></li>
              <li><a href="#" className="hover:text-white transition">Bán chạy nhất</a></li>
              <li><a href="#" className="hover:text-white transition">Bộ khám phá</a></li>
              <li><a href="#" className="hover:text-white transition">Ý tưởng quà tặng</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">HỔ TRỢ</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
              <li><a href="#" className="hover:text-white transition">Vận chuyển &amp; Đổi trả</a></li>
              <li><Link to="/contact" className="hover:text-white transition">Liên hệ</Link></li>
              <li><a href="#" className="hover:text-white transition">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="hover:text-white transition">Chính sách bảo mật</a></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">CHĂM SÓC KHÁCH HÀNG</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
              <li>
                <p className="font-medium text-white">Cần hỗ trợ?</p>
                <p>+84 20 7123 5678</p>
              </li>
              <li>
                <p className="font-medium text-white">Email</p>
                <p className="break-all">hello@luxefragrance.com</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-dark-800 mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">© 2025 LUXE FRAGRANCE. Tất cả quyền được bảo lưu.</p>
          
          <div className="flex items-center space-x-5 sm:space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition touch-target flex items-center justify-center">
              <Facebook size={18} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition touch-target flex items-center justify-center">
              <Instagram size={18} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition touch-target flex items-center justify-center">
              <Twitter size={18} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition touch-target flex items-center justify-center">
              <Youtube size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
