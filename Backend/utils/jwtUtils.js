/**
 * JWT Utilities
 * Functions for JWT token generation and verification
 */

const jwt = require('jsonwebtoken');

// Token expiration times (in seconds)
const ACCESS_TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days for testing

/**
 * Generate JWT access token
 * @param {object} payload - User data to include in token
 * @returns {string} - JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
};

/**
 * Generate both access and refresh tokens
 * @param {object} user - User object
 * @returns {object} - Object containing both tokens
 */
const generateTokens = (user) => {
  // Create payload with minimal user data
  const payload = {
    userId: user.userId,
    email: user.email,
    role: user.role
  };

  return {
    accessToken: generateAccessToken(payload),
    expiresIn: ACCESS_TOKEN_EXPIRY
  };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} - Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};

module.exports = {
  generateTokens,
  verifyToken,
  ACCESS_TOKEN_EXPIRY
};