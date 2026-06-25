<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'datn_perfume');
define('DB_CHARSET', 'utf8mb4');

// Create connection
try {
    $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
    
    // Check connection
    if ($mysqli->connect_error) {
        throw new Exception('Connection failed: ' . $mysqli->connect_error);
    }
    
    // Set charset
    $mysqli->set_charset(DB_CHARSET);
    
    // Set timezone
    date_default_timezone_set('Asia/Ho_Chi_Minh');
    $mysqli->query("SET time_zone='+07:00'");
} catch (Exception $e) {
    http_response_code(500);
    die(json_encode(['message' => 'Lỗi kết nối database: ' . $e->getMessage()]));
}
?>
