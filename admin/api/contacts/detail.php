<?php
require_once __DIR__ . '/../../config/header.php';

// Check authentication
checkStaffRole();

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

// Get contact ID from URL
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_filter(explode('/', $path));
$contactId = array_pop($segments);

if (empty($contactId) || !is_numeric($contactId)) {
    sendError('Invalid contact ID', 400);
}

try {
    if ($method === 'GET') {
        // Get contact details
        $stmt = $mysqli->prepare('
            SELECT id, name, email, subject, message, status, created_at
            FROM contacts
            WHERE id = ?
        ');
        
        $stmt->bind_param('i', $contactId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            sendError('Contact không tồn tại', 404);
        }
        
        $contact = $result->fetch_assoc();
        sendResponse($contact, 'Contact loaded', 200);
        
    } elseif ($method === 'PUT') {
        // Update contact status
        checkAdminRole();
        
        $status = $input['status'] ?? null;
        
        if (empty($status)) {
            sendError('Status is required', 400);
        }
        
        $stmt = $mysqli->prepare('
            UPDATE contacts 
            SET status = ?
            WHERE id = ?
        ');
        
        $stmt->bind_param('si', $status, $contactId);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi cập nhật contact: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Cập nhật contact thành công', 200);
        
    } elseif ($method === 'DELETE') {
        // Delete contact
        checkAdminRole();
        
        $stmt = $mysqli->prepare('DELETE FROM contacts WHERE id = ?');
        $stmt->bind_param('i', $contactId);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi xóa contact: ' . $stmt->error, 500);
        }
        
        sendResponse(null, 'Đã xóa contact', 200);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
