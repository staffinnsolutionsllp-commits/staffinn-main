/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, X, Building2, Briefcase, ChevronDown, Info } from 'lucide-react';
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
    const [modalView, setModalView] = useState('login'); // 'login', 'registerStaff', 'registerPartner'
    const [registrationType, setRegistrationType] = useState('');
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    
    // OTP related states for staff registration
    const [otpSent, setOtpSent] = useState(false);
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
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
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            document.body.classList.add('modal-open');
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.body.classList.remove('modal-open');
        }
        
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
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
            setStaffFormData({
                fullName: '',
                email: '',
                password: '',
                confirmPassword: '',
                phoneNumber: ''
            });
        }, 300);
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

    const handleRequestFormClick = () => {
        setShowLoginModal(false);
        setShowRequestForm(true);
        if (onRegisterClick) {
            onRegisterClick(handleLoginRedirect, true);
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
                        <p>Complete your dashboard</p>
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
                                        
                                        <a href="#" className="forgot-password">Forgot password?</a>
                                        
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
                                    
                                    <form className="auth-form" onSubmit={(e) => {
                                        e.preventDefault();
                                        handleRegisterClick();
                                    }}>
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
                                    
                                    <form className="auth-form" onSubmit={(e) => {
                                        e.preventDefault();
                                        handleRequestFormClick();
                                    }}>
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
                                                required
                                            />
                                        </div>
                                        
                                        <div className="input-wrapper">
                                            <input
                                                type="email"
                                                placeholder="Email *"
                                                className="auth-input"
                                                required
                                            />
                                        </div>
                                        
                                        <div className="input-wrapper">
                                            <div className="phone-prefix">+91 🇮🇳</div>
                                            <input
                                                type="tel"
                                                placeholder="Phone Number *"
                                                className="auth-input phone-input"
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
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default Header;
