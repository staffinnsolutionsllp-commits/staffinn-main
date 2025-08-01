/**
 * Email Validator Utilities
 * Advanced email validation with domain verification and disposable email detection
 */
const dns = require('dns').promises;
const net = require('net');

// Email validation configuration
const VALIDATION_CONFIG = {
  MAX_LENGTH: 254, // RFC 5321 limit
  LOCAL_MAX_LENGTH: 64, // Local part max length
  DOMAIN_MAX_LENGTH: 253, // Domain max length
  DNS_TIMEOUT: 5000, // 5 seconds
  SMTP_TIMEOUT: 10000, // 10 seconds
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  RATE_LIMIT: {
    MAX_REQUESTS: 50,
    WINDOW_MINUTES: 60 // 1 hour
  }
};

// Cache for validation results
const emailValidationCache = new Map();
const rateLimitCache = new Map();

// Disposable email domains (common ones)
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
  'yopmail.com', 'temp-mail.org', 'throwaway.email', 'getnada.com',
  'maildrop.cc', 'tempail.com', 'dispostable.com', 'trashmail.com',
  '20minutemail.it', 'fakemailgenerator.com', 'mohmal.com', 'sharklasers.com',
  'spam4.me', 'tempinbox.com', 'tmpeml.com', 'emailondeck.com'
]);

// Common valid email domains
const TRUSTED_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
  'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com', 'mail.com',
  'rediffmail.com', 'yandex.com', 'inbox.com', 'fastmail.com'
]);

// Educational institution domains (Indian)
const EDUCATIONAL_DOMAINS = new Set([
  'edu', 'ac.in', 'edu.in', 'ernet.in', 'res.in', 'gov.in'
]);

// Professional email patterns
const PROFESSIONAL_PATTERNS = [
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|mil|int)$/,
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(co\.in|org\.in|edu\.in|gov\.in)$/,
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(ac\.uk|edu\.au|edu\.ca)$/
];

/**
 * Check rate limiting for email validation
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
 * Validate email format using comprehensive regex
 * @param {string} email - Email to validate
 * @returns {Object} - Format validation result
 */
const validateEmailFormat = (email) => {
  try {
    // Basic checks
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        error: 'Email is required and must be a string',
        details: null
      };
    }
    
    const trimmedEmail = email.trim().toLowerCase();
    
    // Length checks
    if (trimmedEmail.length === 0) {
      return {
        isValid: false,
        error: 'Email cannot be empty',
        details: null
      };
    }
    
    if (trimmedEmail.length > VALIDATION_CONFIG.MAX_LENGTH) {
      return {
        isValid: false,
        error: Email is too long (max ${VALIDATION_CONFIG.MAX_LENGTH} characters),
        details: null
      };
    }
    
    // Basic format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      return {
        isValid: false,
        error: 'Invalid email format',
        details: null
      };
    }
    
    // Split email into local and domain parts
    const [localPart, domainPart] = trimmedEmail.split('@');
    
    // Validate local part
    if (localPart.length > VALIDATION_CONFIG.LOCAL_MAX_LENGTH) {
      return {
        isValid: false,
        error: Local part is too long (max ${VALIDATION_CONFIG.LOCAL_MAX_LENGTH} characters),
        details: null
      };
    }
    
    // Validate domain part
    if (domainPart.length > VALIDATION_CONFIG.DOMAIN_MAX_LENGTH) {
      return {
        isValid: false,
        error: Domain is too long (max ${VALIDATION_CONFIG.DOMAIN_MAX_LENGTH} characters),
        details: null
      };
    }
    
    // Check for consecutive dots
    if (trimmedEmail.includes('..')) {
      return {
        isValid: false,
        error: 'Email cannot contain consecutive dots',
        details: null
      };
    }
    
    // Check for starting/ending dots
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return {
        isValid: false,
        error: 'Local part cannot start or end with a dot',
        details: null
      };
    }
    
    return {
      isValid: true,
      normalizedEmail: trimmedEmail,
      localPart,
      domainPart,
      error: null,
      details: {
        length: trimmedEmail.length,
        localLength: localPart.length,
        domainLength: domainPart.length
      }
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: 'Email format validation failed',
      details: null
    };
  }
};

/**
 * Check if email domain is disposable/temporary
 * @param {string} domain - Domain to check
 * @returns {Object} - Disposable check result
 */
