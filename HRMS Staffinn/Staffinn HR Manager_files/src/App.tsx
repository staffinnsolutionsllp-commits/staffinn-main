import  { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AttendanceProvider } from './contexts/AttendanceContext'
import AuthPage from './components/Auth/AuthPage'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Organogram from './components/Organogram'
import Attendance from './components/Attendance'
import LeaveManagement from './components/LeaveManagement'
import Payroll from './components/Payroll'
import ClaimManagement from './components/ClaimManagement'
import TaskPerformance from './components/TaskPerformance'
import GrievanceManagement from './components/GrievanceManagement'
import SeparationManagement from './components/SeparationManagement'
import Onboarding from './components/Onboarding'
import Performance from './components/Performance'
import Tasks from './components/Tasks'
import Grievances from './components/Grievances'
import Exit from './components/Exit'

function AppContent() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  if (isLoading) {
    return (
      <div className="flex w-full h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'organogram': return <Organogram />
      case 'attendance': return <Attendance />
      case 'leave': return <LeaveManagement />
      case 'payroll': return <Payroll />
      case 'claims': return <ClaimManagement />
      case 'tasks-performance': return <TaskPerformance />
      case 'grievance-management': return <GrievanceManagement />
      case 'separation': return <SeparationManagement />
      case 'onboarding': return <Onboarding />
      case 'performance': return <Performance />
      case 'tasks': return <Tasks />
      case 'grievances': return <Grievances />
      case 'exit': return <Exit />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <Header user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <AppContent />
      </AttendanceProvider>
    </AuthProvider>
  )
}

export default App
 