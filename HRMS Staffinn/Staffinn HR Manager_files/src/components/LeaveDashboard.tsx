import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'
import { apiService } from '../services/api'

export default function LeaveDashboard() {
  const [stats, setStats] = useState({ totalRequests: 0, approved: 0, pending: 0, rejected: 0 })
  const [leaves, setLeaves] = useState<any[]>([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [dateRange, department])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, leavesData] = await Promise.all([
        apiService.getLeaveStats(),
        apiService.getLeaves({ dateRange, department })
      ])
      setStats(statsData)
      setLeaves(leavesData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Leave Overview</h2>
        <div className="flex space-x-3">
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="HR">HR</option>
            <option value="Sales">Sales</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full"><Calendar className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-600">Total Requests</p><p className="text-2xl font-bold">{stats.totalRequests}</p></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full"><CheckCircle className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-gray-600">Approved</p><p className="text-2xl font-bold">{stats.approved}</p></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-full"><Clock className="text-orange-600" size={24} /></div>
            <div><p className="text-sm text-gray-600">Pending</p><p className="text-2xl font-bold">{stats.pending}</p></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full"><XCircle className="text-red-600" size={24} /></div>
            <div><p className="text-sm text-gray-600">Rejected</p><p className="text-2xl font-bold">{stats.rejected}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Leave Applications</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaves.slice(0, 10).map((leave) => (
                <tr key={leave.leaveId}>
                  <td className="px-4 py-3 text-sm">{leave.employeeName}</td>
                  <td className="px-4 py-3 text-sm">{leave.leaveType}</td>
                  <td className="px-4 py-3 text-sm">{leave.startDate} to {leave.endDate}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' : leave.status === 'Pending' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>{leave.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