const checkDisposableEmail = (domain) => {
  try {
    const normalizedDomain = domain.toLowerCase().trim();
    
    const isDisposable = DISPOSABLE_EMAIL_DOMAINS.has(normalizedDomain);
    const isTrusted = TRUSTED_EMAIL_DOMAINS.has(normalizedDomain);
    const isEducational = EDUCATIONAL_DOMAINS.has(normalizedDomain) || 
                         normalizedDomain.endsWith('.edu') || 
                         normalizedDomain.endsWith('.ac.in') ||
                         normalizedDomain.endsWith('.edu.in');
    
    const isProfessional = PROFESSIONAL_PATTERNS.some(pattern => 
      pattern.test(test@${normalizedDomain})
    );
    
    return {
      isDisposable,
      isTrusted,
      isEducational,
      isProfessional,
      domainType: isEducational ? 'educational' : 
                  isTrusted ? 'trusted' : 
                  isProfessional ? 'professional' : 
                  isDisposable ? 'disposable' : 'unknown',
      recommendation: isDisposable ? 'reject' : 
                     isTrusted || isEducational ? 'accept' : 'verify'
    };
    
  } catch (error) {
    console.error('Disposable email check error:', error);
    return {
      isDisposable: false,
      isTrusted: false,
      isEducational: false,
      isProfessional: false,
      domainType: 'unknown',
      recommendation: 'verify'
    };
  }
};

/**
 * Verify domain DNS records
 * @param {string} domain - Domain to verify
 * @returns {Promise<Object>} - DNS verification result
 */
const verifyDomainDNS = async (domain) => {
  try {
    const normalizedDomain = domain.toLowerCase().trim();
    
    // Check MX records
    let mxRecords = [];
    try {
      mxRecords = await dns.resolveMx(normalizedDomain);
    } catch (error) {
      // MX lookup failed
    }
    
    // Check A records
    let aRecords = [];
    try {
      aRecords = await dns.resolve4(normalizedDomain);
    } catch (error) {
      // A lookup failed
    }
    
    // Check AAAA records (IPv6)
    let aaaaRecords = [];
    try {
      aaaaRecords = await dns.resolve6(normalizedDomain);
    } catch (error) {
      // AAAA lookup failed
    }
    
    const hasMX = mxRecords.length > 0;
    const hasA = aRecords.length > 0;
    const hasAAAA = aaaaRecords.length > 0;
    
    return {
      isResolvable: hasMX || hasA || hasAAAA,
      hasMXRecords: hasMX,
      hasARecords: hasA,
      hasAAAARecords: hasAAAA,
      mxRecords: mxRecords.slice(0, 3), // Limit to first 3
      aRecords: aRecords.slice(0, 3),
      aaaaRecords: aaaaRecords.slice(0, 3),
      error: null
    };
    
  } catch (error) {
    console.error('DNS verification error:', error);
    return {
      isResolvable: false,
      hasMXRecords: false,
      hasARecords: false,
      hasAAAARecords: false,
      mxRecords: [],
      aRecords: [],
      aaaaRecords: [],
      error: error.message
    };
  }
};

/**
 * Perform SMTP verification (basic connection test)
 * @param {string} email - Email to verify
 * @param {Array} mxRecords - MX records for the domain
 * @returns {Promise<Object>} - SMTP verification result
 */
const verifySMTP = async (email, mxRecords) => {
  // Note: This is a simplified SMTP check
  // Full SMTP verification requires more complex implementation
  // and may be blocked by many mail servers
  
  try {
    if (!mxRecords || mxRecords.length === 0) {
      return {
        isVerified: false,
        error: 'No MX records found',
        smtpResponse: null
      };
    }
    
    // For now, just check if we can connect to the MX server
    const primaryMX = mxRecords[0];
    const host = primaryMX.exchange;
    const port = 25;
    
    return new Promise((resolve) => {
      const socket = net.createConnection(port, host);
      
      socket.setTimeout(VALIDATION_CONFIG.SMTP_TIMEOUT);
      
      socket.on('connect', () => {
        socket.end();
        resolve({
          isVerified: true,
          error: null,
          smtpResponse: 'Connection successful',
          mxServer: host
        });
      });
      
      socket.on('error', (error) => {
        resolve({
          isVerified: false,
          error: error.message,
          smtpResponse: null,
          mxServer: host
        });
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          isVerified: false,
          error: 'Connection timeout',
          smtpResponse: null,
          mxServer: host
        });
      });
    });
    
  } catch (error) {
    console.error('SMTP verification error:', error);
    return {
      isVerified: false,
      error: error.message,
      smtpResponse: null
    };
  }
};

/**
 * Comprehensive email validation
 * @param {string} email - Email to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} - Complete validation result
 */
