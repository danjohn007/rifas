<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private $whatsapp;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    public function create(Request $request)
    {
        $phone = $request->get('phone');
        $products = Product::active()->get()->groupBy('category');
        
        return view('orders.create', compact('products', 'phone'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'name' => 'required|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        
        try {
            // Find or create user
            $user = User::firstOrCreate(
                ['phone' => $request->phone],
                ['name' => $request->name]
            );

            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'status' => 'RECIBIDO',
                'paid' => false,
                'total' => 0,
            ]);

            $total = 0;

            // Create order items
            foreach ($request->items as $item) {
                $product = Product::find($item['product_id']);
                $subtotal = $product->price * $item['quantity'];
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'subtotal' => $subtotal,
                ]);

                $total += $subtotal;
            }

            // Update order total
            $order->update(['total' => $total]);

            // Generate payment link
            $paymentLink = $this->generatePaymentLink($order);
            $order->update(['payment_link' => $paymentLink]);

            DB::commit();

            // Send WhatsApp confirmation
            $this->whatsapp->sendPaymentLink($order);

            return response()->json([
                'success' => true,
                'order_id' => $order->id,
                'payment_link' => $paymentLink,
                'total' => $total,
                'message' => 'Pedido creado exitosamente. Se ha enviado el enlace de pago por WhatsApp.'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el pedido: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Order $order)
    {
        $order->load(['user', 'orderItems.product']);
        return view('orders.show', compact('order'));
    }

    public function paymentSuccess(Request $request)
    {
        $orderId = $request->get('order_id');
        $order = Order::findOrFail($orderId);
        
        // Mark as paid
        $order->update(['paid' => true]);
        
        // Update user total spent
        $order->user->updateTotalSpent();
        
        // Send confirmation
        $this->whatsapp->sendStatusUpdate($order);
        
        return view('orders.success', compact('order'));
    }

    public function history(Request $request)
    {
        $phone = $request->get('phone');
        
        if (!$phone) {
            return redirect('/')->with('error', 'Número de teléfono requerido.');
        }
        
        $user = User::where('phone', $phone)->first();
        
        if (!$user) {
            return view('orders.history', ['orders' => collect(), 'user' => null]);
        }
        
        $orders = $user->orders()
            ->with('orderItems.product')
            ->latest()
            ->paginate(10);
            
        return view('orders.history', compact('orders', 'user'));
    }

    private function generatePaymentLink(Order $order)
    {
        // This would integrate with Stripe, PayPal, etc.
        // For now, return a mock payment URL
        return config('app.url') . '/payment/' . $order->id . '?token=' . $order->payment_token;
    }
}