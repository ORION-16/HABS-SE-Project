const jwt = require('jsonwebtoken');

const getSecret = () => process.env.JWT_ACCESS_SECRET || 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8';
const getExpiry = () => process.env.JWT_ACCESS_EXPIRY || '24h';

/**
 * Sign a JWT access token.
 * @param {Object} payload - { userId, role, email }
 * @returns {string} signed token
 */
const signToken = (payload) => {
  return jwt.sign(payload, getSecret(), { expiresIn: getExpiry() });
};

/**
 * Verify a JWT access token.
 * @param {string} token
 * @returns {Object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};

/**
 * Sign a short-lived token (e.g., email verification).
 * @param {Object} payload
 * @param {string} expiresIn - e.g. '24h', '10m'
 * @returns {string} signed token
 */
const signVerificationToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, getSecret(), { expiresIn });
};

module.exports = { signToken, verifyToken, signVerificationToken };
