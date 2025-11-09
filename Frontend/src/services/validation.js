/* eslint-disable no-unused-vars */
// Frontend validation utilities

// Enhanced password validation
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return errors;
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 50) {
    errors.push('Password cannot exceed 50 characters');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*[0-9])/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[!@#$%^&*])/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }
  
  return errors;
};

// Enhanced email validation
export const validateEmail = (email) => {
  const errors = [];
  
  if (!email) {
    errors.push('Email is required');
    return errors;
  }
  
  // Enhanced email regex for better validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  // Check email length
  if (email.length > 254) {
    errors.push('Email address is too long');
  }
  
  // Check for disposable email domains
  const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com', 'yopmail.com'];
  const domain = email.split('@')[1];
  if (domain && disposableDomains.includes(domain.toLowerCase())) {
    errors.push('Disposable email addresses are not allowed');
  }
  
  return errors;
};

// Enhanced phone validation (Indian format)
export const validatePhone = (phone) => {
  const errors = [];
  
  if (!phone) {
    errors.push('Phone number is required');
    return errors;
  }
  
  // Remove spaces and special characters
  const cleanPhone = phone.replace(/\s|-|\(|\)/g, '');
  
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    errors.push('Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9');
  }
  
  return errors;
};

// Enhanced website validation
export const validateWebsite = (website) => {
  const errors = [];
  
  if (!website) {
    errors.push('Website URL is required');
    return errors;
  }
  
  try {
    // Add protocol if missing
    let url = website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    
    // Check if it's a valid domain
    if (!urlObj.hostname.includes('.') || urlObj.hostname.length < 4) {
      errors.push('Please enter a valid website URL');
    }
    
    // Check for localhost or invalid domains
    const invalidDomains = ['localhost', '127.0.0.1', 'example.com', 'test.com'];
    if (invalidDomains.includes(urlObj.hostname.toLowerCase())) {
      errors.push('Please enter a valid public website URL');
    }
    
  } catch (error) {
    errors.push('Please enter a valid website URL (e.g., https://company.com)');
  }
  
  return errors;
};

// Enhanced registration number validation
export const validateRegistrationNumber = (regNumber) => {
  const errors = [];
  
  if (!regNumber) {
    errors.push('Registration number is required');
    return errors;
  }
  
  const normalized = regNumber.toUpperCase().trim();
  
  if (normalized.length < 6 || normalized.length > 20) {
    errors.push('Registration number must be between 6 and 20 characters long');
  }
  
  if (!/^[A-Z0-9]+$/.test(normalized)) {
    errors.push('Registration number must contain only uppercase letters and numbers');
  }
  
  // Check for common patterns
  const validPatterns = [
    /^(AICTE|aicte)[0-9]{8,12}$/i,      // AICTE
    /^(UGC|ugc)[A-Z0-9]{6,15}$/i,       // UGC
    /^[A-Z]{2}[0-9]{6,12}$/,             // State Board
    /^[0-9]{8,15}$/,                     // Numeric
    /^(UNIV|UNIVERSITY)[A-Z0-9]{6,12}$/i, // University
    /^(INST|REG|EDU)[A-Z0-9]{6,15}$/i   // Generic Institute
  ];
  
  const isValidPattern = validPatterns.some(pattern => pattern.test(normalized));
  if (!isValidPattern) {
    errors.push('Registration number format is not recognized. Please check and try again.');
  }
  
  return errors;
};

// Full name validation
export const validateFullName = (name) => {
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Full name is required');
    return errors;
  }
  
  if (name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }
  
  if (name.trim().length > 50) {
    errors.push('Full name cannot exceed 50 characters');
  }
  
  if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) {
    errors.push('Full name can only contain letters, spaces, dots, hyphens, and apostrophes');
  }
  
  return errors;
};

// Company name validation
export const validateCompanyName = (companyName) => {
  const errors = [];
  
  if (!companyName || companyName.trim().length === 0) {
    errors.push('Company name is required');
    return errors;
  }
  
  if (companyName.trim().length < 2) {
    errors.push('Company name must be at least 2 characters long');
  }
  
  if (companyName.trim().length > 100) {
    errors.push('Company name cannot exceed 100 characters');
  }
  
  return errors;
};

// Institute name validation
export const validateInstituteName = (instituteName) => {
  const errors = [];
  
  if (!instituteName || instituteName.trim().length === 0) {
    errors.push('Institute name is required');
    return errors;
  }
  
  if (instituteName.trim().length < 2) {
    errors.push('Institute name must be at least 2 characters long');
  }
  
  if (instituteName.trim().length > 100) {
    errors.push('Institute name cannot exceed 100 characters');
  }
  
  return errors;
};

