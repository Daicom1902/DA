<?php
require_once __DIR__ . '/../config/header.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

try {
    if ($method === 'POST') {
        // Create new admin/staff account
        checkAdminRole();
        
        $missing = validateRequired($input, ['full_name', 'email', 'password', 'role']);
        if (!empty($missing)) {
            sendError('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        $full_name = $input['full_name'];
        $email = $input['email'];
        $password = $input['password'];
        $role = $input['role'];
        $phone = $input['phone'] ?? null;
        
        // Validate role
        if (!in_array($role, ['admin', 'manager', 'staff'])) {
            sendError('Invalid role', 400);
        }
        
        // Check if email already exists
        $stmt = $mysqli->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            sendError('Email đã được sử dụng', 409);
        }
        
        // Hash password
        $password_hash = password_hash($password, PASSWORD_BCRYPT);
        
        // Create account
        $stmt = $mysqli->prepare('
            INSERT INTO users (full_name, email, password_hash, phone, role, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        ');
        
        $stmt->bind_param('sssss', $full_name, $email, $password_hash, $phone, $role);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi tạo tài khoản: ' . $stmt->error, 500);
        }
        
        sendResponse(['id' => $mysqli->insert_id], 'Tạo tài khoản thành công', 201);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
