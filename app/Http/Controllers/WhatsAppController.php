<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppController extends Controller
{
    private $whatsapp;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    public function webhook(Request $request)
    {
        // Verify webhook signature
        $signature = $request->header('X-Hub-Signature-256');
        $payload = $request->getContent();
        $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, config('services.whatsapp.webhook_secret'));

        if (!hash_equals($signature, $expectedSignature)) {
            return response('Unauthorized', 401);
        }

        $data = $request->json()->all();
        
        if (isset($data['entry'][0]['changes'][0]['value']['messages'][0])) {
            $message = $data['entry'][0]['changes'][0]['value']['messages'][0];
            $this->processMessage($message);
        }

        return response('OK', 200);
    }

    private function processMessage($message)
    {
        $phone = $message['from'];
        $text = $message['text']['body'] ?? '';
        
        // Find or create user
        $user = User::firstOrCreate(
            ['phone' => $phone],
            ['name' => 'Usuario ' . substr($phone, -4)]
        );

        Log::info('Processing WhatsApp message', ['phone' => $phone, 'text' => $text]);

        // Process different commands
        switch (strtolower(trim($text))) {
            case '1':
            case 'menu':
            case 'menú':
                $this->sendMenu($phone);
                break;
                
            case '2':
            case 'historial':
                $this->sendHistory($user);
                break;
                
            case '3':
            case 'pedido':
                $this->startOrder($user);
                break;
                
            case '4':
            case 'estado':
                $this->sendOrderStatus($user);
                break;
                
            default:
                $this->whatsapp->sendMenu($phone);
                break;
        }
    }

    private function sendMenu($phone)
    {
        $products = Product::active()->get()->groupBy('category');
        
        $message = "🍽️ NUESTRO MENÚ\n\n";
        
        foreach ($products as $category => $categoryProducts) {
            $message .= "📂 " . strtoupper($category) . "\n";
            foreach ($categoryProducts as $product) {
                $message .= "• " . $product->name . " - $" . number_format($product->price, 2) . " MXN\n";
            }
            $message .= "\n";
        }
        
        $message .= "Para hacer un pedido, escribe '3' o 'pedido'";
        
        $this->whatsapp->sendMessage($phone, $message);
    }

    private function sendHistory(User $user)
    {
        $orders = $user->orders()->latest()->take(5)->get();
        
        if ($orders->isEmpty()) {
            $message = "📋 No tienes pedidos registrados aún.\n\nEscribe '3' para hacer tu primer pedido.";
        } else {
            $message = "📋 TUS ÚLTIMOS PEDIDOS\n\n";
            
            foreach ($orders as $order) {
                $message .= "🗓️ " . $order->created_at->format('d/m/Y H:i') . "\n";
                $message .= "💰 Total: $" . number_format($order->total, 2) . " MXN\n";
                $message .= "📊 Estado: " . $order->status . "\n";
                $message .= "💳 Pagado: " . ($order->paid ? 'Sí' : 'No') . "\n\n";
            }
            
            $message .= "💰 Total gastado: $" . number_format($user->total_spent, 2) . " MXN";
        }
        
        $this->whatsapp->sendMessage($user->phone, $message);
    }

    private function startOrder(User $user)
    {
        $message = "🛒 INICIAR PEDIDO\n\n";
        $message .= "Para realizar tu pedido, puedes:\n\n";
        $message .= "1. Escribir los productos que deseas\n";
        $message .= "   Ejemplo: '2 café americano, 1 sandwich'\n\n";
        $message .= "2. O visitar nuestro sitio web para una experiencia más completa:\n";
        $message .= config('app.url') . "/order\n\n";
        $message .= "¿Cómo prefieres continuar?";
        
        $this->whatsapp->sendMessage($user->phone, $message);
    }

    private function sendOrderStatus(User $user)
    {
        $activeOrder = $user->orders()
            ->whereIn('status', ['RECIBIDO', 'EN_PREPARACION', 'LISTO'])
            ->latest()
            ->first();
            
        if (!$activeOrder) {
            $message = "📊 No tienes pedidos activos en este momento.\n\nEscribe '3' para hacer un nuevo pedido.";
        } else {
            $message = "📊 ESTADO DE TU PEDIDO\n\n";
            $message .= "🆔 Pedido #" . $activeOrder->id . "\n";
            $message .= "📅 Fecha: " . $activeOrder->created_at->format('d/m/Y H:i') . "\n";
            $message .= "💰 Total: $" . number_format($activeOrder->total, 2) . " MXN\n";
            $message .= "📊 Estado: " . $activeOrder->status . "\n";
            $message .= "💳 Pagado: " . ($activeOrder->paid ? 'Sí' : 'No') . "\n";
        }
        
        $this->whatsapp->sendMessage($user->phone, $message);
    }
}