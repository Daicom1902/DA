<?php
require_once __DIR__ . '/../../config/header.php';

// Check authentication
checkAdminRole();

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

// Get user ID from URL
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_filter(explode('/', $path));
$userId = array_pop($segments);

if (empty($userId) || !is_numeric($userId)) {
    sendError('Invalid user ID', 400);
}

try {
    if ($method === 'GET') {
        // Get user details
        $stmt = $mysqli->prepare('
            SELECT id, full_name, email, phone, role, is_active, created_at
            FROM users
            WHERE id = ?
        ');
        
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            sendError('User không tồn tại', 404);
        }
        
        $user = $result->fetch_assoc();
        sendResponse($user, 'User loaded', 200);
        
    } elseif ($method === 'PUT') {
        // Update user role or status
        $role = $input['role'] ?? null;
        $is_active = isset($input['is_active']) ? (int)$input['is_active'] : null;
        
        $updates = [];
        $params = [];
        $types = '';
        
        if ($role !== null) {
            $updates[] = 'role = ?';
            $params[] = $role;
            $types .= 's';
        }
        
        if ($is_active !== null) {
            $updates[] = 'is_active = ?';
            $params[] = $is_active;
            $types .= 'i';
        }
        
        if (empty($updates)) {
            sendError('No fields to update', 400);
        }
        
        $params[] = $userId;
        $types .= 'i';
        
        $updateQuery = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $mysqli->prepare($updateQuery);
        $stmt->bind_param($types, ...$params);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi cập nhật user: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Cập nhật user thành công', 200);
        
    } elseif ($method === 'DELETE') {
        // Deactivate user
        $stmt = $mysqli->prepare('UPDATE users SET is_active = 0 WHERE id = ?');
        $stmt->bind_param('i', $userId);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi xóa user: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Đã xóa user', 200);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
