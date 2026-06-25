<?php
// Check if session is started and user is logged in
session_start();

if (!isset($_SESSION['user_id'])) {
    // Redirect to login or show login page
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'Please login first',
        'login_url' => '/admin/api/auth/login.php'
    ]);
    exit;
}

// Redirect to dashboard
header('Location: /admin/api/dashboard.php');
exit;
?>
