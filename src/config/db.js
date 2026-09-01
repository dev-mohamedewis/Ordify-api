const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in the environment variables.');
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

module.exports = { connectDB };
