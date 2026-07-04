import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, CalendarDays, PlaneTakeoff, IndianRupee,
  CreditCard, ClipboardList, MessageSquare, Network, User, LogOut, ChevronRight
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/attendance': 'Attendance',
  '/leave':      'Leave Management',
  '/payroll':    'Payroll & Payslips',
  '/claims':     'Claim Management',
  '/tasks':      'Tasks & Performance',
  '/grievances': 'Grievances',
  '/organogram': 'Organization Chart',
  '/profile':    'My Profile',
  '/resignation':'My Resignation',
};

export default function Layout({ children }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/attendance', icon: CalendarDays,     label: 'Attendance' },
    { path: '/leave',      icon: PlaneTakeoff,     label: 'Leave' },
    { path: '/payroll',    icon: IndianRupee,      label: 'Payroll' },
    { path: '/claims',     icon: CreditCard,       label: 'Claim Management' },
    { path: '/tasks',      icon: ClipboardList,    label: 'Tasks & Performance' },
    { path: '/grievances', icon: MessageSquare,    label: 'Grievances' },
    { path: '/organogram', icon: Network,          label: 'Organogram' },
    { path: '/resignation',icon: LogOut,           label: 'Resignation' },
    { path: '/profile',    icon: User,             label: 'Profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const employee = user?.employee || {};
  const initials = employee.fullName
    ? employee.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.user?.email?.[0] || 'E').toUpperCase();

  const pageTitle = PAGE_TITLES[location.pathname] || (location.pathname.startsWith('/separation') ? 'No Dues Clearance' : 'Employee Portal');

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-72 bg-slate-900 flex flex-col flex-shrink-0 select-none">

        {/* Brand */}
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white font-black text-base tracking-tight">S</span>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none tracking-tight">StaffInn</p>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">Employee Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon    = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith('/separation');
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight size={14} className="text-indigo-300" />}
              </button>
            );
          })}
        </nav>

        {/* Employee Card + Logout */}
        <div className="px-3 pb-4 space-y-2 border-t border-slate-800 pt-3">
          <div className="px-3 py-3 rounded-xl bg-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {employee.fullName || user?.user?.email || 'Employee'}
              </p>
              <p className="text-slate-400 text-xs truncate">
                {employee.designation || user?.user?.employeeId || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all duration-150"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">{pageTitle}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {employee.department && employee.designation
                ? `${employee.designation} · ${employee.department}`
                : new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
