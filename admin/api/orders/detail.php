<?php
require_once __DIR__ . '/../../config/header.php';

// Check authentication
checkStaffRole();

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

// Get order ID from URL
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_filter(explode('/', $path));
$orderId = array_pop($segments);

if (empty($orderId) || !is_numeric($orderId)) {
    sendError('Invalid order ID', 400);
}

try {
    if ($method === 'GET') {
        // Get order details
        $stmt = $mysqli->prepare('
            SELECT id, customer_name, customer_email, customer_phone,
                   total, status, payment_method, shipping_address, created_at, updated_at
            FROM orders
            WHERE id = ?
        ');
        
        $stmt->bind_param('i', $orderId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            sendError('Đơn hàng không tồn tại', 404);
        }
        
        $order = $result->fetch_assoc();
        
        // Get order items
        $itemsResult = $mysqli->query('
            SELECT oi.id, oi.product_id, oi.quantity, oi.price, oi.size_label,
                   p.name as product_name, p.image
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ' . intval($orderId)
        );
        
        $items = [];
        while ($row = $itemsResult->fetch_assoc()) {
            $items[] = $row;
        }
        
        $order['items'] = $items;
        
        sendResponse($order, 'Order loaded', 200);
        
    } elseif ($method === 'PUT') {
        // Update order status
        $status = $input['status'] ?? null;
        
        if (empty($status)) {
            sendError('Status is required', 400);
        }
        
        $stmt = $mysqli->prepare('
            UPDATE orders 
            SET status = ?, updated_at = NOW()
            WHERE id = ?
        ');
        
        $stmt->bind_param('si', $status, $orderId);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi cập nhật đơn hàng: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Cập nhật đơn hàng thành công', 200);
        
    } elseif ($method === 'DELETE') {
        // Cancel order
        checkAdminRole();
        
        $stmt = $mysqli->prepare('
            UPDATE orders 
            SET status = ?, updated_at = NOW()
            WHERE id = ?
        ');
        
        $status = 'cancelled';
        $stmt->bind_param('si', $status, $orderId);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi hủy đơn hàng: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Đã hủy đơn hàng', 200);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
