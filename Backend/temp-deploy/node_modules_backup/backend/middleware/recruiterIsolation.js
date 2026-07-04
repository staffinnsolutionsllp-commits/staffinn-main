/**
 * Recruiter Isolation Middleware
 * Ensures data isolation between different recruiters in HRMS
 */

/**
 * Middleware to validate that the authenticated user's recruiterId matches the expected context
 * This prevents cross-recruiter data access
 */
const validateRecruiterContext = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Ensure recruiterId is present
  if (!user.recruiterId) {
    console.error('🚨 SECURITY: User without recruiterId attempting HRMS access', {
      userId: user.userId,
      email: user.email
    });
    return res.status(403).json({
      success: false,
      message: 'Invalid session: recruiterId missing',
      code: 'MISSING_RECRUITER_ID'
    });
  }

  // Store recruiterId in request for easy access by controllers
  req.recruiterId = user.recruiterId;
  
  console.log('✅ Recruiter context validated:', {
    userId: user.userId,
    recruiterId: user.recruiterId
  });

  next();
};

/**
 * Middleware to add recruiterId filter to query parameters
 * Ensures all database queries are scoped to the current recruiter
 */
const enforceRecruiterFilter = (req, res, next) => {
  if (!req.recruiterId) {
    return res.status(403).json({
      success: false,
      message: 'Recruiter context not established',
      code: 'NO_RECRUITER_CONTEXT'
    });
  }

  // Add recruiterId to query filters
  req.recruiterFilter = {
    recruiterId: req.recruiterId
  };

  next();
};

module.exports = {
  validateRecruiterContext,
  enforceRecruiterFilter
};
