import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

export default function Footer() {

  return (
    <footer className="bg-dark-950 border-t border-dark-800 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-full"></div>
              <span className="text-lg font-serif font-bold">LUXE FRAGRANCE</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Định nghĩa sự sang trọng thông qua sự xuất sắc về khứu giác. Khám phá bộ sưu tập nước hoa tinh tế được tuyển chọn, từ những tác phẩm kinh điển vượt thời gian đến những sáng tạo hương thơm tiên phong.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold mb-4">Cửa Hàng</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/catalog" className="hover:text-white transition">Hàng mới về</Link></li>
              <li><a href="#" className="hover:text-white transition">Bán chạy nhất</a></li>
              <li><a href="#" className="hover:text-white transition">Bộ khám phá</a></li>
              <li><a href="#" className="hover:text-white transition">Ý tưởng quà tặng</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">HỔ TRỢ</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition">Vận chuyển &amp; Đổi trả</a></li>
              <li><a href="#" className="hover:text-white transition">Liên hệ</a></li>
              <li><a href="#" className="hover:text-white transition">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="hover:text-white transition">Chính sách bảo mật</a></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="font-semibold mb-4">CHĂM SÓC KHÁCH HÀNG</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <p className="font-medium text-white">Cần hỗ trợ?</p>
                <p>+44 20 7123 5678</p>
              </li>
              <li>
                <p className="font-medium text-white">Email</p>
                <p>hello@luxefragrance.com</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-dark-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2025 LUXE FRAGRANCE. Tất cả quyền được bảo lưu.</p>
          
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              <Instagram size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              <Youtube size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
