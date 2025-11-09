/**
 * Website Validation Service
 * Validates website URLs and checks their accessibility
 */
const https = require('https');
const http = require('http');
const url = require('url');
const dns = require('dns').promises;

// Website validation configuration
const VALIDATION_CONFIG = {
  TIMEOUT: 15000, // 15 seconds
  MAX_REDIRECTS: 5,
  USER_AGENT: 'Mozilla/5.0 (compatible; WebsiteValidator/1.0)',
  ALLOWED_PROTOCOLS: ['http:', 'https:'],
  BLOCKED_DOMAINS: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '192.168.',
    '10.',
    '172.16.',
    'example.com',
    'test.com',
    'invalid.com'
  ],
  MIN_RESPONSE_SIZE: 100, // Minimum response size in bytes
  VALID_CONTENT_TYPES: [
    'text/html',
    'text/plain',
    'application/xhtml+xml'
  ]
};

// Cache for validation results (in-memory, use Redis in production)
const validationCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Normalize and validate URL format
 * @param {string} websiteUrl - Raw website URL
 * @returns {Object} - Normalized URL and validation status
 */
const normalizeUrl = (websiteUrl) => {
  try {
    let normalizedUrl = websiteUrl.trim().toLowerCase();
    
    // Remove trailing slashes
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');
    
    // Add protocol if missing
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Parse URL
    const parsedUrl = url.parse(normalizedUrl);
    
    // Validate protocol
    if (!VALIDATION_CONFIG.ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return {
        isValid: false,
        error: 'Invalid protocol. Only HTTP and HTTPS are allowed.',
        normalized: null
      };
    }
    
    // Validate hostname
    if (!parsedUrl.hostname) {
      return {
        isValid: false,
        error: 'Invalid hostname.',
        normalized: null
      };
    }
    
    // Check for blocked domains
    const isBlocked = VALIDATION_CONFIG.BLOCKED_DOMAINS.some(blocked => {
      return parsedUrl.hostname.includes(blocked) || parsedUrl.hostname.startsWith(blocked);
    });
    
    if (isBlocked) {
      return {
        isValid: false,
        error: 'Domain is not allowed.',
        normalized: null
      };
    }
    
    return {
      isValid: true,
      normalized: normalizedUrl,
      parsedUrl,
      error: null
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format.',
      normalized: null
    };
  }
};

/**
 * Check DNS resolution for domain
 * @param {string} hostname - Domain hostname
 * @returns {Promise<Object>} - DNS resolution result
 */
const checkDNSResolution = async (hostname) => {
  try {
    const addresses = await dns.lookup(hostname);
    return {
      isResolvable: true,
      addresses,
      error: null
    };
  } catch (error) {
    return {
      isResolvable: false,
      addresses: null,
      error: error.message
    };
  }
};

/**
 * Make HTTP request to check website accessibility
 * @param {string} websiteUrl - Website URL
 * @param {number} redirectCount - Current redirect count
 * @returns {Promise<Object>} - Request result
 */
const makeHttpRequest = (websiteUrl, redirectCount = 0) => {
  return new Promise((resolve) => {
    try {
      const parsedUrl = url.parse(websiteUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path || '/',
        method: 'HEAD', // Use HEAD to save bandwidth
        timeout: VALIDATION_CONFIG.TIMEOUT,
        headers: {
          'User-Agent': VALIDATION_CONFIG.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,/;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'close'
        }
      };
      
      const req = protocol.request(options, (res) => {
        const statusCode = res.statusCode;
        const contentType = res.headers['content-type'] || '';
        const contentLength = parseInt(res.headers['content-length']) || 0;
        
        // Handle redirects
        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
          if (redirectCount >= VALIDATION_CONFIG.MAX_REDIRECTS) {
            return resolve({
              isAccessible: false,
              statusCode,
              error: 'Too many redirects',
              contentType,
              contentLength
            });
          }
          
          const redirectUrl = url.resolve(websiteUrl, res.headers.location);
          return makeHttpRequest(redirectUrl, redirectCount + 1).then(resolve);
        }
        
        // Check if response is successful
        const isSuccessful = statusCode >= 200 && statusCode < 300;
        
        // Validate content type (for successful responses)
        let isValidContentType = true;
        if (isSuccessful && contentType) {
          isValidContentType = VALIDATION_CONFIG.VALID_CONTENT_TYPES.some(validType => 
            contentType.toLowerCase().includes(validType)
          );
        }
        
        resolve({
          isAccessible: isSuccessful,
          statusCode,
          contentType,
          contentLength,
          isValidContentType,
          redirectCount,
          error: isSuccessful ? null : HTTP ${statusCode}
        });
      });
      
      req.on('error', (error) => {
        resolve({
          isAccessible: false,
          statusCode: null,
          error: error.message,
          contentType: null,
          contentLength: 0
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          isAccessible: false,
          statusCode: null,
          error: 'Request timeout',
          contentType: null,
          contentLength: 0
        });
      });
      
      req.end();
      
    } catch (error) {
      resolve({
        isAccessible: false,
        statusCode: null,
        error: error.message,
        contentType: null,
        contentLength: 0
      });
    }
  });
};

