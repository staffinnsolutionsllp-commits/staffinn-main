/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { AuthContext } from '../../context/AuthContext';
import useProfilePhotoSync from '../../hooks/useProfilePhotoSync';
import NotificationBell from './NotificationBell';
import './Header.css';

function Header({ onLoginClick, onRegisterClick, isLoggedIn, onLogout, currentUser }) {
    const { currentUser: contextUser, refreshUserProfile } = useContext(AuthContext);
    // Use the profile photo sync hook to listen for updates
    useProfilePhotoSync();
    const [showLoginModal, setShowLoginModal] = useState(false);
    
    // Use context user if available, fallback to prop user
    const activeUser = contextUser || currentUser;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDashboardMessage, setShowDashboardMessage] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    
    // Function to handle redirect from registration to login
    const handleLoginRedirect = (registeredEmail) => {
        setShowLoginModal(true);
        setEmail(registeredEmail || '');
        setLoginError('Registration successful! Please sign in with your credentials.');
    };
    
    // Effect to show dashboard message when user logs in
    useEffect(() => {
        if (isLoggedIn && currentUser) {
            setShowDashboardMessage(true);
            setTimeout(() => {
                setShowDashboardMessage(false);
            }, 5000); // Hide after 5 seconds
        }
    }, [isLoggedIn, currentUser]);

    // Prevent body scroll when login modal is open
    useEffect(() => {
        if (showLoginModal) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        } else {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-open');
        }
        
        return () => {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-open');
        };
    }, [showLoginModal]);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            // Call the onLoginClick function passed from App.jsx
            const success = await onLoginClick(email, password);
            
            if (success) {
                // Successfully logged in
                setLoginError('');
                setShowLoginModal(false);
                
                // Clear form inputs
                setEmail('');
                setPassword('');
                
                // Show dashboard message
                setShowDashboardMessage(true);
                setTimeout(() => {
                    setShowDashboardMessage(false);
                }, 5000); // Hide after 5 seconds
                
                // Get the current user from session storage
                const userStr = sessionStorage.getItem('currentUser');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    
                    // Navigate to the appropriate dashboard based on user role
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
        // Get fresh user data from storage
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
    const goToNewsPage = () => {
        navigate('/news');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeLoginModal = () => {
        setShowLoginModal(false);
        setEmail('');
        setPassword('');
        setLoginError('');
    };

    const handleLogoutClick = () => {
        onLogout();
        setShowDropdown(false);
        navigate('/');
    };
    
    // Modified onRegisterClick to pass the loginRedirect function
    const handleRegisterClick = () => {
        if (onRegisterClick) {
            // Pass the loginRedirect function to the parent component
            onRegisterClick(handleLoginRedirect);
        }
    };

    // Get user display name based on the role
    const getUserDisplayName = () => {
        if (!activeUser) return "User";
        
        // Return the actual name from the user data
        return activeUser.fullName || activeUser.name || "User";
    };

    return (
        <header className="header">
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

            {showLoginModal && (
                <div className="login-modal">
                    <div className="login-form">
                        <div className="login-left-panel">
                            <h2>Hello, Welcome!</h2>
                            <p>Don't have an account?</p>
                            <button className="register-btn" onClick={(e) => {
                                e.preventDefault();
                                setShowLoginModal(false);
                                onRegisterClick();
                            }}>Register</button>
                        </div>
                        <div className="login-right-panel">
                            <button className="modal-close-btn" onClick={closeLoginModal}>×</button>
                            <div className="modal-header">
                                <h2>Login</h2>
                            </div>
                            <p className="modal-subtitle">Please enter your details</p>

                            <form onSubmit={handleLogin}>
                                <div className="input-group">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <span className="input-icon user-icon">👤</span>
                                </div>
                                <div className="input-group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <span 
                                        className="input-icon eye-icon" 
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? "👁️" : "👁️‍🗨️"}
                                    </span>
                                </div>
                                
                                <button type="submit" className="login-submit-btn">Login</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Login Error Toast */}
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
            
            {/* Dashboard Completion Message */}
            {isLoggedIn && showDashboardMessage && (
                <div className="dashboard-message">
                    <p>Complete your dashboard</p>
                </div>
            )}
        </header>
    );
}

export default Header;