# Luxe Fragrance - Luxury Perfume E-commerce

Website thương mại điện tử cao cấp cho nước hoa, được xây dựng với ReactJS và Tailwind CSS.

## 🚀 Tính năng

- **Trang chủ (Homepage)**: Hero section đẹp mắt, featured collections, discover section, newsletter
- **Trang danh mục (Catalog)**: Filters sidebar đầy đủ, product grid responsive, pagination
- **Trang chi tiết sản phẩm (Product Detail)**: Gallery hình ảnh, thông tin chi tiết, scent profile, reviews
- **Trang giỏ hàng (Shopping Cart)**: Quản lý giỏ hàng, order summary, promo codes, recommendations

## 🛠️ Công nghệ sử dụng

- **ReactJS** - Library UI
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

## 📦 Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Chạy development server:
```bash
npm run dev
```

3. Mở trình duyệt tại: `http://localhost:3000`

## 📂 Cấu trúc thư mục

```
src/
├── components/          # Shared components
│   ├── Header.jsx
│   ├── Footer.jsx
│   ├── Layout.jsx
│   └── ProductCard.jsx
├── pages/              # Page components
│   ├── HomePage.jsx
│   ├── CatalogPage.jsx
│   ├── ProductDetailPage.jsx
│   └── ShoppingCartPage.jsx
├── App.jsx             # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## 🎨 Design Features

- Dark theme với gradient accents
- Responsive design (mobile, tablet, desktop)
- Smooth animations và transitions
- Modern UI/UX với Tailwind CSS
- Component-based architecture

## 🌟 Highlights

- **Performance**: Vite cho build và HMR nhanh
- **Responsive**: Hoạt động tốt trên mọi thiết bị
- **Accessible**: Semantic HTML và ARIA labels
- **Maintainable**: Component reusability cao

## 📝 Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build

## 🎯 Routes

- `/` - Trang chủ
- `/catalog` - Danh mục sản phẩm
- `/product/:id` - Chi tiết sản phẩm
- `/cart` - Giỏ hàng

---

Developed with ❤️ using ReactJS & Tailwind CSS
