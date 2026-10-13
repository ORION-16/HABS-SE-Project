const express = require('express');
const router = express.Router();
const {
  setAvailability,
  blockDates,
  unblockDates,
  getAvailability,
  getOpenSlots,
} = require('../controllers/availability.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  validate,
  setAvailabilitySchema,
  blockDatesSchema,
  unblockDatesSchema,
} = require('../validators/availability.validator');

// IMPORTANT: Place specific routes BEFORE parameterized routes

// Doctor-only routes
router.post(
  '/',
  authenticateToken,
  authorizeRoles('doctor'),
  validate(setAvailabilitySchema),
  setAvailability
);

router.patch(
  '/block',
  authenticateToken,
  authorizeRoles('doctor'),
  validate(blockDatesSchema),
  blockDates
);

router.delete(
  '/unblock',
  authenticateToken,
  authorizeRoles('doctor'),
  validate(unblockDatesSchema),
  unblockDates
);

// Patient + Doctor routes (must come after /block and /unblock)
router.get(
  '/open-slots/:doctorId',
  authenticateToken,
  authorizeRoles('patient', 'doctor'),
  getOpenSlots
);

router.get(
  '/:doctorId',
  authenticateToken,
  authorizeRoles('patient', 'doctor'),
  getAvailability
);

module.exports = router;
