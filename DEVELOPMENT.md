# Hướng Dẫn Thiết Lập Môi Trường Phát Triển (Luxe Fragrance)

Tài liệu này hướng dẫn chi tiết cách thiết lập môi trường phát triển cục bộ (Local Development Environment) cho dự án **Luxe Fragrance - Luxury Perfume E-commerce**.

---

## 🛠️ 1. Yêu Cầu Hệ Thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

1. **Node.js**: Phiên bản LTS mới nhất (Khuyên dùng từ `v18.x` hoặc `v20.x` trở lên).
2. **XAMPP / MySQL**:
   - Sử dụng **XAMPP** để chạy dịch vụ **MySQL Database** (cổng mặc định `3306`) và quản lý thông qua **phpMyAdmin**.
3. **Python 3.x** (Tùy chọn):
   - Để chạy các script tạo tài liệu thiết kế CSDL (`generate_database_doc.py`) hoặc sơ đồ ERD (`generate_erd_diagram.py`).
4. **Git**: Để quản lý mã nguồn.
5. **Code Editor**: VS Code (khuyên dùng) hoặc các editor tương tự.

---

## 📂 2. Cấu Trúc Dự Án

Dự án được cấu trúc theo dạng Client-Server nguyên bản nhưng chạy song song thông qua cơ chế proxy của Vite:

- **Frontend**: ReactJS + Tailwind CSS (Vite build tool, chạy ở cổng `3000`).
- **Backend (API Server)**: Node.js + Express + MySQL (chạy ở cổng `5000`).
- **Scripts**: Các script Python tạo sơ đồ và tài liệu.

---

## ⚙️ 3. Các Bước Thiết Lập Chi Tiết

### Bước 3.1. Cài Đặt Node.js Dependencies
Tại thư mục gốc của dự án (`c:\xampp\htdocs\DA`), chạy lệnh cài đặt tất cả các package phụ thuộc cho cả client và server:

```bash
npm install
```

### Bước 3.2. Cấu Hình Biến Môi Trường (`.env`)
Tạo file `.env` tại thư mục gốc (nếu chưa có). Bạn có thể sao chép cấu hình mẫu từ `.env` hiện tại và thay đổi các thông số cần thiết:

```env
# Kết nối Cơ sở dữ liệu (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=datn_perfume

# Cổng chạy API Server (Backend)
PORT=5000

# JSON Web Token Secret Key
JWT_SECRET=luxe_fragrance_super_secret_key_2025

# Google OAuth Credentials (Dành cho Đăng nhập bằng Google)
GOOGLE_CLIENT_ID=591189718947-og62hv9bav1hf69mjmq6kvrrl412h09r.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=591189718947-og62hv9bav1hf69mjmq6kvrrl412h09r.apps.googleusercontent.com

# Cấu hình SMTP Email (Gửi mã OTP khi quên mật khẩu)
# Nếu để trống, OTP sẽ tự động hiển thị trực tiếp trên giao diện Console/Log để test.
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=20224329@eaut.edu.vn
SMTP_PASS=wafo nwop feja zhao
SMTP_FROM="LUMIÈRE <20224329@eaut.edu.vn>"

# Cấu hình MoMo Sandbox (Cổng thanh toán thử nghiệm)
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:3000/payment/momo-return
MOMO_IPN_URL=http://localhost:5000/api/orders/momo-ipn
APP_URL=http://localhost:3000

# API Keys AI (Dùng cho chatbot hỗ trợ nước hoa)
# Google Gemini AI (Miễn phí tại https://aistudio.google.com/app/apikey)
GOOGLE_AI_API_KEY=AIzaSyCZjDOF3VM9QYn3QWhyrzhbQ4P-oyGBcQU

# Anthropic Claude AI (Tùy chọn)
ANTHROPIC_API_KEY=

# Groq AI (Llama 3.3 70B - Siêu nhanh, miễn phí tại https://console.groq.com/keys)
GROQ_API_KEY=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
```

