# Admin API - Hướng dẫn Test với cURL

## 1. Authentication

### Đăng nhập
```bash
curl -X POST http://localhost/admin/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Lấy thông tin người dùng hiện tại
```bash
curl -X GET http://localhost/admin/api/auth/me.php
```

### Đăng xuất
```bash
curl -X POST http://localhost/admin/api/auth/logout.php
```

## 2. Dashboard

```bash
curl -X GET http://localhost/admin/api/dashboard.php
```

## 3. Products

### Danh sách sản phẩm
```bash
curl -X GET http://localhost/admin/api/products/index.php
```

### Tạo sản phẩm
```bash
curl -X POST http://localhost/admin/api/products/index.php \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chanel No. 5",
    "brand": "Chanel",
    "concentration": "Eau de Toilette",
    "price": 1500000,
    "old_price": 1800000,
    "description": "Mùi hương sang trọng",
    "image": "https://example.com/image.jpg",
    "is_featured": true,
    "gender": "female"
  }'
```

### Chi tiết sản phẩm
```bash
curl -X GET "http://localhost/admin/api/products/detail.php?id=1"
```

### Cập nhật sản phẩm
```bash
curl -X PUT "http://localhost/admin/api/products/detail.php?id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chanel No. 5 Updated",
    "price": 1600000,
    "is_active": true
  }'
```

### Xóa sản phẩm
```bash
curl -X DELETE "http://localhost/admin/api/products/detail.php?id=1"
```

## 4. Product Images

### Thêm ảnh sản phẩm
```bash
curl -X POST "http://localhost/admin/api/products/images.php?productId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/image-1.jpg",
    "alt_text": "Product front view",
    "sort_order": 1
  }'
```

### Cập nhật ảnh
```bash
curl -X PUT "http://localhost/admin/api/products/images.php?productId=1&imageId=5" \
  -H "Content-Type: application/json" \
  -d '{
    "alt_text": "Front view updated",
    "sort_order": 2
  }'
```

### Xóa ảnh
```bash
curl -X DELETE "http://localhost/admin/api/products/images.php?productId=1&imageId=5"
```

## 5. Product Variants

### Danh sách dung tích
```bash
curl -X GET "http://localhost/admin/api/products/variants.php?productId=1"
```

### Thêm dung tích
```bash
curl -X POST "http://localhost/admin/api/products/variants.php?productId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "size_label": "50ml",
    "price": 1500000,
    "old_price": 1800000,
    "stock": 100,
    "sku": "CHN-NO5-50ML"
  }'
```

### Cập nhật dung tích
```bash
curl -X PUT "http://localhost/admin/api/products/variants.php?productId=1&variantId=10" \
  -H "Content-Type: application/json" \
  -d '{
    "size_label": "50ml",
    "price": 1600000,
    "stock": 85,
    "is_active": 1
  }'
```

### Xóa dung tích
```bash
curl -X DELETE "http://localhost/admin/api/products/variants.php?productId=1&variantId=10"
```

## 6. Orders

### Danh sách đơn hàng
```bash
curl -X GET "http://localhost/admin/api/orders/index.php"

# Lọc theo trạng thái
curl -X GET "http://localhost/admin/api/orders/index.php?status=pending"
```

### Chi tiết đơn hàng
```bash
curl -X GET "http://localhost/admin/api/orders/detail.php?id=1"
```

### Cập nhật trạng thái đơn hàng
```bash
curl -X PUT "http://localhost/admin/api/orders/detail.php?id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "processing"
  }'
```

### Hủy đơn hàng
```bash
curl -X DELETE "http://localhost/admin/api/orders/detail.php?id=1"
```

## 7. Brands

### Danh sách brand
```bash
curl -X GET "http://localhost/admin/api/brands/index.php"
```

### Tạo brand
```bash
curl -X POST "http://localhost/admin/api/brands/index.php" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dior"
  }'
```

## 8. Concentrations

### Danh sách concentration
```bash
curl -X GET "http://localhost/admin/api/concentrations/index.php"
```

### Tạo concentration
```bash
curl -X POST "http://localhost/admin/api/concentrations/index.php" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Eau de Parfum"
  }'
```

## 9. Contacts

### Danh sách contact
```bash
curl -X GET "http://localhost/admin/api/contacts/index.php"
```

### Chi tiết contact
```bash
curl -X GET "http://localhost/admin/api/contacts/detail.php?id=1"
```

### Cập nhật trạng thái contact
```bash
curl -X PUT "http://localhost/admin/api/contacts/detail.php?id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "replied"
  }'
```

### Xóa contact
```bash
curl -X DELETE "http://localhost/admin/api/contacts/detail.php?id=1"
```

## 10. Users (Admin only)

### Danh sách user
```bash
curl -X GET "http://localhost/admin/api/users/index.php"
```

### Chi tiết user
```bash
curl -X GET "http://localhost/admin/api/users/detail.php?id=1"
```

### Tạo tài khoản staff
```bash
curl -X POST "http://localhost/admin/api/auth/register.php" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "New Staff",
    "email": "staff@example.com",
    "password": "password123",
    "role": "staff",
    "phone": "0123456789"
  }'
```

### Cập nhật user
```bash
curl -X PUT "http://localhost/admin/api/users/detail.php?id=5" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "manager",
    "is_active": 1
  }'
```

### Xóa user
```bash
curl -X DELETE "http://localhost/admin/api/users/detail.php?id=5"
```

## Tips for Testing

1. **Lưu cookie session**: Nếu muốn lưu session giữa các requests
```bash
curl -X POST http://localhost/admin/api/auth/login.php \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Sử dụng cookies trong requests tiếp theo
curl -X GET http://localhost/admin/api/dashboard.php -b cookies.txt
```

2. **Pretty print JSON**:
```bash
curl -X GET http://localhost/admin/api/dashboard.php | python -m json.tool
```

3. **Kiểm tra headers response**:
```bash
curl -X GET http://localhost/admin/api/dashboard.php -i
```

## Notes

- Hãy đảm bảo Apache `mod_rewrite` được bật
- Session timeout mặc định là vài phút
- Tất cả requests phải kèm `Content-Type: application/json` nếu có body
- Admin có toàn quyền, staff/manager có quyền giới hạn
