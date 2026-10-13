const { verifyToken } = require('../utils/jwt');
const redis = require('../config/redis');

/**
 * JWT authentication middleware.
 * 1. Extract Bearer token from Authorization header
 * 2. Check Redis blacklist — if found, return 401 "Token revoked"
 * 3. jwt.verify(token, JWT_ACCESS_SECRET)
 * 4. Attach decoded payload to req.user = { userId, role, email }
 * 5. Call next()
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Check Redis blacklist
    if (redis && redis.status === 'ready') {
      try {
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return res.status(401).json({
            success: false,
            message: 'Token revoked. Please login again.',
          });
        }
      } catch (err) {
        // Redis error — continue without blacklist check
        console.warn('⚠️  Redis blacklist check failed:', err.message);
      }
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    next(error);
  }
};

module.exports = { authenticateToken };
