import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { apiService } from '../services/api'

export default function LeaveRules() {
  const [rules, setRules] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    leaveName: '', leaveCode: '', leaveCategory: 'Paid', description: '', effectiveFrom: '', totalLeavesPerYear: '', accrualType: 'Yearly', proRataCalculation: 'No', applicableAfterProbation: 'Yes', applicableTo: 'All', applicableDepartments: [], minLeaveDuration: '1', maxLeaveAtTime: '', advanceNoticeRequired: '0', backdatedLeaveAllowed: 'No', sandwichRuleEnabled: 'No', carryForwardAllowed: 'No', maxCarryForwardLimit: '', expiryPeriod: '', encashmentAllowed: 'No', allowNegativeLeave: 'No', maxNegativeLimit: '', approvalLevel: 'Single', approverRole: 'Manager', autoApproval: 'No', protocols: '', autoAllocate: 'Yes', isCarryForwardLeave: 'No'
  })

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      setLoading(true)
      const data = await apiService.getLeaveRules()
      setRules(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let response
      if (editingRule) {
        response = await apiService.updateLeaveRule(editingRule.ruleId, formData)
      } else {
        response = await apiService.createLeaveRule(formData)
        // Always auto-allocate when creating new leave type
        await allocateLeaveBalances(response.data || response)
      }
      
      setShowForm(false)
      setEditingRule(null)
      loadRules()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save leave type')
    }
  }

