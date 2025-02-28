<?php
// Basic PHP index file
header('Content-Type: application/json');

// Example JSON response
$data = [
    'status' => 'success',
    'message' => 'PHP is working correctly!',
    'timestamp' => date('Y-m-d H:i:s'),
    'version' => phpversion()
];

echo json_encode($data, JSON_PRETTY_PRINT);
?>
