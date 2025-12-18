// RegistrationPopup.jsx
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import './RegistrationPopup.css';
import { assets } from '../../assets/assets';
import { 
  validateStaffForm, 
  validateRecruiterForm, 
  validateInstituteForm,
  validateFieldRealTime,
  getPasswordStrength 
} from '../../services/validation';
import PasswordStrength from '../common/PasswordStrength';
import apiService from '../../services/api';

// StaffRegistrationForm Component
const StaffRegistrationForm = ({ onRegister }) => {
   const [formData, setFormData] = useState({
       fullName: '',
       email: '',
       password: '',
       confirmPassword: '',
       phoneNumber: ''
   });
   const [formQuality, setFormQuality] = useState(0);
   const [qualityMessage, setQualityMessage] = useState("Start filling the form to become a quality staff member!");
   const [errors, setErrors] = useState({});
   const [fieldErrors, setFieldErrors] = useState({});

   const updateQuality = (newFormData) => {
       let filledFields = 0;
       let totalFields = Object.keys(newFormData).length;
       
       Object.values(newFormData).forEach(value => {
           if(value && value.trim() !== '') {
               filledFields++;
           }
       });

       const quality = (filledFields / totalFields) * 100;
       setFormQuality(quality);

       if(quality === 0) {
           setQualityMessage("Start filling the form to become a quality staff member!");
       } else if(quality < 50) {
           setQualityMessage("Good start! Keep going!");
       } else if(quality < 80) {
           setQualityMessage("Almost there! Complete your profile!");
       } else {
           setQualityMessage("Excellent! You're ready to join our team!");
       }
   };

   const handleInputChange = (field, value) => {
       const newFormData = { ...formData, [field]: value };
       setFormData(newFormData);
       updateQuality(newFormData);
       
       // Real-time validation
       const fieldErrors = validateFieldRealTime(field, value, newFormData);
       setFieldErrors(prev => ({
           ...prev,
           [field]: fieldErrors.length > 0 ? fieldErrors[0] : ''
       }));
       
       // Clear main errors if field is now valid
       if (fieldErrors.length === 0) {
           setErrors(prev => ({
               ...prev,
               [field]: ''
           }));
       }
   };

   const handleSubmit = (e) => {
       e.preventDefault();
       
       // Validate entire form
       const formErrors = validateStaffForm(formData);
       setErrors(formErrors);
       
       // Check if there are any errors
       if (Object.keys(formErrors).length > 0) {
           return;
       }
       
       onRegister(formData, 'Staff');
   };

   return (
       <div className="registration-form">
           <div className="quality-indicator">
               <p className="quality-message">{qualityMessage}</p>
               <div className="quality-bar-container">
                   <div 
                       className="quality-bar" 
                       style={{ 
                           width: formQuality + '%',
                           backgroundColor: formQuality < 30 ? '#ffd700' : 
                                         formQuality < 70 ? '#4863f7' : 
                                         '#28a745'
                       }}
                   ></div>
               </div>
           </div>
           
           <form className="form-fields" onSubmit={handleSubmit}>
               <div className="input-group">
                   <input 
                       type="text"
                       placeholder="Full Name *"
                       value={formData.fullName}
                       onChange={(e) => handleInputChange('fullName', e.target.value)}
                       className={fieldErrors.fullName || errors.fullName ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.fullName || errors.fullName) && 
                       <span className="error-text">{fieldErrors.fullName || errors.fullName}</span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="email"
                       placeholder="Email *"
                       value={formData.email}
                       onChange={(e) => handleInputChange('email', e.target.value)}
                       className={fieldErrors.email || errors.email ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.email || errors.email) && 
                       <span className="error-text">{fieldErrors.email || errors.email}</span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="password"
                       placeholder="Password *"
                       value={formData.password}
                       onChange={(e) => handleInputChange('password', e.target.value)}
                       className={fieldErrors.password || errors.password ? 'error' : ''}
                       required
                   />
                   <PasswordStrength password={formData.password} />
                   {(fieldErrors.password || errors.password) && 
                       <span className="error-text">
                           {Array.isArray(errors.password) ? errors.password[0] : (fieldErrors.password || errors.password)}
                       </span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="password"
                       placeholder="Confirm Password *"
                       value={formData.confirmPassword}
                       onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                       className={fieldErrors.confirmPassword || errors.confirmPassword ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.confirmPassword || errors.confirmPassword) && 
                       <span className="error-text">{fieldErrors.confirmPassword || errors.confirmPassword}</span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="tel"
                       placeholder="Phone Number *"
                       value={formData.phoneNumber}
                       onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                       className={fieldErrors.phoneNumber || errors.phoneNumber ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.phoneNumber || errors.phoneNumber) && 
                       <span className="error-text">{fieldErrors.phoneNumber || errors.phoneNumber}</span>
                   }
               </div>

               <button type="submit" className="submit-btn">Register</button>
           </form>
       </div>
   );
};

