<?php
require_once __DIR__ . '/../config/header.php';

// Check authentication
checkStaffRole();

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

try {
    if ($method === 'GET') {
        // Get all products
        $result = $mysqli->query('
            SELECT p.id, p.name, p.description, p.details, p.price, p.old_price,
                   p.image, p.badge, p.rating, p.review_count, p.gender,
                   p.is_active, p.is_featured, p.created_at,
                   b.name AS brand, c.name AS category, co.name AS concentration,
                   (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = 1) AS variant_count,
                   (SELECT MIN(pv2.price) FROM product_variants pv2 WHERE pv2.product_id = p.id AND pv2.is_active = 1) AS min_variant_price,
                   (SELECT MAX(pv3.price) FROM product_variants pv3 WHERE pv3.product_id = p.id AND pv3.is_active = 1) AS max_variant_price
            FROM products p
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN concentrations co ON co.id = p.concentration_id
            WHERE p.is_active = 1
            ORDER BY p.created_at DESC
        ');
        
        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
        
        sendResponse($products, 'Products loaded', 200);
        
    } elseif ($method === 'POST') {
        // Create new product
        checkAdminRole();
        
        $missing = validateRequired($input, ['name', 'price']);
        if (!empty($missing)) {
            sendError('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        $name = $input['name'];
        $brand = $input['brand'] ?? null;
        $concentration = $input['concentration'] ?? null;
        $description = $input['description'] ?? null;
        $details = $input['details'] ?? null;
        $price = (float)$input['price'];
        $old_price = isset($input['old_price']) ? (float)$input['old_price'] : null;
        $rating = isset($input['rating']) ? (float)$input['rating'] : null;
        $image = $input['image'] ?? null;
        $badge = $input['badge'] ?? null;
        $is_featured = isset($input['is_featured']) ? 1 : 0;
        $gender = $input['gender'] ?? null;
        
        $brandId = getOrCreateBrand($mysqli, $brand);
        $concentrationId = getOrCreateConcentration($mysqli, $concentration);
        $slug = generateSlug($name);
        
        $stmt = $mysqli->prepare('
            INSERT INTO products (name, slug, brand_id, concentration_id, description, details, price, old_price, rating, image, badge, is_featured, gender)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->bind_param(
            'ssiissdddssi',
            $name, $slug, $brandId, $concentrationId, $description, $details,
            $price, $old_price, $rating, $image, $badge, $is_featured, $gender
        );
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi thêm sản phẩm: ' . $stmt->error, 500);
        }
        
        sendResponse(['id' => $mysqli->insert_id], 'Thêm sản phẩm thành công', 201);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
