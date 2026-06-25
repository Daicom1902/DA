<?php
require_once __DIR__ . '/../config/header.php';

// Check authentication
checkStaffRole();

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

try {
    if ($method === 'GET') {
        // Get all contacts
        $result = $mysqli->query('
            SELECT id, name, email, subject, message, status, created_at
            FROM contacts
            ORDER BY created_at DESC
        ');
        
        $contacts = [];
        while ($row = $result->fetch_assoc()) {
            $contacts[] = $row;
        }
        
        sendResponse($contacts, 'Contacts loaded', 200);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