// InstituteRegistrationForm Component
const InstituteRegistrationForm = ({ onRegister }) => {
   const [formData, setFormData] = useState({
       instituteName: '',
       email: '',
       password: '',
       confirmPassword: '',
       phoneNumber: ''
   });
   const [formQuality, setFormQuality] = useState(0);
   const [qualityMessage, setQualityMessage] = useState("Start filling the form to register your institute!");
   const [errors, setErrors] = useState({});
   const [fieldErrors, setFieldErrors] = useState({});

   const updateQuality = (newFormData) => {
       let filledFields = 0;
       let totalFields = Object.keys(newFormData).length;
       
       Object.values(newFormData).forEach(value => {
           if(value && value.trim() !== '') {
               filledFields++;
           }
       });

       const quality = (filledFields / totalFields) * 100;
       setFormQuality(quality);

       if(quality === 0) {
           setQualityMessage("Start filling the form to register your institute!");
       } else if(quality < 50) {
           setQualityMessage("Good progress! Continue providing details!");
       } else if(quality < 80) {
           setQualityMessage("Almost there! Complete institute profile!");
       } else {
           setQualityMessage("Excellent! Ready to register your institute!");
       }
   };

   const handleInputChange = (field, value) => {
       const newFormData = { ...formData, [field]: value };
       setFormData(newFormData);
       updateQuality(newFormData);
       
       // Real-time validation
       const fieldErrors = validateFieldRealTime(field, value, newFormData);
       setFieldErrors(prev => ({
           ...prev,
           [field]: fieldErrors.length > 0 ? fieldErrors[0] : ''
       }));
       
       // Clear main errors if field is now valid
       if (fieldErrors.length === 0) {
           setErrors(prev => ({
               ...prev,
               [field]: ''
           }));
       }
   };

   const handleSubmit = (e) => {
       e.preventDefault();
       
       // Validate entire form
       const formErrors = validateInstituteForm(formData);
       setErrors(formErrors);
       
       // Check if there are any errors
       if (Object.keys(formErrors).length > 0) {
           return;
       }
       
       onRegister(formData, 'Institute');
   };

   return (
       <div className="registration-form">
           <div className="quality-indicator">
               <p className="quality-message">{qualityMessage}</p>
               <div className="quality-bar-container">
                   <div 
                       className="quality-bar" 
                       style={{ 
                           width: formQuality + '%',
                           backgroundColor: formQuality < 30 ? '#ffd700' : 
                                         formQuality < 70 ? '#4863f7' : 
                                         '#28a745'
                       }}
                   ></div>
               </div>
           </div>

           <form className="form-fields" onSubmit={handleSubmit}>
               <div className="input-group">
                   <input 
                       type="text"
                       placeholder="Institute Name *"
                       value={formData.instituteName}
                       onChange={(e) => handleInputChange('instituteName', e.target.value)}
                       className={fieldErrors.instituteName || errors.instituteName ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.instituteName || errors.instituteName) && 
                       <span className="error-text">{fieldErrors.instituteName || errors.instituteName}</span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="email"
                       placeholder="Email *"
                       value={formData.email}
                       onChange={(e) => handleInputChange('email', e.target.value)}
                       className={fieldErrors.email || errors.email ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.email || errors.email) && 
                       <span className="error-text">{fieldErrors.email || errors.email}</span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="password"
                       placeholder="Password *"
                       value={formData.password}
                       onChange={(e) => handleInputChange('password', e.target.value)}
                       className={fieldErrors.password || errors.password ? 'error' : ''}
                       required
                   />
                   <PasswordStrength password={formData.password} />
                   {(fieldErrors.password || errors.password) && 
                       <span className="error-text">
                           {Array.isArray(errors.password) ? errors.password[0] : (fieldErrors.password || errors.password)}
                       </span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="password"
                       placeholder="Confirm Password *"
                       value={formData.confirmPassword}
                       onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                       className={fieldErrors.confirmPassword || errors.confirmPassword ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.confirmPassword || errors.confirmPassword) && 
                       <span className="error-text">{fieldErrors.confirmPassword || errors.confirmPassword}</span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="tel"
                       placeholder="Phone Number *"
                       value={formData.phoneNumber}
                       onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                       className={fieldErrors.phoneNumber || errors.phoneNumber ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.phoneNumber || errors.phoneNumber) && 
                       <span className="error-text">{fieldErrors.phoneNumber || errors.phoneNumber}</span>
                   }
               </div>

               <button type="submit" className="submit-btn">Register</button>
           </form>
       </div>
   );
};

