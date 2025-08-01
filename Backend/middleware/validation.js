/**
 * Validation Middleware
 * Centralized validation middleware for different registration types
 */
const { 
  validateRegistration, 
  validateLogin,
  validateStaffRegistration,
  validateRecruiterRegistration,
  validateInstituteRegistration,
  validatePasswordStrength,
  validateEmail
} = require('../utils/validation');

/**
 * General registration validation middleware (existing - keeping as is)
 */
const validateRegister = (req, res, next) => {
  const { error } = validateRegistration(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error
    });
  }
  
  next();
};

/**
 * Login validation middleware (existing - keeping as is)
 */
const validateLoginData = (req, res, next) => {
  const { error } = validateLogin(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error
    });
  }
  
  next();
};

/**
 * Staff registration validation middleware
 */
const validateStaffRegister = (req, res, next) => {
  const { error, value } = validateStaffRegistration(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error
    });
  }
  
  // Attach validated data to request
  req.validatedData = value;
  next();
};

/**
 * Recruiter registration validation middleware
 */
const validateRecruiterRegister = (req, res, next) => {
  const { error, value } = validateRecruiterRegistration(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error
    });
  }
  
  // Attach validated data to request
  req.validatedData = value;
  next();
};

/**
 * Institute registration validation middleware
 */
const validateInstituteRegister = (req, res, next) => {
  const { error, value } = validateInstituteRegistration(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error
    });
  }
  
  // Attach validated data to request
  req.validatedData = value;
  next();
};

/**
 * Password strength validation middleware
 */
const validatePasswordOnly = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }
  
  const { error } = validatePasswordStrength(password);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error
    });
  }
  
  next();
};

/**
 * Email validation middleware
 */
const validateEmailOnly = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  const { error } = validateEmail(email);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error
    });
  }
  
  next();
};

/**
 * OTP validation middleware
 */
const validateOTP = (req, res, next) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required'
    });
  }
  
  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: 'OTP must be 6 digits'
    });
  }
  
  next();
};

/**
 * Check if passwords match middleware
 */
const validatePasswordMatch = (req, res, next) => {
  const { password, confirmPassword } = req.body;
  
  if (!password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Password and confirm password are required'
    });
  }
  
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Password and confirm password do not match'
    });
  }
  
  next();
};

/**
 * Sanitize input data middleware
 */
const sanitizeInput = (req, res, next) => {
  // Remove extra spaces and convert to proper case where needed
  if (req.body.fullName) {
    req.body.fullName = req.body.fullName.trim();
  }
  
  if (req.body.companyName) {
    req.body.companyName = req.body.companyName.trim();
  }
  
  if (req.body.instituteName) {
    req.body.instituteName = req.body.instituteName.trim();
  }
  
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
  }
  
  if (req.body.website) {
    req.body.website = req.body.website.trim();
    // Add https:// if not present
    if (req.body.website && !req.body.website.startsWith('http')) {
      req.body.website = 'https://' + req.body.website;
    }
  }
  
  if (req.body.registrationNumber) {
    req.body.registrationNumber = req.body.registrationNumber.toUpperCase().trim();
  }
  
  next();
};

/**
 * Rate limiting for registration attempts (basic implementation)
 */
const registrationRateLimit = (req, res, next) => {
  // Basic rate limiting - you can enhance this later
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // For now, just log the attempt
  console.log(Registration attempt from IP: ${clientIP} at ${new Date()});
  
  // You can add Redis-based rate limiting here later
  next();
};

module.exports = {
  // Existing middleware (keeping as is)
  validateRegister,
  validateLoginData,
  
  // New enhanced validation middleware
  validateStaffRegister,
  validateRecruiterRegister,
  validateInstituteRegister,
  validatePasswordOnly,
  validateEmailOnly,
  validateOTP,
  validatePasswordMatch,
  sanitizeInput,
  registrationRateLimit
};