const express = require('express');
const { body, validationResult } = require('express-validator');
const Raffle = require('../models/Raffle');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const lotteryService = require('../utils/lotteryService');

const router = express.Router();

// Get lottery results for a specific date (admin only)
router.get('/results/:date', adminAuth, async (req, res) => {
  try {
    const { date } = req.params;
    const lotteryDate = new Date(date);

    if (isNaN(lotteryDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const results = await lotteryService.getLotteryResults(lotteryDate);
    
    res.json({
      message: 'Lottery results retrieved successfully',
      results
    });
  } catch (error) {
    console.error('Get lottery results error:', error);
    res.status(500).json({ 
      message: 'Error fetching lottery results',
      error: error.message 
    });
  }
});

// Process raffle winner determination (admin only)
router.post('/determine-winner/:raffleId', adminAuth, async (req, res) => {
  try {
    const { raffleId } = req.params;
    
    const raffle = await Raffle.findById(raffleId);
    if (!raffle) {
      return res.status(404).json({ message: 'Raffle not found' });
    }

    if (raffle.status !== 'active') {
      return res.status(400).json({ message: 'Raffle is not active' });
    }

    if (raffle.winner.user) {
      return res.status(400).json({ message: 'Winner already determined for this raffle' });
    }

    // Get lottery results for the raffle's lottery date
    const lotteryResults = await lotteryService.getLotteryResults(raffle.lotteryDate);
    
    if (!lotteryResults.firstPrize) {
      return res.status(400).json({ 
        message: 'Lottery results not available for the specified date' 
      });
    }

    // Get all paid tickets for this raffle
    const paidTickets = await Ticket.find({ 
      raffle: raffleId, 
      paymentStatus: 'completed' 
    }).populate('owner', 'name email phone');

    if (paidTickets.length === 0) {
      return res.status(400).json({ message: 'No paid tickets found for this raffle' });
    }

    const soldTicketNumbers = paidTickets.map(ticket => ticket.ticketNumber);
    
    // Determine winner using lottery service
    const winnerResult = lotteryService.findWinner(lotteryResults.firstPrize, soldTicketNumbers);
    
    if (!winnerResult.winnerFound) {
      // No winner found, mark raffle as completed but with no winner
      raffle.status = 'completed';
      raffle.winner.lotteryResult = lotteryResults.firstPrize;
      await raffle.save();

      return res.json({
        message: 'No winner found for this raffle',
        lotteryResults,
        winnerResult,
        raffleStatus: 'completed'
      });
    }

    // Find the winning ticket and user
    const winningTicket = paidTickets.find(ticket => ticket.ticketNumber === winnerResult.winningNumber);
    
    if (!winningTicket) {
      return res.status(500).json({ message: 'Error: Winning ticket not found in database' });
    }

    // Update raffle with winner information
    raffle.winner = {
      user: winningTicket.owner._id,
      ticketNumber: winnerResult.winningNumber,
      lotteryResult: lotteryResults.firstPrize,
      notifiedAt: new Date()
    };
    raffle.status = 'completed';
    await raffle.save();

    // Mark winning ticket
    winningTicket.isWinner = true;
    await winningTicket.save();

    // TODO: Send notification to winner (email/SMS)
    // This would be implemented in a notification service

    res.json({
      message: 'Winner determined successfully',
      winner: {
        user: winningTicket.owner,
        ticketNumber: winnerResult.winningNumber,
        matchType: winnerResult.matchType
      },
      lotteryResults,
      winnerResult
    });

  } catch (error) {
    console.error('Determine winner error:', error);
    res.status(500).json({ 
      message: 'Error determining winner',
      error: error.message 
    });
  }
});

// Manual winner determination with custom lottery result (admin only)
router.post('/manual-winner/:raffleId', adminAuth, [
  body('lotteryResult').notEmpty().withMessage('Lottery result is required'),
  body('lotteryResult').isLength({ min: 5 }).withMessage('Lottery result must have at least 5 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { raffleId } = req.params;
    const { lotteryResult } = req.body;
    
    const raffle = await Raffle.findById(raffleId);
    if (!raffle) {
      return res.status(404).json({ message: 'Raffle not found' });
    }

    if (raffle.winner.user) {
      return res.status(400).json({ message: 'Winner already determined for this raffle' });
    }

    // Validate lottery data
    if (!lotteryService.validateLotteryData(raffle.lotteryDate, lotteryResult)) {
      return res.status(400).json({ message: 'Invalid lottery result or date' });
    }

    // Get all paid tickets for this raffle
    const paidTickets = await Ticket.find({ 
      raffle: raffleId, 
      paymentStatus: 'completed' 
    }).populate('owner', 'name email phone');

    if (paidTickets.length === 0) {
      return res.status(400).json({ message: 'No paid tickets found for this raffle' });
    }

    const soldTicketNumbers = paidTickets.map(ticket => ticket.ticketNumber);
    
    // Determine winner using manual lottery result
    const winnerResult = lotteryService.findWinner(lotteryResult, soldTicketNumbers);
    
    if (!winnerResult.winnerFound) {
      return res.json({
        message: 'No winner found with the provided lottery result',
        lotteryResult,
        winnerResult
      });
    }

    // Find the winning ticket and user
    const winningTicket = paidTickets.find(ticket => ticket.ticketNumber === winnerResult.winningNumber);
    
    // Update raffle with winner information
    raffle.winner = {
      user: winningTicket.owner._id,
      ticketNumber: winnerResult.winningNumber,
      lotteryResult: lotteryResult,
      notifiedAt: new Date()
    };
    raffle.status = 'completed';
    await raffle.save();

    // Mark winning ticket
    winningTicket.isWinner = true;
    await winningTicket.save();

    res.json({
      message: 'Winner determined successfully (manual)',
      winner: {
        user: winningTicket.owner,
        ticketNumber: winnerResult.winningNumber,
        matchType: winnerResult.matchType
      },
      lotteryResult,
      winnerResult
    });

  } catch (error) {
    console.error('Manual winner determination error:', error);
    res.status(500).json({ 
      message: 'Error in manual winner determination',
      error: error.message 
    });
  }
});

// Get winner information for a raffle (public for completed raffles)
router.get('/winner/:raffleId', async (req, res) => {
  try {
    const { raffleId } = req.params;
    
    const raffle = await Raffle.findById(raffleId)
      .populate('winner.user', 'name')
      .select('title winner status drawDate lotteryDate');

    if (!raffle) {
      return res.status(404).json({ message: 'Raffle not found' });
    }

    if (raffle.status !== 'completed' || !raffle.winner.user) {
      return res.status(400).json({ message: 'Winner not determined yet' });
    }

    res.json({
      raffle: {
        title: raffle.title,
        drawDate: raffle.drawDate,
        lotteryDate: raffle.lotteryDate
      },
      winner: {
        name: raffle.winner.user.name,
        ticketNumber: raffle.winner.ticketNumber,
        winnerAnnouncedAt: raffle.winner.notifiedAt
      },
      lotteryResult: raffle.winner.lotteryResult
    });

  } catch (error) {
    console.error('Get winner error:', error);
    res.status(500).json({ message: 'Error retrieving winner information' });
  }
});

// Schedule automatic winner determination for future raffles (admin only)
router.post('/schedule-check/:raffleId', adminAuth, async (req, res) => {
  try {
    const { raffleId } = req.params;
    
    const raffle = await Raffle.findById(raffleId);
    if (!raffle) {
      return res.status(404).json({ message: 'Raffle not found' });
    }

    if (raffle.status !== 'active') {
      return res.status(400).json({ message: 'Raffle is not active' });
    }

    // Schedule automatic check
    lotteryService.scheduleResultCheck(raffle.lotteryDate, async (error, results) => {
      if (error) {
        console.error(`Scheduled lottery check failed for raffle ${raffleId}:`, error);
        return;
      }

      try {
        // Automatically determine winner when results are available
        // This would trigger the same logic as the manual determination
        console.log(`Lottery results available for raffle ${raffleId}:`, results);
        
        // Here you would call the winner determination logic
        // For now, just log that results are available
      } catch (autoError) {
        console.error(`Auto winner determination failed for raffle ${raffleId}:`, autoError);
      }
    });

    res.json({
      message: 'Automatic lottery result check scheduled',
      raffleId,
      lotteryDate: raffle.lotteryDate
    });

  } catch (error) {
    console.error('Schedule lottery check error:', error);
    res.status(500).json({ 
      message: 'Error scheduling lottery check',
      error: error.message 
    });
  }
});

module.exports = router;