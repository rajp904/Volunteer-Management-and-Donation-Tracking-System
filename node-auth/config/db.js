/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  config/db.js
 *  MongoDB Atlas connection for ONE WORLD ONE FAMILY
 *  Database : one_world_one_family
 *  Project  : Volunteer Management and Donation Tracking System
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

/**
 * connectDB — Establishes connection to MongoDB Atlas (one_world_one_family db).
 * Call once at server startup. Exits the process on failure.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options keep the connection clean and prevent deprecation warnings
      serverSelectionTimeoutMS: 10000, // 10 sec timeout
      socketTimeoutMS: 45000,
    });

    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  ✅  MongoDB Atlas Connected Successfully             ║');
    console.log(`║  🌐  Host    : ${conn.connection.host.substring(0, 34).padEnd(34)} ║`);
    console.log(`║  🗄️  Database: one_world_one_family                   ║`);
    console.log(`║  📁  Project : Volunteer Mgmt & Donation Tracking     ║`);
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄  MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌  MongoDB connection error:', err.message);
    });

  } catch (error) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════╗');
    console.error('║  ❌  MongoDB Atlas Connection FAILED                  ║');
    console.error(`║  📛  Error: ${error.message.substring(0, 40).padEnd(40)} ║`);
    console.error('╚══════════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1); // Exit with failure code so server restarts if using PM2
  }
};

module.exports = connectDB;
