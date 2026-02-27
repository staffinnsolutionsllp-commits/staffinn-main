# HRMS Frontend Changes Required

## Overview
The backend has been updated to enforce data isolation by recruiterId. Now the frontend needs to be updated to pass the recruiterId during registration and check if a recruiter is already registered.

## Changes Required

### 1. Main StaffInn Frontend - Pass recruiterId to HRMS

**File**: `Frontend/src/Components/HRMS/HRMS.jsx`

**Current Code**:
```javascript
import React, { useEffect } from 'react';
import './HRMS.css';

const HRMS = () => {
    useEffect(() => {
        window.location.href = 'http://localhost:5175';
    }, []);

    return (
        <div className="hrms-redirect-container">
            <div className="hrms-redirect-content">
                <div className="hrms-loader">
                    <div className="hrms-spinner"></div>
                </div>
                <h2>Redirecting to STAFFINN HRMS</h2>
                <p>Please wait while we redirect you to the Human Resource Management System...</p>
            </div>
        </div>
    );
};

export default HRMS;
```

**Updated Code**:
```javascript
import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Import auth context
import './HRMS.css';

const HRMS = () => {
    const { user } = useAuth(); // Get current user

    useEffect(() => {
        if (user && user.userId) {
            // Pass recruiterId (which is the user's userId from StaffInn) to HRMS
            const hrmsUrl = `http://localhost:5175?recruiterId=${user.userId}`;
            window.location.href = hrmsUrl;
        } else {
            console.error('User not found. Please login first.');
        }
    }, [user]);

    return (
        <div className="hrms-redirect-container">
            <div className="hrms-redirect-content">
                <div className="hrms-loader">
                    <div className="hrms-spinner"></div>
                </div>
                <h2>Redirecting to STAFFINN HRMS</h2>
                <p>Please wait while we redirect you to the Human Resource Management System...</p>
                <p className="hrms-integration-note">Preparing your personalized HRMS workspace...</p>
            </div>
        </div>
    );
};

export default HRMS;
```

---

### 2. HRMS Frontend - Update API Service

**File**: `HRMS Staffinn/Staffinn HR Manager_files/src/services/api.js`

**Add these methods**:
```javascript
// Add to existing apiService object

// Check if recruiter is already registered
checkRecruiterRegistration: async (recruiterId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/hrms/auth/check-recruiter/${recruiterId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to check registration status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Check registration error:', error);
    throw error;
  }
},

// Update register method to include recruiterId
register: async (name, email, password, role, recruiterId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/hrms/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        recruiterId  // ← NEW: Include recruiterId
      })
    });

    const data = await response.json();

    if (data.success && data.data && data.data.token) {
      localStorage.setItem('hrms_token', data.data.token);
      this.setToken(data.data.token);
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
},

