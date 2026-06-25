<?php
require_once __DIR__ . '/../config/header.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Check if user is logged in
        if (!isset($_SESSION['user_id'])) {
            sendResponse(null, 'Not logged in', 200);
        }
        
        // Get user info
        $user = getUserFromDB($mysqli, $_SESSION['user_id']);
        
        if ($user) {
            sendResponse([
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'is_active' => $user['is_active']
            ], 'User info', 200);
        } else {
            // Session invalid
            logoutUser();
            sendResponse(null, 'Not logged in', 200);
        }
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
