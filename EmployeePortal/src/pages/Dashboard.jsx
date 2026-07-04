import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import {
  CalendarDays, Clock, CheckCircle, XCircle, FileText,
  IndianRupee, User, ArrowRight, TrendingUp
} from 'lucide-react';

export default function Dashboard() {
  const { user }     = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const today   = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const employee = user?.employee || {};

  const quickActions = [
    { href: '/attendance', icon: CalendarDays, label: 'Mark Attendance', desc: 'Check in or out for today', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { href: '/leave',      icon: FileText,     label: 'Apply Leave',     desc: 'Request time off',          color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { href: '/payroll',    icon: IndianRupee,  label: 'View Payslips',   desc: 'Check salary details',      color: 'text-amber-600',   bg: 'bg-amber-50' },
    { href: '/profile',    icon: User,         label: 'Update Profile',  desc: 'Edit your information',     color: 'text-violet-600',  bg: 'bg-violet-50' },
  ];

  return (
    <div className="p-8 space-y-8 animate-fadeIn">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good {getGreeting()},{' '}
            <span className="text-indigo-600">{employee.fullName?.split(' ')[0] || 'Employee'}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">{today}</p>
        </div>
        {employee.employeeId && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 shadow-sm">
            <User size={14} className="text-slate-400" />
            <span className="font-medium">{employee.employeeId}</span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            icon={<CalendarDays size={20} className="text-indigo-600" />}
            iconBg="bg-indigo-50"
            label="Attendance This Month"
            value={stats.attendanceThisMonth}
            accent="border-l-indigo-500"
          />
          <StatCard
            icon={<Clock size={20} className="text-amber-600" />}
            iconBg="bg-amber-50"
            label="Pending Leaves"
            value={stats.pendingLeaves}
            accent="border-l-amber-500"
          />
          <StatCard
            icon={stats.todayAttendance
              ? <CheckCircle size={20} className="text-emerald-600" />
              : <XCircle    size={20} className="text-red-500" />}
            iconBg={stats.todayAttendance ? 'bg-emerald-50' : 'bg-red-50'}
            label="Today's Status"
            value={stats.todayAttendance ? 'Present' : 'Absent'}
            valueColor={stats.todayAttendance ? 'text-emerald-600' : 'text-red-500'}
            accent={stats.todayAttendance ? 'border-l-emerald-500' : 'border-l-red-500'}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-slate-400" />
          <h2 className="text-base font-semibold text-slate-800">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ href, icon: Icon, label, desc, color, bg }) => (
            <a
              key={href}
              href={href}
              className="group flex flex-col gap-3 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 card-hover"
            >
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-900">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, valueColor = 'text-slate-900', accent }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${accent} shadow-sm p-5 flex items-center gap-4 card-hover`}>
      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold ${valueColor} mt-0.5 leading-none`}>{value}</p>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
