<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run()
    {
        $products = [
            // Bebidas
            ['name' => 'Café Americano', 'price' => 25.00, 'category' => 'Bebidas'],
            ['name' => 'Café Latte', 'price' => 35.00, 'category' => 'Bebidas'],
            ['name' => 'Cappuccino', 'price' => 32.00, 'category' => 'Bebidas'],
            ['name' => 'Frappé de Chocolate', 'price' => 45.00, 'category' => 'Bebidas'],
            ['name' => 'Té Verde', 'price' => 20.00, 'category' => 'Bebidas'],
            ['name' => 'Smoothie de Fresa', 'price' => 40.00, 'category' => 'Bebidas'],
            
            // Panadería
            ['name' => 'Croissant Simple', 'price' => 18.00, 'category' => 'Panadería'],
            ['name' => 'Croissant de Chocolate', 'price' => 22.00, 'category' => 'Panadería'],
            ['name' => 'Muffin de Arándanos', 'price' => 28.00, 'category' => 'Panadería'],
            ['name' => 'Dona Glaseada', 'price' => 15.00, 'category' => 'Panadería'],
            ['name' => 'Scone de Queso', 'price' => 25.00, 'category' => 'Panadería'],
            
            // Comidas
            ['name' => 'Sandwich Club', 'price' => 65.00, 'category' => 'Comidas'],
            ['name' => 'Sandwich Vegetariano', 'price' => 55.00, 'category' => 'Comidas'],
            ['name' => 'Ensalada César', 'price' => 70.00, 'category' => 'Comidas'],
            ['name' => 'Quiche Lorraine', 'price' => 60.00, 'category' => 'Comidas'],
            ['name' => 'Bagel con Salmón', 'price' => 85.00, 'category' => 'Comidas'],
            
            // Postres
            ['name' => 'Cheesecake de Fresa', 'price' => 45.00, 'category' => 'Postres'],
            ['name' => 'Brownie con Helado', 'price' => 38.00, 'category' => 'Postres'],
            ['name' => 'Tiramisu', 'price' => 50.00, 'category' => 'Postres'],
            ['name' => 'Galletas de Chocolate', 'price' => 20.00, 'category' => 'Postres'],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}