/**
 * Registration Number Validation Service
 * Validates institute registration numbers and educational certificates
 */
const userModel = require('../models/userModel');

// Registration validation configuration
const VALIDATION_CONFIG = {
  MIN_LENGTH: 6,
  MAX_LENGTH: 25,
  CACHE_DURATION: 60 * 60 * 1000, // 1 hour
  API_TIMEOUT: 10000, // 10 seconds
  RATE_LIMIT: {
    MAX_REQUESTS: 10,
    WINDOW_MINUTES: 5
  }
};

// Cache for validation results
const validationCache = new Map();
const rateLimitCache = new Map();

// Common Indian registration number patterns
const REGISTRATION_PATTERNS = {
  // AICTE Registration Numbers
  AICTE: {
    pattern: /^(AICTE|aicte)[0-9]{8,12}$/i,
    description: 'AICTE Registration Number',
    example: 'AICTE123456789'
  },
  
  // UGC Recognition Numbers
  UGC: {
    pattern: /^(UGC|ugc)[A-Z0-9]{6,15}$/i,
    description: 'UGC Recognition Number',
    example: 'UGCF123456'
  },
  
  // State Board Registration
  STATE_BOARD: {
    pattern: /^[A-Z]{2}[0-9]{6,12}$/,
    description: 'State Board Registration',
    example: 'UP123456789'
  },
  
  // University Registration
  UNIVERSITY: {
    pattern: /^(UNIV|UNIVERSITY)[A-Z0-9]{6,12}$/i,
    description: 'University Registration',
    example: 'UNIV123456789'
  },
  
  // CBSE School Code
  CBSE: {
    pattern: /^[0-9]{8}$/,
    description: 'CBSE School Code',
    example: '12345678'
  },
  
  // ICSE Council Number
  ICSE: {
    pattern: /^(IC|ICSE)[0-9]{6,10}$/i,
    description: 'ICSE Council Number',
    example: 'IC123456'
  },
  
  // Generic Institute Registration
  GENERIC_INSTITUTE: {
    pattern: /^(INST|REG|EDU)[A-Z0-9]{6,15}$/i,
    description: 'Generic Institute Registration',
    example: 'INST123456789'
  },
  
  // Numeric only (Government issued)
  NUMERIC: {
    pattern: /^[0-9]{8,15}$/,
    description: 'Numeric Registration Number',
    example: '123456789012'
  },
  
  // Alphanumeric (Mixed format)
  ALPHANUMERIC: {
    pattern: /^[A-Z0-9]{8,20}$/,
    description: 'Alphanumeric Registration',
    example: 'ABC123DEF456'
  }
};

// Indian states and their common prefixes
const STATE_PREFIXES = {
  'AP': 'Andhra Pradesh',
  'AR': 'Arunachal Pradesh',
  'AS': 'Assam',
  'BR': 'Bihar',
  'CT': 'Chhattisgarh',
  'GA': 'Goa',
  'GJ': 'Gujarat',
  'HR': 'Haryana',
  'HP': 'Himachal Pradesh',
  'JH': 'Jharkhand',
  'KA': 'Karnataka',
  'KL': 'Kerala',
  'MP': 'Madhya Pradesh',
  'MH': 'Maharashtra',
  'MN': 'Manipur',
  'ML': 'Meghalaya',
  'MZ': 'Mizoram',
  'NL': 'Nagaland',
  'OR': 'Odisha',
  'PB': 'Punjab',
  'RJ': 'Rajasthan',
  'SK': 'Sikkim',
  'TN': 'Tamil Nadu',
  'TG': 'Telangana',
  'TR': 'Tripura',
  'UP': 'Uttar Pradesh',
  'UT': 'Uttarakhand',
  'WB': 'West Bengal',
  'DL': 'Delhi',
  'PY': 'Puducherry',
  'JK': 'Jammu and Kashmir',
  'LD': 'Lakshadweep'
};

/**
 * Check rate limiting for registration validation
 * @param {string} identifier - IP or user identifier
 * @returns {boolean} - Whether request is allowed
 */