// RecruiterRegistrationForm Component
const RecruiterRegistrationForm = ({ onRegister }) => {
   const [formData, setFormData] = useState({
       companyName: '',
       email: '',
       password: '',
       confirmPassword: '',
       phoneNumber: ''
   });
   const [formQuality, setFormQuality] = useState(0);
   const [qualityMessage, setQualityMessage] = useState("Start filling the form to become a recruiter!");
   const [errors, setErrors] = useState({});
   const [fieldErrors, setFieldErrors] = useState({});

   const updateQuality = (newFormData) => {
       let filledFields = 0;
       let totalFields = Object.keys(newFormData).length;
       
       Object.values(newFormData).forEach(value => {
           if(value && value.trim() !== '') {
               filledFields++;
           }
       });

       const quality = (filledFields / totalFields) * 100;
       setFormQuality(quality);

       if(quality === 0) {
           setQualityMessage("Start filling the form to become a recruiter!");
       } else if(quality < 50) {
           setQualityMessage("Good progress! Keep adding details!");
       } else if(quality < 80) {
           setQualityMessage("Almost there! Complete company profile!");
       } else {
           setQualityMessage("Excellent! Ready to start recruiting!");
       }
   };

   const handleInputChange = (field, value) => {
       const newFormData = { ...formData, [field]: value };
       setFormData(newFormData);
       updateQuality(newFormData);
       
       // Real-time validation
       const fieldErrors = validateFieldRealTime(field, value, newFormData);
       setFieldErrors(prev => ({
           ...prev,
           [field]: fieldErrors.length > 0 ? fieldErrors[0] : ''
       }));
       
       // Clear main errors if field is now valid
       if (fieldErrors.length === 0) {
           setErrors(prev => ({
               ...prev,
               [field]: ''
           }));
       }
   };

   const handleSubmit = (e) => {
       e.preventDefault();
       
       // Validate entire form
       const formErrors = validateRecruiterForm(formData);
       setErrors(formErrors);
       
       // Check if there are any errors
       if (Object.keys(formErrors).length > 0) {
           return;
       }
       
       onRegister(formData, 'Recruiter');
   };

   return (
       <div className="registration-form">
           <div className="quality-indicator">
               <p className="quality-message">{qualityMessage}</p>
               <div className="quality-bar-container">
                   <div 
                       className="quality-bar" 
                       style={{ 
                           width: formQuality + '%',
                           backgroundColor: formQuality < 30 ? '#ffd700' : 
                                         formQuality < 70 ? '#4863f7' : 
                                         '#28a745'
                       }}
                   ></div>
               </div>
           </div>

           <form className="form-fields" onSubmit={handleSubmit}>
               <div className="input-group">
                   <input 
                       type="text"
                       placeholder="Company Name *"
                       value={formData.companyName}
                       onChange={(e) => handleInputChange('companyName', e.target.value)}
                       className={fieldErrors.companyName || errors.companyName ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.companyName || errors.companyName) && 
                       <span className="error-text">{fieldErrors.companyName || errors.companyName}</span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="email"
                       placeholder="Email *"
                       value={formData.email}
                       onChange={(e) => handleInputChange('email', e.target.value)}
                       className={fieldErrors.email || errors.email ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.email || errors.email) && 
                       <span className="error-text">{fieldErrors.email || errors.email}</span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="password"
                       placeholder="Password *"
                       value={formData.password}
                       onChange={(e) => handleInputChange('password', e.target.value)}
                       className={fieldErrors.password || errors.password ? 'error' : ''}
                       required
                   />
                   <PasswordStrength password={formData.password} />
                   {(fieldErrors.password || errors.password) && 
                       <span className="error-text">
                           {Array.isArray(errors.password) ? errors.password[0] : (fieldErrors.password || errors.password)}
                       </span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="password"
                       placeholder="Confirm Password *"
                       value={formData.confirmPassword}
                       onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                       className={fieldErrors.confirmPassword || errors.confirmPassword ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.confirmPassword || errors.confirmPassword) && 
                       <span className="error-text">{fieldErrors.confirmPassword || errors.confirmPassword}</span>
                   }
               </div>

               <div className="input-group">
                   <input 
                       type="tel"
                       placeholder="Phone Number *"
                       value={formData.phoneNumber}
                       onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                       className={fieldErrors.phoneNumber || errors.phoneNumber ? 'error' : ''}
                       required
                   />
                   {(fieldErrors.phoneNumber || errors.phoneNumber) && 
                       <span className="error-text">{fieldErrors.phoneNumber || errors.phoneNumber}</span>
                   }
               </div>



               <button type="submit" className="submit-btn">Register</button>
           </form>
       </div>
   );
};

