const express = require('express');
const { createAppointment, getAppointments } = require('../controllers/appointment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles('patient', 'doctor'), getAppointments);
router.post('/', authenticateToken, authorizeRoles('patient'), createAppointment);

module.exports = router;
