<?php
require_once __DIR__ . '/../config/header.php';

// Check authentication
checkAdminRole();

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

try {
    if ($method === 'GET') {
        // Get all users
        $result = $mysqli->query('
            SELECT id, full_name, email, phone, role, is_active, created_at
            FROM users
            ORDER BY created_at DESC
        ');
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        
        sendResponse($users, 'Users loaded', 200);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
