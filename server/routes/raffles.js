const express = require('express');
const { body, validationResult } = require('express-validator');
const Raffle = require('../models/Raffle');
const Ticket = require('../models/Ticket');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all active raffles (public)
router.get('/public', async (req, res) => {
  try {
    const raffles = await Raffle.find({ 
      status: 'active',
      drawDate: { $gt: new Date() }
    })
    .sort({ drawDate: 1 })
    .select('title description carDetails ticketPrice totalTickets soldTickets drawDate status createdAt');

    const rafflesWithAvailability = raffles.map(raffle => ({
      ...raffle.toObject(),
      availableTickets: raffle.totalTickets - raffle.soldTickets,
      canPurchase: raffle.canSellTickets()
    }));

    res.json(rafflesWithAvailability);
  } catch (error) {
    console.error('Get public raffles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get raffle by ID (public)
router.get('/public/:id', async (req, res) => {
  try {
    const raffle = await Raffle.findById(req.params.id);
    
    if (!raffle) {
      return res.status(404).json({ message: 'Raffle not found' });
    }

    if (raffle.status !== 'active') {
      return res.status(403).json({ message: 'Raffle is not active' });
    }

    const raffleData = raffle.getPublicSummary();
    raffleData.canPurchase = raffle.canSellTickets();
    raffleData.availableTickets = raffle.totalTickets - raffle.soldTickets;

    res.json(raffleData);
  } catch (error) {
    console.error('Get raffle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all raffles (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) query.status = status;

    const raffles = await Raffle.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Raffle.countDocuments(query);

    res.json({
      raffles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get raffles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new raffle (admin only)
router.post('/', adminAuth, upload.array('images', 10), [
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('description').notEmpty().trim().withMessage('Description is required'),
  body('carDetails.brand').notEmpty().trim().withMessage('Car brand is required'),
  body('carDetails.model').notEmpty().trim().withMessage('Car model is required'),
  body('carDetails.year').isInt({ min: 1900, max: new Date().getFullYear() + 2 }).withMessage('Valid year is required'),
  body('carDetails.color').notEmpty().trim().withMessage('Car color is required'),
  body('ticketPrice').isFloat({ min: 0 }).withMessage('Valid ticket price is required'),
  body('totalTickets').isInt({ min: 1, max: 100000 }).withMessage('Total tickets must be between 1 and 100,000'),
  body('drawDate').isISO8601().withMessage('Valid draw date is required'),
  body('lotteryDate').isISO8601().withMessage('Valid lottery date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      carDetails,
      ticketPrice,
      totalTickets,
      drawDate,
      lotteryDate,
      rules
    } = req.body;

    // Process uploaded images
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const raffle = new Raffle({
      title,
      description,
      carDetails: {
        ...JSON.parse(carDetails),
        images
      },
      ticketPrice: parseFloat(ticketPrice),
      totalTickets: parseInt(totalTickets),
      drawDate: new Date(drawDate),
      lotteryDate: new Date(lotteryDate),
      rules: rules ? JSON.parse(rules) : {},
      createdBy: req.user._id
    });

    await raffle.save();

    res.status(201).json({
      message: 'Raffle created successfully',
      raffle
    });
  } catch (error) {
    console.error('Create raffle error:', error);
    res.status(500).json({ message: 'Server error creating raffle' });
  }
});

// Update raffle (admin only)
router.put('/:id', adminAuth, [
  body('title').optional().notEmpty().trim().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().trim().withMessage('Description cannot be empty'),
  body('ticketPrice').optional().isFloat({ min: 0 }).withMessage('Valid ticket price is required'),
  body('drawDate').optional().isISO8601().withMessage('Valid draw date is required'),
  body('lotteryDate').optional().isISO8601().withMessage('Valid lottery date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const raffle = await Raffle.findById(req.params.id);
    
    if (!raffle) {
      return res.status(404).json({ message: 'Raffle not found' });
    }

    // Don't allow updates if raffle is completed or has sales
    if (raffle.status === 'completed' || raffle.soldTickets > 0) {
      return res.status(400).json({ 
        message: 'Cannot update raffle with existing sales or completed status' 
      });
    }

    const updateData = req.body;
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        raffle[key] = updateData[key];
      }
    });

    await raffle.save();

    res.json({
      message: 'Raffle updated successfully',
      raffle
    });
  } catch (error) {
    console.error('Update raffle error:', error);
    res.status(500).json({ message: 'Server error updating raffle' });
  }
});

// Change raffle status (admin only)
router.patch('/:id/status', adminAuth, [
  body('status').isIn(['draft', 'active', 'paused', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const raffle = await Raffle.findById(req.params.id);
    
    if (!raffle) {
      return res.status(404).json({ message: 'Raffle not found' });
    }

    raffle.status = status;
    await raffle.save();

    res.json({
      message: `Raffle status changed to ${status}`,
      raffle
    });
  } catch (error) {
    console.error('Change raffle status error:', error);
    res.status(500).json({ message: 'Server error changing raffle status' });
  }
});

// Get raffle statistics (admin only)
router.get('/:id/stats', adminAuth, async (req, res) => {
  try {
    const raffle = await Raffle.findById(req.params.id);
    
    if (!raffle) {
      return res.status(404).json({ message: 'Raffle not found' });
    }

    const tickets = await Ticket.find({ raffle: req.params.id });
    const paidTickets = tickets.filter(ticket => ticket.paymentStatus === 'completed');
    const totalRevenue = paidTickets.reduce((sum, ticket) => sum + ticket.purchasePrice, 0);

    const stats = {
      totalTickets: raffle.totalTickets,
      soldTickets: raffle.soldTickets,
      availableTickets: raffle.totalTickets - raffle.soldTickets,
      paidTickets: paidTickets.length,
      pendingPayments: tickets.filter(ticket => ticket.paymentStatus === 'pending').length,
      totalRevenue,
      averageTicketPrice: paidTickets.length > 0 ? totalRevenue / paidTickets.length : 0,
      salesPercentage: (raffle.soldTickets / raffle.totalTickets) * 100
    };

    res.json(stats);
  } catch (error) {
    console.error('Get raffle stats error:', error);
    res.status(500).json({ message: 'Server error getting raffle statistics' });
  }
});

module.exports = router;