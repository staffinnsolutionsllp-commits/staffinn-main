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

// Main RegistrationPopup Component
const RegistrationPopup = ({ onClose, onRegister, onLoginRedirect }) => {
   const [selectedRole, setSelectedRole] = useState(null);
   const [isRegistering, setIsRegistering] = useState(false);
   const [registrationError, setRegistrationError] = useState('');

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
       setSelectedRole(role);
       setRegistrationError('');
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
       switch(selectedRole) {
           case 'Staff':
               return (
                   <>
                       {registrationError && <div className="error-message">{registrationError}</div>}
                       <StaffRegistrationForm onRegister={handleRegister} isRegistering={isRegistering} />
                   </>
               );
           case 'Institute':
               return (
                   <>
                       {registrationError && <div className="error-message">{registrationError}</div>}
                       <InstituteRegistrationForm onRegister={handleRegister} isRegistering={isRegistering} />
                   </>
               );
           case 'Recruiter':
               return (
                   <>
                       {registrationError && <div className="error-message">{registrationError}</div>}
                       <RecruiterRegistrationForm onRegister={handleRegister} isRegistering={isRegistering} />
                   </>
               );
           default:
               return (
                   <div className="registration-cards">
                       <div className="registration-card" onClick={() => handleRegisterClick('Staff')}>
                           <img src='/job.jpg' alt="Job Seeker" />
                           <h3>Register as Staff</h3>
                       </div>
                       <div className="registration-card" onClick={() => handleRegisterClick('Recruiter')}>
                           <img src='/recruiter.jpg' alt="Recruiter" />
                           <h3>Register as Recruiter</h3>
                       </div>
                       <div className="registration-card" onClick={() => handleRegisterClick('Institute')}>
                           <img src='/institute.jpg' alt="Institute" />
                           <h3>Register as Institute</h3>
                       </div>
                   </div>
               );
       }
   };

   return (
       <div className="registration-popup-overlay">
           <div className="registration-popup">
               <button className="close-btn" onClick={onClose}>✖</button>
               <h2 className="registration-title">
                   {selectedRole ? `Register as ${selectedRole}` : 'Registration'}
               </h2>
               {renderForm()}
               {selectedRole && (
                   <button className="back-btn" onClick={() => setSelectedRole(null)}>
                       Back to Selection
                   </button>
               )}
           </div>
       </div>
   );
};

export default RegistrationPopup;