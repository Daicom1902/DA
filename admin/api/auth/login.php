<?php
require_once __DIR__ . '/../config/header.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

try {
    if ($method === 'POST') {
        // Check if user already logged in
        if (isset($_SESSION['user_id'])) {
            sendResponse(null, 'Bạn đã đăng nhập rồi', 200);
        }
        
        $missing = validateRequired($input, ['email', 'password']);
        if (!empty($missing)) {
            sendError('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        $email = $input['email'];
        $password = $input['password'];
        
        // Get user from database
        $stmt = $mysqli->prepare('
            SELECT id, full_name, email, password_hash, role, is_active 
            FROM users 
            WHERE email = ? AND is_active = 1
        ');
        
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            sendError('Email hoặc mật khẩu không đúng', 401);
        }
        
        $user = $result->fetch_assoc();
        
        // Verify password (assuming password_hash is bcrypt)
        if (!password_verify($password, $user['password_hash'])) {
            sendError('Email hoặc mật khẩu không đúng', 401);
        }
        
        // Check role - only admin, manager, staff can access
        if (!in_array($user['role'], ['admin', 'manager', 'staff'])) {
            sendError('Bạn không có quyền truy cập admin', 403);
        }
        
        // Login user
        loginUser($user['id'], $user['role']);
        
        sendResponse([
            'id' => $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => $user['role']
        ], 'Đăng nhập thành công', 200);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
