<?php

/**
 * Cafetería WhatsApp - API Entry Point
 * Sistema de pedidos en línea con integración WhatsApp
 */

// Check if we're running in CLI mode (for artisan commands)
if (php_sapi_name() === 'cli') {
    // Load basic autoloader for CLI operations
    if (file_exists(__DIR__ . '/vendor/autoload.php')) {
        require_once __DIR__ . '/vendor/autoload.php';
    }
    
    echo "Cafetería WhatsApp System\n";
    echo "========================\n\n";
    echo "Available operations:\n";
    echo "- migrate: Set up database tables\n";
    echo "- seed: Load demo products\n";
    echo "- serve: Start development server\n\n";
    echo "For full Laravel functionality, install dependencies with 'composer install'\n";
    exit(0);
}

// For web requests, serve the static HTML for now
if (file_exists(__DIR__ . '/public/index.html')) {
    include __DIR__ . '/public/index.html';
} else {
    echo "<h1>Cafetería WhatsApp</h1>";
    echo "<p>Sistema de pedidos en línea con integración WhatsApp</p>";
    echo "<p>Configure el sistema siguiendo las instrucciones en README.md</p>";
}