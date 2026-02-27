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
    const urlParams = new URLSearchParams(window.location.search)
    const recruiterIdParam = urlParams.get('recruiterId')
    
    if (!recruiterIdParam) {
      setError('Recruiter ID not found. Please access HRMS from StaffInn dashboard.')
      setIsCheckingRegistration(false)
      return
    }
    
    setRecruiterId(recruiterIdParam)
    checkRegistrationStatus(recruiterIdParam)
  }, [])

  const checkRegistrationStatus = async (recruiterId: string) => {
    try {
      const response = await apiService.checkRecruiterRegistration(recruiterId)
      
      if (response.success && response.data.isRegistered) {
        setError('You are already registered in HRMS. Please sign in instead.')
        setTimeout(() => onToggleForm(), 2000)
      }
    } catch (error) {
      console.error('Error checking registration:', error)
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
