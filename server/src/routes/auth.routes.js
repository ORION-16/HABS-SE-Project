const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  getDoctors,
  getAllUsers,
  approveDoctor,
} = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');

// Public routes
router.post('/register', validate(registerSchema), register);
router.get('/verify-email', verifyEmail);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Protected routes (shared)
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);
router.get('/doctors', authenticateToken, getDoctors);

// Admin-only routes
router.get('/users', authenticateToken, authorizeRoles('admin'), getAllUsers);
router.patch('/approve-doctor/:userId', authenticateToken, authorizeRoles('admin'), approveDoctor);

module.exports = router;