const checkRateLimit = (identifier) => {
  const now = Date.now();
  const windowMs = VALIDATION_CONFIG.RATE_LIMIT.WINDOW_MINUTES * 60 * 1000;
  
  if (!rateLimitCache.has(identifier)) {
    rateLimitCache.set(identifier, { count: 1, firstRequest: now });
    return true;
  }
  
  const rateData = rateLimitCache.get(identifier);
  
  // Reset if window has passed
  if (now - rateData.firstRequest > windowMs) {
    rateLimitCache.set(identifier, { count: 1, firstRequest: now });
    return true;
  }
  
  // Check if limit exceeded
  if (rateData.count >= VALIDATION_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  // Increment count
  rateData.count++;
  rateLimitCache.set(identifier, rateData);
  return true;
};

/**
 * Validate registration number format
 * @param {string} registrationNumber - Registration number to validate
 * @returns {Object} - Format validation result
 */
const validateFormat = (registrationNumber) => {
  try {
    const normalizedRegNum = registrationNumber.toUpperCase().trim();
    
    // Basic length check
    if (normalizedRegNum.length < VALIDATION_CONFIG.MIN_LENGTH || 
        normalizedRegNum.length > VALIDATION_CONFIG.MAX_LENGTH) {
      return {
        isValid: false,
        error: Registration number must be between ${VALIDATION_CONFIG.MIN_LENGTH} and ${VALIDATION_CONFIG.MAX_LENGTH} characters,
        pattern: null,
        suggestion: null
      };
    }
    
    // Check against known patterns
    const matchedPatterns = [];
    
    for (const [patternName, patternData] of Object.entries(REGISTRATION_PATTERNS)) {
      if (patternData.pattern.test(normalizedRegNum)) {
        matchedPatterns.push({
          name: patternName,
          description: patternData.description,
          example: patternData.example
        });
      }
    }
    
    if (matchedPatterns.length === 0) {
      return {
        isValid: false,
        error: 'Registration number format does not match any known patterns',
        pattern: null,
        suggestion: 'Please check if the registration number follows standard formats like AICTE123456789, UP123456789, or similar'
      };
    }
    
    // Extract state information if applicable
    let detectedState = null;
    const statePrefix = normalizedRegNum.substring(0, 2);
    if (STATE_PREFIXES[statePrefix]) {
      detectedState = STATE_PREFIXES[statePrefix];
    }
    
    return {
      isValid: true,
      normalizedNumber: normalizedRegNum,
      matchedPatterns,
      detectedState,
      error: null,
      suggestion: null
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid registration number format',
      pattern: null,
      suggestion: null
    };
  }
};

/**
 * Check if registration number already exists in database
 * @param {string} registrationNumber - Registration number to check
 * @returns {Promise<Object>} - Uniqueness check result
 */
const checkUniqueness = async (registrationNumber) => {
  try {
    const normalizedRegNum = registrationNumber.toUpperCase().trim();
    
    // Check in database (assuming userModel has this method)
    const existingUser = await userModel.getUserByRegistrationNumber(normalizedRegNum);
    
    if (existingUser) {
      return {
        isUnique: false,
        error: 'Registration number already exists in our system',
        existingUser: {
          name: existingUser.name,
          email: existingUser.email.replace(/(.{2}).(@.)/, '$1*$2'), // Mask email
          registeredAt: existingUser.createdAt
        }
      };
    }
    
    return {
      isUnique: true,
      error: null,
      existingUser: null
    };
    
  } catch (error) {
    console.error('Registration number uniqueness check error:', error);
    return {
      isUnique: false,
      error: 'Unable to verify registration number uniqueness',
      existingUser: null
    };
  }
};

/**
 * Mock government API validation (placeholder for future implementation)
 * @param {string} registrationNumber - Registration number
 * @param {string} patternType - Pattern type detected
 * @returns {Promise<Object>} - API validation result
 */
const validateWithGovernmentAPI = async (registrationNumber, patternType) => {
  try {
    // This is a mock implementation
    // In production, integrate with actual government APIs like:
    // - AICTE API for technical institutions
    // - UGC API for universities
    // - State education board APIs
    
    const mockDelay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, mockDelay));
    
    // Mock responses based on pattern
    const mockResponses = {
      AICTE: {
        isVerified: Math.random() > 0.3, // 70% success rate
        authority: 'All India Council for Technical Education',
        status: 'Active',
        institutionType: 'Technical Institution'
      },
      UGC: {
        isVerified: Math.random() > 0.2, // 80% success rate
        authority: 'University Grants Commission',
        status: 'Recognized',
        institutionType: 'University'
      },
      STATE_BOARD: {
        isVerified: Math.random() > 0.4, // 60% success rate
        authority: 'State Education Board',
        status: 'Registered',
        institutionType: 'Educational Institution'
      },
      CBSE: {
        isVerified: Math.random() > 0.1, // 90% success rate
        authority: 'Central Board of Secondary Education',
        status: 'Affiliated',
        institutionType: 'CBSE School'
      }
    };
    
    const response = mockResponses[patternType] || {
      isVerified: Math.random() > 0.5,
      authority: 'Educational Authority',
      status: 'Unknown',
      institutionType: 'Educational Institution'
    };
    
    return {
      isVerified: response.isVerified,
      authority: response.authority,
      status: response.status,
      institutionType: response.institutionType,
      lastVerified: new Date().toISOString(),
      error: response.isVerified ? null : 'Registration number not found in government records'
    };
    
  } catch (error) {
    console.error('Government API validation error:', error);
    return {
      isVerified: false,
      authority: null,
      status: null,
      institutionType: null,
      lastVerified: null,
      error: 'Government verification service unavailable'
    };
  }
};

/**
 * Comprehensive registration number validation
 * @param {string} registrationNumber - Registration number to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} - Complete validation result
 */
