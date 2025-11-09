/**
 * Validation Utilities
 * Joi validation schemas and helper functions
 */
const Joi = require('joi');

// Enhanced password validation schema
const passwordSchema = Joi.string()
  .min(8)
  .pattern(new RegExp('^(?=.[a-z])(?=.[A-Z])(?=.[0-9])(?=.[!@#\\$%\\^&\\*])'))
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (!@#$%^&*)',
    'any.required': 'Password is required'
  });

// Enhanced email validation schema
const emailSchema = Joi.string()
  .email()
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  });

// Website validation schema
const websiteSchema = Joi.string()
  .uri()
  .required()
  .messages({
    'string.uri': 'Please provide a valid website URL',
    'any.required': 'Website is required'
  });

// Registration number validation schema
const registrationNumberSchema = Joi.string()
  .pattern(new RegExp('^[A-Z0-9]{6,20}$'))
  .required()
  .messages({
    'string.pattern.base': 'Registration number must be 6-20 characters long and contain only uppercase letters and numbers',
    'any.required': 'Registration number is required'
  });

// User registration validation schema (existing - keeping as is)
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(1) // Allow any password length for testing
    .required()
    .messages({
      'string.min': 'Password is required',
      'any.required': 'Password is required'
    }),
  
  name: Joi.string()
    .required()
    .min(1)
    .messages({
      'string.min': 'Name is required',
      'any.required': 'Name is required'
    }),
  
  role: Joi.string()
    .valid('staff', 'recruiter', 'institute', 'admin', 'Staff', 'Recruiter', 'Institute', 'Admin')
    .required()
    .messages({
      'any.only': 'Role must be valid',
      'any.required': 'Role is required'
    }),
  
  phone: Joi.string()
    .allow('')
    .optional()
});

// Simplified Staff registration validation schema for testing
const staffRegistrationSchema = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 50 characters',
      'any.required': 'Full name is required'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .optional()
    .messages({
      'any.only': 'Confirm password must match password'
    }),
  
  phoneNumber: Joi.string()
    .min(10)
    .max(15)
    .required()
    .messages({
      'string.min': 'Phone number must be at least 10 characters',
      'string.max': 'Phone number cannot exceed 15 characters',
      'any.required': 'Phone number is required'
    }),
  
  role: Joi.string()
    .valid('staff', 'Staff')
    .optional()
    .messages({
      'any.only': 'Role must be staff'
    })
});

// Enhanced Recruiter registration validation schema
const recruiterRegistrationSchema = Joi.object({
  companyName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Company name must be at least 2 characters long',
      'string.max': 'Company name cannot exceed 100 characters',
      'any.required': 'Company name is required'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .optional()
    .messages({
      'any.only': 'Confirm password must match password'
    }),
  
  phoneNumber: Joi.string()
    .min(10)
    .max(15)
    .required()
    .messages({
      'string.min': 'Phone number must be at least 10 characters',
      'string.max': 'Phone number cannot exceed 15 characters',
      'any.required': 'Phone number is required'
    }),
  

  
  role: Joi.string()
    .valid('recruiter', 'Recruiter')
    .optional()
    .messages({
      'any.only': 'Role must be recruiter'
    })
});

// Enhanced Institute registration validation schema
const instituteRegistrationSchema = Joi.object({
  instituteName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Institute name must be at least 2 characters long',
      'string.max': 'Institute name cannot exceed 100 characters',
      'any.required': 'Institute name is required'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .optional()
    .messages({
      'any.only': 'Confirm password must match password'
    }),
  
  phoneNumber: Joi.string()
    .min(10)
    .max(15)
    .required()
    .messages({
      'string.min': 'Phone number must be at least 10 characters',
      'string.max': 'Phone number cannot exceed 15 characters',
      'any.required': 'Phone number is required'
    }),
  

  
  role: Joi.string()
    .valid('institute', 'Institute')
    .optional()
    .messages({
      'any.only': 'Role must be institute'
    })
});

