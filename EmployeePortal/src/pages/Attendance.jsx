import { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { CalendarDays, LogIn, LogOut, Clock } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function Attendance() {
  const [attendance,     setAttendance]     = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [selectedMonth,  setSelectedMonth]  = useState(new Date().getMonth() + 1);
  const [selectedYear,   setSelectedYear]   = useState(new Date().getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => { loadAttendance(); }, [selectedMonth, selectedYear]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getMyAttendance(selectedMonth, selectedYear);
      setAttendance(response.data.data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (type) => {
    setLoading(true);
    try {
      await attendanceAPI.markAttendance(type);
      alert(`${type === 'check-in' ? 'Check-in' : 'Check-out'} successful!`);
      loadAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const presentCount = attendance.filter(r => r.status?.toLowerCase() === 'present').length;
  const absentCount  = attendance.filter(r => r.status?.toLowerCase() !== 'present').length;

  return (
    <div className="p-8 space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track and manage your daily attendance</p>
        </div>
        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary chips */}
      {attendance.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Present: {presentCount}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Absent: {absentCount}
          </div>
        </div>
      )}

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => markAttendance('check-in')}
          disabled={loading}
          className="flex items-center gap-4 p-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl transition-all duration-200 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 group"
        >
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <LogIn size={22} />
          </div>
          <div className="text-left">
            <p className="font-bold text-base">Check In</p>
            <p className="text-emerald-100 text-xs mt-0.5">Mark your arrival</p>
          </div>
        </button>

        <button
          onClick={() => markAttendance('check-out')}
          disabled={loading}
          className="flex items-center gap-4 p-5 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white rounded-2xl transition-all duration-200 shadow-md shadow-slate-500/20 hover:shadow-lg disabled:opacity-50 group"
        >
          <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <LogOut size={22} />
          </div>
          <div className="text-left">
            <p className="font-bold text-base">Check Out</p>
            <p className="text-slate-300 text-xs mt-0.5">Mark your departure</p>
          </div>
        </button>
      </div>

      {/* History table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden card-hover">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <CalendarDays size={18} className="text-slate-400" />
          <h2 className="font-semibold text-slate-800">
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <Clock size={20} className="animate-spin" />
              <span className="text-sm">Loading records…</span>
            </div>
          ) : attendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <CalendarDays size={40} className="text-slate-200" />
              <p className="text-sm font-medium text-slate-500">No records for {MONTHS[selectedMonth - 1]} {selectedYear}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Date', 'Check In', 'Check Out', 'Hours', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendance.map((record, i) => {
                  // Support both field name formats:
                  // - HRMS device/manual: checkIn / checkOut (plain "HH:MM" strings)
                  // - Portal self-mark:   checkInTime / checkOutTime (ISO timestamps)
                  const rawIn  = record.checkInTime  || record.checkIn  || null;
                  const rawOut = record.checkOutTime || record.checkOut || null;

                  // Parse: ISO timestamp → Date object, plain "HH:MM" → prefix with date
                  const parseTime = (raw) => {
                    if (!raw) return null;
                    if (raw.includes('T') || raw.includes('-')) return new Date(raw); // ISO
                    return new Date(`${record.date}T${raw}:00`); // plain HH:MM
                  };

                  const checkIn  = parseTime(rawIn);
                  const checkOut = parseTime(rawOut);
                  const hours    = checkIn && checkOut ? ((checkOut - checkIn) / 3600000).toFixed(1) : '—';
                  const isPresent = record.status?.toLowerCase() === 'present';
                  return (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-800">{record.date}</td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {checkIn ? checkIn.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {checkOut ? checkOut.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">{hours !== '—' ? `${hours}h` : '—'}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                          isPresent ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
