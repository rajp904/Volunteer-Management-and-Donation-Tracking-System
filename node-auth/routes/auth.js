/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  routes/auth.js
 *  Authentication Routes — ONE WORLD ONE FAMILY
 *  Database   : one_world_one_family
 *  Collection : users
 *  Project    : Volunteer Management and Donation Tracking System
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  POST /api/auth/register  → Register a new user
 *  POST /api/auth/login     → Login and receive JWT
 *  GET  /api/auth/me        → Get current logged-in user (protected)
 *  POST /api/auth/logout    → Logout (client-side token removal)
 */

const express  = require('express');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Helper: Generate JWT token ────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token valid for 7 days
  );
};

// ── Helper: Build safe response (no password) ─────────────────────────────
const userResponse = (user) => ({
  _id:          user._id,
  fullName:     user.fullName,
  email:        user.email,
  phone:        user.phone,
  role:         user.role,
  profileImage: user.profileImage,
  isVerified:   user.isVerified,
  isActive:     user.isActive,
  lastLogin:    user.lastLogin,
  createdAt:    user.createdAt,
  updatedAt:    user.updatedAt,
});

// ──────────────────────────────────────────────────────────────────────────
//  POST /api/auth/register
//  Register a new user into the `users` collection (one_world_one_family db)
// ──────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, role, password, profileImage } = req.body;

    // 1. Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required.',
      });
    }

    // 2. Check for duplicate email in the `users` collection
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please log in.',
      });
    }

    // 3. Create user — password is auto-hashed by the pre-save hook in User.js
    const newUser = await User.create({
      fullName:     fullName.trim(),
      email:        email.toLowerCase().trim(),
      phone:        phone || null,
      role:         role  || 'Volunteer',
      password,               // Raw; will be bcrypt-hashed by pre-save hook
      profileImage: profileImage || null,
    });

    // 4. Generate JWT token
    const token = generateToken(newUser._id);

    console.log(`✅ [REGISTER] New user registered: ${newUser.email} | Role: ${newUser.role}`);

    // 5. Return user (excluding password) + token
    return res.status(201).json({
      success: true,
      message: `Welcome to One World One Family, ${newUser.fullName}! Your account has been created successfully.`,
      token,
      user: userResponse(newUser),
    });

  } catch (error) {
    // Handle Mongoose duplicate key error (email unique index violation)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
    }

    console.error('❌ [REGISTER] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────
//  POST /api/auth/login
//  Login user, verify credentials, update lastLogin timestamp
// ──────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // 2. Find user by email — explicitly select password for comparison
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 3. Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // 4. Verify password using bcrypt
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 5. Update lastLogin timestamp in the `users` collection
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 6. Generate JWT token
    const token = generateToken(user._id);

    console.log(`✅ [LOGIN] User logged in: ${user.email} | Role: ${user.role} | Last login: ${user.lastLogin}`);

    // 7. Return user (excluding password) + token
    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.fullName}!`,
      token,
      user: userResponse(user),
    });

  } catch (error) {
    console.error('❌ [LOGIN] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────
//  GET /api/auth/me
//  Get the currently authenticated user (requires valid JWT)
// ──────────────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: userResponse(user),
    });
  } catch (error) {
    console.error('❌ [ME] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile.',
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────
//  POST /api/auth/logout
//  Logout is handled client-side (remove token from storage).
//  This endpoint is a clean hook for logging the event server-side.
// ──────────────────────────────────────────────────────────────────────────
router.post('/logout', protect, (req, res) => {
  console.log(`👋 [LOGOUT] User logged out: ${req.user.email}`);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please remove your token on the client.',
  });
});

module.exports = router;
