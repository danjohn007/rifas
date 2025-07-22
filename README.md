# Cafetería WhatsApp - Sistema de Pedidos en Línea

Sistema completo de pedidos para cafetería con integración a WhatsApp API, pagos en línea y panel de administración.

## 🌟 Características

- **Integración con WhatsApp**: Bot automatizado para recibir pedidos
- **Panel de Administración**: CRUD de productos, gestión de pedidos y reportes
- **Portal del Cliente**: Historial de pedidos y seguimiento
- **Pagos en Línea**: Integración con Stripe y PayPal
- **Notificaciones Automáticas**: Actualizaciones de estado por WhatsApp

## 🛠️ Tecnologías

- **Backend**: Laravel 10
- **Frontend**: Laravel Blade
- **Base de Datos**: MySQL
- **WhatsApp API**: Zoko
- **Pagos**: Stripe, PayPal
- **Hosting**: Apache

## 📦 Instalación

1. **Configurar entorno**:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

2. **Instalar dependencias**:
```bash
composer install
```

3. **Configurar base de datos**:
```bash
php artisan migrate
php artisan db:seed
```

4. **Configurar WhatsApp**:
- Registrarse en Zoko
- Configurar webhook: `/webhook/whatsapp`
- Agregar credenciales en `.env`

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# WhatsApp (Zoko)
WHATSAPP_API_URL=https://api.zoko.io/v1
WHATSAPP_ACCESS_TOKEN=tu_token_de_zoko
WHATSAPP_WEBHOOK_SECRET=tu_secret_webhook

# Pagos
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=tu_paypal_client_id
PAYPAL_CLIENT_SECRET=tu_paypal_secret
```

## 📱 Flujo de Pedido

1. **Cliente**: Envía mensaje a WhatsApp
2. **Bot**: Responde con menú y opciones
3. **Cliente**: Selecciona productos
4. **Sistema**: Genera enlace de pago
5. **Cliente**: Paga en línea
6. **Bot**: Envía confirmación y actualizaciones de estado

## 🎯 Endpoints Principales

- `/` - Página principal
- `/order` - Crear pedido web
- `/history` - Historial del cliente
- `/admin` - Panel de administración
- `/webhook/whatsapp` - Webhook de WhatsApp

## 📊 Base de Datos

- `users` - Clientes de WhatsApp
- `products` - Menú de productos
- `orders` - Pedidos realizados
- `order_items` - Detalle de pedidos

## 🚀 Estados del Pedido

- **RECIBIDO** - Pedido confirmado
- **EN_PREPARACION** - En cocina
- **LISTO** - Preparado para entrega
- **ENTREGADO** - Completado
