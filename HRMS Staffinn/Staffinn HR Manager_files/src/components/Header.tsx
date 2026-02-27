import { useState } from 'react'
import { Search, Bell, User, LogOut, Home, Users, Clock, CreditCard, UserPlus, TrendingUp, MessageSquare, Network, Calendar, ChevronDown } from 'lucide-react'
import { User as UserType } from '../types'
import { useAuth } from '../contexts/AuthContext'
import logo from '../logowbg.PNG'

interface HeaderProps {
  user: UserType
  activeTab: string
  setActiveTab: (tab: string) => void
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'onboarding', label: 'Onboarding', icon: UserPlus },
  { id: 'organogram', label: 'Organogram', icon: Network },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'leave', label: 'Leave Management', icon: Calendar },
  { id: 'payroll', label: 'Payroll', icon: CreditCard },
  { id: 'claims', label: 'Claim Management', icon: CreditCard },
  { id: 'tasks-performance', label: 'Tasks & Performance', icon: TrendingUp },
  { id: 'grievances', label: 'Grievances', icon: MessageSquare },
  { id: 'separation', label: 'Separation', icon: LogOut }
]

export default function Header({ user, activeTab, setActiveTab }: HeaderProps) {
  const { logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout()
    }
  }

  return (
    <header className="bg-white shadow-sm border-b px-6 h-28">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-4">
          <img src={logo} alt="Staffinn HRMS" className="h-24 w-auto object-contain" />
        </div>
        
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search employees, tasks..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={16} className="text-blue-600" />
              </div>
              <ChevronDown size={16} className="text-gray-600" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
                  <div className="py-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id)
                            setShowMenu(false)
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                            activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                          }`}
                        >
                          <Icon size={18} />
                          <span className="text-sm">{item.label}</span>
                        </button>
                      )
                    })}
                    <div className="border-t my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 text-red-600 transition-colors"
                    >
                      <LogOut size={18} />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
 