import { useState, useEffect } from 'react'
import { Search, Edit2 } from 'lucide-react'
import { apiService } from '../services/api'

export default function LeaveBalance() {
  const [balances, setBalances] = useState<any[]>([])
  const [filteredBalances, setFilteredBalances] = useState<any[]>([])
  const [leaveTypes, setLeaveTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [adjustmentData, setAdjustmentData] = useState({ employeeId: '', leaveType: '', adjustmentType: 'Add', days: '', reason: '' })
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadBalances()
    loadLeaveTypes()
  }, [])

  useEffect(() => {
    filterBalances()
  }, [balances, searchTerm, departmentFilter, yearFilter])

  const loadBalances = async () => {
    try {
      setLoading(true)
      const data = await apiService.getLeaveBalances()
      setBalances(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLeaveTypes = async () => {
    try {
      const rules = await apiService.getLeaveRules()
      const types = rules.map((rule: any) => rule.leaveName || rule.leaveType || rule.name).filter(Boolean)
      setLeaveTypes(types)
      console.log('✅ Loaded leave types:', types)
    } catch (error) {
      console.error('❌ Error loading leave types:', error)
    }
  }

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiService.adjustLeaveBalance(adjustmentData)
      setShowAdjustment(false)
      setAdjustmentData({ employeeId: '', leaveType: '', adjustmentType: 'Add', days: '', reason: '' })
      loadBalances()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filterBalances = () => {
    let filtered = balances
    if (searchTerm) filtered = filtered.filter(b => b.employeeName.toLowerCase().includes(searchTerm.toLowerCase()))
    if (departmentFilter) filtered = filtered.filter(b => b.department === departmentFilter)
    if (yearFilter) {
      filtered = filtered.filter(b => {
        const balanceYear = b.year || new Date(b.createdAt).getFullYear().toString()
        return balanceYear === yearFilter
      })
    }
    setFilteredBalances(filtered)
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg w-64" />
          </div>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="HR">HR</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowAdjustment(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit2 size={18} /><span>Manual Adjustment</span></button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allocated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carry Forward</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LWP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredBalances.map((balance, index) => (
              <tr key={index}>
                <td className="px-6 py-4"><div className="font-medium">{balance.employeeName}</div><div className="text-sm text-gray-500">{balance.employeeId}</div></td>
                <td className="px-6 py-4 text-sm">{balance.leaveType}</td>
                <td className="px-6 py-4 text-sm font-semibold">{balance.totalAllocated}</td>
                <td className="px-6 py-4 text-sm text-red-600">{balance.used}</td>
                <td className="px-6 py-4 text-sm"><span className={`font-semibold ${balance.remaining > 5 ? 'text-green-600' : balance.remaining > 0 ? 'text-orange-600' : 'text-red-600'}`}>{balance.remaining}</span></td>
                <td className="px-6 py-4 text-sm">{balance.carryForward || 0}</td>
                <td className="px-6 py-4 text-sm text-red-600">{balance.lwp || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdjustment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Manual Adjustment</h3>
              <button onClick={() => setShowAdjustment(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleAdjustment} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Employee *</label><select value={adjustmentData.employeeId} onChange={(e) => setAdjustmentData({ ...adjustmentData, employeeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required><option value="">Select</option>{balances.map((b, i) => <option key={i} value={b.employeeId}>{b.employeeName}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Leave Type *</label><select value={adjustmentData.leaveType} onChange={(e) => setAdjustmentData({ ...adjustmentData, leaveType: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required><option value="">Select Leave Type</option>{leaveTypes.length === 0 ? <option disabled>No leave types configured</option> : leaveTypes.map((type, i) => <option key={i} value={type}>{type}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Type *</label><div className="flex space-x-4"><label className="flex items-center"><input type="radio" value="Add" checked={adjustmentData.adjustmentType === 'Add'} onChange={(e) => setAdjustmentData({ ...adjustmentData, adjustmentType: e.target.value })} className="mr-2" />Add</label><label className="flex items-center"><input type="radio" value="Deduct" checked={adjustmentData.adjustmentType === 'Deduct'} onChange={(e) => setAdjustmentData({ ...adjustmentData, adjustmentType: e.target.value })} className="mr-2" />Deduct</label></div></div>
              <div><label className="block text-sm font-medium mb-1">Days *</label><input type="number" step="0.5" value={adjustmentData.days} onChange={(e) => setAdjustmentData({ ...adjustmentData, days: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Reason *</label><textarea value={adjustmentData.reason} onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} required /></div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowAdjustment(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Apply</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
