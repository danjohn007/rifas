const express = require('express');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const Raffle = require('../models/Raffle');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get user's tickets
router.get('/my-tickets', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, raffleId, status } = req.query;
    const query = { owner: req.user._id };
    
    if (raffleId) query.raffle = raffleId;
    if (status) query.paymentStatus = status;

    const tickets = await Ticket.find(query)
      .populate('raffle', 'title drawDate status carDetails.brand carDetails.model')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(query);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ticket by ID (owner or admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('raffle', 'title description carDetails drawDate status')
      .populate('owner', 'name email phone');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check ownership or admin privileges
    if (ticket.owner._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add verification code for display
    const ticketData = ticket.toObject();
    ticketData.verificationCode = ticket.generateVerificationCode();
    ticketData.qrData = ticket.getQRData();

    res.json(ticketData);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Purchase ticket
router.post('/purchase', auth, [
  body('raffleId').notEmpty().withMessage('Raffle ID is required'),
  body('paymentMethod').isIn(['stripe', 'paypal', 'spei']).withMessage('Valid payment method is required'),
  body('quantity').optional().isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { raffleId, paymentMethod, quantity = 1 } = req.body;

    // Get raffle and validate
    const raffle = await Raffle.findById(raffleId);
    if (!raffle) {
      return res.status(404).json({ message: 'Raffle not found' });
    }

    if (!raffle.canSellTickets()) {
      return res.status(400).json({ 
        message: 'Raffle is not available for ticket sales' 
      });
    }

    // Check if enough tickets are available
    if (raffle.soldTickets + quantity > raffle.totalTickets) {
      return res.status(400).json({ 
        message: 'Not enough tickets available' 
      });
    }

    // Generate ticket numbers and create tickets
    const tickets = [];
    const ticketNumbers = [];

    for (let i = 0; i < quantity; i++) {
      try {
        const ticketNumber = await Ticket.generateAvailableNumber(raffleId);
        ticketNumbers.push(ticketNumber);

        const ticket = new Ticket({
          ticketNumber,
          raffle: raffleId,
          owner: req.user._id,
          purchasePrice: raffle.ticketPrice,
          paymentMethod
        });

        tickets.push(ticket);
      } catch (error) {
        return res.status(400).json({ 
          message: 'No available ticket numbers' 
        });
      }
    }

    // Save all tickets
    await Promise.all(tickets.map(ticket => ticket.save()));

    // Update raffle sold tickets count
    raffle.soldTickets += quantity;
    await raffle.save();

    // Calculate total amount
    const totalAmount = raffle.ticketPrice * quantity;

    // Return ticket information for payment processing
    res.status(201).json({
      message: 'Tickets reserved successfully',
      tickets: tickets.map(ticket => ({
        _id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        purchasePrice: ticket.purchasePrice,
        verificationCode: ticket.generateVerificationCode()
      })),
      ticketNumbers,
      totalAmount,
      paymentMethod,
      raffleTitle: raffle.title,
      nextStep: 'Complete payment to confirm tickets'
    });

  } catch (error) {
    console.error('Purchase ticket error:', error);
    res.status(500).json({ message: 'Server error during ticket purchase' });
  }
});

// Confirm payment for tickets
router.post('/confirm-payment', auth, [
  body('ticketIds').isArray().notEmpty().withMessage('Ticket IDs array is required'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('paymentStatus').isIn(['completed', 'failed']).withMessage('Valid payment status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ticketIds, paymentId, paymentStatus } = req.body;

    // Find tickets and verify ownership
    const tickets = await Ticket.find({
      _id: { $in: ticketIds },
      owner: req.user._id,
      paymentStatus: 'pending'
    }).populate('raffle', 'title');

    if (tickets.length !== ticketIds.length) {
      return res.status(400).json({ 
        message: 'Some tickets not found or already processed' 
      });
    }

    // Update payment status
    for (const ticket of tickets) {
      ticket.paymentStatus = paymentStatus;
      ticket.paymentId = paymentId;
      
      if (paymentStatus === 'completed') {
        // Generate QR code and PDF would be done here
        // For now, just mark as confirmed
        ticket.notificationsSent.purchaseConfirmation = true;
      }

      await ticket.save();
    }

    // If payment failed, reduce sold tickets count
    if (paymentStatus === 'failed') {
      const raffle = await Raffle.findById(tickets[0].raffle._id);
      raffle.soldTickets -= tickets.length;
      await raffle.save();
    }

    res.json({
      message: `Payment ${paymentStatus} for ${tickets.length} ticket(s)`,
      tickets: tickets.map(ticket => ({
        _id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        paymentStatus: ticket.paymentStatus,
        verificationCode: ticket.generateVerificationCode()
      }))
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error confirming payment' });
  }
});

// Generate ticket PDF
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('raffle', 'title description carDetails drawDate')
      .populate('owner', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check ownership or admin privileges
    if (ticket.owner._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (ticket.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'Ticket payment not completed' });
    }

    // TODO: Generate PDF using PDFKit
    // For now, return ticket data that would be in the PDF
    const ticketData = {
      ticketNumber: ticket.ticketNumber,
      raffleTitle: ticket.raffle.title,
      carDetails: ticket.raffle.carDetails,
      drawDate: ticket.raffle.drawDate,
      ownerName: ticket.owner.name,
      purchaseDate: ticket.purchasedAt,
      verificationCode: ticket.generateVerificationCode(),
      qrData: JSON.stringify(ticket.getQRData())
    };

    res.json({
      message: 'PDF data generated',
      ticketData,
      note: 'PDF generation would be implemented here'
    });

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ message: 'Server error generating PDF' });
  }
});

// Verify ticket authenticity
router.post('/verify', [
  body('ticketNumber').matches(/^\d{5}$/).withMessage('Valid 5-digit ticket number is required'),
  body('verificationCode').isLength({ min: 8, max: 8 }).withMessage('Valid 8-character verification code is required'),
  body('raffleId').notEmpty().withMessage('Raffle ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ticketNumber, verificationCode, raffleId } = req.body;

    const ticket = await Ticket.findOne({
      ticketNumber,
      raffle: raffleId,
      paymentStatus: 'completed'
    }).populate('raffle', 'title drawDate')
      .populate('owner', 'name');

    if (!ticket) {
      return res.status(404).json({ 
        message: 'Ticket not found or payment not completed',
        isValid: false
      });
    }

    const expectedCode = ticket.generateVerificationCode();
    const isValid = expectedCode === verificationCode.toUpperCase();

    if (!isValid) {
      return res.status(400).json({ 
        message: 'Invalid verification code',
        isValid: false
      });
    }

    res.json({
      message: 'Ticket verified successfully',
      isValid: true,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        raffleTitle: ticket.raffle.title,
        drawDate: ticket.raffle.drawDate,
        ownerName: ticket.owner.name,
        purchaseDate: ticket.purchasedAt,
        isWinner: ticket.isWinner
      }
    });

  } catch (error) {
    console.error('Verify ticket error:', error);
    res.status(500).json({ message: 'Server error verifying ticket' });
  }
});

// Get all tickets for a raffle (admin only)
router.get('/raffle/:raffleId', adminAuth, async (req, res) => {
  try {
    const { raffleId } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    
    const query = { raffle: raffleId };
    if (status) query.paymentStatus = status;

    const tickets = await Ticket.find(query)
      .populate('owner', 'name email phone')
      .sort({ ticketNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(query);

    // Get summary statistics
    const stats = await Ticket.aggregate([
      { $match: { raffle: raffleId } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$purchasePrice' }
        }
      }
    ]);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      stats
    });

  } catch (error) {
    console.error('Get raffle tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;