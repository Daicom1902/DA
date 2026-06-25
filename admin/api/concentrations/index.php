<?php
require_once __DIR__ . '/../config/header.php';

// Check authentication
checkStaffRole();

$method = $_SERVER['REQUEST_METHOD'];
$input = getJsonInput();

try {
    if ($method === 'GET') {
        // Get all concentrations
        $result = $mysqli->query('
            SELECT id, name, slug, is_active, created_at
            FROM concentrations
            WHERE is_active = 1
            ORDER BY name ASC
        ');
        
        $concentrations = [];
        while ($row = $result->fetch_assoc()) {
            $concentrations[] = $row;
        }
        
        sendResponse($concentrations, 'Concentrations loaded', 200);
        
    } elseif ($method === 'POST') {
        // Create concentration
        checkAdminRole();
        
        $missing = validateRequired($input, ['name']);
        if (!empty($missing)) {
            sendError('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        $name = $input['name'];
        $slug = mb_strtolower(preg_replace('/\s+/', '-', $name), 'UTF-8');
        
        $stmt = $mysqli->prepare('
            INSERT INTO concentrations (name, slug)
            VALUES (?, ?)
        ');
        
        $stmt->bind_param('ss', $name, $slug);
        
        if (!$stmt->execute()) {
            sendError('Lỗi khi tạo concentration: ' . $stmt->error, 500);
        }
        
        sendResponse(['id' => $mysqli->insert_id], 'Tạo concentration thành công', 201);
        
    } else {
        sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    sendError('Lỗi server: ' . $e->getMessage(), 500);
}
?>
