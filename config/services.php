<?php

return [
    'whatsapp' => [
        'api_url' => env('WHATSAPP_API_URL', 'https://api.zoko.io/v1'),
        'access_token' => env('WHATSAPP_ACCESS_TOKEN'),
        'webhook_secret' => env('WHATSAPP_WEBHOOK_SECRET'),
    ],

    'stripe' => [
        'public_key' => env('STRIPE_PUBLIC_KEY'),
        'secret_key' => env('STRIPE_SECRET_KEY'),
    ],

    'paypal' => [
        'client_id' => env('PAYPAL_CLIENT_ID'),
        'client_secret' => env('PAYPAL_CLIENT_SECRET'),
        'mode' => env('PAYPAL_MODE', 'sandbox'), // sandbox or live
    ],
];