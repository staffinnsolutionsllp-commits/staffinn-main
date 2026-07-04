/* eslint-disable no-unused-vars */

import { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from "./Components/Header/Header.jsx";
import Home from "./Components/Home/Home.jsx";
import StaffDashboard from "./Components/Dashboard/StaffDashboard.jsx";
import RecruiterDashboard from "./Components/Dashboard/RecruiterDashboard.jsx";
import InstituteDashboard from "./Components/Dashboard/InstituteDashboard.jsx";
import StaffPage from "./Components/Pages/StaffPage.jsx"; // Import the StaffPage component
import InstitutePage from './Components/Pages/InstitutePage.jsx';
import InstitutePageList from './Components/Pages/InstitutePageList.jsx'; // Added this import
import NewsPage from './Components/Pages/NewsPage.jsx';
import RecruiterPage from './Components/Pages/RecruiterPage.jsx';
import JobsPage from './Components/Pages/JobsPage.jsx';
import CoursesPage from './Components/Pages/CoursesPage.jsx';

import CourseLearningPage from './Components/Pages/CourseLearningPage.jsx';
import LoadingExample from './Components/common/LoadingExample.jsx';
import MessageCenter from './Components/Messages/MessageCenter.jsx';
import ChatWindow from './Components/Messages/ChatWindow.jsx';
import AdminDashboard from './Components/MasterAdminPanel/AdminDashboard.jsx';
import HRMS from './Components/HRMS/HRMS.jsx';
import { AuthProvider, AuthContext, LoadingProvider } from './context';
import HourglassLoader from './Components/common/HourglassLoader';
import apiService from './services/api';

import { useLenis } from './hooks/useLenis';
import { showLoginWithMessage } from './utils/authGuard';
import './App.css';

function AppContent() {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const authContext = useContext(AuthContext);
    
    // Initialize Lenis smooth scrolling
    useLenis();
    
    if (!authContext) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                backgroundColor: '#0c0c0c'
            }}>
                <HourglassLoader message="Loading Staffinn..." />
            </div>
        );
    }
    
    const { isLoggedIn, currentUser, login, register, logout, loading } = authContext;
    
    // Show loading screen while authentication is being checked
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                backgroundColor: '#0c0c0c'
            }}>
                <HourglassLoader message="Loading Staffinn..." />
            </div>
        );
    }

    const openLoginPopupWithMessage = () => {
        setShowLoginModal(true);
    };
    
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

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="app">
            {/* Header Section with Prop Drilling */}
            <Header 
                onLoginClick={handleLoginClick} 
                isLoggedIn={isLoggedIn}
                onLogout={handleLogout}
                currentUser={currentUser}
                showLoginModal={showLoginModal}
                setShowLoginModal={setShowLoginModal}
            />

            {/* Main Content Section */}
            <main>
                <Routes>
                    <Route path="/" element={<Home isLoggedIn={isLoggedIn} onShowLogin={openLoginPopupWithMessage} />} />
                    <Route path="/staff" element={<StaffPage isLoggedIn={isLoggedIn} onShowLogin={openLoginPopupWithMessage} />} /> 
                    <Route path="/institute" element={<InstitutePageList isLoggedIn={isLoggedIn} onShowLogin={openLoginPopupWithMessage} currentUser={currentUser} />} />
                    <Route path="/institute/:id" element={<InstitutePage isLoggedIn={isLoggedIn} onShowLogin={openLoginPopupWithMessage} />} />
                    <Route path="/news" element={<NewsPage isLoggedIn={isLoggedIn} onShowLogin={openLoginPopupWithMessage} />} />
                    <Route path="/recruiter" element={<RecruiterPage isLoggedIn={isLoggedIn} onShowLogin={openLoginPopupWithMessage} />} />
                    <Route path="/recruiter/:recruiterId" element={<RecruiterPage isLoggedIn={isLoggedIn} onShowLogin={openLoginPopupWithMessage} />} />
                    <Route path="/jobs" element={<JobsPage isLoggedIn={isLoggedIn} onShowLogin={openLoginPopupWithMessage} />} />
                    <Route path="/courses" element={<CoursesPage isLoggedIn={isLoggedIn} onShowLogin={openLoginPopupWithMessage} />} />
                    <Route path="/course-learning/:courseId" element={<CourseLearningPage />} />
                    <Route path="/loading-demo" element={<LoadingExample />} />
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
                    <Route 
                        path="/messages" 
                        element={isLoggedIn ? 
                            <MessageCenter /> : <Navigate to="/" />
                        } 
                    />
                    <Route 
                        path="/chat/:userId" 
                        element={isLoggedIn ? 
                            <ChatWindow /> : <Navigate to="/" />
                        } 
                    />
                    <Route 
                        path="/admin" 
                        element={isLoggedIn && currentUser?.role?.toLowerCase() === 'admin' ? 
                            <AdminDashboard /> : <Navigate to="/" />
                        } 
                    />
                    <Route 
                        path="/hrms" 
                        element={isLoggedIn && currentUser?.role?.toLowerCase() === 'recruiter' ? 
                            <HRMS /> : <Navigate to="/" />
                        } 
                    />

                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <LoadingProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </LoadingProvider>
        </Router>
    );
}

export default App;