const allocateLeaveBalances = async (leaveRule: any) => {
    try {
      console.log('Starting allocation for:', leaveRule)
      
      // Get all employees
      const employeesResponse = await apiService.getCandidates()
      console.log('Employees response:', employeesResponse)
      
      if (!employeesResponse.success) {
        console.error('Failed to get employees')
        return
      }
      
      const employees = employeesResponse.data.filter((e: any) => {
        // Filter based on applicability
        if (formData.applicableTo === 'Department' && formData.applicableDepartments.length > 0) {
          return formData.applicableDepartments.includes(e.department)
        }
        return true // All employees
      })

      console.log(`Allocating to ${employees.length} employees:`, employees)

      // Create balance for each employee
      for (const employee of employees) {
        const balanceData = {
          employeeId: employee.employeeId,
          employeeName: employee.name,
          department: employee.department,
          leaveType: leaveRule.leaveName || formData.leaveName,
          totalAllocated: parseInt(formData.totalLeavesPerYear),
          used: 0,
          remaining: parseInt(formData.totalLeavesPerYear),
          carryForward: 0,
          lwp: 0
        }
        
        console.log('Creating balance:', balanceData)
        
        // Create balance entry in backend
        const response = await fetch('http://localhost:4001/api/v1/hrms/leaves/balances/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('hrms_token')}` },
          body: JSON.stringify(balanceData)
        })
        
        const result = await response.json()
        console.log('Balance created:', result)
      }
      
      alert(`Leave balances allocated to ${employees.length} employees successfully!`)
    } catch (error) {
      console.error('Error allocating balances:', error)
      alert('Failed to allocate balances. Check console for details.')
    }
  }

  const handleEdit = (rule: any) => {
    setEditingRule(rule)
    setFormData(rule)
    setShowForm(true)
  }

  const handleDelete = async (ruleId: string) => {
    const rule = rules.find(r => r.ruleId === ruleId)
    if (!rule) return
    
    if (confirm(`Delete "${rule.leaveName}"? This will also remove all employee balances for this leave type.`)) {
      try {
        // First delete the rule
        await apiService.deactivateLeaveRule(ruleId)
        
        // Then delete all balances for this leave type
        await deleteLeaveBalances(rule.leaveName)
        
        loadRules()
        alert('Leave type and all balances deleted successfully!')
      } catch (error) {
        console.error('Error:', error)
        alert('Failed to delete leave type')
      }
    }
  }

  const deleteLeaveBalances = async (leaveType: string) => {
    try {
      // Call backend to delete all balances for this leave type
      await fetch(`http://localhost:4001/api/v1/hrms/leaves/balances/delete-by-type?leaveType=${encodeURIComponent(leaveType)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('hrms_token')}` }
      })
      console.log(`Deleted all balances for: ${leaveType}`)
    } catch (error) {
      console.error('Error deleting balances:', error)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Leave Types & Policies</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={18} /><span>Add Leave Type</span></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => (
          <div key={rule.ruleId} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="text-lg font-semibold">{rule.leaveName}</h3><p className="text-sm text-gray-500">{rule.leaveCode}</p></div>
              <span className={`px-2 py-1 text-xs rounded-full ${rule.leaveCategory === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{rule.leaveCategory}</span>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-600">Total:</span><span className="font-semibold">{rule.totalLeavesPerYear} days/year</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Accrual:</span><span className="font-semibold">{rule.accrualType}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Carry Forward:</span><span className="font-semibold">{rule.carryForwardAllowed}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">CF Leave:</span><span className={`font-semibold ${rule.isCarryForwardLeave === 'Yes' ? 'text-blue-600' : 'text-gray-600'}`}>{rule.isCarryForwardLeave === 'Yes' ? 'Yes' : 'No'}</span></div>
            </div>
            {rule.protocols && (
              <div className="border-t pt-3 mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Leave Protocols:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {rule.protocols.split('\n').filter((p: string) => p.trim()).map((protocol: string, idx: number) => (
                    <li key={idx}>• {protocol.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex space-x-2">
              <button onClick={() => handleEdit(rule)} className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border rounded-lg hover:bg-gray-50"><Edit2 size={16} /><span>Edit</span></button>
              <button onClick={() => handleDelete(rule.ruleId)} className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={16} /><span>Delete</span></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">{editingRule ? 'Edit' : 'Add'} Leave Type</h3>
              <button onClick={() => { setShowForm(false); setEditingRule(null); }} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Leave Name *</label><input type="text" value={formData.leaveName} onChange={(e) => setFormData({ ...formData, leaveName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Leave Code *</label><input type="text" value={formData.leaveCode} onChange={(e) => setFormData({ ...formData, leaveCode: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Category</label><select value={formData.leaveCategory} onChange={(e) => setFormData({ ...formData, leaveCategory: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Effective From *</label><input type="date" value={formData.effectiveFrom} onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">Allocation Rules</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Total Leaves/Year *</label><input type="number" value={formData.totalLeavesPerYear} onChange={(e) => setFormData({ ...formData, totalLeavesPerYear: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Accrual Type</label><select value={formData.accrualType} onChange={(e) => setFormData({ ...formData, accrualType: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Yearly">Yearly</option><option value="One-time">One-time</option></select></div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Is Carry Forward Leave?</label>
                    <select value={formData.isCarryForwardLeave} onChange={(e) => setFormData({ ...formData, isCarryForwardLeave: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                      <option value="No">No - Regular Leave</option>
                      <option value="Yes">Yes - Carry Forward Leave</option>
                    </select>
                    {formData.isCarryForwardLeave === 'Yes' && (
                      <p className="text-xs text-blue-600 mt-1">💡 This leave will be automatically added from previous year's unused leaves</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">Applicability</h4>
                <div className="space-y-3">
                  <div><label className="block text-sm font-medium mb-1">Applicable To</label><select value={formData.applicableTo} onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="All">All Employees</option><option value="Department">Specific Departments</option></select></div>
                  {formData.applicableTo === 'Department' && (
                    <div><label className="block text-sm font-medium mb-1">Select Departments</label><div className="space-y-2">{['Engineering', 'HR', 'Sales', 'Marketing', 'Finance'].map(dept => (<label key={dept} className="flex items-center space-x-2"><input type="checkbox" checked={formData.applicableDepartments.includes(dept)} onChange={(e) => {const depts = e.target.checked ? [...formData.applicableDepartments, dept] : formData.applicableDepartments.filter(d => d !== dept); setFormData({ ...formData, applicableDepartments: depts })}} className="rounded" /><span className="text-sm">{dept}</span></label>))}</div></div>
                  )}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">✅ Leave balances will be automatically allocated to all employees</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">Leave Protocols</h4>
                <div>
                  <label className="block text-sm font-medium mb-1">Protocols (one per line)</label>
                  <textarea value={formData.protocols} onChange={(e) => setFormData({ ...formData, protocols: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={5} placeholder="Enter each protocol on a new line, e.g.:\nMinimum 1 day leave duration\nAdvance notice of 2 days required\nBackdated leaves not allowed" />
                  <p className="text-xs text-gray-500 mt-1">Each line will appear as a bullet point</p>
                </div>
              </div>
              <div className="flex space-x-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); setEditingRule(null); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingRule ? 'Update' : 'Create'} Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
