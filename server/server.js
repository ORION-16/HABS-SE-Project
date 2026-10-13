require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./src/app');
const connectDB = require('./src/config/db');
const redis = require('./src/config/redis');

const PORT = process.env.PORT || 5000;

// ─── Create HTTP & Socket.io Server ──────────────────────────────
const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join_doctor_room', (doctorId) => {
    socket.join(`doctor:${doctorId}`);
    console.log(`📋 Socket ${socket.id} joined room doctor:${doctorId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── Create the Express app WITH io injected ─────────────────────
const app = createApp(io);
httpServer.on('request', app);

// ─── Start Server ────────────────────────────────────────────────
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis (non-blocking — app works without it)
    if (redis) {
      try {
        await redis.connect();
      } catch (err) {
        console.warn('⚠️  Redis connection failed — continuing without cache');
      }
    }

    const tryListen = (portToTry, fallbackPort) => {
      const onError = (err) => {
        if (err.code === 'EADDRINUSE' && fallbackPort) {
          console.warn(`⚠️  Port ${portToTry} in use (AirPlay Receiver / ControlCenter). Automatically switching to port ${fallbackPort}...`);
          tryListen(fallbackPort, null);
        } else {
          console.error(`❌ Server error on port ${portToTry}:`, err.message);
          process.exit(1);
        }
      };

      httpServer.once('error', onError);
      httpServer.listen(portToTry, () => {
        httpServer.removeListener('error', onError);
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log(`║   🏥 HABS Server running on port ${portToTry}        ║`);
        console.log('║   Healthcare Appointment Booking System      ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('');
      });
    };

    tryListen(PORT, 5001);
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
