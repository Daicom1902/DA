<?php

// Response helper
function sendResponse($data = null, $message = '', $status = 200) {
    http_response_code($status);
    echo json_encode([
        'data' => $data,
        'message' => $message,
        'status' => $status
    ]);
    exit;
}

function sendError($message, $status = 400) {
    http_response_code($status);
    echo json_encode([
        'message' => $message,
        'status' => $status
    ]);
    exit;
}

// Generate slug
function generateSlug($name) {
    $slug = mb_strtolower($name, 'UTF-8');
    // Remove Vietnamese accents
    $slug = preg_replace('/[àáạảãăằắặẳẵâầấậẩẫ]/u', 'a', $slug);
    $slug = preg_replace('/[èéẹẻẽêềếệểễ]/u', 'e', $slug);
    $slug = preg_replace('/[ìíịỉĩ]/u', 'i', $slug);
    $slug = preg_replace('/[òóọỏõôồốộổỗơờớợởỡ]/u', 'o', $slug);
    $slug = preg_replace('/[ùúụủũưừứựửữ]/u', 'u', $slug);
    $slug = preg_replace('/[ỳýỵỷỹ]/u', 'y', $slug);
    $slug = preg_replace('/[đ]/u', 'd', $slug);
    
    // Remove special characters
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = trim($slug);
    $slug = preg_replace('/\s+/', '-', $slug);
    $slug .= '-' . time();
    
    return $slug;
}

// Get or create brand
function getOrCreateBrand($mysqli, $name) {
    if (empty($name)) return null;
    
    $clean = trim($name);
    $stmt = $mysqli->prepare('SELECT id FROM brands WHERE name = ?');
    $stmt->bind_param('s', $clean);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return $row['id'];
    }
    
    $slug = mb_strtolower(preg_replace('/\s+/', '-', $clean), 'UTF-8');
    $stmt = $mysqli->prepare('INSERT INTO brands (name, slug) VALUES (?, ?)');
    $stmt->bind_param('ss', $clean, $slug);
    $stmt->execute();
    
    return $mysqli->insert_id;
}

// Get or create concentration
function getOrCreateConcentration($mysqli, $name) {
    if (empty($name)) return null;
    
    $clean = trim($name);
    $stmt = $mysqli->prepare('SELECT id FROM concentrations WHERE name = ?');
    $stmt->bind_param('s', $clean);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return $row['id'];
    }
    
    $slug = mb_strtolower(preg_replace('/\s+/', '-', $clean), 'UTF-8');
    $stmt = $mysqli->prepare('INSERT INTO concentrations (name, slug) VALUES (?, ?)');
    $stmt->bind_param('ss', $clean, $slug);
    $stmt->execute();
    
    return $mysqli->insert_id;
}

// Parse JSON input
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

// Validate required fields
function validateRequired($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (empty($data[$field])) {
            $missing[] = $field;
        }
    }
    return $missing;
}

// Check if method is POST
function isPost() {
    return $_SERVER['REQUEST_METHOD'] === 'POST';
}

// Check if method is PUT
function isPut() {
    return $_SERVER['REQUEST_METHOD'] === 'PUT';
}

// Check if method is GET
function isGet() {
    return $_SERVER['REQUEST_METHOD'] === 'GET';
}

// Check if method is DELETE
function isDelete() {
    return $_SERVER['REQUEST_METHOD'] === 'DELETE';
}

// Get ID from URL
function getId() {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $segments = array_filter(explode('/', $path));
    return end($segments) ?? null;
}

// Sanitize string
function sanitize($str) {
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}
?>
