# Admin PHP API Documentation

Hệ thống quản lý admin hoàn chỉnh viết bằng PHP thuần với MySQL.

## Cấu trúc Thư mục

```
admin/
├── config/
│   ├── db.php          # Kết nối database
│   └── header.php      # Header chung cho tất cả API
├── includes/
│   ├── auth.php        # Middleware xác thực
│   └── helpers.php     # Hàm tiện ích
├── api/
│   ├── auth/
│   │   ├── login.php
│   │   ├── logout.php
│   │   ├── me.php
│   │   └── register.php
│   ├── dashboard.php
│   ├── products/
│   │   ├── index.php       # Danh sách & tạo sản phẩm
│   │   ├── detail.php      # Chi tiết & cập nhật & xóa sản phẩm
│   │   ├── images.php      # Quản lý ảnh sản phẩm
│   │   └── variants.php    # Quản lý dung tích sản phẩm
│   ├── orders/
│   │   ├── index.php       # Danh sách & tạo đơn hàng
│   │   └── detail.php      # Chi tiết & cập nhật đơn hàng
│   ├── brands/
│   │   └── index.php
│   ├── concentrations/
│   │   └── index.php
│   ├── contacts/
│   │   ├── index.php
│   │   └── detail.php
│   └── users/
│       ├── index.php
│       └── detail.php
└── .htaccess           # Routing configuration
```

## Authentication

### Đăng nhập
```
POST /admin/api/auth/login.php
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response:
{
  "data": {
    "id": 1,
    "full_name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  "message": "Đăng nhập thành công",
  "status": 200
}
```

### Lấy thông tin người dùng hiện tại
```
GET /admin/api/auth/me.php

Response:
{
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin",
    "is_active": 1
  },
  "message": "User info",
  "status": 200
}
```

### Đăng xuất
```
POST /admin/api/auth/logout.php

Response:
{
  "message": "Đăng xuất thành công",
  "status": 200
}
```

### Tạo tài khoản Admin/Staff (Admin only)
```
POST /admin/api/auth/register.php
Content-Type: application/json

{
  "full_name": "New Staff",
  "email": "staff@example.com",
  "password": "password123",
  "role": "staff",
  "phone": "0123456789"
}

Response:
{
  "data": {
    "id": 10
  },
  "message": "Tạo tài khoản thành công",
  "status": 201
}
```

## Dashboard

```
GET /admin/api/dashboard.php

Response:
{
  "data": {
    "totalProducts": 150,
    "totalOrders": 342,
    "pendingOrders": 12,
    "totalRevenue": 50000000,
    "totalContacts": 25,
    "recentOrders": [...]
  },
  "message": "Dashboard data loaded",
  "status": 200
}
```

## Products

### Danh sách sản phẩm
```
GET /admin/api/products/index.php

Response:
{
  "data": [
    {
      "id": 1,
      "name": "Fragrance Name",
      "price": 599000,
      "image": "url",
      "brand": "Brand Name",
      "concentration": "Eau de Parfum",
      ...
    }
  ],
  "message": "Products loaded",
  "status": 200
}
```

### Tạo sản phẩm
```
POST /admin/api/products/index.php
Content-Type: application/json

{
  "name": "New Fragrance",
  "brand": "Guerlain",
  "concentration": "Eau de Toilette",
  "price": 599000,
  "old_price": 799000,
  "description": "Description",
  "image": "url",
  "is_featured": true,
  "gender": "unisex"
}

Response:
{
  "data": { "id": 151 },
  "message": "Thêm sản phẩm thành công",
  "status": 201
}
```

### Chi tiết sản phẩm
```
GET /admin/api/products/detail.php?id=1

Response:
{
  "data": {
    "id": 1,
    "name": "Fragrance",
    "price": 599000,
    "images": [...],
    "variants": [...]
  },
  "message": "Product loaded",
  "status": 200
}
```

### Cập nhật sản phẩm
```
PUT /admin/api/products/detail.php?id=1
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 699000,
  "is_active": true
}
```

### Xóa sản phẩm (Soft delete)
```
DELETE /admin/api/products/detail.php?id=1
```

### Quản lý ảnh sản phẩm

