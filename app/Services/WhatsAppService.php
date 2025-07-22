<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private $apiUrl;
    private $accessToken;

    public function __construct()
    {
        $this->apiUrl = config('services.whatsapp.api_url');
        $this->accessToken = config('services.whatsapp.access_token');
    }

    public function sendMessage($phone, $message)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '/messages', [
                'to' => $phone,
                'type' => 'text',
                'text' => ['body' => $message]
            ]);

            Log::info('WhatsApp message sent', ['phone' => $phone, 'response' => $response->json()]);
            return $response->successful();
        } catch (\Exception $e) {
            Log::error('WhatsApp message failed', ['phone' => $phone, 'error' => $e->getMessage()]);
            return false;
        }
    }

    public function sendMenu($phone)
    {
        $message = "¡Hola! Bienvenido a nuestra cafetería 🌟\n\n";
        $message .= "¿Qué deseas hacer hoy?\n\n";
        $message .= "1️⃣ Ver menú\n";
        $message .= "2️⃣ Mi historial\n";
        $message .= "3️⃣ Hacer pedido\n";
        $message .= "4️⃣ Estado de mi pedido\n\n";
        $message .= "Escribe el número de la opción que prefieras.";

        return $this->sendMessage($phone, $message);
    }

    public function sendStatusUpdate(Order $order)
    {
        $statusMessages = [
            'RECIBIDO' => '✅ Tu pedido ha sido recibido y está siendo procesado.',
            'EN_PREPARACION' => '👨‍🍳 Tu pedido está en preparación.',
            'LISTO' => '🚶 Tu pedido está listo para recoger.',
            'ENTREGADO' => '🍽️ ¡Tu pedido ha sido entregado! ¡Buen provecho!'
        ];

        $message = $statusMessages[$order->status] ?? 'Estado actualizado.';
        $message .= "\n\nPedido #" . $order->id;
        $message .= "\nTotal: $" . number_format($order->total, 2) . " MXN";

        return $this->sendMessage($order->user->phone, $message);
    }

    public function sendPaymentLink(Order $order)
    {
        $message = "💰 Total de tu pedido: $" . number_format($order->total, 2) . " MXN\n\n";
        $message .= "Para proceder con el pago, haz clic en el siguiente enlace:\n";
        $message .= $order->payment_link . "\n\n";
        $message .= "Una vez realizado el pago, recibirás la confirmación automáticamente.";

        return $this->sendMessage($order->user->phone, $message);
    }
}