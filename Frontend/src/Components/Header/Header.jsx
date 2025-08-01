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

                <nav className="nav-menu">
                    <ul className="nav-list">
                        <li><Link to="/staff" className="nav-link">Staff</Link></li>
                        <li><Link to="/institute" className="nav-link">Institute</Link></li>
                        <li><a href="/recruiter" className="nav-link">Recruiter</a></li>
                        <li><Link to="/news" className="news-btn">News</Link></li>
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
                        <button className="modal-close-btn" onClick={closeLoginModal}>×</button>
                        <div className="modal-header">
                            <h2>Welcome Back</h2>
                            <p className="modal-subtitle">Please enter your details</p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="input-group">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            
                            {/* Error message moved to toast */}
                            
                            <button type="submit" className="login-submit-btn">Sign In</button>
                        </form>

                        <div className="divider">
                            <span>OR</span>
                        </div>

                        <div className="social-login">
                            <button className="social-btn social-btn-google">
                                <img src={assets.google_icon} alt="Google" />
                                Continue with Google
                            </button>
                            <button className="social-btn social-btn-facebook">
                                <img src={assets.facebook_icon} alt="Facebook" />
                                Continue with Facebook
                            </button>
                            <button className="social-btn social-btn-linkedin">
                                <img src={assets.linkedin_icon} alt="LinkedIn" />
                                Continue with LinkedIn
                            </button>
                        </div>

                        <p className="register-text">
                            Don't have an account? <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setShowLoginModal(false);
                                onRegisterClick();
                            }}>Register here</a>
                        </p>
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