### Bước 3.3. Thiết Lập Cơ Sở Dữ Liệu MySQL (XAMPP)
1. Khởi động **XAMPP Control Panel** và nhấn **Start** cho cả **Apache** và **MySQL**.
2. Truy cập vào **phpMyAdmin** qua đường dẫn: `http://localhost/phpmyadmin/`.
3. Tạo một Cơ sở dữ liệu mới với tên là `datn_perfume` (hoặc tên bất kỳ trùng với biến `DB_NAME` trong `.env`), chọn kiểu mã hóa (Collation) là `utf8mb4_unicode_ci`.
4. Import file CSDL ban đầu:
   - Click chọn database `datn_perfume`.
   - Chọn tab **Import** (Nhập).
   - Chọn tệp từ máy tính: `c:\xampp\htdocs\DA\database\datn_perfume.sql`.
   - Nhấn **Go** (Thực hiện) ở cuối trang để hoàn tất quá trình import.
5. Chạy lệnh Migration để cập nhật cấu trúc bảng mới nhất (như thêm cột giới tính `gender` và bảng lưu trữ giỏ hàng `shopping_carts`):
   ```bash
   node server/run-migrations.js
   ```

### Bước 3.4. Cấu Hóa Python Virtual Environment (Tùy chọn)
Nếu bạn cần chạy các script Python để tự động tạo tài liệu word hay sơ đồ:
1. Tạo môi trường ảo (Virtual Environment):
   ```bash
   python -m venv .venv
   ```
2. Kích hoạt môi trường ảo:
   - Trên Windows (PowerShell):
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - Trên Windows (CMD):
     ```cmd
     .venv\Scripts\activate.bat
     ```
3. Cài đặt các package cần thiết:
   ```bash
   pip install python-docx matplotlib networkx
   ```
4. Chạy script tạo tài liệu:
   ```bash
   python generate_database_doc.py
   ```

---

## 🚀 4. Khởi Chạy Ứng Dụng

Sau khi hoàn tất cấu hình, bạn cần chạy song song cả **Backend API Server** và **Frontend Dev Server**:

### 1. Khởi chạy Backend Server (API)
Mở một cửa sổ dòng lệnh (terminal) mới và chạy:
```bash
npm run server:dev
```
*Lệnh này sử dụng chế độ `--watch` để tự động khởi động lại backend server mỗi khi có thay đổi trong thư mục `/server`.*
- Server API sẽ chạy ở địa chỉ: `http://localhost:5000`
- Bạn có thể kiểm tra trạng thái hoạt động của Server thông qua Endpoint kiểm tra sức khỏe (Health Check): `http://localhost:5000/api/health`

### 2. Khởi chạy Frontend Server (Vite)
Mở một cửa sổ dòng lệnh (terminal) khác và chạy:
```bash
npm run dev
```
- Frontend Server sẽ chạy ở địa chỉ: `http://localhost:3000`
- Toàn bộ các API request từ Client bắt đầu bằng `/api` sẽ được Vite tự động chuyển hướng (proxy) tới API Server chạy ở cổng `5000` để tránh các lỗi liên quan đến CORS (Cross-Origin Resource Sharing).

---

## ⚠️ 5. Xử Lý Các Sự Cố Thường Gặp (Troubleshooting)

### Lỗi Cổng Bị Chiếm (Port 5000 Already In Use)
Khi khởi chạy server backend, nếu gặp lỗi `EADDRINUSE: address already in use :::5000`, có nghĩa là một process khác (hoặc backend instance cũ chưa tắt hoàn toàn) đang chiếm dụng cổng 5000.

**Giải pháp:**
Bạn có thể chạy script tích hợp sẵn để tự động tìm và tắt process đang chạy trên cổng 5000:
```bash
npm run server:kill
```
Sau đó khởi động lại server bằng `npm run server:dev`.

### Lỗi Kết Nối Cơ Sở Dữ Liệu (Database Connection Failed)
Nếu backend hiển thị log `❌ Không thể kết nối database: ...`:
- Hãy chắc chắn rằng MySQL trên **XAMPP Control Panel** đã được Start thành công.
- Kiểm tra xem bạn đã tạo database mang tên `datn_perfume` chưa.
- Kiểm tra chính xác thông tin đăng nhập trong file `.env` (như `DB_USER`, `DB_PASSWORD`). Mặc định XAMPP thường là `DB_USER=root` và `DB_PASSWORD=` (để trống).

---

Developed with ❤️ for Luxe Fragrance E-commerce.
