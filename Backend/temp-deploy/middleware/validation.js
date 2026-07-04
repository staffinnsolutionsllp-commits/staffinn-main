const validator = require('validator');

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
};

const validateCourseInput = (req, res, next) => {
  const { name, duration, instructor } = req.body;

  // Required field validation
  if (!name || !duration || !instructor) {
    return res.status(400).json({
      success: false,
      message: 'Name, duration, and instructor are required'
    });
  }

  // Sanitize inputs
  req.body.name = sanitizeInput(name);
  req.body.duration = sanitizeInput(duration);
  req.body.instructor = sanitizeInput(instructor);
  req.body.description = sanitizeInput(req.body.description || '');
  req.body.category = sanitizeInput(req.body.category || 'General');
  req.body.prerequisites = sanitizeInput(req.body.prerequisites || '');
  req.body.syllabus = sanitizeInput(req.body.syllabus || '');

  // Validate fees
  if (req.body.fees && isNaN(parseFloat(req.body.fees))) {
    return res.status(400).json({
      success: false,
      message: 'Fees must be a valid number'
    });
  }

  next();
};

const validateFileUploads = (req, res, next) => {
  const files = req.files || {};
  
  // Validate file types
  for (const [key, fileArray] of Object.entries(files)) {
    if (Array.isArray(fileArray)) {
      for (const file of fileArray) {
        if (!isValidFileType(file, key)) {
          return res.status(400).json({
            success: false,
            message: `Invalid file type for ${key}: ${file.mimetype}`
          });
        }
      }
    }
  }

  next();
};

const isValidFileType = (file, fieldName) => {
  const allowedTypes = {
    thumbnail: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    default: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  };

  const validTypes = fieldName.includes('thumbnail') ? 
    allowedTypes.thumbnail : allowedTypes.default;
  
  return validTypes.includes(file.mimetype);
};

module.exports = {
  validateCourseInput,
  validateFileUploads,
  sanitizeInput
};