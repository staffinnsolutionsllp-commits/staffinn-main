import  { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthContextType } from '../types'
import { apiService } from '../services/api'
import CompanySetupModal from '../components/CompanySetupModal'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [needsCompanySetup, setNeedsCompanySetup] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('hrms_token')
    if (token) {
      apiService.setToken(token)
      loadUserProfile()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadUserProfile = async () => {
    try {
      const response = await apiService.getProfile()
      if (response.success) {
        const userData = response.data
        
        // Check if user has company setup
        if (userData.role === 'admin' && !userData.companyId) {
          setNeedsCompanySetup(true)
        }
        
        setUser(userData)
      } else {
        apiService.logout()
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      apiService.logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string, recruiterId?: string): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password, recruiterId)
      console.log('Login response:', response)
      if (response.success && response.data) {
        const userData = response.data.user
        
        if (userData.role === 'admin' && !userData.companyId) {
          setNeedsCompanySetup(true)
        }
        
        setUser(userData)
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string, recruiterId: string): Promise<boolean> => {
    try {
      console.log('🔵 Starting registration with recruiterId:', recruiterId)
      const response = await apiService.register(name, email, password, 'admin', recruiterId)
      console.log('🔵 Registration response:', response)
      
      if (response.success && response.data) {
        const userData = response.data.user
        const token = response.data.token
        
        if (token) {
          apiService.setToken(token)
        }
        
        setUser(userData)
        
        if (userData.role === 'admin' && !userData.companyId) {
          setTimeout(() => setNeedsCompanySetup(true), 200)
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Registration error:', error)
      return false
    }
  }

  const completeCompanySetup = (companyData: any) => {
    if (user) {
      setUser({
        ...user,
        companyId: companyData.companyId,
        companyName: companyData.companyName,
        apiKey: companyData.apiKey
      })
    }
    setNeedsCompanySetup(false)
  }

  const logout = () => {
    setUser(null)
    setNeedsCompanySetup(false)
    apiService.logout()
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      alert(`Password reset functionality would be implemented here for ${email}`)
      return true
    } catch (error) {
      console.error('Password reset error:', error)
      return false
    }
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    resetPassword,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {needsCompanySetup && user && (
        <CompanySetupModal 
          userEmail={user.email} 
          onComplete={completeCompanySetup}
        />
      )}
    </AuthContext.Provider>
  )
}
 