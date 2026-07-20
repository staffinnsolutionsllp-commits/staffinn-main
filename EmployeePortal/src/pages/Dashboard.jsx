import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, attendanceAPI, leaveAPI, taskAPI, grievanceAPI, dtrAPI } from '../services/api';
import {
  CalendarDays, CheckCircle, XCircle, Clock, FileText,
  IndianRupee, TrendingUp, Briefcase, MessageSquare,
  CreditCard, ClipboardList, PlaneTakeoff, Network
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => { loadStats(); }, []);

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try { const r = await dashboardAPI.getStats(); setStats(r.data.data); } catch {}
  };

  const employee = user?.employee || {};
  const firstName = employee.fullName?.split(' ')[0] || 'Employee';

  const statCards = [
    { icon: CalendarDays, label: 'Days Present', value: stats?.attendanceThisMonth ?? '—', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: stats?.todayAttendance ? CheckCircle : XCircle, label: "Today's Status", value: stats?.todayAttendance ? 'Present' : 'Absent', color: stats?.todayAttendance ? 'text-green-600' : 'text-red-500', bg: stats?.todayAttendance ? 'bg-green-50' : 'bg-red-50' },
    { icon: PlaneTakeoff, label: 'Pending Leaves', value: stats?.pendingLeaves ?? '—', color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: ClipboardList, label: 'Active Tasks', value: stats?.activeTasks ?? '—', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: FileText, label: 'DTR Today', value: stats?.dtrSubmittedToday ? 'Submitted' : 'Pending', color: stats?.dtrSubmittedToday ? 'text-green-600' : 'text-amber-600', bg: stats?.dtrSubmittedToday ? 'bg-green-50' : 'bg-amber-50' },
    { icon: CreditCard, label: 'Pending Claims', value: stats?.pendingClaims ?? '—', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: MessageSquare, label: 'Grievances', value: stats?.openGrievances ?? '—', color: 'text-rose-600', bg: 'bg-rose-50' },
    { icon: IndianRupee, label: 'Last Salary', value: stats?.lastSalary ? `₹${Number(stats.lastSalary).toLocaleString('en-IN')}` : '—', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-gray-500 text-xs">{getGreeting()}</p>
          <h1 className="text-lg font-semibold text-gray-900 mt-0.5">{employee.fullName || firstName}</h1>
          {employee.designation && (
            <div className="flex items-center gap-1.5 mt-1">
              <Briefcase size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500">{employee.designation} · {employee.department}</span>
            </div>
          )}
        </div>
        {employee.employeeId && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">ID: {employee.employeeId}</span>
        )}
      </div>

      {/* Analog Clock + Date */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row items-center gap-5">
        <AnalogClock time={time} />
        <div className="text-center sm:text-left">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon size={15} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 font-medium truncate">{label}</p>
                <p className={`text-sm font-bold ${color} leading-tight mt-0.5`}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Analog Clock Component ── */
function AnalogClock({ time }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;

    ctx.clearRect(0, 0, size, size);

    // Clock face
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hour markers
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6 - Math.PI / 2;
      const innerR = radius - 10;
      const outerR = radius - 3;
      ctx.beginPath();
      ctx.moveTo(center + innerR * Math.cos(angle), center + innerR * Math.sin(angle));
      ctx.lineTo(center + outerR * Math.cos(angle), center + outerR * Math.sin(angle));
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Minute markers
    for (let i = 0; i < 60; i++) {
      if (i % 5 !== 0) {
        const angle = (i * Math.PI) / 30 - Math.PI / 2;
        const innerR = radius - 5;
        const outerR = radius - 3;
        ctx.beginPath();
        ctx.moveTo(center + innerR * Math.cos(angle), center + innerR * Math.sin(angle));
        ctx.lineTo(center + outerR * Math.cos(angle), center + outerR * Math.sin(angle));
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    // Hour hand
    const hourAngle = ((hours + minutes / 60) * Math.PI) / 6 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + (radius * 0.5) * Math.cos(hourAngle), center + (radius * 0.5) * Math.sin(hourAngle));
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Minute hand
    const minAngle = ((minutes + seconds / 60) * Math.PI) / 30 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + (radius * 0.7) * Math.cos(minAngle), center + (radius * 0.7) * Math.sin(minAngle));
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Second hand
    const secAngle = (seconds * Math.PI) / 30 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + (radius * 0.75) * Math.cos(secAngle), center + (radius * 0.75) * Math.sin(secAngle));
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(center, center, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#1f2937';
    ctx.fill();
  }, [time]);

  return <canvas ref={canvasRef} width={140} height={140} className="flex-shrink-0" />;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
