/**
 * HRMS Access Controller
 * Handles secure access token generation for HRMS
 */

const { generateHRMSAccessToken, checkExistingHRMSAccount } = require('../middleware/hrmsAccessControl');

/**
 * Generate HRMS access token for authenticated recruiter
 * @route POST /api/hrms-access/generate-token
 */
const generateAccessToken = async (req, res) => {
  try {
    // Verify user is authenticated and is a recruiter
    if (!req.user || req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Only recruiters can access HRMS'
      });
    }
    
    const recruiterId = req.user.userId;
    const userEmail = req.user.email;
    
    console.log('🔑 Generating HRMS access token for recruiter:', {
      recruiterId,
      userEmail
    });
    
    // Check if recruiter already has HRMS account
    const existingAccount = await checkExistingHRMSAccount(recruiterId);
    
    // Generate one-time access token
    const accessToken = generateHRMSAccessToken(recruiterId, userEmail);
    
    // Determine the HRMS URL based on environment
    const hrmsBaseUrl = process.env.HRMS_URL || 'http://localhost:5173';
    
    // Build HRMS URL with access token
    let hrmsUrl;
    if (existingAccount) {
      // User already registered, redirect to login with access token
      hrmsUrl = `${hrmsBaseUrl}?hrmsAccessToken=${accessToken}&recruiterId=${recruiterId}&action=login`;
    } else {
      // New user, redirect to registration with access token
      hrmsUrl = `${hrmsBaseUrl}?hrmsAccessToken=${accessToken}&recruiterId=${recruiterId}&action=register`;
    }
    
    res.status(200).json({
      success: true,
      data: {
        accessToken,
        hrmsUrl,
        expiresIn: 300, // 5 minutes
        hasAccount: !!existingAccount,
        message: existingAccount 
          ? 'Access token generated. You will be redirected to HRMS login.' 
          : 'Access token generated. You will be redirected to HRMS registration.'
      }
    });
    
  } catch (error) {
    console.error('Error generating HRMS access token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate HRMS access token'
    });
  }
};

/**
 * Validate HRMS access token (for frontend verification)
 * @route GET /api/hrms-access/validate-token
 */
const validateAccessToken = async (req, res) => {
  try {
    const { accessToken } = req.query;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }
    
    const { validateHRMSAccessToken } = require('../middleware/hrmsAccessControl');
    const tokenData = validateHRMSAccessToken(accessToken);
    
    if (!tokenData) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired access token'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        valid: true,
        recruiterId: tokenData.recruiterId,
        userEmail: tokenData.userEmail
      }
    });
    
  } catch (error) {
    console.error('Error validating HRMS access token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate access token'
    });
  }
};

module.exports = {
  generateAccessToken,
  validateAccessToken
};
