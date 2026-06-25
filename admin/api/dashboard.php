<?php
require_once __DIR__ . '/../config/header.php';

// Check authentication
checkStaffRole();

try {
    // Total products
    $result = $mysqli->query('SELECT COUNT(*) AS totalProducts FROM products WHERE is_active = 1');
    $totalProducts = $result->fetch_assoc()['totalProducts'];
    
    // Total orders
    $result = $mysqli->query('SELECT COUNT(*) AS totalOrders FROM orders');
    $totalOrders = $result->fetch_assoc()['totalOrders'];
    
    // Pending orders
    $result = $mysqli->query("SELECT COUNT(*) AS pendingOrders FROM orders WHERE status = 'pending'");
    $pendingOrders = $result->fetch_assoc()['pendingOrders'];
    
    // Total revenue
    $result = $mysqli->query("SELECT COALESCE(SUM(total), 0) AS totalRevenue FROM orders WHERE status NOT IN ('cancelled')");
    $totalRevenue = $result->fetch_assoc()['totalRevenue'];
    
    // Total contacts
    $result = $mysqli->query('SELECT COUNT(*) AS totalContacts FROM contacts');
    $totalContacts = $result->fetch_assoc()['totalContacts'];
    
    // Recent orders
    $result = $mysqli->query('
        SELECT id, customer_name, customer_email, total, status, created_at
        FROM orders ORDER BY created_at DESC LIMIT 10
    ');
    
    $recentOrders = [];
    while ($row = $result->fetch_assoc()) {
        $recentOrders[] = $row;
    }
    
    sendResponse([
        'totalProducts' => $totalProducts,
        'totalOrders' => $totalOrders,
        'pendingOrders' => $pendingOrders,
        'totalRevenue' => $totalRevenue,
        'totalContacts' => $totalContacts,
        'recentOrders' => $recentOrders
    ], 'Dashboard data loaded', 200);
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
