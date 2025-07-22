<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard()
    {
        $stats = [
            'total_orders' => Order::count(),
            'pending_orders' => Order::whereIn('status', ['RECIBIDO', 'EN_PREPARACION'])->count(),
            'today_revenue' => Order::whereDate('created_at', today())->where('paid', true)->sum('total'),
            'total_customers' => User::count(),
        ];

        $recent_orders = Order::with(['user', 'orderItems.product'])
            ->latest()
            ->take(10)
            ->get();

        return view('admin.dashboard', compact('stats', 'recent_orders'));
    }

    public function products()
    {
        $products = Product::latest()->get();
        return view('admin.products.index', compact('products'));
    }

    public function createProduct()
    {
        return view('admin.products.create');
    }

    public function storeProduct(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'image_url' => 'nullable|url',
        ]);

        Product::create($request->all());

        return redirect()->route('admin.products')->with('success', 'Producto creado exitosamente.');
    }

    public function editProduct(Product $product)
    {
        return view('admin.products.edit', compact('product'));
    }

    public function updateProduct(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'image_url' => 'nullable|url',
        ]);

        $product->update($request->all());

        return redirect()->route('admin.products')->with('success', 'Producto actualizado exitosamente.');
    }

    public function deleteProduct(Product $product)
    {
        $product->delete();
        return redirect()->route('admin.products')->with('success', 'Producto eliminado exitosamente.');
    }

    public function orders()
    {
        $orders = Order::with(['user', 'orderItems.product'])
            ->latest()
            ->paginate(20);

        return view('admin.orders.index', compact('orders'));
    }

    public function showOrder(Order $order)
    {
        $order->load(['user', 'orderItems.product']);
        return view('admin.orders.show', compact('order'));
    }

    public function updateOrderStatus(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|in:RECIBIDO,EN_PREPARACION,LISTO,ENTREGADO'
        ]);

        $order->updateStatus($request->status);

        return redirect()->back()->with('success', 'Estado del pedido actualizado.');
    }

    public function customers()
    {
        $customers = User::withCount('orders')
            ->with(['orders' => function($query) {
                $query->latest()->take(3);
            }])
            ->orderBy('total_spent', 'desc')
            ->paginate(20);

        return view('admin.customers.index', compact('customers'));
    }

    public function reports()
    {
        $dailyRevenue = Order::selectRaw('DATE(created_at) as date, SUM(total) as revenue')
            ->where('paid', true)
            ->whereDate('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $topProducts = Product::selectRaw('products.*, SUM(order_items.quantity) as total_sold')
            ->join('order_items', 'products.id', '=', 'order_items.product_id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.paid', true)
            ->groupBy('products.id')
            ->orderBy('total_sold', 'desc')
            ->take(10)
            ->get();

        return view('admin.reports', compact('dailyRevenue', 'topProducts'));
    }
}