import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { Calendar, Clock, CheckCircle, FileText, Briefcase, DollarSign, User, Bell } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.employee?.fullName || user?.user?.email}!</h1>
        <p className="text-gray-600">Employee ID: {user?.user?.employeeId}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Attendance This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.attendanceThisMonth}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Leaves</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingLeaves}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${stats.todayAttendance ? 'bg-green-100' : 'bg-red-100'}`}>
                <CheckCircle className={stats.todayAttendance ? 'text-green-600' : 'text-red-600'} size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today Status</p>
                <p className={`text-2xl font-bold ${stats.todayAttendance ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.todayAttendance ? 'Present' : 'Absent'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/attendance" className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
            <Calendar className="text-blue-600 mb-2" size={24} />
            <h3 className="font-semibold text-gray-900">Mark Attendance</h3>
            <p className="text-sm text-gray-600 mt-1">Check in/out for today</p>
          </a>

          <a href="/leave" className="p-4 border rounded-lg hover:border-green-500 hover:bg-green-50 transition">
            <FileText className="text-green-600 mb-2" size={24} />
            <h3 className="font-semibold text-gray-900">Apply Leave</h3>
            <p className="text-sm text-gray-600 mt-1">Request time off</p>
          </a>

          <a href="/payroll" className="p-4 border rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition">
            <DollarSign className="text-yellow-600 mb-2" size={24} />
            <h3 className="font-semibold text-gray-900">View Payslips</h3>
            <p className="text-sm text-gray-600 mt-1">Check salary details</p>
          </a>

          <a href="/profile" className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
            <User className="text-purple-600 mb-2" size={24} />
            <h3 className="font-semibold text-gray-900">Update Profile</h3>
            <p className="text-sm text-gray-600 mt-1">Edit your information</p>
          </a>
        </div>
      </div>
    </div>
  );
}
