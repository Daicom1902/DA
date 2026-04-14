import { Award, Heart, Sparkles, Users, Globe, Shield } from 'lucide-react'

export default function AboutPage() {

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1200)',
            filter: 'brightness(0.3)'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950/50 to-dark-950"></div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 md:mb-6">
              Giới thiệu về chúng tôi
          </h1>
          <p className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto">
            Hành trình tạo nên những hương thơm đẳng cấp và sang trọng
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-12 md:py-20 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <span className="text-primary-400 text-xs md:text-sm font-semibold uppercase tracking-wider">
            CÂU CHUYỆN CỦA CHÚNG TÔI
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold mt-2 mb-4 md:mb-6">
              Hành trình của sự xuất sắc về khứu giác
            </h2>
            <div className="space-y-4 text-sm md:text-base text-gray-400">
              <p>Được thành lập vào năm 2001, LUXE FRAGRANCE bắt đầu với một tầm nhìn đơn giản: mang đến những hương thơm cao cấp và tinh tế nhất thế giới cho những người sành điệu tại Việt Nam.</p>
              <p>Qua hơn hai thập kỷ, chúng tôi đã phát triển thành một trong những nhà phân phối nước hoa cao cấp hàng đầu, hợp tác với các thương hiệu danh tiếng nhất từ Paris đến New York, từ Milan đến Tokyo.</p>
              <p>Niềm đam mê của chúng tôi nằm ở việc giúp mỗi khách hàng tìm thấy hương thơm đặc trưng của riêng mình - một hương thơm kể câu chuyện của họ, thể hiện cá tính và để lại ấn tượng khó phai.</p>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1595535873420-a599195b3f4a?w=800" 
              alt="Our Story"
              className="rounded-lg shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-primary-600/10 rounded-lg -z-10"></div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 md:py-20 bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-primary-400 text-xs md:text-sm font-semibold uppercase tracking-wider">
              GIÁ TRỊ CỐT LÕI
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold mt-2">
              Những gì chúng tôi tin tưởng
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="card p-6 md:p-8 text-center hover:border-primary-600 transition">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-primary-400" size={28} />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">Chất lượng vượt trội</h3>
              <p className="text-sm md:text-base text-gray-400">Chúng tôi chỉ tuyển chọn những thương hiệu và sản phẩm tốt nhất, đảm bảo 100% chính hãng và chất lượng cao nhất.</p>
            </div>

            <div className="card p-6 md:p-8 text-center hover:border-primary-600 transition">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-primary-400" size={28} />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">Đổi mới sáng tạo</h3>
              <p className="text-sm md:text-base text-gray-400">Luôn tìm kiếm những hương thơm độc đáo và xu hướng mới nhất trong ngành công nghiệp nước hoa toàn cầu.</p>
            </div>

            <div className="card p-6 md:p-8 text-center hover:border-primary-600 transition">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-primary-400" size={28} />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">Tận tâm phục vụ</h3>
              <p className="text-sm md:text-base text-gray-400">Mỗi khách hàng đều nhận được sự tư vấn chuyên nghiệp và chăm sóc tận tình từ đội ngũ chuyên gia của chúng tôi.</p>
            </div>

            <div className="card p-6 md:p-8 text-center hover:border-primary-600 transition">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-primary-400" size={28} />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">Đảm bảo chính hãng</h3>
              <p className="text-sm md:text-base text-gray-400">Cam kết 100% sản phẩm chính hãng được nhập khẩu trực tiếp từ các nhà sản xuất và nhà phân phối ủy quyền.</p>
            </div>

            <div className="card p-6 md:p-8 text-center hover:border-primary-600 transition">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="text-primary-400" size={28} />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">Trách nhiệm môi trường</h3>
              <p className="text-sm md:text-base text-gray-400">Ưu tiên các thương hiệu có trách nhiệm với môi trường và thực hành bền vững.</p>
            </div>

            <div className="card p-6 md:p-8 text-center hover:border-primary-600 transition">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-primary-400" size={28} />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">Cộng đồng đam mê</h3>
              <p className="text-sm md:text-base text-gray-400">Xây dựng một cộng đồng những người yêu thích nước hoa, chia sẻ kiến thức và đam mê về hương thơm.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 md:py-20 container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <span className="text-primary-400 text-xs md:text-sm font-semibold uppercase tracking-wider">
            GẶP GỠ ĐỘI NGŨ
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold mt-2">
            Những người đằng sau hương thơm
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {[
            { name: 'Sophie Laurent', role: 'Người sáng lập & CEO', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
            { name: 'Marc Dubois', role: 'Chuyên gia nước hoa chính', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
            { name: 'Elena Rodriguez', role: 'Giám đốc sáng tạo', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400' },
            { name: 'James Chen', role: 'Trưởng phòng vận hành', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400' }
          ].map((member, index) => (
            <div key={index} className="text-center group">
              <div className="relative overflow-hidden rounded-lg mb-3 md:mb-4 aspect-square">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-1">{member.name}</h3>
              <p className="text-xs md:text-sm text-primary-400">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-400 mb-2">25+</div>
              <p className="text-sm md:text-base text-gray-400">Năm kinh nghiệm</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-400 mb-2">500+</div>
              <p className="text-sm md:text-base text-gray-400">Sản phẩm cao cấp</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-400 mb-2">50K+</div>
              <p className="text-sm md:text-base text-gray-400">Khách hàng hài lòng</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-400 mb-2">98%</div>
              <p className="text-sm md:text-base text-gray-400">Tỷ lệ hài lòng</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