const validateEmail = async (email, options = {}) => {
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
    if (options.useCache !== false) {
      const cacheKey = email.toLowerCase().trim();
      if (emailValidationCache.has(cacheKey)) {
        const cached = emailValidationCache.get(cacheKey);
        if (Date.now() - cached.timestamp < VALIDATION_CONFIG.CACHE_DURATION) {
          return { ...cached.result, fromCache: true };
        }
        emailValidationCache.delete(cacheKey);
      }
    }
    
    // Step 1: Format validation
    const formatResult = validateEmailFormat(email);
    if (!formatResult.isValid) {
      return {
        ...formatResult,
        validationTime: Date.now() - startTime
      };
    }
    
    const { normalizedEmail, domainPart } = formatResult;
    
    // Step 2: Disposable email check
    const disposableResult = checkDisposableEmail(domainPart);
    if (disposableResult.isDisposable && options.allowDisposable !== true) {
      return {
        isValid: false,
        error: 'Disposable email addresses are not allowed',
        normalizedEmail,
        domainInfo: disposableResult,
        validationTime: Date.now() - startTime
      };
    }
    
    // Step 3: DNS verification
    let dnsResult = null;
    if (options.verifyDNS !== false) {
      dnsResult = await verifyDomainDNS(domainPart);
      
      if (!dnsResult.isResolvable) {
        return {
          isValid: false,
          error: 'Email domain does not exist or is not configured for email',
          normalizedEmail,
          domainInfo: disposableResult,
          dnsInfo: dnsResult,
          validationTime: Date.now() - startTime
        };
      }
    }
    
    // Step 4: SMTP verification (optional)
    let smtpResult = null;
    if (options.verifySMTP === true && dnsResult && dnsResult.mxRecords.length > 0) {
      smtpResult = await verifySMTP(normalizedEmail, dnsResult.mxRecords);
    }
    
    const result = {
      isValid: true,
      normalizedEmail,
      domainInfo: disposableResult,
      dnsInfo: dnsResult,
      smtpInfo: smtpResult,
      validationTime: Date.now() - startTime,
      validatedAt: new Date().toISOString(),
      error: null
    };
    
    // Cache successful validations
    if (options.useCache !== false) {
      emailValidationCache.set(normalizedEmail, {
        result,
        timestamp: Date.now()
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('Email validation error:', error);
    return {
      isValid: false,
      error: 'Email validation failed: ' + error.message,
      validationTime: Date.now() - Date.now()
    };
  }
};

/**
 * Quick email validation (format only)
 * @param {string} email - Email to validate
 * @returns {boolean} - Simple validity status
 */
const isValidEmail = (email) => {
  try {
    const result = validateEmailFormat(email);
    return result.isValid;
  } catch (error) {
    console.error('Quick email validation error:', error);
    return false;
  }
};

/**
 * Check if email exists (comprehensive check)
 * @param {string} email - Email to check
 * @param {Object} options - Check options
 * @returns {Promise<boolean>} - Existence status
 */
const emailExists = async (email, options = {}) => {
  try {
    const result = await validateEmail(email, {
      verifyDNS: true,
      verifySMTP: options.verifySMTP || false,
      allowDisposable: false,
      ...options
    });
    
    return result.isValid;
  } catch (error) {
    console.error('Email existence check error:', error);
    return false;
  }
};

/**
 * Get email validation statistics
 * @returns {Object} - Validation statistics
 */
const getValidationStatistics = () => {
  try {
    return {
      totalCached: emailValidationCache.size,
      totalRateLimit: rateLimitCache.size,
      disposableDomains: DISPOSABLE_EMAIL_DOMAINS.size,
      trustedDomains: TRUSTED_EMAIL_DOMAINS.size,
      educationalDomains: EDUCATIONAL_DOMAINS.size,
      cacheDuration: VALIDATION_CONFIG.CACHE_DURATION / 1000 / 60 / 60 // hours
    };
  } catch (error) {
    console.error('Get validation statistics error:', error);
    return null;
  }
};

/**
 * Clear email validation cache
 * @param {string} email - Specific email to clear (optional)
 * @returns {boolean} - Clear success
 */
const clearValidationCache = (email = null) => {
  try {
    if (email) {
      const cacheKey = email.toLowerCase().trim();
      return emailValidationCache.delete(cacheKey);
    } else {
      emailValidationCache.clear();
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
  
  // Clean email validation cache
  for (const [email, cached] of emailValidationCache.entries()) {
    if (now - cached.timestamp > VALIDATION_CONFIG.CACHE_DURATION) {
      emailValidationCache.delete(email);
    }
  }
  
  // Clean rate limit cache
  const rateLimitWindow = VALIDATION_CONFIG.RATE_LIMIT.WINDOW_MINUTES * 60 * 1000;
  for (const [identifier, rateData] of rateLimitCache.entries()) {
    if (now - rateData.firstRequest > rateLimitWindow) {
      rateLimitCache.delete(identifier);
    }
  }
}, 30 * 60 * 1000); // Every 30 minutes

console.log('Email Validator initialized with', DISPOSABLE_EMAIL_DOMAINS.size, 'disposable domains');

module.exports = {
  validateEmail,
  isValidEmail,
  emailExists,
  validateEmailFormat,
  checkDisposableEmail,
  verifyDomainDNS,
  verifySMTP,
  getValidationStatistics,
  clearValidationCache,
  DISPOSABLE_EMAIL_DOMAINS,
  TRUSTED_EMAIL_DOMAINS,
  EDUCATIONAL_DOMAINS
};