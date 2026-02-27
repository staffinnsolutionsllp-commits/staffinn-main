import { useState } from 'react'
import { Calendar, FileText, Settings, BarChart3, Wallet, ClipboardList } from 'lucide-react'
import LeaveDashboard from './LeaveDashboard'
import LeaveLogs from './LeaveLogs'
import LeaveRules from './LeaveRules'
import LeaveBalance from './LeaveBalance'
import LeaveAnalytics from './LeaveAnalytics'
import LeaveSettings from './LeaveSettings'

export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Calendar },
    { id: 'logs', label: 'Leave Logs', icon: ClipboardList },
    { id: 'rules', label: 'Leave Rules', icon: FileText },
    { id: 'balance', label: 'Leave Balance', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <LeaveDashboard />
      case 'logs': return <LeaveLogs />
      case 'rules': return <LeaveRules />
      case 'balance': return <LeaveBalance />
      case 'analytics': return <LeaveAnalytics />
      case 'settings': return <LeaveSettings />
      default: return <LeaveDashboard />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-gray-600">Manage employee leaves, policies, and analytics</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div>{renderContent()}</div>
    </div>
  )
}
