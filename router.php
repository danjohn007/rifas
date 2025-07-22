<?php
/**
 * Simple Router for Cafetería WhatsApp System
 * Handles basic routing for development/demo purposes
 */

// Get the request URI and method
$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove leading slash
$path = ltrim($path, '/');

// Basic routing
switch ($path) {
    case '':
    case 'index.php':
        if (file_exists('public/index.html')) {
            include 'public/index.html';
        } else {
            echo "<h1>Cafetería WhatsApp</h1><p>Sistema de pedidos en línea</p>";
        }
        break;
        
    case 'order':
        if (file_exists('public/order/index.html')) {
            include 'public/order/index.html';
        } else {
            echo "<h1>Crear Pedido</h1>";
        }
        break;
        
    case 'admin':
        if (file_exists('public/admin/index.html')) {
            include 'public/admin/index.html';
        } else {
            echo "<h1>Panel de Administración</h1>";
        }
        break;
        
    case 'api/products':
        header('Content-Type: application/json');
        include 'api.php';
        break;
        
    case 'api/orders':
        header('Content-Type: application/json');
        include 'api.php';
        break;
        
    case 'webhook/whatsapp':
        include 'webhook.php';
        break;
        
    default:
        // Try to serve static files
        if (file_exists('public/' . $path)) {
            $ext = pathinfo($path, PATHINFO_EXTENSION);
            switch ($ext) {
                case 'css':
                    header('Content-Type: text/css');
                    break;
                case 'js':
                    header('Content-Type: application/javascript');
                    break;
                case 'html':
                    header('Content-Type: text/html');
                    break;
            }
            include 'public/' . $path;
        } else {
            http_response_code(404);
            echo "<h1>404 - Page Not Found</h1>";
        }
        break;
}