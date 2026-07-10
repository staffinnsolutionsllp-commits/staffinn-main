import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import {
  CalendarDays, CheckCircle, XCircle, Clock, FileText,
  IndianRupee, User, TrendingUp, ArrowRight, Briefcase,
  MessageSquare, CreditCard
} from 'lucide-react';

export default function Dashboard() {
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => { loadStats(); }, []);
  const loadStats = async () => {
    try { const r = await dashboardAPI.getStats(); setStats(r.data.data); } catch {}
  };

  const employee = user?.employee || {};
  const firstName = employee.fullName?.split(' ')[0] || 'Employee';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const quickActions = [
    { path:'/leave',      icon:FileText,     label:'Apply Leave',    desc:'Request time off',       color:'text-emerald-600', bg:'bg-emerald-50', border:'hover:border-emerald-200' },
    { path:'/payroll',    icon:IndianRupee,  label:'View Payslips',  desc:'Check salary details',   color:'text-violet-600',  bg:'bg-violet-50',  border:'hover:border-violet-200' },
    { path:'/claims',     icon:CreditCard,   label:'File a Claim',   desc:'Submit expense claim',   color:'text-amber-600',   bg:'bg-amber-50',   border:'hover:border-amber-200' },
    { path:'/tasks',      icon:TrendingUp,   label:'My Tasks',       desc:'Track your work',        color:'text-indigo-600',  bg:'bg-indigo-50',  border:'hover:border-indigo-200' },
    { path:'/grievances', icon:MessageSquare,label:'Grievances',     desc:'Submit or track',        color:'text-rose-600',    bg:'bg-rose-50',    border:'hover:border-rose-200' },
    { path:'/profile',    icon:User,         label:'My Profile',     desc:'Update your info',       color:'text-slate-600',   bg:'bg-slate-100',  border:'hover:border-slate-200' },
  ];

  return (
    <div className="p-7 space-y-6 animate-fadeIn">

      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#6366f1 50%,#818cf8 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative">
          <p className="text-indigo-200 text-sm font-medium">{getGreeting()}</p>
          <h1 className="text-2xl font-bold mt-0.5">{firstName} 👋</h1>
          <p className="text-indigo-200 text-xs mt-1">{today}</p>
          {employee.designation && (
            <div className="flex items-center gap-2 mt-3">
              <Briefcase size={13} className="text-indigo-300" />
              <span className="text-indigo-100 text-xs font-medium">{employee.designation} · {employee.department}</span>
            </div>
          )}
        </div>
        {employee.employeeId && (
          <div className="absolute top-5 right-5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            ID: {employee.employeeId}
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<CalendarDays size={18} />}
            label="Days Present"
            value={stats.attendanceThisMonth}
            sub="This month"
            color="text-indigo-600" bg="bg-indigo-50" accent="border-l-indigo-500"
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Pending Leaves"
            value={stats.pendingLeaves}
            sub="Awaiting approval"
            color="text-amber-600" bg="bg-amber-50" accent="border-l-amber-500"
          />
          <StatCard
            icon={stats.todayAttendance ? <CheckCircle size={18}/> : <XCircle size={18}/>}
            label="Today"
            value={stats.todayAttendance ? 'Present' : 'Absent'}
            sub={stats.todayAttendance ? 'Biometric checked in' : 'Not yet recorded'}
            color={stats.todayAttendance ? 'text-emerald-600' : 'text-red-500'}
            bg={stats.todayAttendance ? 'bg-emerald-50' : 'bg-red-50'}
            accent={stats.todayAttendance ? 'border-l-emerald-500' : 'border-l-red-500'}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map(({ path, icon: Icon, label, desc, color, bg, border }) => (
            <button key={path} onClick={() => navigate(path)}
              className={`group flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 ${border} hover:shadow-sm transition-all duration-150 text-left`}>
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon size={17} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{desc}</p>
              </div>
              <ArrowRight size={13} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Leave balance hint */}
      {stats && (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={14} className="text-indigo-500" />
          </div>
          <p className="text-sm text-slate-600">
            You have <strong className="text-slate-900">{stats.pendingLeaves}</strong> pending leave request{stats.pendingLeaves !== 1 ? 's' : ''}.
            {stats.pendingLeaves > 0 ? ' Your manager will review them shortly.' : ' All clear!'}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, bg, accent }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${accent} shadow-sm p-4 flex items-center gap-3 card-hover`}>
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={`text-xl font-bold ${color} leading-tight mt-0.5`}>{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
