/* eslint-disable react/prop-types */
import { createContext, useState, useEffect } from 'react';
import apiService from '../services/api';

// Create the context
const AuthContext = createContext();

// Create the provider component
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    
    console.log('AuthContext init - Token:', token ? 'Found' : 'Not found');
    console.log('AuthContext init - User data:', userData ? 'Found' : 'Not found');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setCurrentUser(parsedUser);
        setIsLoggedIn(true);
        console.log('User restored from storage:', parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  // Auth methods
  const register = async (userData, role) => {
    try {
      console.log('Registering user with role:', role);
      let response;
      
      // Use specific staff registration endpoint for staff role
      if (role.toLowerCase() === 'staff') {
        response = await apiService.register(userData, role);
      } else {
        response = await apiService.register(userData, role);
      }
      
      if (response.success) {
        console.log('Registration successful:', response.data);
        
        // Auto login after registration
        if (response.data && response.data.accessToken) {
          const token = response.data.accessToken;
          localStorage.setItem('token', token);
          console.log('Token stored after registration:', token ? 'Yes' : 'No');
          
          const userInfo = response.data.user;
          setUser(userInfo);
          setCurrentUser(userInfo);
          setIsLoggedIn(true);
          sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
          localStorage.setItem('currentUser', JSON.stringify(userInfo));
        }
        
        return { success: true, data: response.data };
      } else {
        console.error('Registration failed:', response.message);
        return { success: false, message: response.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };
  
  const login = async (email, password) => {
    try {
      console.log('Logging in user:', email);
      const response = await apiService.login(email, password);
      
      if (response.success) {
        console.log('Login successful:', response.data);
        
        // Store token in localStorage with validation
        const token = response.data.accessToken;
        if (token) {
          localStorage.setItem('token', token);
          console.log('Token stored successfully:', token.substring(0, 20) + '...');
        } else {
          console.error('No access token received from server');
          return { success: false, message: 'Authentication token not received' };
        }
        
        // Store user data in both session and local storage
        const userInfo = response.data.user;
        setIsLoggedIn(true);
        setUser(userInfo);
        setCurrentUser(userInfo);
        sessionStorage.setItem('currentUser', JSON.stringify(userInfo));
        localStorage.setItem('currentUser', JSON.stringify(userInfo));
        
        console.log('User logged in and stored:', userInfo);
        
        return { success: true, data: response.data };
      } else {
        console.error('Login failed:', response.message);
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };
  
  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    setUser(null);
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  // Update user information
  const updateUser = (updatedUserInfo) => {
    // Ensure profile photo URL is properly formatted
    if (updatedUserInfo && updatedUserInfo.profilePhoto && !updatedUserInfo.profilePhoto.startsWith('http')) {
      updatedUserInfo.profilePhoto = `http://localhost:5000${updatedUserInfo.profilePhoto}`;
    }
    
    setUser(updatedUserInfo);
    setCurrentUser(updatedUserInfo);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUserInfo));
    localStorage.setItem('currentUser', JSON.stringify(updatedUserInfo));
  };

  // Get fresh user profile from API
  const refreshUserProfile = async () => {
    try {
      setLoading(true);
      let response;
      
      // Use appropriate API endpoint based on user role
      if (currentUser?.role?.toLowerCase() === 'recruiter') {
        response = await apiService.getRecruiterProfile();
      } else {
        response = await apiService.getProfile();
      }
      
      if (response.success) {
        const updatedUser = response.data;
        updateUser(updatedUser);
        return { success: true, data: updatedUser };
      } else {
        console.error('Failed to refresh profile:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
      return { success: false, message: 'Failed to refresh profile' };
    } finally {
      setLoading(false);
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role?.toLowerCase() === role.toLowerCase();
  };

  // Check if user is staff
  const isStaff = () => {
    return hasRole('staff');
  };

  // Check if user is recruiter
  const isRecruiter = () => {
    return hasRole('recruiter');
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser,
        isLoggedIn,
        loading,
        register,
        login,
        logout,
        updateUser,
        refreshUserProfile,
        hasRole,
        isStaff,
        isRecruiter,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };