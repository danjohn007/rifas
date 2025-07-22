const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    match: /^\d{5}$/ // Exactly 5 digits (00000-99999)
  },
  raffle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Raffle',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'spei', 'cash'],
    required: true
  },
  paymentId: {
    type: String, // External payment provider ID
    default: null
  },
  qrCode: {
    type: String, // Base64 encoded QR code or file path
    default: null
  },
  pdfPath: {
    type: String, // Path to generated PDF ticket
    default: null
  },
  isWinner: {
    type: Boolean,
    default: false
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  notificationsSent: {
    purchaseConfirmation: { type: Boolean, default: false },
    drawReminder: { type: Boolean, default: false },
    resultNotification: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Compound index to ensure unique ticket numbers per raffle
ticketSchema.index({ ticketNumber: 1, raffle: 1 }, { unique: true });
ticketSchema.index({ owner: 1, raffle: 1 });
ticketSchema.index({ raffle: 1, paymentStatus: 1 });

// Method to generate QR code data
ticketSchema.methods.getQRData = function() {
  return {
    ticketId: this._id,
    ticketNumber: this.ticketNumber,
    raffleId: this.raffle,
    ownerId: this.owner,
    purchasedAt: this.purchasedAt,
    verificationCode: this.generateVerificationCode()
  };
};

// Method to generate verification code for ticket validation
ticketSchema.methods.generateVerificationCode = function() {
  const crypto = require('crypto');
  const data = `${this._id}-${this.ticketNumber}-${this.raffle}-${this.owner}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8).toUpperCase();
};

// Method to check if ticket is valid and paid
ticketSchema.methods.isValid = function() {
  return this.paymentStatus === 'completed';
};

// Static method to generate random available ticket number
ticketSchema.statics.generateAvailableNumber = async function(raffleId) {
  const usedNumbers = await this.find({ raffle: raffleId }, { ticketNumber: 1 });
  const usedSet = new Set(usedNumbers.map(ticket => ticket.ticketNumber));
  
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    const randomNumber = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    if (!usedSet.has(randomNumber)) {
      return randomNumber;
    }
    attempts++;
  }
  
  // If random generation fails, find first available number sequentially
  for (let i = 0; i < 100000; i++) {
    const number = i.toString().padStart(5, '0');
    if (!usedSet.has(number)) {
      return number;
    }
  }
  
  throw new Error('No available ticket numbers');
};

module.exports = mongoose.model('Ticket', ticketSchema);