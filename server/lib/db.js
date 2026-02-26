/**
 * Database connection manager.
 * Sets global flag for memory mode when MongoDB unavailable.
 */

import mongoose from 'mongoose';

// Global flag — models check this at call time
let _useMemory = false;

export function isMemoryMode() {
  return _useMemory;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/velocity';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    _useMemory = false;
    console.log('Connected to MongoDB');
    return true;
  } catch (err) {
    console.warn(`MongoDB not available: ${err.message}`);
    console.log('>>> Using in-memory storage (data resets on restart) <<<');
    _useMemory = true;
    return false;
  }
}

export function getMongooseState() {
  if (_useMemory) return 'memory';
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}
