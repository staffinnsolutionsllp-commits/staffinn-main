import { useState, useEffect } from 'react'
import { Download, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react'
import { apiService } from '../services/api'

export default function LeaveAnalytics() {
  const [analytics, setAnalytics] = useState<any>({ departmentWise: [], monthlyTrend: [], leaveTypeUsage: [], leaveLiability: 0, lwpImpact: 0 })
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    loadAnalytics()
  }, [yearFilter])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const data = await apiService.getLeaveAnalytics(yearFilter)
      setAnalytics(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    const reportData = { year: yearFilter, ...analytics }
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leave-analytics-${yearFilter}.json`
    a.click()
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Leave Analytics & Reports</h2>
        <div className="flex space-x-3">
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            {[2024, 2023, 2022].map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <button onClick={downloadReport} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Download size={18} /><span>Download</span></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-full"><DollarSign className="text-purple-600" size={24} /></div>
            <div><p className="text-sm text-gray-600">Leave Liability</p><p className="text-2xl font-bold">₹{analytics.leaveLiability.toLocaleString()}</p></div>
          </div>
          <p className="text-sm text-gray-500">Total financial liability</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-red-100 rounded-full"><TrendingUp className="text-red-600" size={24} /></div>
            <div><p className="text-sm text-gray-600">LWP Impact</p><p className="text-2xl font-bold">₹{analytics.lwpImpact.toLocaleString()}</p></div>
          </div>
          <p className="text-sm text-gray-500">Payroll deductions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><Users className="mr-2" size={20} />Department-wise Usage</h3>
          <div className="space-y-3">
            {analytics.departmentWise.map((dept: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium">{dept.department}</span><span className="text-gray-600">{dept.totalLeaves} days</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(dept.totalLeaves / Math.max(...analytics.departmentWise.map((d: any) => d.totalLeaves))) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><Calendar className="mr-2" size={20} />Most Used Types</h3>
          <div className="space-y-3">
            {analytics.leaveTypeUsage.map((type: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium">{type.leaveType}</span><span className="text-gray-600">{type.count} requests</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${(type.count / Math.max(...analytics.leaveTypeUsage.map((t: any) => t.count))) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center"><TrendingUp className="mr-2" size={20} />Monthly Trend</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {analytics.monthlyTrend.map((month: any, index: number) => {
            const maxLeaves = Math.max(...analytics.monthlyTrend.map((m: any) => m.leaves))
            const height = maxLeaves > 0 ? (month.leaves / maxLeaves) * 100 : 0
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="text-xs text-gray-600 mb-1">{month.leaves}</div>
                <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors" style={{ height: `${height}%` }} title={`${month.month}: ${month.leaves} leaves`} />
                <div className="text-xs text-gray-600 mt-2">{month.month.substring(0, 3)}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Peak Month</p><p className="text-xl font-bold text-blue-600">{analytics.monthlyTrend.length > 0 ? analytics.monthlyTrend.reduce((max: any, m: any) => m.leaves > max.leaves ? m : max).month : 'N/A'}</p></div>
          <div className="p-4 bg-green-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Most Active Dept</p><p className="text-xl font-bold text-green-600">{analytics.departmentWise.length > 0 ? analytics.departmentWise.reduce((max: any, d: any) => d.totalLeaves > max.totalLeaves ? d : max).department : 'N/A'}</p></div>
          <div className="p-4 bg-purple-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Popular Type</p><p className="text-xl font-bold text-purple-600">{analytics.leaveTypeUsage.length > 0 ? analytics.leaveTypeUsage.reduce((max: any, t: any) => t.count > max.count ? t : max).leaveType : 'N/A'}</p></div>
        </div>
      </div>
    </div>
  )
}
