import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in
    const token = localStorage.getItem('adminToken');
    const storedAdminData = localStorage.getItem('adminData');
    
    console.log('Checking stored auth:', { token: !!token, adminData: !!storedAdminData });
    
    if (token && storedAdminData) {
      try {
        const parsedAdminData = JSON.parse(storedAdminData);
        console.log('Restoring admin session:', parsedAdminData);
        setAdminData(parsedAdminData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored admin data:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (data) => {
    setAdminData(data);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminData(null);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Master Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        <AdminPanel adminData={adminData} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
