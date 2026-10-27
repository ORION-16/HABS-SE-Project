const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User.model');
const { signToken, verifyToken, signVerificationToken } = require('../utils/jwt');
const { sendVerificationEmail, sendOtpEmail } = require('../utils/email');
const redis = require('../config/redis');

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, dateOfBirth, specialization, licenseNumber } = req.validatedBody;
    const requiresEmailVerification = process.env.NODE_ENV === 'production';

    // Check email not already registered
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Build user data
    const userData = {
      name,
      email,
      phone,
      passwordHash,
      role,
      // Email delivery is deliberately optional for local development. SMTP
      // credentials are required to send a real Gmail message in production.
      isVerified: !requiresEmailVerification,
    };

    if (role === 'patient' && dateOfBirth) {
      userData.dateOfBirth = new Date(dateOfBirth);
    }

    if (role === 'doctor') {
      userData.specialization = specialization;
      userData.licenseNumber = licenseNumber;
      // Local registration must be self-contained now that demo admins are
      // not seeded. Production retains the administrator approval workflow.
      userData.isApproved = process.env.NODE_ENV !== 'production';
    }

    const user = await User.create(userData);

    if (requiresEmailVerification) {
      const verificationToken = signVerificationToken(
        { userId: user._id, email: user.email, purpose: 'email-verification' },
        '24h'
      );
      await sendVerificationEmail(user.email, verificationToken);
    }

    res.status(201).json({
      success: true,
      message: requiresEmailVerification
        ? 'Registration successful. Check your email to verify your account.'
        : 'Registration successful. You can sign in now.',
      data: { requiresEmailVerification },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/verify-email?token=<jwt>
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      });
    }

    const decoded = verifyToken(token);

    if (decoded.purpose !== 'email-verification') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token.',
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified.',
      });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified.',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Verification token expired. Please register again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token.',
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check account lockout
    if (user.isLocked()) {
      const remainingMs = user.lockUntil - Date.now();
      const remainingMins = Math.ceil(remainingMs / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try after ${remainingMins} minute(s).`,
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment failed logins
      user.failedLogins += 1;

      if (user.failedLogins >= MAX_FAILED_LOGINS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await user.save();
        return res.status(423).json({
          success: false,
          message: 'Account locked due to too many failed attempts. Try after 15 minutes.',
        });
      }

      await user.save();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Reset failed logins on success
    user.failedLogins = 0;
    user.lockUntil = null;
    await user.save();

    // Check email verification
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first.',
      });
    }

    // Check doctor approval
    if (user.role === 'doctor' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Doctor account pending admin approval.',
      });
    }

    // Sign JWT
    const token = signToken({
      userId: user._id,
      role: user.role,
      email: user.email,
    });

    // Store token fingerprint in Redis with TTL 24h
    if (redis && redis.status === 'ready') {
      try {
        await redis.set(`token:${user._id}`, token, 'EX', 86400);
      } catch (err) {
        console.warn('⚠️  Redis token store failed:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const token = req.token;

    // Add token to Redis blacklist
    if (redis && redis.status === 'ready') {
      try {
        // Decode to get remaining TTL
        const decoded = verifyToken(token);
        const remainingTTL = decoded.exp - Math.floor(Date.now() / 1000);

        if (remainingTTL > 0) {
          await redis.set(`blacklist:${token}`, '1', 'EX', remainingTTL);
        }
      } catch (err) {
        console.warn('⚠️  Redis blacklist failed:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged out.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.validatedBody;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists
      return res.status(200).json({
        success: true,
        message: 'If the email is registered, an OTP has been sent.',
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store in Redis with 10 min TTL
    if (redis && redis.status === 'ready') {
      await redis.set(`otp:${user._id}`, otp, 'EX', 600);
    }

    // Send OTP via email (console stub in dev)
    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.validatedBody;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request.',
      });
    }

    // Get OTP from Redis
    let storedOtp = null;
    if (redis && redis.status === 'ready') {
      storedOtp = await redis.get(`otp:${user._id}`);
    }

    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Hash new password and save
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.failedLogins = 0;
    user.lockUntil = null;
    await user.save();

    // Delete OTP from Redis
    if (redis && redis.status === 'ready') {
      await redis.del(`otp:${user._id}`);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/users
 * Admin only — list all users with role counts.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });

    const counts = {
      total: users.length,
      patients: users.filter((u) => u.role === 'patient').length,
      doctors: users.filter((u) => u.role === 'doctor').length,
      admins: users.filter((u) => u.role === 'admin').length,
      pendingDoctors: users.filter((u) => u.role === 'doctor' && !u.isApproved).length,
      verifiedUsers: users.filter((u) => u.isVerified).length,
    };

    res.status(200).json({
      success: true,
      data: { users, counts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/approve-doctor/:userId
 * Admin only — approve or revoke a doctor's access.
 */
const approveDoctor = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role !== 'doctor') {
      return res.status(400).json({ success: false, message: 'User is not a doctor.' });
    }

    user.isApproved = !user.isApproved;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Doctor ${user.isApproved ? 'approved' : 'approval revoked'}.`,
      data: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/doctors
 * Authenticated — list doctors. If patient, lists approved doctors.
 */
const getDoctors = async (req, res, next) => {
  try {
    const filter = { role: 'doctor' };
    if (req.user?.role === 'patient') {
      filter.isApproved = true;
    }
    const doctors = await User.find(filter)
      .select('-passwordHash')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: doctors.map((d) => d.toSafeObject()),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  getAllUsers,
  approveDoctor,
  getDoctors,
};
