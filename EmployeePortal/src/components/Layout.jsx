import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, CalendarDays, PlaneTakeoff, IndianRupee,
  CreditCard, ClipboardList, MessageSquare, Network, User,
  LogOut, ChevronRight, Building2, FileText
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
  { path: '/grievances', icon: MessageSquare,    label: 'Grievances & Warnings' },
  { path: '/organogram', icon: Network,          label: 'Organogram' },
  { path: '/resignation',icon: LogOut,           label: 'Resignation' },
  { path: '/profile',    icon: User,             label: 'Profile' },
];

export default function Layout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  const employee  = user?.employee || {};
  const initials  = employee.fullName
    ? employee.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || 'E').toUpperCase();

  const pageTitle = PAGE_TITLES[location.pathname]
    || (location.pathname.startsWith('/separation') ? 'No Dues Clearance' : 'Employee Portal');

  const isActive = (path) =>
    location.pathname === path ||
    (path === '/resignation' && location.pathname.startsWith('/separation'));

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">

      {/* ── Sidebar ── */}
      <aside
        style={{ background: '#0f172a' }}
        className="w-64 flex flex-col flex-shrink-0 select-none"
      >
        {/* Brand */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              <Building2 size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">StaffInn</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: '#64748b' }}>Employee Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {NAV.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  active ? 'nav-active text-white' : 'text-slate-400 hover:text-white'
                }`}
                style={!active ? undefined : undefined}
                onMouseEnter={e => { if(!active) e.currentTarget.style.background='#1e293b'; }}
                onMouseLeave={e => { if(!active) e.currentTarget.style.background=''; }}
              >
                <Icon size={16} className={active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="flex-1 text-left">{label}</span>
                {active && <ChevronRight size={13} style={{ color: 'rgba(255,255,255,.5)' }} />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-1"
            style={{ background: '#1e293b' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#818cf8,#6366f1)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {employee.fullName || user?.email || 'Employee'}
              </p>
              <p className="text-xs truncate" style={{ color:'#64748b' }}>
                {employee.designation || employee.employeeId || ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 transition-all"
            onMouseEnter={e => e.currentTarget.style.background='#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background=''}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-7 h-14 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-slate-900">{pageTitle}</h1>
            {employee.department && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-xs text-slate-500">{employee.department}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#818cf8,#6366f1)' }}>
              {initials}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
