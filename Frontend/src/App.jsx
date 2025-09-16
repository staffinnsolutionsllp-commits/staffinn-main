/* eslint-disable no-unused-vars */

import { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from "./Components/Header/Header.jsx";
import Home from "./Components/Home/Home.jsx";
import RegistrationPopup from "./Components/Register/RegistrationPopup.jsx";
import LoginPopup from "./Components/Login/LoginPopup.jsx";
import StaffDashboard from "./Components/Dashboard/StaffDashboard.jsx";
import RecruiterDashboard from "./Components/Dashboard/RecruiterDashboard.jsx";
import InstituteDashboard from "./Components/Dashboard/InstituteDashboard.jsx";
import StaffPage from "./Components/Pages/StaffPage.jsx"; // Import the StaffPage component
import InstitutePage from './Components/Pages/InstitutePage.jsx';
import InstitutePageList from './Components/Pages/InstitutePageList.jsx'; // Added this import
import NewsPage from './Components/Pages/NewsPage.jsx';
import RecruiterPage from './Components/Pages/RecruiterPage.jsx';
import CourseLearningPage from './Components/Pages/CourseLearningPage.jsx';
import { AuthProvider, AuthContext } from './context';
import apiService from './services/api';
import './App.css';

function AppContent() {
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showRegistrationPopup, setShowRegistrationPopup] = useState(false);
    const authContext = useContext(AuthContext);
    
    if (!authContext) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                fontFamily: 'Arial, sans-serif'
            }}>
                <div style={{ marginBottom: '20px', fontSize: '18px' }}>Loading Staffinn...</div>
                <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }
    
    const { isLoggedIn, currentUser, login, register, logout } = authContext;

    const openLoginPopup = () => setShowLoginPopup(true);
    const closeLoginPopup = () => setShowLoginPopup(false);
    
    const handleLoginClick = async (email, password) => {
        try {
            console.log('Login attempt for:', email);
            const result = await login(email, password);
            console.log('Login result:', result);
            return result.success;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const openRegistrationPopup = (loginRedirectCallback) => {
        setShowRegistrationPopup(true);
        // Store the callback for later use
        window.loginRedirectCallback = loginRedirectCallback;
    };
    
    const closeRegistrationPopup = () => setShowRegistrationPopup(false);

    const handleRegistration = async (userData, role) => {
        try {
            // Call backend API through the AuthContext
            const result = await register(userData, role);
            
            if (result.success) {
                // Close registration popup
                closeRegistrationPopup();
                
                // Redirect to login if callback exists
                if (window.loginRedirectCallback) {
                    window.loginRedirectCallback(userData.email);
                    window.loginRedirectCallback = null;
                }
                
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="app">
            {/* Header Section with Prop Drilling */}
            <Header 
                onLoginClick={handleLoginClick} 
                onRegisterClick={openRegistrationPopup}
                isLoggedIn={isLoggedIn}
                onLogout={handleLogout}
                currentUser={currentUser}
            />

            {/* Main Content Section */}
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/staff" element={<StaffPage />} /> 
                    <Route path="/institute" element={<InstitutePageList />} />
                    <Route path="/institute/:id" element={<InstitutePage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/recruiter" element={<RecruiterPage />} />
                    <Route path="/recruiter/:recruiterId" element={<RecruiterPage />} />
                    <Route path="/course/:courseId" element={<CourseLearningPage />} />
                    <Route 
                        path="/dashboard/staff" 
                        element={isLoggedIn && currentUser?.role?.toLowerCase() === 'staff' ? 
                            <StaffDashboard currentUser={currentUser} /> : <Navigate to="/" />
                        } 
                    />
                    <Route 
                        path="/dashboard/recruiter" 
                        element={isLoggedIn && currentUser?.role?.toLowerCase() === 'recruiter' ? 
                            <RecruiterDashboard currentUser={currentUser} /> : <Navigate to="/" />
                        } 
                    />
                    <Route 
                        path="/dashboard/institute" 
                        element={isLoggedIn && currentUser?.role?.toLowerCase() === 'institute' ? 
                            <InstituteDashboard currentUser={currentUser} /> : <Navigate to="/" />
                        } 
                    />
                </Routes>
            </main>

            {/* Conditional Rendering for Popups */}
            {showRegistrationPopup && 
                <RegistrationPopup 
                    onClose={closeRegistrationPopup} 
                    onRegister={handleRegistration}
                    onLoginRedirect={window.loginRedirectCallback}
                />
            }
            
            {showLoginPopup && 
                <LoginPopup 
                    onClose={closeLoginPopup} 
                />
            }
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;