const validateRegistrationNumber = async (registrationNumber, options = {}) => {
  try {
    const startTime = Date.now();
    const identifier = options.userIP || 'unknown';
    
    // Check rate limiting
    if (!checkRateLimit(identifier)) {
      return {
        isValid: false,
        error: 'Too many validation requests. Please try again later.',
        validationTime: Date.now() - startTime
      };
    }
    
    // Check cache first
    const cacheKey = registrationNumber.toUpperCase().trim();
    if (validationCache.has(cacheKey)) {
      const cached = validationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < VALIDATION_CONFIG.CACHE_DURATION) {
        return { ...cached.result, fromCache: true };
      }
      validationCache.delete(cacheKey);
    }
    
    // Step 1: Format validation
    const formatResult = validateFormat(registrationNumber);
    if (!formatResult.isValid) {
      return {
        ...formatResult,
        validationTime: Date.now() - startTime
      };
    }
    
    // Step 2: Uniqueness check
    const uniquenessResult = await checkUniqueness(formatResult.normalizedNumber);
    if (!uniquenessResult.isUnique) {
      return {
        isValid: false,
        isUnique: false,
        error: uniquenessResult.error,
        existingUser: uniquenessResult.existingUser,
        formatValid: true,
        normalizedNumber: formatResult.normalizedNumber,
        validationTime: Date.now() - startTime
      };
    }
    
    // Step 3: Government API validation (if enabled)
    let governmentValidation = null;
    if (options.verifyWithAPI && formatResult.matchedPatterns.length > 0) {
      const primaryPattern = formatResult.matchedPatterns[0].name;
      governmentValidation = await validateWithGovernmentAPI(
        formatResult.normalizedNumber, 
        primaryPattern
      );
    }
    
    const result = {
      isValid: true,
      isUnique: true,
      formatValid: true,
      normalizedNumber: formatResult.normalizedNumber,
      matchedPatterns: formatResult.matchedPatterns,
      detectedState: formatResult.detectedState,
      governmentVerification: governmentValidation,
      validationTime: Date.now() - startTime,
      validatedAt: new Date().toISOString(),
      error: null
    };
    
    // Cache successful validations
    validationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    return result;
    
  } catch (error) {
    console.error('Registration number validation error:', error);
    return {
      isValid: false,
      error: 'Registration number validation failed: ' + error.message,
      validationTime: Date.now() - Date.now()
    };
  }
};

/**
 * Quick registration number check (format only)
 * @param {string} registrationNumber - Registration number
 * @returns {Promise<boolean>} - Simple validity status
 */
const isRegistrationNumberValid = async (registrationNumber) => {
  try {
    const result = validateFormat(registrationNumber);
    return result.isValid;
  } catch (error) {
    console.error('Quick registration check error:', error);
    return false;
  }
};

/**
 * Get supported registration patterns
 * @returns {Array} - List of supported patterns
 */
const getSupportedPatterns = () => {
  return Object.entries(REGISTRATION_PATTERNS).map(([name, data]) => ({
    name,
    description: data.description,
    example: data.example,
    pattern: data.pattern.toString()
  }));
};

/**
 * Get validation statistics
 * @returns {Object} - Validation statistics
 */
const getValidationStatistics = () => {
  try {
    let totalCached = 0;
    let totalRateLimit = 0;
    
    totalCached = validationCache.size;
    totalRateLimit = rateLimitCache.size;
    
    return {
      totalCached,
      totalRateLimit,
      supportedPatterns: Object.keys(REGISTRATION_PATTERNS).length,
      supportedStates: Object.keys(STATE_PREFIXES).length,
      cacheDuration: VALIDATION_CONFIG.CACHE_DURATION / 1000 / 60 // minutes
    };
    
  } catch (error) {
    console.error('Get validation statistics error:', error);
    return null;
  }
};

/**
 * Clear validation cache
 * @param {string} registrationNumber - Specific number to clear (optional)
 * @returns {boolean} - Clear success
 */
const clearValidationCache = (registrationNumber = null) => {
  try {
    if (registrationNumber) {
      const cacheKey = registrationNumber.toUpperCase().trim();
      return validationCache.delete(cacheKey);
    } else {
      validationCache.clear();
      return true;
    }
  } catch (error) {
    console.error('Clear validation cache error:', error);
    return false;
  }
};

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean validation cache
  for (const [regNum, cached] of validationCache.entries()) {
    if (now - cached.timestamp > VALIDATION_CONFIG.CACHE_DURATION) {
      validationCache.delete(regNum);
    }
  }
  
  // Clean rate limit cache
  const rateLimitWindow = VALIDATION_CONFIG.RATE_LIMIT.WINDOW_MINUTES * 60 * 1000;
  for (const [identifier, rateData] of rateLimitCache.entries()) {
    if (now - rateData.firstRequest > rateLimitWindow) {
      rateLimitCache.delete(identifier);
    }
  }
}, 15 * 60 * 1000); // Every 15 minutes

console.log('Registration Validation Service initialized with', Object.keys(REGISTRATION_PATTERNS).length, 'patterns');

module.exports = {
  validateRegistrationNumber,
  isRegistrationNumberValid,
  validateFormat,
  checkUniqueness,
  validateWithGovernmentAPI,
  getSupportedPatterns,
  getValidationStatistics,
  clearValidationCache,
  REGISTRATION_PATTERNS,
  STATE_PREFIXES
};