<?php
require_once __DIR__ . '/../../config/header.php';

// Check authentication
checkAdminRole();

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

// Get product ID and image ID from URL
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_filter(explode('/', $path));
$imageId = array_pop($segments);
$productId = array_pop($segments);

if (empty($productId) || !is_numeric($productId) || empty($imageId) || !is_numeric($imageId)) {
    sendError('Invalid product or image ID', 400);
}

try {
    if ($method === 'POST') {
        // Add image
        $missing = validateRequired($input, ['url']);
        if (!empty($missing)) {
            sendError('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        $url = $input['url'];
        $alt_text = $input['alt_text'] ?? null;
        $sort_order = isset($input['sort_order']) ? (int)$input['sort_order'] : 0;
        
        $stmt = $mysqli->prepare('
            INSERT INTO product_images (product_id, url, alt_text, sort_order)
            VALUES (?, ?, ?, ?)
        ');
        
        $stmt->bind_param('issi', $productId, $url, $alt_text, $sort_order);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi thêm ảnh: ' . $stmt->error, 500);
        }
        
        sendResponse(['id' => $mysqli->insert_id], 'Thêm ảnh thành công', 201);
        
    } elseif ($method === 'PUT') {
        // Update image
        $sort_order = isset($input['sort_order']) ? (int)$input['sort_order'] : 0;
        $alt_text = $input['alt_text'] ?? null;
        
        $stmt = $mysqli->prepare('
            UPDATE product_images 
            SET sort_order = ?, alt_text = ? 
            WHERE id = ? AND product_id = ?
        ');
        
        $stmt->bind_param('isii', $sort_order, $alt_text, $imageId, $productId);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi cập nhật ảnh: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Đã cập nhật ảnh', 200);
        
    } elseif ($method === 'DELETE') {
        // Delete image
        $stmt = $mysqli->prepare('
            DELETE FROM product_images 
            WHERE id = ? AND product_id = ?
        ');
        
        $stmt->bind_param('ii', $imageId, $productId);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi xóa ảnh: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Đã xóa ảnh', 200);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
