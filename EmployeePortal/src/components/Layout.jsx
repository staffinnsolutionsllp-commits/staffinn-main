import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, CalendarDays, PlaneTakeoff, IndianRupee,
  CreditCard, ClipboardList, MessageSquare, Network, User,
  LogOut, Building2, FileText, Menu, X
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/attendance': 'Attendance',
  '/leave':      'Leave Management',
  '/payroll':    'Payroll & Payslips',
  '/claims':     'Claim Management',
  '/tasks':      'Tasks & Performance',
  '/dtr':        'Daily Task Report',
  '/grievances': 'Grievances',
  '/organogram': 'Organization Chart',
  '/profile':    'My Profile',
  '/resignation':'My Resignation',
};

const NAV = [
  { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/attendance', icon: CalendarDays,     label: 'Attendance' },
  { path: '/leave',      icon: PlaneTakeoff,     label: 'Leave' },
  { path: '/payroll',    icon: IndianRupee,      label: 'Payroll' },
  { path: '/claims',     icon: CreditCard,       label: 'Claims' },
  { path: '/tasks',      icon: ClipboardList,    label: 'Tasks' },
  { path: '/dtr',        icon: FileText,         label: 'Daily Task Report' },
  { path: '/grievances', icon: MessageSquare,    label: 'Grievances' },
  { path: '/organogram', icon: Network,          label: 'Organogram' },
  { path: '/resignation',icon: LogOut,           label: 'Resignation' },
  { path: '/profile',    icon: User,             label: 'Profile' },
];

export default function Layout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const employee  = user?.employee || {};
  const initials  = employee.fullName
    ? employee.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || 'E').toUpperCase();

  const pageTitle = PAGE_TITLES[location.pathname]
    || (location.pathname.startsWith('/separation') ? 'No Dues Clearance' : 'Employee Portal');

  const isActive = (path) =>
    location.pathname === path ||
    (path === '/resignation' && location.pathname.startsWith('/separation'));

  const handleNav = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Light theme */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Brand */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-600 leading-none">StaffInn</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Employee Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          {NAV.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button key={path} onClick={() => handleNav(path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={16} className={active ? 'text-blue-600' : 'text-gray-400'} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-blue-600 flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{employee.fullName || user?.email || 'Employee'}</p>
              <p className="text-[10px] text-gray-400 truncate">{employee.designation || employee.employeeId || ''}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-lg text-[13px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-12 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <Menu size={18} />
            </button>
            <h1 className="text-[13px] font-semibold text-gray-800">{pageTitle}</h1>
            {employee.department && (
              <span className="hidden sm:inline text-[11px] text-gray-400 ml-1">· {employee.department}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={() => navigate('/profile')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-blue-600 hover:bg-blue-700 transition-colors">
              {initials}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