// Update login method to include optional recruiterId
login: async (email, password, recruiterId = null) => {
  try {
    const body = { email, password };
    if (recruiterId) {
      body.recruiterId = recruiterId;
    }

    const response = await fetch(`${API_BASE_URL}/hrms/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.success && data.data && data.data.token) {
      localStorage.setItem('hrms_token', data.data.token);
      this.setToken(data.data.token);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

---

### 3. HRMS Frontend - Update Auth Context

**File**: `HRMS Staffinn/Staffinn HR Manager_files/src/contexts/AuthContext.tsx`

**Update the register method**:
```typescript
const register = async (name: string, email: string, password: string, recruiterId: string): Promise<boolean> => {
  try {
    console.log('🔵 Starting registration...');
    console.log('🔵 Recruiter ID:', recruiterId);
    
    const response = await apiService.register(name, email, password, 'admin', recruiterId);
    console.log('🔵 Registration response:', response);
    
    if (response.success && response.data) {
      const userData = response.data.user;
      const token = response.data.token;
      
      console.log('🔵 User data:', userData);
      console.log('🔵 Token:', token ? 'Present' : 'Missing');
      
      // Set token first
      if (token) {
        apiService.setToken(token);
        console.log('✅ Token saved');
      }
      
      // Set user
      setUser(userData);
      console.log('✅ User state set');
      
      // Check if admin needs company setup
      if (userData.role === 'admin' && !userData.companyId) {
        console.log('🔵 Admin without company - showing modal');
        setTimeout(() => {
          setNeedsCompanySetup(true);
          console.log('✅ Modal triggered');
        }, 200);
      }
      
      return true;
    }
    console.error('❌ Registration failed:', response);
    return false;
  } catch (error) {
    console.error('❌ Registration error:', error);
    return false;
  }
};

const login = async (email: string, password: string, recruiterId?: string): Promise<boolean> => {
  try {
    const response = await apiService.login(email, password, recruiterId);
    console.log('Login response:', response);
    if (response.success && response.data) {
      const userData = response.data.user;
      
      // Check if admin needs company setup
      if (userData.role === 'admin' && !userData.companyId) {
        setNeedsCompanySetup(true);
      }
      
      setUser(userData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};

// Update the value object to include recruiterId parameter
const value: AuthContextType = {
  user,
  login,
  register,
  logout,
  resetPassword,
  isLoading
};
```

---

### 4. HRMS Frontend - Update Register Form

**File**: `HRMS Staffinn/Staffinn HR Manager_files/src/components/Auth/RegisterForm.tsx`

**Update the component**:
```typescript
import { useState, useEffect } from 'react'
import { UserPlus, Lock, Mail, User, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { validateEmail, validatePassword } from '../../utils/auth'
import { apiService } from '../../services/api'

interface RegisterFormProps {
  onToggleForm: () => void
}

export default function RegisterForm({ onToggleForm }: RegisterFormProps) {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [recruiterId, setRecruiterId] = useState<string | null>(null)
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true)

  useEffect(() => {
    // Get recruiterId from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const recruiterIdParam = urlParams.get('recruiterId')
    
    if (!recruiterIdParam) {
      setError('Recruiter ID not found. Please access HRMS from StaffInn dashboard.')
      setIsCheckingRegistration(false)
      return
    }
    
    setRecruiterId(recruiterIdParam)
    
    // Check if recruiter is already registered
    checkRegistrationStatus(recruiterIdParam)
  }, [])

  const checkRegistrationStatus = async (recruiterId: string) => {
    try {
      const response = await apiService.checkRecruiterRegistration(recruiterId)
      
      if (response.success && response.data.isRegistered) {
        // Recruiter already registered, redirect to login
        setError('You are already registered in HRMS. Please sign in instead.')
        setTimeout(() => {
          onToggleForm() // Switch to login form
        }, 2000)
      }
    } catch (error) {
      console.error('Error checking registration:', error)
      // Continue with registration if check fails
    } finally {
      setIsCheckingRegistration(false)
    }
  }

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password })
    const validation = validatePassword(password)
    setPasswordErrors(validation.errors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!recruiterId) {
      setError('Recruiter ID not found. Please access HRMS from StaffInn dashboard.')
      return
    }
    
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      setError('Please fix password requirements')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const success = await register(formData.name, formData.email, formData.password, recruiterId)
      if (!success) {
        setError('Registration failed. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingRegistration) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
          <p className="mt-4 text-gray-600">Checking registration status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-green-100 rounded-full">
            <UserPlus className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">Join Staffinn HRMS today</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="flex items-center space-x-2 p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <div className="mt-1 relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1 relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Create a strong password"
              />
            </div>
            {formData.password && (
              <div className="mt-2 space-y-1">
                {[
                  { text: 'At least 8 characters', valid: formData.password.length >= 8 },
                  { text: 'Contains lowercase letter', valid: /(?=.*[a-z])/.test(formData.password) },
                  { text: 'Contains uppercase letter', valid: /(?=.*[A-Z])/.test(formData.password) },
                  { text: 'Contains number', valid: /(?=.*\d)/.test(formData.password) },
                  { text: 'Contains special character', valid: /(?=.*[@$!%*?&])/.test(formData.password) }
                ].map((requirement, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {requirement.valid ? (
                      <CheckCircle size={12} className="text-green-500" />
                    ) : (
                      <div className="w-3 h-3 border border-gray-300 rounded-full" />
                    )}
                    <span className={`text-xs ${requirement.valid ? 'text-green-600' : 'text-gray-500'}`}>
                      {requirement.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || passwordErrors.length > 0 || !recruiterId}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onToggleForm}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </button>
          </span>
        </div>
      </form>
    </div>
  )
}
```

---

### 5. HRMS Frontend - Update Login Form

**File**: `HRMS Staffinn/Staffinn HR Manager_files/src/components/Auth/LoginForm.tsx`

**Add recruiterId handling**:
```typescript
import { useState, useEffect } from 'react'
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { validateEmail } from '../../utils/auth'

interface LoginFormProps {
  onToggleForm: () => void
  onForgotPassword: () => void
}

export default function LoginForm({ onToggleForm, onForgotPassword }: LoginFormProps) {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recruiterId, setRecruiterId] = useState<string | null>(null)

  useEffect(() => {
    // Get recruiterId from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const recruiterIdParam = urlParams.get('recruiterId')
    setRecruiterId(recruiterIdParam)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!formData.password) {
      setError('Password is required')
      return
    }

    setIsLoading(true)

    try {
      const success = await login(formData.email, formData.password, recruiterId || undefined)
      if (!success) {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <LogIn className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-sm text-gray-600">Sign in to your HRMS account</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="flex items-center space-x-2 p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1 relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <button
              type="button"
              onClick={onForgotPassword}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onToggleForm}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </button>
          </span>
        </div>
      </form>
    </div>
  )
}
```

---

## Testing the Changes

### Step 1: Test Backend First
```bash
# Test check registration endpoint
curl http://localhost:3000/api/hrms/auth/check-recruiter/REC123

# Test registration with recruiterId
curl -X POST http://localhost:3000/api/hrms/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#",
    "recruiterId": "REC123"
  }'
```

### Step 2: Test Frontend Flow
1. Login to StaffInn as a recruiter
2. Click "HRMS" in sidebar
3. Should redirect to HRMS with recruiterId in URL
4. If first time: Should show registration form
5. If already registered: Should show login form
6. After login: Should see only your own employees

### Step 3: Test Data Isolation
1. Login as Recruiter A, onboard employees
2. Logout, login as Recruiter B
3. Open HRMS, register as new user
4. Should see empty employee list
5. Onboard employees as Recruiter B
6. Logout, login back as Recruiter A
7. Should see only Recruiter A's employees

## Summary

✅ **Backend**: Complete - All changes implemented
⏳ **Frontend**: Requires updates to 5 files
🎯 **Goal**: Complete data isolation between recruiters

Once these frontend changes are implemented, each recruiter will have their own isolated HRMS workspace with no data leakage.