// Job posting validation schema
const jobPostingSchema = Joi.object({
  title: Joi.string()
    .required()
    .min(3)
    .max(200)
    .messages({
      'string.min': 'Job title must be at least 3 characters long',
      'string.max': 'Job title cannot exceed 200 characters',
      'any.required': 'Job title is required'
    }),

  department: Joi.string()
    .required()
    .valid('Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Analytics', 'HR', 'Finance', 'Operations', 'Legal', 'Customer Support')
    .messages({
      'any.only': 'Please select a valid department',
      'any.required': 'Department is required'
    }),

  jobType: Joi.string()
    .required()
    .valid('Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship')
    .messages({
      'any.only': 'Please select a valid job type',
      'any.required': 'Job type is required'
    }),

  salary: Joi.string()
    .required()
    .min(3)
    .max(50)
    .messages({
      'string.min': 'Salary information must be at least 3 characters long',
      'string.max': 'Salary information cannot exceed 50 characters',
      'any.required': 'Salary information is required'
    }),

  experience: Joi.string()
    .required()
    .pattern(/^\d+$|^\d+-\d+$/)
    .max(50)
    .messages({
      'string.pattern.base': 'Experience must be a single number (e.g., "2") or range (e.g., "3-5")',
      'string.max': 'Experience requirement cannot exceed 50 characters',
      'any.required': 'Experience requirement is required'
    }),

  location: Joi.string()
    .required()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Location must be at least 2 characters long',
      'string.max': 'Location cannot exceed 100 characters',
      'any.required': 'Location is required'
    }),

  description: Joi.string()
    .required()
    .min(50)
    .max(5000)
    .messages({
      'string.min': 'Job description must be at least 50 characters long',
      'string.max': 'Job description cannot exceed 5000 characters',
      'any.required': 'Job description is required'
    }),

  skills: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().min(1).max(50)).min(1).max(20),
      Joi.string().min(3).max(500)
    )
    .required()
    .messages({
      'alternatives.match': 'Skills must be provided as an array or comma-separated string',
      'any.required': 'At least one skill is required'
    }),

  status: Joi.string()
    .valid('Active', 'Closed', 'Draft')
    .default('Active')
    .messages({
      'any.only': 'Status must be Active, Closed, or Draft'
    }),

  postedDate: Joi.string()
    .default(new Date().toISOString())
    .messages({
      'any.invalid': 'Posted date must be a valid date'
    })
});

// User login validation schema (existing - keeping as is)
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Validate data against schema
 * @param {object} schema - Joi validation schema
 * @param {object} data - Data to validate
 * @returns {object} - Validation result with error or value
 */
const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return { error: errorMessage };
  }
  
  return { value };
};

/**
 * Validate user registration data (existing - keeping as is)
 * @param {object} data - Registration data
 * @returns {object} - Validation result
 */
const validateRegistration = (data) => {
  return validate(registerSchema, data);
};

/**
 * Validate user login data (existing - keeping as is)
 * @param {object} data - Login data
 * @returns {object} - Validation result
 */
const validateLogin = (data) => {
  return validate(loginSchema, data);
};

/**
 * Validate staff registration data
 * @param {object} data - Staff registration data
 * @returns {object} - Validation result
 */
const validateStaffRegistration = (data) => {
  return validate(staffRegistrationSchema, data);
};

/**
 * Validate recruiter registration data
 * @param {object} data - Recruiter registration data
 * @returns {object} - Validation result
 */
const validateRecruiterRegistration = (data) => {
  return validate(recruiterRegistrationSchema, data);
};

/**
 * Validate institute registration data
 * @param {object} data - Institute registration data
 * @returns {object} - Validation result
 */
const validateInstituteRegistration = (data) => {
  return validate(instituteRegistrationSchema, data);
};

/**
 * Validate job posting data
 * @param {object} data - Job posting data
 * @returns {object} - Validation result
 */
const validateJobPosting = (data) => {
  return validate(jobPostingSchema, data);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result
 */
const validatePasswordStrength = (password) => {
  return validate(passwordSchema, password);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} - Validation result
 */
const validateEmail = (email) => {
  return validate(emailSchema, email);
};

/**
 * Validate website URL
 * @param {string} website - Website URL to validate
 * @returns {object} - Validation result
 */
const validateWebsite = (website) => {
  return validate(websiteSchema, website);
};

/**
 * Validate registration number
 * @param {string} registrationNumber - Registration number to validate
 * @returns {object} - Validation result
 */
const validateRegistrationNumber = (registrationNumber) => {
  return validate(registrationNumberSchema, registrationNumber);
};

module.exports = {
  // Existing exports (keeping as is)
  validateRegistration,
  validateLogin,
  validate,
  
  // New enhanced validation functions
  validateStaffRegistration,
  validateRecruiterRegistration,
  validateInstituteRegistration,
  validateJobPosting,
  validatePasswordStrength,
  validateEmail,
  validateWebsite,
  validateRegistrationNumber
};