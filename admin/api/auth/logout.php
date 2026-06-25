<?php
require_once __DIR__ . '/../config/header.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        // Check if user is logged in
        if (!isset($_SESSION['user_id'])) {
            sendError('Unauthorized', 401);
        }
        
        // Logout user
        logoutUser();
        
        sendResponse(null, 'Đăng xuất thành công', 200);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
