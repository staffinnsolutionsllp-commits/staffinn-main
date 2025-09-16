const crypto = require('crypto');

// Simple CSRF token store (use Redis in production)
const csrfTokens = new Map();

const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests and public routes
  if (req.method === 'GET' || req.path.includes('/public/')) {
    return next();
  }

  // Skip CSRF in development mode
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    return next();
  }

  const token = req.headers['x-csrf-token'];
  const userId = req.user?.userId;

  if (!token || !userId || !csrfTokens.has(userId) || csrfTokens.get(userId) !== token) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  next();
};

const getCSRFToken = (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const token = generateCSRFToken();
  csrfTokens.set(userId, token);
  
  // Clean up old tokens (simple cleanup)
  if (csrfTokens.size > 1000) {
    const keys = Array.from(csrfTokens.keys());
    keys.slice(0, 100).forEach(key => csrfTokens.delete(key));
  }

  res.json({
    success: true,
    token
  });
};

module.exports = {
  csrfProtection,
  getCSRFToken
};