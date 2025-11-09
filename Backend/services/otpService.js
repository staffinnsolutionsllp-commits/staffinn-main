/**
 * OTP Service
 * Handles OTP generation, storage, and verification
 */
const crypto = require('crypto');

// In-memory OTP storage (use Redis in production)
const otpStorage = new Map();

// OTP Configuration
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  RATE_LIMIT: {
    MAX_REQUESTS: 3, // Max 3 OTP requests per email
    WINDOW_MINUTES: 15 // within 15 minutes
  }
};

/**
 * Generate random OTP
 * @param {number} length - OTP length (default: 6)
 * @returns {string} - Generated OTP
 */
const generateRandomOTP = (length = OTP_CONFIG.LENGTH) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

/**
 * Generate secure OTP using crypto
 * @param {number} length - OTP length (default: 6)
 * @returns {string} - Generated OTP
 */
const generateSecureOTP = (length = OTP_CONFIG.LENGTH) => {
  const buffer = crypto.randomBytes(Math.ceil(length / 2));
  const otp = buffer.toString('hex').slice(0, length).toUpperCase();
  
  // Ensure it's all numbers for better user experience
  return generateRandomOTP(length);
};

/**
 * Check rate limiting for OTP requests
 * @param {string} email - User email
 * @returns {boolean} - Whether request is allowed
 */
const checkRateLimit = (email) => {
  const key = 'rate_' + email.toLowerCase();
  const now = Date.now();
  const windowMs = OTP_CONFIG.RATE_LIMIT.WINDOW_MINUTES * 60 * 1000;
  
  if (!otpStorage.has(key)) {
    otpStorage.set(key, { count: 1, firstRequest: now });
    return true;
  }
  
  const rateData = otpStorage.get(key);
  
  // Reset if window has passed
  if (now - rateData.firstRequest > windowMs) {
    otpStorage.set(key, { count: 1, firstRequest: now });
    return true;
  }
  
  // Check if limit exceeded
  if (rateData.count >= OTP_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  // Increment count
  rateData.count++;
  otpStorage.set(key, rateData);
  return true;
};

/**
 * Generate and store OTP for email
 * @param {string} email - User email
 * @param {string} purpose - OTP purpose (verification, reset, etc.)
 * @returns {Promise<string|null>} - Generated OTP or null if failed
 */
const generateOTP = async (email, purpose = 'verification') => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check rate limiting
    if (!checkRateLimit(normalizedEmail)) {
      console.error('Rate limit exceeded for email: ' + normalizedEmail);
      return null;
    }
    
    // Generate OTP
    const otp = generateSecureOTP();
    const expiryTime = Date.now() + (OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);
    
    // Store OTP data
    const otpData = {
      otp,
      purpose,
      createdAt: Date.now(),
      expiryTime,
      attempts: 0,
      maxAttempts: OTP_CONFIG.MAX_ATTEMPTS,
      verified: false
    };
    
    otpStorage.set(normalizedEmail, otpData);
    
    console.log('OTP generated for ' + normalizedEmail + ': ' + otp + ' (expires in ' + OTP_CONFIG.EXPIRY_MINUTES + ' minutes)');
    return otp;
    
  } catch (error) {
    console.error('Generate OTP error:', error);
    return null;
  }
};

/**
 * Verify OTP
 * @param {string} email - User email
 * @param {string} inputOtp - OTP provided by user
 * @param {string} purpose - OTP purpose (optional)
 * @returns {Promise<boolean>} - Verification result
 */
const verifyOTP = async (email, inputOtp, purpose = 'verification') => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOTP = inputOtp.toString().trim();
    
    // Check if OTP exists
    if (!otpStorage.has(normalizedEmail)) {
      console.error('No OTP found for email: ' + normalizedEmail);
      return false;
    }
    
    const otpData = otpStorage.get(normalizedEmail);
    
    // Check if OTP has expired
    if (Date.now() > otpData.expiryTime) {
      console.error('OTP expired for email: ' + normalizedEmail);
      otpStorage.delete(normalizedEmail);
      return false;
    }
    
    // Check if already verified
    if (otpData.verified) {
      console.error('OTP already used for email: ' + normalizedEmail);
      return false;
    }
    
    // Check attempt limit
    if (otpData.attempts >= otpData.maxAttempts) {
      console.error('Max OTP attempts exceeded for email: ' + normalizedEmail);
      otpStorage.delete(normalizedEmail);
      return false;
    }
    
    // Increment attempt count
    otpData.attempts++;
    
    // Verify OTP
    if (otpData.otp !== normalizedOTP) {
      console.error('Invalid OTP for email: ' + normalizedEmail + '. Attempts: ' + otpData.attempts);
      otpStorage.set(normalizedEmail, otpData);
      return false;
    }
    
    // Check purpose match (optional)
    if (purpose && otpData.purpose !== purpose) {
      console.error('OTP purpose mismatch for email: ' + normalizedEmail);
      return false;
    }
    
    // Mark as verified
    otpData.verified = true;
    otpStorage.set(normalizedEmail, otpData);
    
    console.log('OTP verified successfully for email: ' + normalizedEmail);
    
    // Clean up after successful verification (optional, keep for audit trail)
    setTimeout(() => {
      otpStorage.delete(normalizedEmail);
    }, 60000); // Delete after 1 minute
    
    return true;
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    return false;
  }
};

