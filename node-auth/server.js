/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  server.js — Entry Point
 *  ONE WORLD ONE FAMILY — Node Auth Service
 *  Project  : Volunteer Management and Donation Tracking System
 *  Database : one_world_one_family (MongoDB Atlas)
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config(); // Load .env variables first

const express    = require('express');
const cors       = require('cors');
const connectDB  = require('./config/db');
const authRoutes = require('./routes/auth');

// ── Connect to MongoDB Atlas (one_world_one_family database) ──────────────
connectDB();

// ── Initialize Express ────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin:      [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8000',
  ],
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    project:  'One World One Family',
    service:  'Node Auth Service',
    database: 'one_world_one_family (MongoDB Atlas)',
    status:   'running',
    version:  '1.0.0',
    endpoints: {
      register: 'POST /api/auth/register',
      login:    'POST /api/auth/login',
      me:       'GET  /api/auth/me        (protected)',
      logout:   'POST /api/auth/logout    (protected)',
    },
  });
});

// Authentication routes (register, login, me, logout)
app.use('/api/auth', authRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 [SERVER] Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ── Start Server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   🌍  ONE WORLD ONE FAMILY — Auth Service            ║');
  console.log(`║   🚀  Server running on http://localhost:${PORT}        ║`);
  console.log('║   📦  Project: Volunteer Mgmt & Donation Tracking    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
