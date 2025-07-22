const mongoose = require('mongoose');

const raffleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  carDetails: {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    features: [String],
    images: [String] // Array of image URLs/paths
  },
  ticketPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalTickets: {
    type: Number,
    required: true,
    min: 1,
    max: 100000 // 00000 to 99999
  },
  soldTickets: {
    type: Number,
    default: 0
  },
  drawDate: {
    type: Date,
    required: true
  },
  lotteryDate: {
    type: Date, // Date of the Mexican National Lottery draw
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  winner: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    ticketNumber: {
      type: String,
      default: null
    },
    lotteryResult: {
      type: String, // Full lottery number
      default: null
    },
    notifiedAt: {
      type: Date,
      default: null
    },
    prizeClaimedAt: {
      type: Date,
      default: null
    }
  },
  rules: {
    termsAndConditions: String,
    prizeDeliveryInfo: String,
    contactInfo: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
raffleSchema.index({ status: 1, drawDate: 1 });
raffleSchema.index({ createdBy: 1 });

// Virtual for available tickets
raffleSchema.virtual('availableTickets').get(function() {
  return this.totalTickets - this.soldTickets;
});

// Method to check if raffle is active and can sell tickets
raffleSchema.methods.canSellTickets = function() {
  return this.status === 'active' && 
         this.soldTickets < this.totalTickets && 
         new Date() < this.drawDate;
};

// Method to get raffle summary for public display
raffleSchema.methods.getPublicSummary = function() {
  return {
    _id: this._id,
    title: this.title,
    description: this.description,
    carDetails: this.carDetails,
    ticketPrice: this.ticketPrice,
    totalTickets: this.totalTickets,
    soldTickets: this.soldTickets,
    availableTickets: this.availableTickets,
    drawDate: this.drawDate,
    status: this.status,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Raffle', raffleSchema);