// Real-time password strength indicator (enhanced)
export const getPasswordStrength = (password) => {
  let score = 0;
  const feedback = [];
  
  if (!password) {
    return {
      score: 0,
      label: 'No Password',
      color: '#ccc',
      width: '0%',
      feedback: ['Enter a password']
    };
  }
  
  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters');
  
  if (/(?=.*[a-z])/.test(password)) score += 1;
  else feedback.push('One lowercase letter');
  
  if (/(?=.*[A-Z])/.test(password)) score += 1;
  else feedback.push('One uppercase letter');
  
  if (/(?=.*[0-9])/.test(password)) score += 1;
  else feedback.push('One number');
  
  if (/(?=.*[!@#$%^&*])/.test(password)) score += 1;
  else feedback.push('One special character (!@#$%^&*)');
  
  // Bonus points for length and complexity
  if (password.length >= 12) score += 0.5;
  if (/(?=.*[!@#$%^&()_+\-=\[\]{};':"\\|,.<>\?])/.test(password)) score += 0.5;
  
  const strength = {
    0: { label: 'Very Weak', color: '#ff4444', width: '10%' },
    1: { label: 'Weak', color: '#ff8800', width: '25%' },
    2: { label: 'Fair', color: '#ffaa00', width: '45%' },
    3: { label: 'Good', color: '#88cc00', width: '65%' },
    4: { label: 'Strong', color: '#44aa00', width: '85%' },
    5: { label: 'Very Strong', color: '#00aa00', width: '100%' },
    6: { label: 'Excellent', color: '#008800', width: '100%' }
  };
  
  const finalScore = Math.min(Math.floor(score), 6);
  
  return {
    score: finalScore,
    ...strength[finalScore],
    feedback
  };
};

// Enhanced form validation for each user type
export const validateStaffForm = (formData) => {
  const errors = {};
  
  const nameErrors = validateFullName(formData.fullName);
  if (nameErrors.length > 0) errors.fullName = nameErrors[0];
  
  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) errors.email = emailErrors[0];
  
  const passwordErrors = validatePassword(formData.password);
  if (passwordErrors.length > 0) errors.password = passwordErrors;
  
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Password confirmation does not match';
  }
  
  const phoneErrors = validatePhone(formData.phoneNumber || formData.phone);
  if (phoneErrors.length > 0) errors.phoneNumber = phoneErrors[0];
  
  return errors;
};

export const validateRecruiterForm = (formData) => {
  const errors = {};
  
  const companyNameErrors = validateCompanyName(formData.companyName);
  if (companyNameErrors.length > 0) errors.companyName = companyNameErrors[0];
  
  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) errors.email = emailErrors[0];
  
  const passwordErrors = validatePassword(formData.password);
  if (passwordErrors.length > 0) errors.password = passwordErrors;
  
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Password confirmation does not match';
  }
  
  const phoneErrors = validatePhone(formData.phoneNumber || formData.phone);
  if (phoneErrors.length > 0) errors.phoneNumber = phoneErrors[0];
  

  
  return errors;
};

export const validateInstituteForm = (formData) => {
  const errors = {};
  
  const instituteNameErrors = validateInstituteName(formData.instituteName);
  if (instituteNameErrors.length > 0) errors.instituteName = instituteNameErrors[0];
  
  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) errors.email = emailErrors[0];
  
  const passwordErrors = validatePassword(formData.password);
  if (passwordErrors.length > 0) errors.password = passwordErrors;
  
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Password confirmation does not match';
  }
  
  const phoneErrors = validatePhone(formData.phoneNumber || formData.phone);
  if (phoneErrors.length > 0) errors.phoneNumber = phoneErrors[0];
  

  
  return errors;
};

// Real-time validation functions for immediate feedback
export const validateFieldRealTime = (fieldName, value, formData = {}) => {
  switch (fieldName) {
    case 'fullName':
      return validateFullName(value);
    case 'companyName':
      return validateCompanyName(value);
    case 'instituteName':
      return validateInstituteName(value);
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value);
    case 'confirmPassword':
      return value !== formData.password ? ['Passwords do not match'] : [];
    case 'phoneNumber':
    case 'phone':
      return validatePhone(value);

    case 'registrationNumber':
      return validateRegistrationNumber(value);
    default:
      return [];
  }
};

// API validation functions (for backend integration)
export const validateEmailExists = async (email) => {
  try {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Email verification error:', error);
    return false;
  }
};

export const validateWebsiteExists = async (website) => {
  try {
    const response = await fetch('/api/recruiter/verify-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ website }),
    });
    
    const data = await response.json();
    return data.success && data.data.isValid;
  } catch (error) {
    console.error('Website verification error:', error);
    return false;
  }
};

export const validateRegistrationNumberExists = async (registrationNumber) => {
  try {
    const response = await fetch('/api/institute/verify-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registrationNumber }),
    });
    
    const data = await response.json();
    return data.success && data.data.isValid;
  } catch (error) {
    console.error('Registration number verification error:', error);
    return false;
  }
};