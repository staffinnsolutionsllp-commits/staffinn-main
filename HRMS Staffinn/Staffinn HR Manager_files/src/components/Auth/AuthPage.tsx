import  { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotPasswordForm from './ForgotPasswordForm'

type FormType = 'login' | 'register' | 'forgot'

export default function AuthPage() {
  const [currentForm, setCurrentForm] = useState<FormType>('login')

  const renderForm = () => {
    switch (currentForm) {
      case 'login':
        return (
          <LoginForm
            onToggleForm={() => setCurrentForm('register')}
            onForgotPassword={() => setCurrentForm('forgot')}
          />
        )
      case 'register':
        return <RegisterForm onToggleForm={() => setCurrentForm('login')} />
      case 'forgot':
        return <ForgotPasswordForm onBackToLogin={() => setCurrentForm('login')} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderForm()}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Demo Credentials: admin@staffinn.com / Admin@123
          </p>
        </div>
      </div>
    </div>
  )
}
 