# 🚀 Deployment Instructions - Cafetería WhatsApp

## Quick Start (Development)

1. **Clone and setup**:
```bash
git clone <repository-url>
cd rifas
```

2. **Test with PHP built-in server**:
```bash
php -S localhost:8080 router.php
```

3. **Visit the application**:
- Homepage: http://localhost:8080
- Order page: http://localhost:8080/order
- Admin panel: http://localhost:8080/admin

## Production Deployment

### Apache Configuration
```apache
DocumentRoot /path/to/rifas
DirectoryIndex index.php

<Directory "/path/to/rifas">
    AllowOverride All
    Require all granted
</Directory>
```

### Laravel Deployment (Full Setup)
```bash
# Install dependencies
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate
php artisan db:seed
```

### WhatsApp Integration (Zoko)
1. Register at https://zoko.io
2. Create WhatsApp Bot
3. Configure webhook URL: `https://yourdomain.com/webhook/whatsapp`
4. Add credentials to `.env`:
```env
WHATSAPP_API_URL=https://api.zoko.io/v1
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_WEBHOOK_SECRET=your_secret
```

### Payment Integration
**Stripe:**
```env
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

**PayPal:**
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
PAYPAL_MODE=live
```

## Testing

### API Endpoints
```bash
# Test products API
curl http://localhost:8080/api/products

# Test order creation
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5233312345678","items":[{"product_id":1,"quantity":2}]}'

# Test WhatsApp webhook
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5233334445566","text":{"body":"menu"}}]}}]}]}'
```

## Features Implemented ✅

- ✅ WhatsApp Bot Integration
- ✅ Product Management
- ✅ Order Processing
- ✅ Payment Links
- ✅ Status Tracking
- ✅ Admin Dashboard
- ✅ Customer Portal
- ✅ Responsive Design