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
