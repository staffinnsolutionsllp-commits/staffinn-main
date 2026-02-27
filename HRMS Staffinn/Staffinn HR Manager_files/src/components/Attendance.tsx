import  { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, Plus, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useAttendance } from '../contexts/AttendanceContext'
import DeviceSetup from './DeviceSetup'

export default function Attendance() {
  const { user } = useAuth()
  const { stats, refreshStats, isLoading: attendanceLoading } = useAttendance()
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMarkForm, setShowMarkForm] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [checkInTime, setCheckInTime] = useState('')
  const [checkOutTime, setCheckOutTime] = useState('')
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showDeviceSetup, setShowDeviceSetup] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today

  // Get company credentials from user object (from DynamoDB)
  const companyId = user?.companyId || ''
  const apiKey = user?.apiKey || ''

  useEffect(() => {
    loadData()
    // Refresh stats when date changes
    refreshStats(selectedDate)
    
    const interval = setInterval(() => {
      // Only auto-refresh if viewing today's data
      if (isToday) {
        loadData()
        refreshStats(selectedDate)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [selectedDate, isToday])

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    try {
      const [attendanceResponse, employeesResponse] = await Promise.all([
        apiService.getAttendanceByDate(selectedDate),
        apiService.getEmployees()
      ])
      
      console.log('Attendance Response:', attendanceResponse)
      console.log('Employees Response:', employeesResponse)
      console.log('Employees Data:', employeesResponse.data)
      console.log('Number of employees:', employeesResponse.data?.length)
      
      if (attendanceResponse.success) {
        setAttendanceData(attendanceResponse.data)
      }
      
      if (employeesResponse.success) {
        setEmployees(employeesResponse.data)
      }
    } catch (error) {
      console.error('Error loading attendance data:', error)
      setError('Failed to load data. Please make sure you are logged in.')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!selectedEmployee || !checkInTime) {
      setError('Please select an employee and enter check-in time')
      return
    }

    if (checkOutTime && checkOutTime <= checkInTime) {
      setError('Check-out time must be after check-in time')
      return
    }

    try {
      const response = await apiService.markAttendance({
        employeeId: selectedEmployee,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        date: selectedDate
      })
      
      if (response.success) {
        await loadData()
        await refreshStats() // Refresh shared stats
        setShowMarkForm(false)
        setSelectedEmployee('')
        setCheckInTime('')
        setCheckOutTime('')
        setError('')
      } else {
        setError(response.message || 'Failed to mark attendance')
      }
    } catch (err: any) {
      console.error('Attendance error:', err)
      setError(err.message || 'Failed to mark attendance')
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to access attendance management.</p>
        </div>
      </div>
    )
  }

  if (loading || attendanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Track and manage employee attendance in real-time</p>
        </div>
        <div className="flex items-center space-x-4">
          {!showDeviceSetup && (
            <>
              <button
                onClick={() => setShowDeviceSetup(true)}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
              >
                Device Setup
              </button>
              <div className="flex items-center space-x-2 bg-white border rounded-lg px-3 py-2">
            <Calendar size={16} className="text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none outline-none bg-transparent text-sm"
            />
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={() => {
                  const date = new Date(selectedDate)
                  date.setDate(date.getDate() - 1)
                  setSelectedDate(date.toISOString().split('T')[0])
                }}
                className="p-1 hover:bg-gray-100 rounded"
                title="Previous day"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => {
                  const date = new Date(selectedDate)
                  date.setDate(date.getDate() + 1)
                  setSelectedDate(date.toISOString().split('T')[0])
                }}
                className="p-1 hover:bg-gray-100 rounded"
                title="Next day"
              >
                <ChevronRight size={14} />
              </button>
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(today)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  title="Go to today"
                >
                  Today
                </button>
              )}
            </div>
          </div>
          {isToday && (
            <button 
              onClick={() => setShowMarkForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>Mark Attendance</span>
            </button>
          )}
            </>  
          )}
        </div>
      </div>

      {showDeviceSetup ? (
        <div>
          <button
            onClick={() => setShowDeviceSetup(false)}
            className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Attendance
          </button>
          <DeviceSetup companyId={companyId} apiKey={apiKey} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Present Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.presentToday}/{stats.totalEmployees}</p>
              <p className="text-xs text-gray-500">
                {stats.attendanceRate}% attendance
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Late Arrivals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lateArrivals}</p>
              <p className="text-xs text-gray-500">After 9:30 AM</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Hours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgHours}h</p>
              <p className="text-xs text-gray-500">Daily average</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isToday ? 'Today\'s' : 'Historical'} Attendance - {new Date(selectedDate).toLocaleDateString()}
            </h3>
            {isToday && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((employee) => {
                const attendance = attendanceData.find(att => att.employeeId === employee.employeeId)
                const employeeName = employee.fullName || employee.name || 'Unknown'
                const employeePosition = employee.designation || employee.position || '-'
                return (
                  <tr key={employee.employeeId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{employeeName}</div>
                        <div className="text-sm text-gray-500">{employeePosition}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {attendance?.checkIn || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {attendance?.checkOut || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {attendance && attendance.hours ? `${Number(attendance.hours).toFixed(1)}h` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        !attendance ? 'bg-red-100 text-red-800' :
                        attendance.status === 'present' ? 'bg-green-100 text-green-800' : 
                        attendance.status === 'late' ? 'bg-orange-100 text-orange-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {attendance?.status || 'absent'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {employees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No employees found. Add employees first to track attendance.
            </div>
          )}
        </div>
      </div>

      {showMarkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Mark Attendance</h3>
              <button 
                onClick={() => {
                  setShowMarkForm(false)
                  setError('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-center space-x-2 p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleMarkAttendance} className="space-y-4">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => {
                  const hasAttendance = attendanceData.find(att => att.employeeId === employee.employeeId)
                  const employeeName = employee.fullName || employee.name || 'Unknown'
                  return (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employeeName} {hasAttendance ? '(Already marked)' : ''}
                    </option>
                  )
                })}
              </select>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check In Time *
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Out Time (Optional)
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMarkForm(false)
                    setError('')
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mark Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
 