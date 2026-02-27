import { useState, useEffect } from 'react'
import { Plus, MessageSquare, Clock, CheckCircle, AlertTriangle, Send, X } from 'lucide-react'
import { apiService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface Grievance {
  grievanceId: string
  employeeId: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high'
  status: 'submitted' | 'in-review' | 'resolved' | 'closed'
  submittedDate: string
  assignedTo: string | null
  resolvedDate: string | null
  employee?: {
    name: string
    email: string
  }
  comments?: GrievanceComment[]
}

interface GrievanceComment {
  commentId: string
  grievanceId: string
  userId: string
  userName: string
  comment: string
  isInternal: boolean
  timestamp: string
}

export default function Grievances() {
  const { user } = useAuth()
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as const
  })

  const categories = [
    'Workplace Harassment',
    'Discrimination',
    'Work Environment',
    'Management Issues',
    'Policy Violations',
    'Safety Concerns',
    'Compensation',
    'Other'
  ]

  useEffect(() => {
    loadGrievances()
  }, [])

  const loadGrievances = async () => {
    try {
      setLoading(true)
      const response = user?.role === 'employee' 
        ? await apiService.getMyGrievances()
        : await apiService.getGrievances()
      
      if (response.success) {
        setGrievances(response.data)
      }
    } catch (error) {
      console.error('Error loading grievances:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await apiService.createGrievance(formData)
      if (response.success) {
        await loadGrievances()
        setShowAddForm(false)
        setFormData({ title: '', description: '', category: '', priority: 'medium' })
      }
    } catch (error) {
      console.error('Error submitting grievance:', error)
      alert('Failed to submit grievance')
    }
  }

  const handleStatusUpdate = async (grievanceId: string, status: string) => {
    try {
      const response = await apiService.updateGrievanceStatus(grievanceId, status)
      if (response.success) {
        await loadGrievances()
        if (selectedGrievance?.grievanceId === grievanceId) {
          setSelectedGrievance({ ...selectedGrievance, status: status as any })
        }
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update grievance status')
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGrievance || !newComment.trim()) return

    try {
      const response = await apiService.addGrievanceComment(
        selectedGrievance.grievanceId, 
        newComment,
        false
      )
      if (response.success) {
        setNewComment('')
        // Reload grievance details
        const updatedGrievances = await apiService.getGrievances()
        if (updatedGrievances.success) {
          setGrievances(updatedGrievances.data)
          const updated = updatedGrievances.data.find(g => g.grievanceId === selectedGrievance.grievanceId)
          if (updated) setSelectedGrievance(updated)
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Failed to add comment')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'in-review': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusCounts = () => {
    return {
      total: grievances.length,
      submitted: grievances.filter(g => g.status === 'submitted').length,
      inReview: grievances.filter(g => g.status === 'in-review').length,
      resolved: grievances.filter(g => g.status === 'resolved').length
    }
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading grievances...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grievance Management</h1>
          <p className="text-gray-600">Submit and track employee grievances</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Submit Grievance</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-100 rounded-full">
              <MessageSquare className="text-gray-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.submitted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Review</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.inReview}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Grievances</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grievances.map((grievance) => (
                <tr key={grievance.grievanceId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{grievance.title}</div>
                      {grievance.employee && (
                        <div className="text-sm text-gray-500">by {grievance.employee.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{grievance.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(grievance.priority)}`}>
                      {grievance.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(grievance.status)}`}>
                      {grievance.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(grievance.submittedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedGrievance(grievance)
                          setShowDetails(true)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                      {(user?.role === 'admin' || user?.role === 'hr') && (
                        <select
                          value={grievance.status}
                          onChange={(e) => handleStatusUpdate(grievance.grievanceId, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="submitted">Submitted</option>
                          <option value="in-review">In Review</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {grievances.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No grievances found. Submit your first grievance to get started.
            </div>
          )}
        </div>
      </div>

      {/* Add Grievance Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Submit New Grievance</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitGrievance} className="space-y-4">
              <input
                type="text"
                placeholder="Grievance Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category *</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              <textarea
                placeholder="Describe your grievance in detail *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                required
              />

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Grievance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grievance Details Modal */}
      {showDetails && selectedGrievance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Grievance Details</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">{selectedGrievance.title}</h4>
                <div className="flex space-x-4 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedGrievance.status)}`}>
                    {selectedGrievance.status}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedGrievance.priority)}`}>
                    {selectedGrievance.priority} priority
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Category: {selectedGrievance.category}</p>
                <p className="text-sm text-gray-600">
                  Submitted: {new Date(selectedGrievance.submittedDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedGrievance.description}</p>
              </div>

              {selectedGrievance.comments && selectedGrievance.comments.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Comments</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedGrievance.comments.map((comment) => (
                      <div key={comment.commentId} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm">{comment.userName}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleAddComment} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}