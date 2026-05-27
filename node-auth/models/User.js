/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  models/User.js
 *  Mongoose User Schema — ONE WORLD ONE FAMILY
 *  Database   : one_world_one_family
 *  Collection : users
 *  Project    : Volunteer Management and Donation Tracking System
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Fields stored in the `users` collection:
 *  ┌─────────────┬──────────────┬─────────────────────────────────────────────┐
 *  │ Field       │ Type         │ Notes                                       │
 *  ├─────────────┼──────────────┼─────────────────────────────────────────────┤
 *  │ fullName    │ String       │ Required                                    │
 *  │ email       │ String       │ Required, unique, lowercase, trimmed        │
 *  │ phone       │ String       │ Optional                                    │
 *  │ role        │ String       │ Volunteer | NGO | Donor | Admin             │
 *  │ password    │ String       │ Required, bcrypt hashed (NEVER returned)    │
 *  │ profileImage│ String       │ Optional URL                                │
 *  │ isVerified  │ Boolean      │ Default: false                              │
 *  │ isActive    │ Boolean      │ Default: true                               │
 *  │ lastLogin   │ Date         │ Updated on every successful login           │
 *  │ createdAt   │ Date         │ Auto (timestamps: true)                     │
 *  │ updatedAt   │ Date         │ Auto (timestamps: true)                     │
 *  └─────────────┴──────────────┴─────────────────────────────────────────────┘
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Schema definition ──────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // Full name of the user (Volunteer / NGO representative / Donor / Admin)
    fullName: {
      type:     String,
      required: [true, 'Full name is required'],
      trim:     true,
      minlength: [2,  'Full name must be at least 2 characters'],
      maxlength: [100,'Full name cannot exceed 100 characters'],
    },

    // Email — must be unique across the one_world_one_family database
    email: {
      type:      String,
      required:  [true, 'Email address is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    // Phone number (optional)
    phone: {
      type:  String,
      trim:  true,
      match: [/^[+\d\s\-()]{7,20}$/, 'Please provide a valid phone number'],
      default: null,
    },

    // Role of the user within the One World One Family platform
    role: {
      type:    String,
      enum:    {
        values:  ['Volunteer', 'NGO', 'Donor', 'Admin'],
        message: 'Role must be one of: Volunteer, NGO, Donor, Admin',
      },
      default: 'Volunteer',
      required: true,
    },

    // Password — stored as bcrypt hash (NEVER expose in responses)
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false, // Excluded from all queries by default
    },

    // Optional profile image URL
    profileImage: {
      type:    String,
      default: null,
    },

    // Whether the user's email has been verified
    isVerified: {
      type:    Boolean,
      default: false,
    },

    // Whether the account is active (admins can deactivate)
    isActive: {
      type:    Boolean,
      default: true,
    },

    // Timestamp of the user's most recent successful login
    lastLogin: {
      type:    Date,
      default: null,
    },
  },
  {
    // Automatically manage createdAt and updatedAt timestamps
    timestamps: true,
    // Name the collection explicitly inside one_world_one_family database
    collection: 'users',
  }
);

// ── Pre-save middleware: Hash password before storing ─────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if the password field was actually modified
  if (!this.isModified('password')) return next();

  try {
    const salt     = await bcrypt.genSalt(12); // Cost factor 12 = secure & reasonable speed
    this.password  = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: Verify a plain-text password against stored hash ─────
userSchema.methods.comparePassword = async function (plainPassword) {
  // NOTE: password field has select:false, so must be explicitly selected
  return bcrypt.compare(plainPassword, this.password);
};

// ── Instance method: Return safe user object (no password) ────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ── Static method: Find by email (with password for auth) ─────────────────
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() }).select('+password');
};

// ── Export model ──────────────────────────────────────────────────────────
const User = mongoose.model('User', userSchema);
module.exports = User;
