import { useState, useEffect } from 'react'
import { DollarSign, Filter, Download, Eye, CheckCircle, XCircle, Clock, Plus, Edit2, Trash2, Settings } from 'lucide-react'
import { apiService } from '../services/api'

export default function ClaimManagement() {
  const [claims, setClaims] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ category: '', status: '', employeeId: '' })
  const [selectedClaim, setSelectedClaim] = useState<any>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [editingCategory, setEditingCategory] = useState<any>(null)

  useEffect(() => {
    loadClaims()
    loadStats()
    loadCategories()
  }, [filters])

  const loadCategories = async () => {
    try {
      const response = await apiService.getClaimCategories()
      if (response.success) setCategories(response.data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadClaims = async () => {
    try {
      const response = await apiService.getClaims(filters)
      if (response.success) setClaims(response.data)
    } catch (error) {
      console.error('Error loading claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiService.getClaimStats()
      if (response.success) setStats(response.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleApprove = async (claimId: string) => {
    if (!confirm('Approve this claim?')) return
    try {
      await apiService.updateClaimStatus(claimId, 'Approved', '')
      loadClaims()
      loadStats()
      setSelectedClaim(null)
    } catch (error) {
      alert('Failed to approve claim')
    }
  }

  const handleReject = async (claimId: string) => {
    const remarks = prompt('Enter rejection remarks:')
    if (!remarks) return
    try {
      await apiService.updateClaimStatus(claimId, 'Rejected', remarks)
      loadClaims()
      loadStats()
      setSelectedClaim(null)
    } catch (error) {
      alert('Failed to reject claim')
    }
  }

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await apiService.updateClaimCategory(editingCategory.categoryId, categoryForm)
        setEditingCategory(null)
      } else {
        await apiService.createClaimCategory(categoryForm)
      }
      loadCategories()
      setCategoryForm({ name: '', description: '' })
    } catch (error) {
      alert('Failed to save category')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Delete this category?')) return
    try {
      await apiService.deleteClaimCategory(categoryId)
      loadCategories()
    } catch (error) {
      alert('Failed to delete category')
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claim Management</h1>
          <p className="text-gray-600">Manage employee claims and reimbursements</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowCategoryModal(true)} className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Settings size={18} />
            <span>Manage Categories</span>
          </button>
          <button onClick={() => apiService.exportClaims()} className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full"><DollarSign className="text-blue-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Total Claims</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-full"><Clock className="text-orange-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full"><CheckCircle className="text-green-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full"><XCircle className="text-red-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4 mb-4">
          <Filter size={20} className="text-gray-500" />
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="px-3 py-2 border rounded-lg">
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat.categoryId} value={cat.name}>{cat.name}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border rounded-lg">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {claims.map((claim) => (
                <tr key={claim.claimId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{claim.claimId.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{claim.employeeName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{claim.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">₹{claim.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(claim.submittedDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      claim.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      claim.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>{claim.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedClaim(claim)} className="text-blue-600 hover:text-blue-800">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">Claim Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-medium">Employee:</span> {selectedClaim.employeeName}</div>
                <div><span className="font-medium">Category:</span> {selectedClaim.category}</div>
                <div><span className="font-medium">Amount:</span> ₹{selectedClaim.amount}</div>
                <div><span className="font-medium">Date:</span> {new Date(selectedClaim.submittedDate).toLocaleDateString()}</div>
              </div>
              <div><span className="font-medium">Description:</span> {selectedClaim.description}</div>
              {selectedClaim.remarks && <div><span className="font-medium">Remarks:</span> {selectedClaim.remarks}</div>}
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setSelectedClaim(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
              {selectedClaim.status === 'Pending' && (
                <>
                  <button onClick={() => handleReject(selectedClaim.claimId)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
                  <button onClick={() => handleApprove(selectedClaim.claimId)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Manage Claim Categories</h3>
            
            <div className="mb-6">
              <div className="flex space-x-3 mb-4">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <button onClick={handleSaveCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Plus size={18} />
                  <span>{editingCategory ? 'Update' : 'Add'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.categoryId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description && <p className="text-sm text-gray-500">{category.description}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingCategory(category)
                        setCategoryForm({ name: category.name, description: category.description || '' })
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.categoryId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowCategoryModal(false)
                  setCategoryForm({ name: '', description: '' })
                  setEditingCategory(null)
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
