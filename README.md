# Sistema de Rifas de Automóviles

Plataforma web para la venta de boletos digitales de rifas de automóviles con integración a la Lotería Nacional de México.

## Características Principales

- 🎫 Compra de boletos digitales con números aleatorios (00000-99999)
- 🚗 Gestión completa de rifas de automóviles
- 🎲 Determinación automática de ganadores basada en Lotería Nacional
- 💳 Múltiples métodos de pago (Stripe, PayPal, SPEI)
- 📱 Notificaciones por email y SMS
- 🔐 Sistema de autenticación y autorización
- 📄 Generación de tickets PDF con códigos QR
- 👨‍💼 Panel administrativo completo

## Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT
- **Pagos**: Stripe, PayPal, SPEI
- **Documentos**: PDFKit para generación de tickets
- **Códigos QR**: qrcode
- **Seguridad**: Helmet, bcryptjs, express-rate-limit

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/danjohn007/rifas.git
cd rifas
```

2. Instalar dependencias:
```bash
npm run install:all
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Ejecutar en modo desarrollo:
```bash
npm run dev
```

## Estructura del Proyecto

```
rifas/
├── server/                 # Backend API
│   ├── config/            # Configuración de base de datos
│   ├── middleware/        # Middleware de autenticación
│   ├── models/           # Modelos de MongoDB
│   ├── routes/           # Rutas de la API
│   ├── utils/            # Servicios y utilidades
│   └── index.js          # Punto de entrada del servidor
├── client/               # Frontend React (pendiente)
├── uploads/              # Archivos subidos
├── tickets/              # Tickets PDF generados
└── package.json          # Dependencias del proyecto
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Información del usuario actual

### Rifas
- `GET /api/raffles/public` - Rifas activas (público)
- `GET /api/raffles/public/:id` - Detalles de rifa (público)
- `POST /api/raffles` - Crear rifa (admin)
- `PUT /api/raffles/:id` - Actualizar rifa (admin)

### Tickets
- `POST /api/tickets/purchase` - Comprar tickets
- `GET /api/tickets/my-tickets` - Tickets del usuario
- `POST /api/tickets/verify` - Verificar autenticidad

### Pagos
- `POST /api/payments/stripe/create-intent` - Crear intención de pago
- `POST /api/payments/paypal/create-order` - Crear orden PayPal
- `POST /api/payments/spei/generate-reference` - Generar referencia SPEI

### Lotería
- `POST /api/lottery/determine-winner/:raffleId` - Determinar ganador
- `GET /api/lottery/winner/:raffleId` - Información del ganador

## Lógica de Determinación del Ganador

El sistema determina automáticamente al ganador utilizando el resultado oficial del primer premio de la Lotería Nacional de México:

1. **Obtención del Resultado**: Se consulta la API oficial de la Lotería Nacional
2. **Extracción de Dígitos**: Se extraen las últimas 5 cifras del número ganador
3. **Búsqueda del Ganador**: 
   - Primero se busca un ticket con coincidencia exacta
   - Si no hay coincidencia exacta, se busca el número más cercano hacia abajo
   - Si no hay ganador, el premio se declara desierto

### Ejemplo:
- Resultado Lotería Nacional: **0526789**
- Últimas 5 cifras: **26789**
- Si existe ticket **26789** → Es el ganador
- Si no existe, se busca el mayor número menor a 26789 entre los tickets vendidos

## Seguridad

- Encriptación de contraseñas con bcrypt
- Autenticación JWT con expiración
- Rate limiting para prevenir abuso
- Validación de datos de entrada
- Helmet para headers de seguridad
- Verificación de códigos QR únicos por ticket

## Desarrollo

### Scripts Disponibles
- `npm start` - Ejecutar servidor en producción
- `npm run dev` - Ejecutar en modo desarrollo con nodemon
- `npm test` - Ejecutar pruebas
- `npm run lint` - Linter de código

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Contribución

1. Fork el proyecto
2. Crear rama para nueva funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Commit los cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

MIT

## Soporte

Para soporte técnico, crear un issue en GitHub o contactar al equipo de desarrollo.
