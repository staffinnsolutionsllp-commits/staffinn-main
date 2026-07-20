import  { Home, Users, Clock, CreditCard, UserPlus, TrendingUp, CheckCircle, LogOut, MessageSquare, Network, Calendar, ShieldCheck, FileText } from 'lucide-react'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const menuItems = [
  { id: 'dashboard',            label: 'Dashboard',             icon: Home },
  { id: 'onboarding',           label: 'Onboarding',            icon: UserPlus },
  { id: 'organogram',           label: 'Organogram',            icon: Network },
  { id: 'attendance',           label: 'Attendance',            icon: Clock },
  { id: 'leave',                label: 'Leave Management',      icon: Calendar },
  { id: 'claims',               label: 'Claim Management',      icon: CreditCard },
  { id: 'claim-approvals',      label: 'Claim Approvals',       icon: ShieldCheck },
  { id: 'tasks-performance',    label: 'Task & Performance',    icon: TrendingUp },
  { id: 'dtr-reports',          label: 'Daily Task Reports',    icon: FileText },
  { id: 'grievance-management', label: 'Grievances & Warnings',  icon: MessageSquare },
  { id: 'separation',           label: 'Separation Management', icon: LogOut },
  { id: 'payroll',              label: 'Payroll',               icon: CreditCard },
]

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="w-64 bg-white shadow-lg border-r">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-blue-600">Staffinn HRMS</h1>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                activeTab === item.id ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
 