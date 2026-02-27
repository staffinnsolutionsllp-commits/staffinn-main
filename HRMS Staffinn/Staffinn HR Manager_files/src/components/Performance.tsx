import  { useState } from 'react'
import { Plus, Star, TrendingUp, X, AlertCircle } from 'lucide-react'
import { Employee } from '../types'
import { database } from '../store/database'

interface PerformanceReview {
  id: string
  employeeId: string
  reviewPeriod: string
  goals: string
  achievements: string
  rating: number
  feedback: string
  reviewedBy: string
  createdAt: string
}

export default function Performance() {
  const [employees] = useState<Employee[]>(database.getEmployees())
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')
  const [reviewForm, setReviewForm] = useState({
    employeeId: '',
    reviewPeriod: '',
    goals: '',
    achievements: '',
    rating: 3,
    feedback: ''
  })

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!reviewForm.employeeId || !reviewForm.reviewPeriod) {
      setError('Please select employee and review period')
      return
    }

    const newReview: PerformanceReview = {
      id: Date.now().toString(),
      ...reviewForm,
      reviewedBy: 'Current User',
      createdAt: new Date().toISOString()
    }

    setReviews([...reviews, newReview])
    setShowAddForm(false)
    setReviewForm({
      employeeId: '',
      reviewPeriod: '',
      goals: '',
      achievements: '',
      rating: 3,
      feedback: ''
    })
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? employee.name : 'Unknown'
  }

  const getAverageRating = () => {
    if (reviews.length === 0) return 0
    return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-600">Track employee performance and conduct reviews</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Add Review</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">{getAverageRating()}/5</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Performers</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviews.filter(r => r.rating >= 4).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Performance Reviews</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Goals</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Achievements</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{getEmployeeName(review.employeeId)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{review.reviewPeriod}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{review.goals}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{review.achievements}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{review.feedback}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No performance reviews conducted yet.
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Performance Review</h3>
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

            <form onSubmit={handleAddReview} className="space-y-4">
              <select
                value={reviewForm.employeeId}
                onChange={(e) => setReviewForm({ ...reviewForm, employeeId: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Review Period (e.g., Q1 2024)"
                value={reviewForm.reviewPeriod}
                onChange={(e) => setReviewForm({ ...reviewForm, reviewPeriod: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <textarea
                placeholder="Goals and Objectives"
                value={reviewForm.goals}
                onChange={(e) => setReviewForm({ ...reviewForm, goals: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                rows={3}
              />
              <textarea
                placeholder="Key Achievements"
                value={reviewForm.achievements}
                onChange={(e) => setReviewForm({ ...reviewForm, achievements: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                rows={3}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performance Rating
                </label>
                <div className="flex items-center space-x-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating })}
                      className="flex items-center space-x-1"
                    >
                      <Star
                        size={24}
                        className={rating <= reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                      />
                      <span className="text-sm">{rating}</span>
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Feedback and Comments"
                value={reviewForm.feedback}
                onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                rows={3}
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
                  Add Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 