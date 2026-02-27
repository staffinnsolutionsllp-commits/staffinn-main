import { useState, useEffect } from 'react'
import { Search, Download, CheckCircle, XCircle, Eye } from 'lucide-react'
import { apiService } from '../services/api'

export default function LeaveLogs() {
  const [leaves, setLeaves] = useState<any[]>([])
  const [filteredLeaves, setFilteredLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [viewingLeave, setViewingLeave] = useState<any>(null)
  const itemsPerPage = 10

  useEffect(() => {
    loadLeaves()
  }, [yearFilter])

  useEffect(() => {
    filterLeaves()
  }, [leaves, searchTerm, statusFilter])

  const loadLeaves = async () => {
    try {
      setLoading(true)
      const data = await apiService.getLeaves({ year: yearFilter })
      setLeaves(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLeaves = () => {
    let filtered = leaves
    if (searchTerm) filtered = filtered.filter(l => l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || l.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    if (statusFilter) filtered = filtered.filter(l => l.status === statusFilter)
    setFilteredLeaves(filtered)
  }

  const handleApprove = async (leaveId: string) => {
    try {
      await apiService.updateLeaveStatus(leaveId, 'Approved')
      loadLeaves()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleReject = async (leaveId: string) => {
    try {
      await apiService.updateLeaveStatus(leaveId, 'Rejected')
      loadLeaves()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleBulkApprove = async () => {
    try {
      await Promise.all(selectedLeaves.map(id => apiService.updateLeaveStatus(id, 'Approved')))
      setSelectedLeaves([])
      loadLeaves()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status']
    const rows = filteredLeaves.map(l => [l.employeeId, l.employeeName, l.department, l.leaveType, l.startDate, l.endDate, l.numberOfDays, l.status])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leave-logs-${yearFilter}.csv`
    a.click()
  }

  const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage)

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg w-64" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            {[2024, 2023, 2022].map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <div className="flex space-x-3">
          {selectedLeaves.length > 0 && <button onClick={handleBulkApprove} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><CheckCircle size={18} /><span>Approve ({selectedLeaves.length})</span></button>}
          <button onClick={exportToCSV} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Download size={18} /><span>Export CSV</span></button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left"><input type="checkbox" onChange={(e) => setSelectedLeaves(e.target.checked ? paginatedLeaves.map(l => l.leaveId) : [])} checked={selectedLeaves.length === paginatedLeaves.length && paginatedLeaves.length > 0} /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedLeaves.map((leave) => (
              <tr key={leave.leaveId}>
                <td className="px-4 py-3"><input type="checkbox" checked={selectedLeaves.includes(leave.leaveId)} onChange={(e) => setSelectedLeaves(e.target.checked ? [...selectedLeaves, leave.leaveId] : selectedLeaves.filter(id => id !== leave.leaveId))} /></td>
                <td className="px-4 py-3 text-sm">{leave.employeeName}</td>
                <td className="px-4 py-3 text-sm">{leave.leaveType}</td>
                <td className="px-4 py-3 text-sm">{leave.startDate}</td>
                <td className="px-4 py-3 text-sm">{leave.endDate}</td>
                <td className="px-4 py-3 text-sm">{leave.numberOfDays}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' : leave.status === 'Pending' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>{leave.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button onClick={() => setViewingLeave(leave)} className="text-blue-600 hover:text-blue-800"><Eye size={18} /></button>
                    {leave.status === 'Pending' && <><button onClick={() => handleApprove(leave.leaveId)} className="text-green-600 hover:text-green-800"><CheckCircle size={18} /></button><button onClick={() => handleReject(leave.leaveId)} className="text-red-600 hover:text-red-800"><XCircle size={18} /></button></>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t flex justify-between">
          <div className="text-sm text-gray-600">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLeaves.length)} of {filteredLeaves.length}</div>
          <div className="flex space-x-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {viewingLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Leave Details</h3>
              <button onClick={() => setViewingLeave(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="font-semibold">Employee:</span> {viewingLeave.employeeName}</div>
              <div><span className="font-semibold">Leave Type:</span> {viewingLeave.leaveType}</div>
              <div><span className="font-semibold">Start:</span> {viewingLeave.startDate}</div>
              <div><span className="font-semibold">End:</span> {viewingLeave.endDate}</div>
              <div><span className="font-semibold">Days:</span> {viewingLeave.numberOfDays}</div>
              <div><span className="font-semibold">Status:</span> {viewingLeave.status}</div>
              <div className="col-span-2"><span className="font-semibold">Reason:</span> {viewingLeave.reason || '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
