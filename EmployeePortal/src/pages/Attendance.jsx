import { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { CalendarDays, Clock, CheckCircle, XCircle, TrendingUp, ChevronDown } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function Attendance() {
  const [attendance,    setAttendance]    = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => { loadAttendance(); }, [selectedMonth, selectedYear]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const r = await attendanceAPI.getMyAttendance(selectedMonth, selectedYear);
      setAttendance(r.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const parseTime = (raw, date) => {
    if (!raw) return null;
    if (raw.includes('T') || raw.includes('-')) return new Date(raw);
    return new Date(`${date}T${raw}:00`);
  };

  const present = attendance.filter(r => r.status?.toLowerCase() === 'present');
  const absent  = attendance.filter(r => r.status?.toLowerCase() !== 'present');
  const totalHrs = present.reduce((sum, r) => {
    const ci = parseTime(r.checkInTime  || r.checkIn,  r.date);
    const co = parseTime(r.checkOutTime || r.checkOut, r.date);
    return sum + (ci && co ? (co - ci) / 3600000 : 0);
  }, 0);

  const selectCls = 'px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer pr-8';

  return (
    <div className="p-7 space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Record</h1>
          <p className="text-slate-500 text-sm mt-0.5">View your attendance history</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className={selectCls}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className={selectCls}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Info banner — biometric only */}
      <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <Clock size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-900">Attendance via Biometric Device</p>
          <p className="text-xs text-indigo-600 mt-0.5">Your attendance is recorded automatically through the biometric system. Contact HR for any discrepancies.</p>
        </div>
      </div>

      {/* Summary stats */}
      {attendance.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: CheckCircle, label: 'Present Days',    val: present.length,          color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
            { icon: XCircle,     label: 'Absent Days',     val: absent.length,           color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-l-red-500' },
            { icon: TrendingUp,  label: 'Avg Daily Hours', val: present.length > 0 ? (totalHrs / present.length).toFixed(1) + 'h' : '—', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-l-indigo-500' },
          ].map(({ icon: Icon, label, val, color, bg, border }) => (
            <div key={label} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${border} p-4 flex items-center gap-3 card-hover`}>
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} className={color} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={`text-xl font-bold ${color} leading-tight`}>{val}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-slate-400" />
            <h2 className="font-semibold text-slate-800 text-sm">{MONTHS[selectedMonth - 1]} {selectedYear}</h2>
          </div>
          <span className="text-xs text-slate-400">{attendance.length} records</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading records…</span>
          </div>
        ) : attendance.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <CalendarDays size={22} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No records for {MONTHS[selectedMonth - 1]} {selectedYear}</p>
            <p className="text-xs text-slate-400">Attendance will appear here once synced from the biometric device</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Date', 'Check In', 'Check Out', 'Hours Worked', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendance.map((record, i) => {
                  const ci = parseTime(record.checkInTime  || record.checkIn,  record.date);
                  const co = parseTime(record.checkOutTime || record.checkOut, record.date);
                  const hrs = ci && co ? ((co - ci) / 3600000).toFixed(1) : null;
                  const present = record.status?.toLowerCase() === 'present';
                  return (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {ci ? ci.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {co ? co.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {hrs ? <span className="font-medium">{hrs}h</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                          present ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${present ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
