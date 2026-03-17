import { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadAttendance();
  }, [selectedMonth, selectedYear]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getMyAttendance(selectedMonth, selectedYear);
      console.log('Attendance response:', response.data);
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-6 lg:p-8">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
            <p className="text-gray-600 mt-1">Track and manage your attendance</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => markAttendance('check-in')}
              disabled={loading}
              className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              ✓ Check In
            </button>
            <button
              onClick={() => markAttendance('check-out')}
              disabled={loading}
              className="flex-1 min-w-[200px] bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              ✗ Check Out
            </button>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center gap-2">
            <CalendarIcon size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Attendance History - {months[selectedMonth - 1]} {selectedYear}
            </h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : attendance.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No attendance records found for {months[selectedMonth - 1]} {selectedYear}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Working Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.map((record, index) => {
                    const checkIn = record.checkInTime ? new Date(record.checkInTime) : null;
                    const checkOut = record.checkOutTime ? new Date(record.checkOutTime) : null;
                    const hours = checkIn && checkOut ? ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(1) : '-';
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {checkIn ? checkIn.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {checkOut ? checkOut.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {hours !== '-' ? `${hours}h` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'Present' || record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
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