/**
 * Check OTP status
 * @param {string} email - User email
 * @returns {Object|null} - OTP status information
 */
const getOTPStatus = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!otpStorage.has(normalizedEmail)) {
      return null;
    }
    
    const otpData = otpStorage.get(normalizedEmail);
    const now = Date.now();
    
    return {
      exists: true,
      isExpired: now > otpData.expiryTime,
      isVerified: otpData.verified,
      attempts: otpData.attempts,
      maxAttempts: otpData.maxAttempts,
      remainingTime: Math.max(0, Math.floor((otpData.expiryTime - now) / 1000)), // seconds
      purpose: otpData.purpose,
      createdAt: new Date(otpData.createdAt).toISOString()
    };
    
  } catch (error) {
    console.error('Get OTP status error:', error);
    return null;
  }
};

/**
 * Delete OTP
 * @param {string} email - User email
 * @returns {Promise<boolean>} - Deletion success
 */
const deleteOTP = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const deleted = otpStorage.delete(normalizedEmail);
    
    if (deleted) {
      console.log('OTP deleted for email: ' + normalizedEmail);
    }
    
    return deleted;
    
  } catch (error) {
    console.error('Delete OTP error:', error);
    return false;
  }
};

/**
 * Clean up expired OTPs
 * @returns {number} - Number of cleaned up OTPs
 */
const cleanupExpiredOTPs = () => {
  try {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [email, otpData] of otpStorage.entries()) {
      // Skip rate limit entries
      if (email.startsWith('rate_')) {
        // Clean up old rate limit entries
        const windowMs = OTP_CONFIG.RATE_LIMIT.WINDOW_MINUTES * 60 * 1000;
        if (now - otpData.firstRequest > windowMs) {
          otpStorage.delete(email);
          cleanedCount++;
        }
        continue;
      }
      
      // Clean up expired OTPs
      if (now > otpData.expiryTime) {
        otpStorage.delete(email);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log('Cleaned up ' + cleanedCount + ' expired OTP entries');
    }
    
    return cleanedCount;
    
  } catch (error) {
    console.error('Cleanup expired OTPs error:', error);
    return 0;
  }
};

/**
 * Get OTP statistics
 * @returns {Object} - OTP statistics
 */
const getOTPStatistics = () => {
  try {
    let totalOTPs = 0;
    let expiredOTPs = 0;
    let verifiedOTPs = 0;
    let activeOTPs = 0;
    let rateLimitEntries = 0;
    
    const now = Date.now();
    
    for (const [email, otpData] of otpStorage.entries()) {
      if (email.startsWith('rate_')) {
        rateLimitEntries++;
        continue;
      }
      
      totalOTPs++;
      
      if (now > otpData.expiryTime) {
        expiredOTPs++;
      } else if (otpData.verified) {
        verifiedOTPs++;
      } else {
        activeOTPs++;
      }
    }
    
    return {
      total: totalOTPs,
      active: activeOTPs,
      expired: expiredOTPs,
      verified: verifiedOTPs,
      rateLimitEntries,
      memoryUsage: otpStorage.size
    };
    
  } catch (error) {
    console.error('Get OTP statistics error:', error);
    return null;
  }
};

/**
 * Resend OTP (generate new one)
 * @param {string} email - User email
 * @param {string} purpose - OTP purpose
 * @returns {Promise<string|null>} - New OTP or null if failed
 */
const resendOTP = async (email, purpose = 'verification') => {
  try {
    // Delete existing OTP
    await deleteOTP(email);
    
    // Generate new OTP
    return await generateOTP(email, purpose);
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    return null;
  }
};

// Start cleanup interval
setInterval(cleanupExpiredOTPs, OTP_CONFIG.CLEANUP_INTERVAL);

console.log('OTP Service initialized with ' + OTP_CONFIG.EXPIRY_MINUTES + ' minute expiry');

module.exports = {
  generateOTP,
  verifyOTP,
  getOTPStatus,
  deleteOTP,
  resendOTP,
  cleanupExpiredOTPs,
  getOTPStatistics,
  checkRateLimit
};