#### Thêm ảnh
```
POST /admin/api/products/images.php?productId=1
Content-Type: application/json

{
  "url": "image-url",
  "alt_text": "Product image",
  "sort_order": 1
}
```

#### Cập nhật ảnh
```
PUT /admin/api/products/images.php?productId=1&imageId=5
Content-Type: application/json

{
  "alt_text": "Updated alt text",
  "sort_order": 2
}
```

#### Xóa ảnh
```
DELETE /admin/api/products/images.php?productId=1&imageId=5
```

### Quản lý dung tích sản phẩm

#### Danh sách dung tích
```
GET /admin/api/products/variants.php?productId=1
```

#### Thêm dung tích
```
POST /admin/api/products/variants.php?productId=1
Content-Type: application/json

{
  "size_label": "50ml",
  "price": 599000,
  "old_price": 799000,
  "stock": 100,
  "sku": "FRG-001-50"
}
```

#### Cập nhật dung tích
```
PUT /admin/api/products/variants.php?productId=1&variantId=10
Content-Type: application/json

{
  "size_label": "50ml",
  "price": 649000,
  "stock": 85,
  "is_active": 1
}
```

#### Xóa dung tích
```
DELETE /admin/api/products/variants.php?productId=1&variantId=10
```

## Orders

### Danh sách đơn hàng
```
GET /admin/api/orders/index.php
GET /admin/api/orders/index.php?status=pending
```

### Chi tiết đơn hàng
```
GET /admin/api/orders/detail.php?id=1
```

### Cập nhật trạng thái đơn hàng
```
PUT /admin/api/orders/detail.php?id=1
Content-Type: application/json

{
  "status": "processing"
}
```

### Hủy đơn hàng
```
DELETE /admin/api/orders/detail.php?id=1
```

## Brands

### Danh sách brand
```
GET /admin/api/brands/index.php
```

### Tạo brand
```
POST /admin/api/brands/index.php
Content-Type: application/json

{
  "name": "Dior"
}
```

## Concentrations

### Danh sách concentration
```
GET /admin/api/concentrations/index.php
```

### Tạo concentration
```
POST /admin/api/concentrations/index.php
Content-Type: application/json

{
  "name": "Eau de Parfum"
}
```

## Contacts

### Danh sách contact
```
GET /admin/api/contacts/index.php
```

### Chi tiết contact
```
GET /admin/api/contacts/detail.php?id=1
```

### Cập nhật trạng thái contact
```
PUT /admin/api/contacts/detail.php?id=1
Content-Type: application/json

{
  "status": "replied"
}
```

### Xóa contact
```
DELETE /admin/api/contacts/detail.php?id=1
```

## Users (Admin only)

### Danh sách user
```
GET /admin/api/users/index.php
```

### Chi tiết user
```
GET /admin/api/users/detail.php?id=1
```

### Cập nhật user
```
PUT /admin/api/users/detail.php?id=1
Content-Type: application/json

{
  "role": "manager",
  "is_active": 1
}
```

### Xóa user (Deactivate)
```
DELETE /admin/api/users/detail.php?id=1
```

## Roles & Permissions

- **admin**: Toàn quyền
- **manager**: Quản lý sản phẩm, đơn hàng, nhưng không thể quản lý user
- **staff**: Xem thông tin, cập nhật trạng thái, nhưng không thể tạo/xóa sản phẩm

## Response Format

Tất cả API trả về JSON với format:

```json
{
  "data": null,
  "message": "Success message",
  "status": 200
}
```

## Error Handling

```json
{
  "message": "Error message",
  "status": 400
}
```

## URL Rewriting

File `.htaccess` tự động chuyển đổi URL:
- `/admin/api/products/1` → `/admin/api/products/detail.php?id=1`
- `/admin/api/auth/login` → `/admin/api/auth/login.php`

## Setup

1. Sao chép thư mục `admin` vào `/xampp/htdocs/DA/`
2. Cấu hình database trong `admin/config/db.php`
3. Chắc chắn `mod_rewrite` được bật trong Apache
4. Bắt đầu sử dụng API

## Lưu ý

- Session được lưu trữ server-side
- Password được hash bằng bcrypt
- Tất cả input được sanitize
- Soft delete được sử dụng cho products