/**
 * Comprehensive website validation
 * @param {string} websiteUrl - Website URL to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} - Validation result
 */
const validateWebsite = async (websiteUrl, options = {}) => {
  try {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = websiteUrl.toLowerCase().trim();
    if (validationCache.has(cacheKey)) {
      const cached = validationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return { ...cached.result, fromCache: true };
      }
      validationCache.delete(cacheKey);
    }
    
    // Step 1: Normalize URL
    const urlValidation = normalizeUrl(websiteUrl);
    if (!urlValidation.isValid) {
      return {
        isValid: false,
        isAccessible: false,
        error: urlValidation.error,
        originalUrl: websiteUrl,
        normalizedUrl: null,
        validationTime: Date.now() - startTime
      };
    }
    
    const normalizedUrl = urlValidation.normalized;
    const parsedUrl = urlValidation.parsedUrl;
    
    // Step 2: DNS Resolution
    const dnsResult = await checkDNSResolution(parsedUrl.hostname);
    if (!dnsResult.isResolvable) {
      return {
        isValid: true, // URL format is valid
        isAccessible: false,
        error: DNS resolution failed: ${dnsResult.error},
        originalUrl: websiteUrl,
        normalizedUrl,
        dnsResolvable: false,
        validationTime: Date.now() - startTime
      };
    }
    
    // Step 3: HTTP Request
    const httpResult = await makeHttpRequest(normalizedUrl);
    
    const result = {
      isValid: true,
      isAccessible: httpResult.isAccessible,
      originalUrl: websiteUrl,
      normalizedUrl,
      dnsResolvable: true,
      statusCode: httpResult.statusCode,
      contentType: httpResult.contentType,
      contentLength: httpResult.contentLength,
      isValidContentType: httpResult.isValidContentType,
      redirectCount: httpResult.redirectCount || 0,
      error: httpResult.error,
      validationTime: Date.now() - startTime,
      validatedAt: new Date().toISOString()
    };
    
    // Cache successful validations
    if (result.isAccessible) {
      validationCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('Website validation error:', error);
    return {
      isValid: false,
      isAccessible: false,
      error: 'Validation failed: ' + error.message,
      originalUrl: websiteUrl,
      normalizedUrl: null,
      validationTime: Date.now() - Date.now()
    };
  }
};

/**
 * Quick website accessibility check (simplified)
 * @param {string} websiteUrl - Website URL
 * @returns {Promise<boolean>} - Simple accessibility status
 */
const isWebsiteAccessible = async (websiteUrl) => {
  try {
    const result = await validateWebsite(websiteUrl);
    return result.isAccessible;
  } catch (error) {
    console.error('Quick website check error:', error);
    return false;
  }
};

/**
 * Batch validate multiple websites
 * @param {Array<string>} websites - Array of website URLs
 * @param {Object} options - Validation options
 * @returns {Promise<Array>} - Array of validation results
 */
const validateMultipleWebsites = async (websites, options = {}) => {
  try {
    const maxConcurrent = options.maxConcurrent || 5;
    const results = [];
    
    // Process websites in batches
    for (let i = 0; i < websites.length; i += maxConcurrent) {
      const batch = websites.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(website => validateWebsite(website, options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
    
  } catch (error) {
    console.error('Batch website validation error:', error);
    return [];
  }
};

/**
 * Get website validation statistics
 * @returns {Object} - Validation statistics
 */
const getValidationStatistics = () => {
  try {
    let totalCached = 0;
    let expiredCached = 0;
    const now = Date.now();
    
    for (const [url, cached] of validationCache.entries()) {
      totalCached++;
      if (now - cached.timestamp > CACHE_DURATION) {
        expiredCached++;
      }
    }
    
    return {
      totalCached,
      activeCached: totalCached - expiredCached,
      expiredCached,
      cacheSize: validationCache.size,
      cacheDuration: CACHE_DURATION / 1000 / 60 // minutes
    };
    
  } catch (error) {
    console.error('Get validation statistics error:', error);
    return null;
  }
};

/**
 * Clear validation cache
 * @param {string} websiteUrl - Specific URL to clear (optional)
 * @returns {boolean} - Clear success
 */
const clearValidationCache = (websiteUrl = null) => {
  try {
    if (websiteUrl) {
      const cacheKey = websiteUrl.toLowerCase().trim();
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
  for (const [url, cached] of validationCache.entries()) {
    if (now - cached.timestamp > CACHE_DURATION) {
      validationCache.delete(url);
    }
  }
}, 10 * 60 * 1000); // Every 10 minutes

console.log('Website Validation Service initialized');

module.exports = {
  validateWebsite,
  isWebsiteAccessible,
  validateMultipleWebsites,
  normalizeUrl,
  checkDNSResolution,
  getValidationStatistics,
  clearValidationCache
};