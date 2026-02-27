import { useState, useEffect } from 'react'
import { Plus, Users, X, AlertCircle } from 'lucide-react'
import { apiService } from '../services/api'
import { useAttendance } from '../contexts/AttendanceContext'

export default function Recruitment() {
  const { refreshStats } = useAttendance()
  const [candidates, setCandidates] = useState([])
  const [stats, setStats] = useState({
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    resumeUrl: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [candidatesResponse, statsResponse] = await Promise.all([
        apiService.getCandidates(),
        apiService.getCandidateStats()
      ])
      
      if (candidatesResponse.success) {
        setCandidates(candidatesResponse.data)
      }
      
      if (statsResponse.success) {
        setStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error loading candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    console.log('Form data:', candidateForm)
    
    if (!candidateForm.name || !candidateForm.email || !candidateForm.position) {
      setError('Please fill all required fields')
      return
    }

    try {
      console.log('Calling API to create candidate...')
      const response = await apiService.createCandidate(candidateForm)
      console.log('API Response:', response)
      
      if (response.success) {
        console.log('Candidate created successfully')
        await loadData()
        await refreshStats() // Refresh attendance stats when candidate is added
        setShowAddForm(false)
        setCandidateForm({ name: '', email: '', phone: '', position: '', resumeUrl: '', notes: '' })
      } else {
        console.error('API returned success=false:', response)
        setError(response.message || 'Failed to add candidate')
      }
    } catch (err) {
      console.error('Error creating candidate:', err)
      setError(err.message || 'Failed to add candidate')
    }
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onboarding & Recruitment</h1>
          <p className="text-gray-600">Manage candidates and hiring pipeline</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Add Candidate</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-xs">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="w-8 h-8 bg-gray-500 rounded-full mx-auto mb-2 flex items-center justify-center">
            <Users size={16} className="text-white" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600">Total</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Onboarding Pipeline</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {candidates.map((candidate) => (
                <tr key={candidate.employeeId || candidate.candidateId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{candidate.name}</div>
                      <div className="text-sm text-gray-500">{candidate.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{candidate.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {candidates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No candidates in pipeline yet. Add your first candidate to get started.
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Candidate</h3>
              <button 
                onClick={() => setShowAddForm(false)}
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

            <form onSubmit={handleAddCandidate} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={candidateForm.name}
                onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={candidateForm.email}
                onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={candidateForm.phone}
                onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Position *"
                value={candidateForm.position}
                onChange={(e) => setCandidateForm({ ...candidateForm, position: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="url"
                placeholder="Resume URL (Optional)"
                value={candidateForm.resumeUrl}
                onChange={(e) => setCandidateForm({ ...candidateForm, resumeUrl: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Notes (Optional)"
                value={candidateForm.notes}
                onChange={(e) => setCandidateForm({ ...candidateForm, notes: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
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
                  Add Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}