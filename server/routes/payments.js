const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Mock payment service - in production, this would integrate with Stripe, PayPal, etc.
class PaymentService {
  static async processStripePayment(amount, paymentMethodId, metadata) {
    // Mock Stripe payment processing
    return {
      id: 'pi_mock_' + Date.now(),
      status: 'succeeded',
      amount: amount,
      currency: 'mxn',
      metadata: metadata
    };
  }

  static async processPayPalPayment(amount, orderId, metadata) {
    // Mock PayPal payment processing
    return {
      id: 'PAYPAL_' + Date.now(),
      status: 'COMPLETED',
      amount: amount,
      currency: 'MXN',
      metadata: metadata
    };
  }

  static async processSPEIPayment(amount, metadata) {
    // Mock SPEI payment processing - generates reference number
    const reference = Math.floor(Math.random() * 1000000000).toString().padStart(10, '0');
    return {
      id: 'SPEI_' + Date.now(),
      status: 'pending',
      amount: amount,
      currency: 'MXN',
      reference: reference,
      bankInfo: {
        bank: 'Banco Mock',
        account: '1234567890',
        clabe: '012345678901234567'
      },
      metadata: metadata
    };
  }
}

// Create payment intent (Stripe)
router.post('/stripe/create-intent', auth, [
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('ticketIds').isArray().notEmpty().withMessage('Ticket IDs array is required'),
  body('raffleId').notEmpty().withMessage('Raffle ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, ticketIds, raffleId } = req.body;

    // In production, you would create a real Stripe PaymentIntent
    const paymentIntent = await PaymentService.processStripePayment(
      Math.round(amount * 100), // Convert to cents
      null, // payment method would be provided by frontend
      {
        userId: req.user._id.toString(),
        ticketIds: ticketIds.join(','),
        raffleId: raffleId
      }
    );

    res.json({
      clientSecret: 'pi_mock_secret_' + Date.now(),
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: 'mxn'
    });

  } catch (error) {
    console.error('Create Stripe payment intent error:', error);
    res.status(500).json({ message: 'Error creating payment intent' });
  }
});

// Confirm payment (Stripe)
router.post('/stripe/confirm', auth, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('ticketIds').isArray().notEmpty().withMessage('Ticket IDs array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId, ticketIds } = req.body;

    // In production, you would retrieve and confirm the actual PaymentIntent from Stripe
    const paymentResult = {
      id: paymentIntentId,
      status: 'succeeded',
      amount: 500 * ticketIds.length, // Mock amount
      currency: 'mxn'
    };

    if (paymentResult.status === 'succeeded') {
      // Update tickets with payment confirmation
      // This would be handled by the tickets route confirm-payment endpoint
      res.json({
        success: true,
        paymentId: paymentResult.id,
        message: 'Payment confirmed successfully',
        nextStep: 'Call /api/tickets/confirm-payment to update tickets'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment failed',
        paymentStatus: paymentResult.status
      });
    }

  } catch (error) {
    console.error('Confirm Stripe payment error:', error);
    res.status(500).json({ message: 'Error confirming payment' });
  }
});

// Create PayPal order
router.post('/paypal/create-order', auth, [
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('ticketIds').isArray().notEmpty().withMessage('Ticket IDs array is required'),
  body('raffleId').notEmpty().withMessage('Raffle ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, ticketIds, raffleId } = req.body;

    // Mock PayPal order creation
    const order = {
      id: 'PAYPAL_ORDER_' + Date.now(),
      status: 'CREATED',
      amount: {
        currency_code: 'MXN',
        value: amount.toString()
      },
      metadata: {
        userId: req.user._id.toString(),
        ticketIds: ticketIds.join(','),
        raffleId: raffleId
      }
    };

    res.json({
      orderId: order.id,
      amount: amount,
      currency: 'MXN',
      approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${order.id}`
    });

  } catch (error) {
    console.error('Create PayPal order error:', error);
    res.status(500).json({ message: 'Error creating PayPal order' });
  }
});

// Capture PayPal payment
router.post('/paypal/capture', auth, [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('ticketIds').isArray().notEmpty().withMessage('Ticket IDs array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, ticketIds } = req.body;

    // Mock PayPal payment capture
    const captureResult = await PaymentService.processPayPalPayment(
      500 * ticketIds.length, // Mock amount
      orderId,
      {
        userId: req.user._id.toString(),
        ticketIds: ticketIds.join(',')
      }
    );

    if (captureResult.status === 'COMPLETED') {
      res.json({
        success: true,
        paymentId: captureResult.id,
        message: 'PayPal payment captured successfully',
        nextStep: 'Call /api/tickets/confirm-payment to update tickets'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'PayPal payment capture failed',
        paymentStatus: captureResult.status
      });
    }

  } catch (error) {
    console.error('Capture PayPal payment error:', error);
    res.status(500).json({ message: 'Error capturing PayPal payment' });
  }
});

// Generate SPEI reference
router.post('/spei/generate-reference', auth, [
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('ticketIds').isArray().notEmpty().withMessage('Ticket IDs array is required'),
  body('raffleId').notEmpty().withMessage('Raffle ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, ticketIds, raffleId } = req.body;

    // Generate SPEI reference
    const speiInfo = await PaymentService.processSPEIPayment(amount, {
      userId: req.user._id.toString(),
      ticketIds: ticketIds.join(','),
      raffleId: raffleId
    });

    res.json({
      reference: speiInfo.reference,
      amount: amount,
      bankInfo: speiInfo.bankInfo,
      paymentId: speiInfo.id,
      instructions: {
        es: 'Realiza el pago con el número de referencia proporcionado. El pago puede tardar hasta 24 horas en procesarse.',
        en: 'Make the payment with the provided reference number. Payment may take up to 24 hours to process.'
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });

  } catch (error) {
    console.error('Generate SPEI reference error:', error);
    res.status(500).json({ message: 'Error generating SPEI reference' });
  }
});

// Webhook endpoint for payment notifications (would be used by payment providers)
router.post('/webhook/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const payload = req.body;

    console.log(`Received ${provider} webhook:`, payload);

    // In production, you would:
    // 1. Verify the webhook signature
    // 2. Process the payment status update
    // 3. Update the corresponding tickets
    // 4. Send notifications to users

    switch (provider) {
      case 'stripe':
        // Handle Stripe webhook
        if (payload.type === 'payment_intent.succeeded') {
          // Payment succeeded, confirm tickets
          console.log('Stripe payment succeeded:', payload.data.object.id);
        }
        break;
      
      case 'paypal':
        // Handle PayPal webhook
        if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
          // Payment captured, confirm tickets
          console.log('PayPal payment captured:', payload.resource.id);
        }
        break;
      
      case 'spei':
        // Handle SPEI notification
        if (payload.status === 'completed') {
          // SPEI payment received, confirm tickets
          console.log('SPEI payment received:', payload.reference);
        }
        break;
      
      default:
        return res.status(400).json({ message: 'Unknown payment provider' });
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
});

// Get payment methods info
router.get('/methods', (req, res) => {
  res.json({
    methods: [
      {
        id: 'stripe',
        name: 'Tarjeta de Crédito/Débito',
        description: 'Pago inmediato con tarjeta',
        fees: '3.6% + $3 MXN',
        processingTime: 'Inmediato'
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Pago con cuenta PayPal',
        fees: '4.4% + $3 MXN',
        processingTime: 'Inmediato'
      },
      {
        id: 'spei',
        name: 'Transferencia SPEI',
        description: 'Transferencia bancaria nacional',
        fees: 'Sin comisión',
        processingTime: 'Hasta 24 horas'
      }
    ]
  });
});

module.exports = router;