// Order Management JavaScript
class OrderManager {
    constructor() {
        this.cart = [];
        this.products = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.renderProducts();
        this.setupEventListeners();
        this.loadPhoneFromURL();
    }

    loadPhoneFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const phone = urlParams.get('phone');
        if (phone) {
            document.getElementById('phone').value = phone;
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            this.products = data.products;
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback products
            this.products = [
                {id: 1, name: 'Café Americano', price: 25.00, category: 'Bebidas'},
                {id: 2, name: 'Café Latte', price: 35.00, category: 'Bebidas'},
                {id: 3, name: 'Sandwich Club', price: 65.00, category: 'Comidas'},
                {id: 4, name: 'Ensalada César', price: 70.00, category: 'Comidas'}
            ];
        }
    }

    renderProducts() {
        const container = document.getElementById('products');
        const grouped = this.groupByCategory(this.products);

        container.innerHTML = '';
        
        for (const [category, products] of Object.entries(grouped)) {
            products.forEach(product => {
                const productCard = this.createProductCard(product);
                container.appendChild(productCard);
            });
        }
    }

    groupByCategory(products) {
        return products.reduce((acc, product) => {
            if (!acc[product.category]) {
                acc[product.category] = [];
            }
            acc[product.category].push(product);
            return acc;
        }, {});
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="category">${product.category}</div>
            <h3>${product.name}</h3>
            <div class="price">$${product.price.toFixed(2)} MXN</div>
            <div class="quantity-controls">
                <button type="button" class="btn btn-primary" onclick="orderManager.addToCart(${product.id})">
                    ➕ Agregar
                </button>
            </div>
        `;
        return card;
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.product_id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                product_id: productId,
                product: product,
                quantity: 1
            });
        }

        this.updateCartDisplay();
    }

    removeFromCart(productId) {
        const index = this.cart.findIndex(item => item.product_id === productId);
        if (index > -1) {
            if (this.cart[index].quantity > 1) {
                this.cart[index].quantity -= 1;
            } else {
                this.cart.splice(index, 1);
            }
        }
        this.updateCartDisplay();
    }

    updateCartDisplay() {
        const cartElement = document.getElementById('cart');
        const cartItemsElement = document.getElementById('cartItems');
        const totalElement = document.getElementById('total');

        if (this.cart.length === 0) {
            cartElement.style.display = 'none';
            return;
        }

        cartElement.style.display = 'block';

        let cartHtml = '';
        let total = 0;

        this.cart.forEach(item => {
            const subtotal = item.product.price * item.quantity;
            total += subtotal;

            cartHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; border: 1px solid #eee; border-radius: 5px;">
                    <div>
                        <strong>${item.product.name}</strong><br>
                        <small>$${item.product.price.toFixed(2)} × ${item.quantity}</small>
                    </div>
                    <div>
                        <button type="button" class="btn btn-warning" onclick="orderManager.removeFromCart(${item.product_id})">
                            ➖
                        </button>
                        <span style="margin: 0 10px;">$${subtotal.toFixed(2)}</span>
                        <button type="button" class="btn btn-success" onclick="orderManager.addToCart(${item.product_id})">
                            ➕
                        </button>
                    </div>
                </div>
            `;
        });

        cartItemsElement.innerHTML = cartHtml;
        totalElement.textContent = total.toFixed(2);
    }

    setupEventListeners() {
        document.getElementById('orderForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitOrder();
        });
    }

    async submitOrder() {
        const phone = document.getElementById('phone').value;
        const name = document.getElementById('name').value;

        if (!phone || !name || this.cart.length === 0) {
            alert('Por favor complete todos los campos y agregue al menos un producto.');
            return;
        }

        const orderData = {
            phone: phone,
            name: name,
            items: this.cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            }))
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (result.success) {
                alert(`¡Pedido creado exitosamente!\n\nID: ${result.order.id}\nTotal: $${result.order.total.toFixed(2)} MXN\n\nSe ha enviado el enlace de pago a tu WhatsApp.`);
                
                // Redirect to payment or order success page
                if (result.order.payment_link) {
                    window.open(result.order.payment_link, '_blank');
                }
                
                // Reset form
                this.cart = [];
                this.updateCartDisplay();
                document.getElementById('orderForm').reset();
            } else {
                alert('Error al crear el pedido: ' + (result.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Error al enviar el pedido. Por favor intente nuevamente.');
        }
    }
}

// Initialize when page loads
let orderManager;
document.addEventListener('DOMContentLoaded', () => {
    orderManager = new OrderManager();
});