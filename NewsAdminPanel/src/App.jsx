import { useState, useEffect } from 'react'
import AdminPanel from './AdminPanel'
import Login from './Login'
import './AdminPanel.css'
import './Login.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem('newsAdminAuth')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('newsAdminAuth')
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div>
      {isAuthenticated ? (
        <AdminPanel onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App
 
 