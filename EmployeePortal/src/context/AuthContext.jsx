import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('employeeToken');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data.data;
      console.log('👤 User loaded:', userData);
      console.log('🏢 Recruiter ID:', userData.recruiterId || userData.companyId);
      setUser(userData);
    } catch (error) {
      console.error('❌ Error loading user:', error);
      localStorage.removeItem('employeeToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    const { token, user } = response.data.data;
    localStorage.setItem('employeeToken', token);
    // Set basic user immediately so navigation works
    setUser(user);
    // Then fetch full profile (includes employee details like name, designation, etc.)
    try {
      const profileResponse = await authAPI.getProfile();
      setUser(profileResponse.data.data);
    } catch (e) {
      // If profile fetch fails, keep the basic user object
      console.error('Profile fetch after login failed:', e);
    }
    return user;
  };

  const logout = () => {
    localStorage.removeItem('employeeToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
