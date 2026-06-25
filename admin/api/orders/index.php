<?php
require_once __DIR__ . '/../config/header.php';

// Check authentication
checkStaffRole();

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

try {
    if ($method === 'GET') {
        // Get all orders with filters
        $query = '
            SELECT o.id, o.customer_name, o.customer_email, o.customer_phone,
                   o.total, o.status, o.payment_method, o.created_at, o.updated_at
            FROM orders o
            ORDER BY o.created_at DESC
        ';
        
        // Filter by status if provided
        if (isset($_GET['status']) && !empty($_GET['status'])) {
            $status = sanitize($_GET['status']);
            $query = str_replace('WHERE', "WHERE o.status = '$status' AND", $query);
        }
        
        $result = $mysqli->query($query);
        
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
        
        sendResponse($orders, 'Orders loaded', 200);
        
    } elseif ($method === 'POST') {
        // Create order (usually from frontend, but might be needed for admin)
        $missing = validateRequired($input, ['customer_name', 'customer_email', 'total']);
        if (!empty($missing)) {
            sendError('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        $customer_name = $input['customer_name'];
        $customer_email = $input['customer_email'];
        $customer_phone = $input['customer_phone'] ?? null;
        $total = (float)$input['total'];
        $status = $input['status'] ?? 'pending';
        $payment_method = $input['payment_method'] ?? null;
        $shipping_address = $input['shipping_address'] ?? null;
        
        $stmt = $mysqli->prepare('
            INSERT INTO orders (customer_name, customer_email, customer_phone, total, status, payment_method, shipping_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->bind_param('sssdsss', $customer_name, $customer_email, $customer_phone, $total, $status, $payment_method, $shipping_address);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi tạo đơn hàng: ' . $stmt->error, 500);
        }
        
        sendResponse(['id' => $mysqli->insert_id], 'Tạo đơn hàng thành công', 201);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
