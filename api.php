<?php

/**
 * Simple API Endpoint
 * Basic API for product management and orders
 */

header('Content-Type: application/json');
$trusted_domains = ['https://example.com', 'https://api.example.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $trusted_domains)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$method = $_SERVER['REQUEST_METHOD'];

// Simple routing
switch ($path) {
    case '/products':
        if ($method === 'GET') {
            echo json_encode([
                'products' => [
                    ['id' => 1, 'name' => 'Café Americano', 'price' => 25.00, 'category' => 'Bebidas'],
                    ['id' => 2, 'name' => 'Café Latte', 'price' => 35.00, 'category' => 'Bebidas'],
                    ['id' => 3, 'name' => 'Sandwich Club', 'price' => 65.00, 'category' => 'Comidas'],
                    ['id' => 4, 'name' => 'Ensalada César', 'price' => 70.00, 'category' => 'Comidas'],
                ]
            ]);
        }
        break;
        
    case '/orders':
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Simulate order creation
            $order = [
                'id' => rand(1000, 9999),
                'phone' => $input['phone'] ?? '',
                'items' => $input['items'] ?? [],
                'total' => calculateTotal($input['items'] ?? []),
                'status' => 'RECIBIDO',
                'payment_link' => 'https://payment.example.com/pay/' . rand(1000, 9999)
            ];
            
            echo json_encode([
                'success' => true,
                'order' => $order,
                'message' => 'Pedido creado exitosamente'
            ]);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}

function calculateTotal($items) {
    $prices = [
        1 => 25.00,  // Café Americano
        2 => 35.00,  // Café Latte
        3 => 65.00,  // Sandwich Club
        4 => 70.00,  // Ensalada César
    ];
    
    $total = 0;
    foreach ($items as $item) {
        $price = $prices[$item['product_id']] ?? 0;
        $total += $price * $item['quantity'];
    }
    
    return $total;
}