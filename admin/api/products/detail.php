<?php
require_once __DIR__ . '/../../config/header.php';

// Check authentication
checkStaffRole();

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

// Get product ID from URL
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_filter(explode('/', $path));
$productId = array_pop($segments); // Get last segment

if (empty($productId) || !is_numeric($productId)) {
    sendError('Invalid product ID', 400);
}

try {
    if ($method === 'GET') {
        // Get product details
        $stmt = $mysqli->prepare('
            SELECT p.id, p.name, p.description, p.details, p.price, p.old_price,
                   p.image, p.badge, p.rating, p.review_count, p.gender,
                   p.is_active, p.is_featured, p.created_at,
                   b.name AS brand, c.name AS category, co.name AS concentration,
                   b.id AS brand_id, c.id AS category_id, co.id AS concentration_id
            FROM products p
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN concentrations co ON co.id = p.concentration_id
            WHERE p.id = ?
        ');
        
        $stmt->bind_param('i', $productId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            sendError('Sản phẩm không tồn tại', 404);
        }
        
        $product = $result->fetch_assoc();
        
        // Get images
        $imagesResult = $mysqli->query('
            SELECT id, url, alt_text, sort_order FROM product_images 
            WHERE product_id = ' . intval($productId) . '
            ORDER BY sort_order, id
        ');
        
        $images = [];
        while ($row = $imagesResult->fetch_assoc()) {
            $images[] = $row;
        }
        
        // Get variants
        $variantsResult = $mysqli->query('
            SELECT id, size_label, price, old_price, stock, sku, is_active 
            FROM product_variants 
            WHERE product_id = ' . intval($productId) . '
            ORDER BY price ASC
        ');
        
        $variants = [];
        while ($row = $variantsResult->fetch_assoc()) {
            $variants[] = $row;
        }
        
        $product['images'] = $images;
        $product['variants'] = $variants;
        
        sendResponse($product, 'Product loaded', 200);
        
    } elseif ($method === 'PUT') {
        // Update product
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
        $is_active = isset($input['is_active']) ? (int)$input['is_active'] : 1;
        $gender = $input['gender'] ?? null;
        
        $brandId = getOrCreateBrand($mysqli, $brand);
        $concentrationId = getOrCreateConcentration($mysqli, $concentration);
        
        // Check if name changed to generate new slug
        $result = $mysqli->query('SELECT name FROM products WHERE id = ' . intval($productId));
        $existing = $result->fetch_assoc();
        $slug = ($existing['name'] !== $name) ? generateSlug($name) : null;
        
        $updateQuery = '
            UPDATE products SET 
            name = ?, brand_id = ?, concentration_id = ?, description = ?, 
            details = ?, price = ?, old_price = ?, rating = ?, image = ?, 
            badge = ?, is_featured = ?, is_active = ?, gender = ?
        ';
        
        $params = [
            $name, $brandId, $concentrationId, $description, $details,
            $price, $old_price, $rating, $image, $badge, $is_featured, $is_active, $gender
        ];
        
        if ($slug) {
            $updateQuery = '
                UPDATE products SET 
                slug = ?, name = ?, brand_id = ?, concentration_id = ?, description = ?, 
                details = ?, price = ?, old_price = ?, rating = ?, image = ?, 
                badge = ?, is_featured = ?, is_active = ?, gender = ?
            ';
            array_unshift($params, $slug);
        }
        
        $updateQuery .= ' WHERE id = ?';
        $params[] = $productId;
        
        $stmt = $mysqli->prepare($updateQuery);
        
        // Build type string
        $types = str_repeat('s', count($params) - 2) . 'i';
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi cập nhật sản phẩm: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Cập nhật sản phẩm thành công', 200);
        
    } elseif ($method === 'DELETE') {
        // Soft delete product
        checkAdminRole();
        
        $stmt = $mysqli->prepare('UPDATE products SET is_active = 0 WHERE id = ?');
        $stmt->bind_param('i', $productId);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi xóa sản phẩm: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Đã xóa sản phẩm', 200);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