// Registration Request Form Component
const RegistrationRequestForm = ({ onSubmit, isSubmitting, error }) => {
   const [formData, setFormData] = useState({
       type: '',
       name: '',
       email: '',
       phoneNumber: ''
   });
   const [errors, setErrors] = useState({});

   const handleInputChange = (field, value) => {
       setFormData(prev => ({ ...prev, [field]: value }));
       // Clear error when user starts typing
       if (errors[field]) {
           setErrors(prev => ({ ...prev, [field]: '' }));
       }
   };

   const validateForm = () => {
       const newErrors = {};
       
       if (!formData.type) newErrors.type = 'Please select a type';
       if (!formData.name.trim()) newErrors.name = 'Name is required';
       if (!formData.email.trim()) newErrors.email = 'Email is required';
       else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
           newErrors.email = 'Invalid email format';
       }
       if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
       else if (!/^[0-9]{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
           newErrors.phoneNumber = 'Invalid phone number format';
       }
       
       setErrors(newErrors);
       return Object.keys(newErrors).length === 0;
   };

   const handleSubmit = (e) => {
       e.preventDefault();
       if (validateForm()) {
           onSubmit(formData);
       }
   };

   return (
       <div className="registration-form">
           <div className="request-message">
               <p>You can send a request to Staffinn. Staffinn will review your request, and once it is approved, you will receive your Institute/Recruiter ID and password on your email.</p>
           </div>
           
           {error && <div className="error-message">{error}</div>}
           
           <form className="form-fields" onSubmit={handleSubmit}>
               <div className="input-group">
                   <select 
                       value={formData.type}
                       onChange={(e) => handleInputChange('type', e.target.value)}
                       className={errors.type ? 'error' : ''}
                       required
                   >
                       <option value="">Select Type *</option>
                       <option value="institute">Institute</option>
                       <option value="recruiter">Recruiter</option>
                   </select>
                   {errors.type && <span className="error-text">{errors.type}</span>}
               </div>

               <div className="input-group">
                   <input 
                       type="text"
                       placeholder="Name *"
                       value={formData.name}
                       onChange={(e) => handleInputChange('name', e.target.value)}
                       className={errors.name ? 'error' : ''}
                       required
                   />
                   {errors.name && <span className="error-text">{errors.name}</span>}
               </div>

               <div className="input-group">
                   <input 
                       type="email"
                       placeholder="Email *"
                       value={formData.email}
                       onChange={(e) => handleInputChange('email', e.target.value)}
                       className={errors.email ? 'error' : ''}
                       required
                   />
                   {errors.email && <span className="error-text">{errors.email}</span>}
               </div>

               <div className="input-group">
                   <input 
                       type="tel"
                       placeholder="Phone Number *"
                       value={formData.phoneNumber}
                       onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                       className={errors.phoneNumber ? 'error' : ''}
                       required
                   />
                   {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
               </div>

               <button type="submit" className="submit-btn" disabled={isSubmitting}>
                   {isSubmitting ? 'Submitting...' : 'Submit Request'}
               </button>
           </form>
       </div>
   );
};

// Main RegistrationPopup Component
const RegistrationPopup = ({ onClose, onRegister, onLoginRedirect, showRequestForm = false }) => {
   const [selectedRole, setSelectedRole] = useState('Staff'); // Default to Staff
   const [isRegistering, setIsRegistering] = useState(false);
   const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
   const [registrationError, setRegistrationError] = useState('');
   const [requestError, setRequestError] = useState('');

   // Prevent body scroll when modal is open
   React.useEffect(() => {
       document.body.style.overflow = 'hidden';
       document.body.classList.add('modal-open');
       return () => {
           document.body.style.overflow = 'unset';
           document.body.classList.remove('modal-open');
       };
   }, []);

   const handleRegisterClick = (role) => {
       if (role === 'Staff') {
           setSelectedRole(role);
           setRegistrationError('');
       }
   };

   const handleRequestFormSubmit = async (requestData) => {
       setIsSubmittingRequest(true);
       setRequestError('');
       
       try {
           const result = await apiService.submitRegistrationRequest(requestData);
           
           if (result.success) {
               alert('Registration request submitted successfully! You will receive an email once your request is approved.');
               onClose();
           } else {
               setRequestError(result.message || 'Failed to submit request');
           }
       } catch (error) {
           console.error('Request submission error:', error);
           setRequestError('An error occurred while submitting your request');
       } finally {
           setIsSubmittingRequest(false);
       }
   };

   const handleRegister = async (userData, role) => {
       setIsRegistering(true);
       setRegistrationError('');
       
       try {
           // Register the user
           const result = await onRegister(userData, role);
           
           if (result) {
               // Redirect to login popup after successful registration
               if (onLoginRedirect) {
                   setTimeout(() => {
                       onLoginRedirect(userData.email);
                   }, 500);
               }
           } else {
               setRegistrationError('Registration failed. Please check your information and try again.');
           }
       } catch (error) {
           console.error('Registration error:', error);
           setRegistrationError('An error occurred during registration. Please try again.');
       } finally {
           setIsRegistering(false);
       }
   };

   const renderForm = () => {
       if (showRequestForm) {
           return (
               <RegistrationRequestForm 
                   onSubmit={handleRequestFormSubmit}
                   isSubmitting={isSubmittingRequest}
                   error={requestError}
               />
           );
       }
       
       if (selectedRole === 'Staff') {
           return (
               <>
                   {registrationError && <div className="error-message">{registrationError}</div>}
                   <StaffRegistrationForm onRegister={handleRegister} isRegistering={isRegistering} />
               </>
           );
       }
       
       // This should never be reached since we default to Staff
       return null;
   };

   return (
       <div className="registration-popup-overlay">
           <div className="registration-popup">
               <button className="close-btn" onClick={onClose}>✖</button>
               <h2 className="registration-title">
                   {showRequestForm ? 'Registration Request' : `Register as ${selectedRole}`}
               </h2>
               {renderForm()}

               {showRequestForm && (
                   <button className="back-btn" onClick={onClose}>
                       Back to Login
                   </button>
               )}
           </div>
       </div>
   );
};

export default RegistrationPopup;