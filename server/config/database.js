const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Skip MongoDB connection in development if not available
    if (process.env.SKIP_DB === 'true') {
      console.log('📦 Database connection skipped (demo mode)');
      return;
    }

    const mongoose = require('mongoose');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rifas', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('🔄 Running in demo mode without database');
    // Don't exit in demo mode
    // process.exit(1);
  }
};

module.exports = connectDB;