const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./routes/auth.routes');
const availabilityRoutes = require('./routes/availability.routes');
const appointmentRoutes = require('./routes/appointment.routes');

/**
 * Creates and configures the Express app.
 * @param {import('socket.io').Server} io - Socket.io server instance
 * @returns {express.Application}
 */
const createApp = (io) => {
  const app = express();

  // ─── Security Headers ────────────────────────────────────────────
  app.use(helmet());

  // ─── CORS ────────────────────────────────────────────────────────
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }));

  // ─── Body Parsing ────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ─── NoSQL Injection Sanitization ────────────────────────────────
  app.use(mongoSanitize());

  // ─── Attach Socket.io to requests ────────────────────────────────
  if (io) {
    app.use((req, res, next) => {
      req.io = io;
      next();
    });
  }

  // ─── Rate Limiting on Auth Routes ────────────────────────────────
  const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'test' ? 1000 : 10, // 10 requests per minute
    message: {
      success: false,
      message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/auth', authLimiter);

  // ─── Routes ──────────────────────────────────────────────────────
  app.get('/api', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'HABS API is running.',
      health: '/api/health',
    });
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/availability', availabilityRoutes);
  app.use('/api/appointments', appointmentRoutes);

  // ─── Health Check ────────────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'HABS API is running' });
  });

  // ─── 404 Handler ─────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
    });
  });

  // ─── Global Error Handler ────────────────────────────────────────
  app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack || err.message);

    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  return app;
};

module.exports = createApp;
