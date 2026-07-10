/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, X, Building2, Briefcase, ChevronDown, Info, KeyRound, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';
import { assets } from "../../assets/assets";
import { AuthContext } from '../../context/AuthContext';
import useProfilePhotoSync from '../../hooks/useProfilePhotoSync';
import NotificationBell from './NotificationBell';
import apiService from '../../services/api';
import './Header.css';
import './AuthModal.css';

function Header({ onLoginClick, onRegisterClick, isLoggedIn, onLogout, currentUser, showLoginModal, setShowLoginModal }) {
    const { currentUser: contextUser, refreshUserProfile } = useContext(AuthContext);
    useProfilePhotoSync();
    const [showRequestForm, setShowRequestForm] = useState(false);
    
    const activeUser = contextUser || currentUser;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDashboardMessage, setShowDashboardMessage] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    
    // New state for modal views
    const [modalView, setModalView] = useState('login'); // 'login', 'registerStaff', 'registerPartner', 'forgotPassword'
    const [registrationType, setRegistrationType] = useState('');
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [partnerFormData, setPartnerFormData] = useState({
        name: '',
        email: '',
        phoneNumber: ''
    });
    
    // Forgot Password states
    const [forgotPasswordStep, setForgotPasswordStep] = useState('email'); // 'email', 'otp', 'newPassword', 'success'
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtpValues, setResetOtpValues] = useState(['', '', '', '', '', '']);
    const [resetOtpError, setResetOtpError] = useState('');
    const [isVerifyingResetOtp, setIsVerifyingResetOtp] = useState(false);
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [otpExpiryTime, setOtpExpiryTime] = useState(null);
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [canResendOtp, setCanResendOtp] = useState(false);
    const [isResendingOtp, setIsResendingOtp] = useState(false);
    
    // OTP related states for staff registration
    const [otpSent, setOtpSent] = useState(false);
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [staffFormData, setStaffFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: ''
    });
    
    const navigate = useNavigate();
    const location = useLocation();
    
    const handleLoginRedirect = (registeredEmail) => {
        setShowLoginModal(true);
        setEmail(registeredEmail || '');
        setLoginError('Registration successful! Please sign in with your credentials.');
    };
    
    useEffect(() => {
        if (isLoggedIn && currentUser) {
            setShowDashboardMessage(true);
            setTimeout(() => {
                setShowDashboardMessage(false);
            }, 5000);
        }
    }, [isLoggedIn, currentUser]);

    useEffect(() => {
        const isDashboardPage = location.pathname.includes('/dashboard');
        
        if (isDashboardPage) {
            setIsHeaderVisible(true);
            return;
        }
        
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY && currentScrollY > 150) {
                setIsHeaderVisible(false);
            } else if (currentScrollY < lastScrollY) {
                setIsHeaderVisible(true);
            }
            
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY, location.pathname]);

    useEffect(() => {
        if (showLoginModal) {
            // Lenis hides the native scrollbar so scrollbarWidth is 0 — use a fixed compensation
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        } else {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
        
        return () => {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        };
    }, [showLoginModal]);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const success = await onLoginClick(email, password);
            
            if (success) {
                setLoginError('');
                setShowLoginModal(false);
                setEmail('');
                setPassword('');
                
                setShowDashboardMessage(true);
                setTimeout(() => {
                    setShowDashboardMessage(false);
                }, 5000);
                
                const userStr = sessionStorage.getItem('currentUser');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const role = user.role ? user.role.toLowerCase() : 'staff';
                    switch(role) {
                        case 'staff':
                            navigate('/dashboard/staff');
                            break;
                        case 'recruiter':
                            navigate('/dashboard/recruiter');
                            break;
                        case 'institute':
                            navigate('/dashboard/institute');
                            break;
                        default:
                            navigate('/dashboard/staff');
                    }
                }
            } else {
                setLoginError('Invalid credentials. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoginError('Login failed. Please try again.');
        }
    };

    const goToDashboard = () => {
        const userStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (!userStr) return;
        
        const user = JSON.parse(userStr);
        const role = user.role ? user.role.toLowerCase() : 'staff';
        
        switch(role) {
            case 'staff':
                navigate('/dashboard/staff');
                break;
            case 'recruiter':
                navigate('/dashboard/recruiter');
                break;
            case 'institute':
                navigate('/dashboard/institute');
                break;
            default:
                navigate('/dashboard/staff');
        }
        setShowDropdown(false);
    };

    const goToHomePage = () => {
        navigate('/'); 
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeLoginModal = () => {
        setShowLoginModal(false);
        setEmail('');
        setPassword('');
        setLoginError('');
        // Reset to login view when closing
        setTimeout(() => {
            setModalView('login');
            // Reset OTP states
            setOtpSent(false);
            setOtpValues(['', '', '', '', '', '']);
            setOtpError('');
            setOtpVerified(false);
            setStaffFormData({
                fullName: '',
                email: '',
                password: '',
                confirmPassword: '',
                phoneNumber: ''
            });
            // Reset Forgot Password states
            resetForgotPasswordState();
        }, 300);
    };

    const resetForgotPasswordState = () => {
        setForgotPasswordStep('email');
        setResetEmail('');
        setResetOtpValues(['', '', '', '', '', '']);
        setResetOtpError('');
        setIsVerifyingResetOtp(false);
        setResetToken('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowNewPassword(false);
        setShowConfirmNewPassword(false);
        setOtpExpiryTime(null);
        setOtpCountdown(0);
        setCanResendOtp(false);
        setIsResendingOtp(false);
    };

    const handleLogoutClick = () => {
        onLogout();
        setShowDropdown(false);
        navigate('/');
    };
    
    const handleRegisterClick = () => {
        setShowLoginModal(false);
        setShowRequestForm(false);
        if (onRegisterClick) {
            onRegisterClick(handleLoginRedirect);
        }
    };

    const handlePartnerRegistrationRequest = async (e) => {
        e.preventDefault();
        
        if (!registrationType) {
            alert('Please select registration type (Institute or Recruiter)');
            return;
        }
        
        if (partnerFormData.phoneNumber.length !== 10) {
            alert('Please enter valid 10-digit phone number');
            return;
        }
        
        try {
            const requestData = {
                type: registrationType,
                name: partnerFormData.name,
                email: partnerFormData.email,
                phoneNumber: partnerFormData.phoneNumber
            };
            
            console.log('Submitting registration request:', requestData);
            const response = await apiService.submitRegistrationRequest(requestData);
            
            if (response.success) {
                alert('Registration request submitted successfully! You will receive login credentials via email within 24-48 hours.');
                // Reset form
                setPartnerFormData({
                    name: '',
                    email: '',
                    phoneNumber: ''
                });
                setRegistrationType('');
                setModalView('login');
            } else {
                alert(response.message || 'Failed to submit registration request');
            }
        } catch (error) {
            console.error('Registration request error:', error);
            alert('Failed to submit registration request. Please try again.');
        }
    };
    
    // OTP handling functions
    const handleSendOtp = async () => {
        if (!staffFormData.email) {
            setOtpError('Please enter email first');
            return;
        }
        
        try {
            // Call OTP API using apiService
            const data = await apiService.sendOTP(staffFormData.email);
            
            if (data.success) {
                setOtpSent(true);
                setOtpError('');
                alert('OTP sent to your email!');
            } else {
                setOtpError(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Send OTP Error:', error);
            setOtpError('Error sending OTP');
        }
    };
    
    const handleOtpChange = (index, value) => {
        // Only allow numbers
        if (value && !/^[0-9]$/.test(value)) return;
        
        const newOtpValues = [...otpValues];
        newOtpValues[index] = value;
        setOtpValues(newOtpValues);
        
        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };
    
    const handleOtpKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };
    
    const handleVerifyOtp = async () => {
        const otpString = otpValues.join('');
        
        if (otpString.length !== 6) {
            setOtpError('Please enter complete 6-digit OTP');
            return;
        }
        
        setIsVerifyingOtp(true);
        setOtpError('');
        
        try {
            const data = await apiService.verifyOTP(staffFormData.email, otpString);
            
            if (data.success) {
                setOtpError('');
                setOtpVerified(true);
                alert('OTP verified successfully!');
            } else {
                setOtpError(data.message || 'Invalid OTP');
                setOtpVerified(false);
            }
        } catch (error) {
            console.error('Verify OTP Error:', error);
            setOtpError('Error verifying OTP');
            setOtpVerified(false);
        } finally {
            setIsVerifyingOtp(false);
        }
    };
    
    const handleStaffRegistration = async (e) => {
        e.preventDefault();
        
        // Validate OTP is verified
        if (!otpVerified) {
            setOtpError('Please verify OTP first by clicking "Verify OTP" button');
            return;
        }
        
        // Validate passwords match
        if (staffFormData.password !== staffFormData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        // Validate phone number
        if (staffFormData.phoneNumber.length !== 10) {
            alert('Please enter valid 10-digit phone number');
            return;
        }
        
        try {
            // Proceed with registration (OTP already verified)
            const registrationData = {
                fullName: staffFormData.fullName,
                email: staffFormData.email,
                password: staffFormData.password,
                phoneNumber: staffFormData.phoneNumber,
                role: 'staff'
            };
            
            const response = await apiService.register(registrationData, 'staff');
            
            if (response.success) {
                alert('Registration successful! Please login with your credentials.');
                // Reset form and switch to login
                setStaffFormData({
                    fullName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    phoneNumber: ''
                });
                setOtpSent(false);
                setOtpValues(['', '', '', '', '', '']);
                setOtpVerified(false);
                setModalView('login');
                setEmail(staffFormData.email);
            } else {
                alert(response.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration Error:', error);
            alert('Registration failed. Please try again.');
        }
    };

    // Forgot Password Functions
    const handleForgotPasswordClick = () => {
        setModalView('forgotPassword');
        setForgotPasswordStep('email');
        resetForgotPasswordState();
    };

    const handleSendResetCode = async (e) => {
        e.preventDefault();
        
        if (!resetEmail) {
            setResetOtpError('Please enter your email address');
            return;
        }
        
        try {
            setResetOtpError('');
            const response = await apiService.sendPasswordResetOTP(resetEmail);
            
            if (response.success) {
                setForgotPasswordStep('otp');
                // Set expiry time (10 minutes from now)
                const expiryTime = Date.now() + (10 * 60 * 1000);
                setOtpExpiryTime(expiryTime);
                setOtpCountdown(600); // 10 minutes in seconds
                setCanResendOtp(false);
            } else {
                setResetOtpError(response.message || 'Failed to send reset code');
            }
        } catch (error) {
            console.error('Send reset code error:', error);
            setResetOtpError('Failed to send reset code. Please try again.');
        }
    };

    const handleResetOtpChange = (index, value) => {
        // Only allow numbers
        if (value && !/^[0-9]$/.test(value)) return;
        
        const newOtpValues = [...resetOtpValues];
        newOtpValues[index] = value;
        setResetOtpValues(newOtpValues);
        
        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`reset-otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleResetOtpKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !resetOtpValues[index] && index > 0) {
            const prevInput = document.getElementById(`reset-otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleVerifyResetOtp = async () => {
        const otpString = resetOtpValues.join('');
        
        if (otpString.length !== 6) {
            setResetOtpError('Please enter complete 6-digit code');
            return;
        }
        
        setIsVerifyingResetOtp(true);
        setResetOtpError('');
        
        try {
            const response = await apiService.verifyPasswordResetOTP(resetEmail, otpString);
            
            console.log('✅ Verify OTP Response:', response);
            
            if (response.success) {
                // Extract resetToken from response.data
                const token = response.data?.resetToken || response.resetToken;
                console.log('🔑 Reset Token:', token);
                
                if (!token) {
                    setResetOtpError('Failed to get reset token. Please try again.');
                    return;
                }
                
                setResetToken(token);
                setForgotPasswordStep('newPassword');
                setResetOtpError('');
            } else {
                setResetOtpError(response.message || 'Invalid code. Please try again.');
            }
        } catch (error) {
            console.error('Verify reset OTP error:', error);
            setResetOtpError('Failed to verify code. Please try again.');
        } finally {
            setIsVerifyingResetOtp(false);
        }
    };

    const handleResendResetCode = async () => {
        if (!canResendOtp || isResendingOtp) return;
        
        setIsResendingOtp(true);
        setResetOtpError('');
        
        try {
            const response = await apiService.resendPasswordResetOTP(resetEmail);
            
            if (response.success) {
                // Reset OTP inputs
                setResetOtpValues(['', '', '', '', '', '']);
                // Reset timer
                const expiryTime = Date.now() + (10 * 60 * 1000);
                setOtpExpiryTime(expiryTime);
                setOtpCountdown(600);
                setCanResendOtp(false);
                // Focus first input
                const firstInput = document.getElementById('reset-otp-0');
                if (firstInput) firstInput.focus();
            } else {
                setResetOtpError(response.message || 'Failed to resend code');
            }
        } catch (error) {
            console.error('Resend reset code error:', error);
            setResetOtpError('Failed to resend code. Please try again.');
        } finally {
            setIsResendingOtp(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        console.log('🔍 Reset Password Debug:');
        console.log('Email:', resetEmail);
        console.log('Reset Token:', resetToken);
        console.log('New Password:', newPassword ? '***' : 'EMPTY');
        
        // Validate passwords
        if (!newPassword || !confirmNewPassword) {
            setResetOtpError('Please enter both password fields');
            return;
        }
        
        if (newPassword.length < 6) {
            setResetOtpError('Password must be at least 6 characters long');
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            setResetOtpError('Passwords do not match');
            return;
        }
        
        // Check if email and token exist
        if (!resetEmail) {
            setResetOtpError('Email is missing. Please start over.');
            console.error('❌ Reset email is empty!');
            return;
        }
        
        if (!resetToken) {
            setResetOtpError('Reset token is missing. Please verify OTP again.');
            console.error('❌ Reset token is empty!');
            return;
        }
        
        setResetOtpError('');
        
        try {
            console.log('📤 Sending reset password request...');
            const response = await apiService.resetPassword(resetEmail, resetToken, newPassword);
            console.log('📥 Response:', response);
            
            if (response.success) {
                setForgotPasswordStep('success');
                // Auto redirect to login after 3 seconds
                setTimeout(() => {
                    setModalView('login');
                    resetForgotPasswordState();
                    setEmail(resetEmail);
                }, 3000);
            } else {
                setResetOtpError(response.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            setResetOtpError('Failed to reset password. Please try again.');
        }
    };

    // OTP Countdown Timer
    useEffect(() => {
        if (forgotPasswordStep === 'otp' && otpCountdown > 0) {
            const timer = setInterval(() => {
                setOtpCountdown(prev => {
                    if (prev <= 1) {
                        setCanResendOtp(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            
            return () => clearInterval(timer);
        }
    }, [forgotPasswordStep, otpCountdown]);

    // Format countdown time
    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <header className={`header ${isHeaderVisible ? 'header-visible' : 'header-hidden'}`}>
                <div className="header-container">
                    <div className="logo" onClick={goToHomePage}>
                        <img src={assets.Logo} alt="STAFFINN" className="logo-image" />
                    </div>

                    <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    <nav className={`nav-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                        <ul className="nav-list">
                            <li><Link to="/staff" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}><span className="first-letter-orange">S</span>taff</Link></li>
                            <li><Link to="/institute" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}><span className="first-letter-blue">I</span>nstitute</Link></li>
                            <li><a href="/recruiter" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}><span className="first-letter-green">R</span>ecruiter</a></li>
                            <li><Link to="/news" className="news-btn" onClick={() => setIsMobileMenuOpen(false)}>News</Link></li>
                        </ul>
                    </nav>

                    <div className="auth-buttons">
                        {isLoggedIn ? (
                            <div className="profile-section">
                                <NotificationBell isLoggedIn={isLoggedIn} />
                                <div className="profile-image-wrapper" onClick={() => setShowDropdown(!showDropdown)}>
                                    <span className="profile-name">My Profile</span>
                                </div>
                                <div className={`profile-dropdown ${showDropdown ? 'show' : ''}`}>
                                    <a href="#" className="dropdown-item" onClick={goToDashboard}>
                                        My Dashboard
                                    </a>
                                    <a href="#" className="dropdown-item logout" onClick={handleLogoutClick}>
                                        Logout
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <button className="login-btn" onClick={() => setShowLoginModal(true)}>Sign In</button>
                        )}
                    </div>
                </div>
                
                {loginError && (
                    <div className="login-error-toast">
                        <p>{loginError}</p>
                        {(loginError.includes('not found') || loginError.includes('Invalid')) && (
                            <p className="register-link">
                                New user? <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setShowLoginModal(false);
                                    setLoginError('');
                                    onRegisterClick();
                                }}>Register here</a>
                            </p>
                        )}
                    </div>
                )}
                
                {isLoggedIn && showDashboardMessage && (
                    <div className="dashboard-message">
                        <div className="dashboard-message-arrow"></div>
                        <div className="dashboard-message-content">
                            <span className="dashboard-message-icon">👆</span>
                            <div>
                                <p className="dashboard-message-title">Complete your profile</p>
                                <p className="dashboard-message-sub">Click <strong>My Profile</strong> to set up your dashboard</p>
                            </div>
                        </div>
                    </div>
                )}
            </header>
            
            {showLoginModal && createPortal(
                <div className="auth-modal-backdrop" onClick={closeLoginModal}>
                    <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
                        {/* Left Panel */}
                        <div className={`auth-modal-left ${modalView === 'registerPartner' ? 'green-gradient' : 'blue-gradient'}`}>
                            {/* Floating decorative circles */}
                            <div className="floating-circle circle-1"></div>
                            <div className="floating-circle circle-2"></div>
                            <div className="floating-circle circle-3"></div>
                            <div className="floating-circle circle-4"></div>
                            
                            <div className="auth-modal-left-content">
                                {modalView === 'login' && (
                                    <>
                                        <h3 className="brand-name">Staffinn</h3>
                                        <h2 className="welcome-title">Hello, Welcome!</h2>
                                        <div className="title-divider"></div>
                                        <p className="welcome-subtitle">Don't have an account?</p>
                                        <button className="outline-btn" onClick={() => setModalView('registerStaff')}>
                                            REGISTER
                                        </button>
                                        <p className="or-text">or</p>
                                        <button className="outline-btn-green" onClick={() => setModalView('registerPartner')}>
                                            Register as Institute / Recruiter
                                        </button>
                                    </>
                                )}
                                
                                {modalView === 'registerStaff' && (
                                    <>
                                        <h3 className="brand-name">Staffinn</h3>
                                        <h2 className="welcome-title">Welcome Back!</h2>
                                        <div className="title-divider"></div>
                                        <p className="welcome-subtitle">Already have an account?</p>
                                        <button className="outline-btn" onClick={() => setModalView('login')}>
                                            SIGN IN
                                        </button>
                                        <p className="or-text">or</p>
                                        <button className="outline-btn-green" onClick={() => setModalView('registerPartner')}>
                                            Register as Institute / Recruiter
                                        </button>
                                    </>
                                )}
                                
                                {modalView === 'registerPartner' && (
                                    <>
                                        <Building2 className="partner-icon" size={48} />
                                        <h2 className="welcome-title">Join as a Partner</h2>
                                        <p className="partner-subtitle">
                                            Institutes & Recruiters get verified accounts after approval.
                                        </p>
                                        <div className="info-box">
                                            <Info size={18} />
                                            <p>
                                                Staffinn will review your request and send login credentials to 
                                                your email within 24-48 hours.
                                            </p>
                                        </div>
                                        <button className="text-link" onClick={() => setModalView('login')}>
                                            Back to Login
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Right Panel */}
                        <div className="auth-modal-right">
                            <button className="modal-close-btn" onClick={closeLoginModal} aria-label="Close">
                                <X size={22} />
                            </button>
                            
                            {/* Login View */}
                            {modalView === 'login' && (
                                <div className="auth-form-content">
                                    <h2 className="form-title">Login</h2>
                                    <div className="title-divider-line"></div>
                                    <p className="form-subtitle">Please enter your details</p>
                                    
                                    <form onSubmit={handleLogin} className="auth-form">
                                        <div className="input-wrapper">
                                            <Mail className="input-icon-left" size={20} />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="auth-input"
                                                required
                                            />
                                        </div>
                                        
                                        <div className="input-wrapper">
                                            <Lock className="input-icon-left" size={20} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="auth-input"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        
                                        <a href="#" className="forgot-password" onClick={(e) => {
                                            e.preventDefault();
                                            handleForgotPasswordClick();
                                        }}>Forgot password?</a>
                                        
                                        <button type="submit" className="submit-btn">
                                            LOGIN
                                        </button>
                                    </form>
                                    
                                    {/* Mobile only buttons */}
                                    <div className="mobile-only-actions">
                                        <div className="mobile-divider">
                                            <span>new to staffinn?</span>
                                        </div>
                                        <button className="mobile-outline-btn" onClick={() => setModalView('registerStaff')}>
                                            REGISTER
                                        </button>
                                        <button className="mobile-outline-btn-green" onClick={() => setModalView('registerPartner')}>
                                            Register as Institute / Recruiter
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Register as Staff View */}
                            {modalView === 'registerStaff' && (
                                <div className="auth-form-content">
                                    <h2 className="form-title">Register as Staff</h2>
                                    <p className="form-subtitle">Start filling the form to become a quality staff member!</p>
                                    
                                    <form className="auth-form" onSubmit={handleStaffRegistration}>
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                placeholder="Full Name *"
                                                className="auth-input"
                                                value={staffFormData.fullName}
                                                onChange={(e) => setStaffFormData({...staffFormData, fullName: e.target.value})}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="input-row">
                                            <div className="input-wrapper flex-grow">
                                                <input
                                                    type="email"
                                                    placeholder="Email *"
                                                    className="auth-input"
                                                    value={staffFormData.email}
                                                    onChange={(e) => setStaffFormData({...staffFormData, email: e.target.value})}
                                                    disabled={otpSent}
                                                    required
                                                />
                                            </div>
                                            {!otpSent && (
                                                <button type="button" className="send-otp-btn" onClick={handleSendOtp}>
                                                    Send OTP
                                                </button>
                                            )}
                                        </div>
                                        
                                        {otpSent && (
                                            <>
                                                <div className="otp-success-message">
                                                    OTP sent! Check your email ✓
                                                </div>
                                                <div className="otp-inputs-container">
                                                    {otpValues.map((value, index) => (
                                                        <input
                                                            key={index}
                                                            id={`otp-${index}`}
                                                            type="text"
                                                            maxLength="1"
                                                            className="otp-input"
                                                            value={value}
                                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                        />
                                                    ))}
                                                </div>
                                                {otpError && <div className="otp-error-message">{otpError}</div>}
                                                <button 
                                                    type="button" 
                                                    className={`verify-otp-btn ${otpVerified ? 'verified' : ''}`}
                                                    onClick={handleVerifyOtp}
                                                    disabled={isVerifyingOtp || otpValues.join('').length !== 6 || otpVerified}
                                                >
                                                    {otpVerified ? '✓ Verified' : (isVerifyingOtp ? 'Verifying...' : 'Verify OTP')}
                                                </button>
                                            </>
                                        )}
                                        
                                        <div className="input-wrapper">
                                            <Lock className="input-icon-left" size={20} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password *"
                                                className="auth-input"
                                                value={staffFormData.password}
                                                onChange={(e) => setStaffFormData({...staffFormData, password: e.target.value})}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        
                                        <div className="input-wrapper">
                                            <Lock className="input-icon-left" size={20} />
                                            <input
                                                type="password"
                                                placeholder="Confirm Password *"
                                                className="auth-input"
                                                value={staffFormData.confirmPassword}
                                                onChange={(e) => setStaffFormData({...staffFormData, confirmPassword: e.target.value})}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="input-wrapper">
                                            <div className="phone-prefix">+91 🇮🇳</div>
                                            <input
                                                type="tel"
                                                placeholder="Phone Number *"
                                                className="auth-input phone-input"
                                                value={staffFormData.phoneNumber}
                                                onChange={(e) => setStaffFormData({...staffFormData, phoneNumber: e.target.value})}
                                                required
                                            />
                                        </div>
                                        
                                        <button type="submit" className="submit-btn dark">
                                            Register
                                        </button>
                                    </form>
                                </div>
                            )}
                            
                            {/* Registration Request View */}
                            {modalView === 'registerPartner' && (
                                <div className="auth-form-content">
                                    <h2 className="form-title">Registration Request</h2>
                                    
                                    <div className="info-banner">
                                        <Info size={18} />
                                        <p>
                                            You can send a request to Staffinn. Once approved, 
                                            you will receive your Institute/Recruiter ID and password on your email.
                                        </p>
                                    </div>
                                    
                                    <form className="auth-form" onSubmit={handlePartnerRegistrationRequest}>
                                        <div className="custom-dropdown" onClick={() => setShowTypeDropdown(!showTypeDropdown)}>
                                            <input
                                                type="text"
                                                placeholder="Select Type *"
                                                value={registrationType}
                                                className="auth-input dropdown-input"
                                                readOnly
                                                required
                                            />
                                            <ChevronDown className={`dropdown-icon ${showTypeDropdown ? 'rotate' : ''}`} size={20} />
                                            
                                            {showTypeDropdown && (
                                                <div className="auth-dropdown-menu">
                                                    <div 
                                                        className={`auth-dropdown-item ${registrationType === 'Institute' ? 'selected' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRegistrationType('Institute');
                                                            setShowTypeDropdown(false);
                                                        }}
                                                    >
                                                        <Building2 size={18} />
                                                        <span>Institute</span>
                                                        {registrationType === 'Institute' && <span className="checkmark">✓</span>}
                                                    </div>
                                                    <div 
                                                        className={`auth-dropdown-item ${registrationType === 'Recruiter' ? 'selected' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRegistrationType('Recruiter');
                                                            setShowTypeDropdown(false);
                                                        }}
                                                    >
                                                        <Briefcase size={18} />
                                                        <span>Recruiter</span>
                                                        {registrationType === 'Recruiter' && <span className="checkmark">✓</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                placeholder="Name *"
                                                className="auth-input"
                                                value={partnerFormData.name}
                                                onChange={(e) => setPartnerFormData({...partnerFormData, name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="input-wrapper">
                                            <input
                                                type="email"
                                                placeholder="Email *"
                                                className="auth-input"
                                                value={partnerFormData.email}
                                                onChange={(e) => setPartnerFormData({...partnerFormData, email: e.target.value})}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="input-wrapper">
                                            <div className="phone-prefix">+91 🇮🇳</div>
                                            <input
                                                type="tel"
                                                placeholder="Phone Number *"
                                                className="auth-input phone-input"
                                                value={partnerFormData.phoneNumber}
                                                onChange={(e) => setPartnerFormData({...partnerFormData, phoneNumber: e.target.value})}
                                                maxLength="10"
                                                pattern="[0-9]{10}"
                                                required
                                            />
                                        </div>
                                        
                                        <button type="submit" className="submit-btn dark">
                                            Submit Request
                                        </button>
                                        
                                        <button type="button" className="back-link" onClick={() => setModalView('login')}>
                                            Back to Login
                                        </button>
                                    </form>
                                </div>
                            )}
                            
                            {/* Forgot Password Views */}
                            {modalView === 'forgotPassword' && (
                                <div className="auth-form-content">
                                    {/* Step 1: Email Input */}
                                    {forgotPasswordStep === 'email' && (
                                        <>
                                            <div className="forgot-password-header">
                                                <KeyRound className="forgot-icon" size={48} />
                                                <h2 className="form-title">Forgot Password?</h2>
                                                <div className="title-divider-line"></div>
                                                <p className="form-subtitle">Enter your email to receive a password reset code</p>
                                            </div>
                                            
                                            <form onSubmit={handleSendResetCode} className="auth-form">
                                                <div className="input-wrapper">
                                                    <Mail className="input-icon-left" size={20} />
                                                    <input
                                                        type="email"
                                                        placeholder="Email Address"
                                                        value={resetEmail}
                                                        onChange={(e) => setResetEmail(e.target.value)}
                                                        className="auth-input"
                                                        required
                                                        autoFocus
                                                    />
                                                </div>
                                                
                                                {resetOtpError && (
                                                    <div className="otp-error-message">{resetOtpError}</div>
                                                )}
                                                
                                                <button type="submit" className="submit-btn">
                                                    Send Reset Code
                                                </button>
                                                
                                                <button 
                                                    type="button" 
                                                    className="back-link"
                                                    onClick={() => setModalView('login')}
                                                >
                                                    <ArrowLeft size={16} /> Back to Login
                                                </button>
                                            </form>
                                        </>
                                    )}
                                    
                                    {/* Step 2: OTP Verification */}
                                    {forgotPasswordStep === 'otp' && (
                                        <>
                                            <div className="forgot-password-header">
                                                <Mail className="forgot-icon" size={48} />
                                                <h2 className="form-title">Verify Reset Code</h2>
                                                <div className="title-divider-line"></div>
                                                <p className="form-subtitle">
                                                    Enter the 6-digit code sent to<br />
                                                    <strong>{resetEmail}</strong>
                                                </p>
                                            </div>
                                            
                                            <div className="auth-form">
                                                <div className="otp-inputs-container">
                                                    {resetOtpValues.map((value, index) => (
                                                        <input
                                                            key={index}
                                                            id={`reset-otp-${index}`}
                                                            type="text"
                                                            maxLength="1"
                                                            className="otp-input"
                                                            value={value}
                                                            onChange={(e) => handleResetOtpChange(index, e.target.value)}
                                                            onKeyDown={(e) => handleResetOtpKeyDown(index, e)}
                                                            autoFocus={index === 0}
                                                        />
                                                    ))}
                                                </div>
                                                
                                                {otpCountdown > 0 && (
                                                    <div className="otp-timer">
                                                        <Clock size={16} />
                                                        <span>Code expires in: {formatCountdown(otpCountdown)}</span>
                                                    </div>
                                                )}
                                                
                                                {resetOtpError && (
                                                    <div className="otp-error-message">{resetOtpError}</div>
                                                )}
                                                
                                                <button 
                                                    type="button" 
                                                    className="verify-otp-btn"
                                                    onClick={handleVerifyResetOtp}
                                                    disabled={isVerifyingResetOtp || resetOtpValues.join('').length !== 6}
                                                >
                                                    {isVerifyingResetOtp ? 'Verifying...' : 'Verify Code'}
                                                </button>
                                                
                                                <div className="resend-otp-section">
                                                    {canResendOtp ? (
                                                        <button 
                                                            type="button"
                                                            className="resend-link"
                                                            onClick={handleResendResetCode}
                                                            disabled={isResendingOtp}
                                                        >
                                                            {isResendingOtp ? 'Sending...' : 'Resend Code'}
                                                        </button>
                                                    ) : (
                                                        <span className="resend-disabled">Didn't receive code? Wait {formatCountdown(otpCountdown)}</span>
                                                    )}
                                                </div>
                                                
                                                <button 
                                                    type="button" 
                                                    className="back-link"
                                                    onClick={() => {
                                                        setForgotPasswordStep('email');
                                                        setResetOtpValues(['', '', '', '', '', '']);
                                                        setResetOtpError('');
                                                    }}
                                                >
                                                    <ArrowLeft size={16} /> Change Email
                                                </button>
                                            </div>
                                        </>
                                    )}
                                    
                                    {/* Step 3: New Password */}
                                    {forgotPasswordStep === 'newPassword' && (
                                        <>
                                            <div className="forgot-password-header">
                                                <Lock className="forgot-icon" size={48} />
                                                <h2 className="form-title">Reset Password</h2>
                                                <div className="title-divider-line"></div>
                                                <p className="form-subtitle">Create your new password</p>
                                            </div>
                                            
                                            <form onSubmit={handleResetPassword} className="auth-form">
                                                <div className="input-wrapper">
                                                    <Lock className="input-icon-left" size={20} />
                                                    <input
                                                        type={showNewPassword ? "text" : "password"}
                                                        placeholder="New Password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="auth-input"
                                                        required
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        className="password-toggle"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                    >
                                                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                                
                                                <div className="input-wrapper">
                                                    <Lock className="input-icon-left" size={20} />
                                                    <input
                                                        type={showConfirmNewPassword ? "text" : "password"}
                                                        placeholder="Confirm New Password"
                                                        value={confirmNewPassword}
                                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                        className="auth-input"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="password-toggle"
                                                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                    >
                                                        {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                                
                                                <div className="password-requirements">
                                                    <p className="requirements-title">Password Requirements:</p>
                                                    <ul className="requirements-list">
                                                        <li className={newPassword.length >= 6 ? 'valid' : ''}>
                                                            {newPassword.length >= 6 ? '✓' : '○'} At least 6 characters
                                                        </li>
                                                        <li className={newPassword && confirmNewPassword && newPassword === confirmNewPassword ? 'valid' : ''}>
                                                            {newPassword && confirmNewPassword && newPassword === confirmNewPassword ? '✓' : '○'} Passwords match
                                                        </li>
                                                    </ul>
                                                </div>
                                                
                                                {resetOtpError && (
                                                    <div className="otp-error-message">{resetOtpError}</div>
                                                )}
                                                
                                                <button type="submit" className="submit-btn">
                                                    Reset Password
                                                </button>
                                            </form>
                                        </>
                                    )}
                                    
                                    {/* Step 4: Success */}
                                    {forgotPasswordStep === 'success' && (
                                        <div className="forgot-password-success">
                                            <CheckCircle2 className="success-icon" size={80} />
                                            <h2 className="success-title">Password Reset Successful!</h2>
                                            <p className="success-message">
                                                Your password has been successfully reset.<br />
                                                You can now login with your new password.
                                            </p>
                                            <button 
                                                className="submit-btn"
                                                onClick={() => {
                                                    setModalView('login');
                                                    resetForgotPasswordState();
                                                    setEmail(resetEmail);
                                                }}
                                            >
                                                Go to Login
                                            </button>
                                            <p className="auto-redirect">Redirecting automatically in 3 seconds...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default Header;
