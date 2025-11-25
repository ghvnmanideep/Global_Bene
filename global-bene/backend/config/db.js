const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is required');
    }

    const options = {
      // Connection options for production
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    };

    // Add additional options for production
    if (process.env.NODE_ENV === 'production') {
      options.retryWrites = true;
      options.retryReads = true;
    }

    await mongoose.connect(mongoUri, options);

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📡 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    // In production, don't exit immediately, let the app handle it
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
    throw err; // Let the caller handle the error
  }
};

module.exports = connectDB;
