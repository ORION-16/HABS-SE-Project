const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  phone:        { type: String, required: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['patient', 'doctor', 'admin'], required: true },

  // Patient-only
  dateOfBirth:  { type: Date },

  // Doctor-only
  specialization: { type: String },
  licenseNumber:  { type: String },
  isApproved:     { type: Boolean, default: false },

  // Shared
  isVerified:   { type: Boolean, default: false },
  failedLogins: { type: Number, default: 0 },
  lockUntil:    { type: Date },

  createdAt:    { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes
UserSchema.index({ role: 1 });

/**
 * Compare a candidate password against the stored hash.
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Check if the account is currently locked.
 */
UserSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

/**
 * Return a safe user object (no password hash).
 */
UserSchema.methods.toSafeObject = function () {
  const obj = {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    isVerified: this.isVerified,
  };

  if (this.role === 'patient') {
    obj.dateOfBirth = this.dateOfBirth;
  }

  if (this.role === 'doctor') {
    obj.specialization = this.specialization;
    obj.licenseNumber = this.licenseNumber;
    obj.isApproved = this.isApproved;
  }

  return obj;
};

module.exports = mongoose.model('User', UserSchema);
