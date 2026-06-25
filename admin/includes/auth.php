<?php
// Session start và xác thực
session_start();

// Kiểm tra xem user đã đăng nhập chưa
function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        die(json_encode(['message' => 'Unauthorized']));
    }
}

// Kiểm tra quyền Admin hoặc Manager
function checkAdminRole() {
    checkAuth();
    
    if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'manager'])) {
        http_response_code(403);
        die(json_encode(['message' => 'Forbidden - Admin/Manager role required']));
    }
}

// Kiểm tra quyền Staff trở lên
function checkStaffRole() {
    checkAuth();
    
    if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'manager', 'staff'])) {
        http_response_code(403);
        die(json_encode(['message' => 'Forbidden - Staff role required']));
    }
}

// Lấy user info từ database
function getUserFromDB($mysqli, $user_id) {
    $stmt = $mysqli->prepare('SELECT id, email, role, is_active FROM users WHERE id = ? AND is_active = 1');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

// Đăng nhập user (dùng sau khi xác thực thành công)
function loginUser($userId, $role) {
    $_SESSION['user_id'] = $userId;
    $_SESSION['role'] = $role;
    $_SESSION['login_time'] = time();
}

// Đăng xuất user
function logoutUser() {
    session_destroy();
}
?>
