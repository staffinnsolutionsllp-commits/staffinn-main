/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

const jwtUtils = require('../utils/jwtUtils');
const userModel = require('../models/userModel');

/**
 * Verify JWT token from request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Remove hardcoded user - use proper JWT authentication
    
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwtUtils.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }
    
    // Get user from database
    const user = await userModel.findUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

/**
 * Protect middleware (alias for authenticate)
 */
const protect = authenticate;

/**
 * Authenticate user (alias for authenticate)
 */
const authenticateUser = authenticate;

/**
 * Authenticate admin
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No admin token provided.'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify admin token
    const decoded = jwtUtils.verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Add admin to request object
    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Admin authentication failed.'
    });
  }
};

module.exports = {
  authenticate,
  authenticateUser,
  authenticateAdmin,
  protect
};