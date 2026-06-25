<?php
require_once __DIR__ . '/../../config/header.php';

// Check authentication
checkAdminRole();

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

// Get product ID and variant ID from URL
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_filter(explode('/', $path));
$variantId = array_pop($segments);
$productId = array_pop($segments);

if (empty($productId) || !is_numeric($productId)) {
    sendError('Invalid product ID', 400);
}

try {
    if ($method === 'GET') {
        // Get all variants for product
        $stmt = $mysqli->prepare('
            SELECT id, size_label, price, old_price, stock, sku, is_active 
            FROM product_variants 
            WHERE product_id = ? 
            ORDER BY price ASC
        ');
        
        $stmt->bind_param('i', $productId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $variants = [];
        while ($row = $result->fetch_assoc()) {
            $variants[] = $row;
        }
        
        sendResponse($variants, 'Variants loaded', 200);
        
    } elseif ($method === 'POST') {
        // Add variant
        $missing = validateRequired($input, ['size_label', 'price']);
        if (!empty($missing)) {
            sendError('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        $size_label = $input['size_label'];
        $price = (float)$input['price'];
        $old_price = isset($input['old_price']) ? (float)$input['old_price'] : null;
        $stock = isset($input['stock']) ? (int)$input['stock'] : 0;
        $sku = $input['sku'] ?? null;
        
        $stmt = $mysqli->prepare('
            INSERT INTO product_variants (product_id, size_label, price, old_price, stock, sku)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->bind_param('isddis', $productId, $size_label, $price, $old_price, $stock, $sku);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi thêm dung tích: ' . $stmt->error, 500);
        }
        
        sendResponse(['id' => $mysqli->insert_id], 'Thêm dung tích thành công', 201);
        
    } elseif ($method === 'PUT') {
        // Update variant
        if (empty($variantId) || !is_numeric($variantId)) {
            sendError('Invalid variant ID', 400);
        }
        
        $missing = validateRequired($input, ['size_label', 'price']);
        if (!empty($missing)) {
            sendError('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        $size_label = $input['size_label'];
        $price = (float)$input['price'];
        $old_price = isset($input['old_price']) ? (float)$input['old_price'] : null;
        $stock = isset($input['stock']) ? (int)$input['stock'] : 0;
        $sku = $input['sku'] ?? null;
        $is_active = isset($input['is_active']) ? (int)$input['is_active'] : 1;
        
        $stmt = $mysqli->prepare('
            UPDATE product_variants 
            SET size_label = ?, price = ?, old_price = ?, stock = ?, sku = ?, is_active = ?
            WHERE id = ? AND product_id = ?
        ');
        
        $stmt->bind_param('sddiisii', $size_label, $price, $old_price, $stock, $sku, $is_active, $variantId, $productId);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi cập nhật dung tích: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Cập nhật dung tích thành công', 200);
        
    } elseif ($method === 'DELETE') {
        // Delete variant
        if (empty($variantId) || !is_numeric($variantId)) {
            sendError('Invalid variant ID', 400);
        }
        
        $stmt = $mysqli->prepare('
            DELETE FROM product_variants 
            WHERE id = ? AND product_id = ?
        ');
        
        $stmt->bind_param('ii', $variantId, $productId);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi xóa dung tích: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Đã xóa dung tích', 200);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
