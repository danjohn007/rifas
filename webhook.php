<?php

/**
 * WhatsApp Webhook Endpoint
 * Handles incoming WhatsApp messages from Zoko API
 */

header('Content-Type: application/json');

// Basic webhook verification
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Webhook verification
    $verify_token = $_GET['hub_verify_token'] ?? '';
    $challenge = $_GET['hub_challenge'] ?? '';
    
    $expected_token = getenv('VERIFY_TOKEN');
    if ($verify_token === $expected_token) {
        echo $challenge;
        exit;
    }
    
    http_response_code(403);
    echo json_encode(['error' => 'Invalid verify token']);
    exit;
}

// Handle incoming webhooks
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Log the webhook for debugging
    error_log('WhatsApp Webhook: ' . $input);
    
    // Basic message processing
    if (isset($data['entry'][0]['changes'][0]['value']['messages'][0])) {
        $message = $data['entry'][0]['changes'][0]['value']['messages'][0];
        $phone = $message['from'];
        $text = $message['text']['body'] ?? '';
        
        // Simple auto-responder
        $response = processWhatsAppMessage($phone, $text);
        
        if ($response) {
            sendWhatsAppMessage($phone, $response);
        }
    }
    
    echo json_encode(['status' => 'ok']);
    exit;
}

function processWhatsAppMessage($phone, $text) {
    $text = strtolower(trim($text));
    
    switch ($text) {
        case '1':
        case 'menu':
        case 'menú':
            return "🍽️ NUESTRO MENÚ\n\n" .
                   "☕ BEBIDAS\n" .
                   "• Café Americano - $25 MXN\n" .
                   "• Café Latte - $35 MXN\n" .
                   "• Cappuccino - $32 MXN\n\n" .
                   "🥐 PANADERÍA\n" .
                   "• Croissant Simple - $18 MXN\n" .
                   "• Muffin de Arándanos - $28 MXN\n\n" .
                   "🥪 COMIDAS\n" .
                   "• Sandwich Club - $65 MXN\n" .
                   "• Ensalada César - $70 MXN\n\n" .
                   "Para hacer un pedido, escribe '3' o 'pedido'";
                   
        case '2':
        case 'historial':
            return "📋 Para ver tu historial completo, visita:\n" .
                   "https://tu-dominio.com/history?phone=" . $phone;
                   
        case '3':
        case 'pedido':
            return "🛒 Para hacer tu pedido, puedes:\n\n" .
                   "1. Visitar nuestro sitio web:\n" .
                   "https://tu-dominio.com/order?phone=" . $phone . "\n\n" .
                   "2. O escribir directamente los productos que deseas\n" .
                   "Ejemplo: '2 café americano, 1 sandwich club'";
                   
        default:
            return "¡Hola! 👋 Bienvenido a nuestra cafetería.\n\n" .
                   "¿Qué deseas hacer?\n\n" .
                   "1️⃣ Ver menú\n" .
                   "2️⃣ Mi historial\n" .
                   "3️⃣ Hacer pedido\n\n" .
                   "Escribe el número de la opción.";
    }
}

function sendWhatsAppMessage($phone, $message) {
    // This would integrate with actual Zoko API
    // For now, just log the response
    error_log("Send to $phone: $message");
    return true;
}