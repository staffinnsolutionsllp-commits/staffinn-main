import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Claims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchClaims();
    fetchCategories();
  }, []);

  const fetchClaims = async () => {
    try {
      console.log('Fetching claims...');
      const response = await api.get('/employee/claims');
      console.log('Claims response:', response.data);
      setClaims(response.data.data || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('Fetching claim categories...');
      const response = await api.get('/employee/claims/categories');
      console.log('Categories response:', response.data);
      
      if (response.data.success) {
        const cats = response.data.data || [];
        console.log(`Received ${cats.length} categories:`, cats);
        setCategories(cats);
      } else {
        console.error('Failed to fetch categories:', response.data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      console.error('Error response:', error.response?.data);
      setCategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting claim:', formData);
      const response = await api.post('/employee/claims', formData);
      console.log('Submit response:', response.data);
      alert('Claim submitted successfully');
      setShowForm(false);
      setFormData({ category: '', amount: '', description: '' });
      fetchClaims();
    } catch (error) {
      console.error('Error submitting claim:', error);
      console.error('Error response:', error.response?.data);
      alert('Error submitting claim: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Claim Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Submit New Claim'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Submit New Claim</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select Category</option>
                {categories.length === 0 ? (
                  <option value="" disabled>No categories available. Please contact your admin.</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.name}>{cat.name}</option>
                  ))
                )}
              </select>
              {categories.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  No claim categories found. Please contact your HR admin to add claim categories.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows="3"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Submit Claim
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
            ) : claims.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center">No claims found</td></tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.claimId}>
                  <td className="px-6 py-4 text-sm text-gray-900">{claim.claimId}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{claim.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">₹{claim.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(claim.submittedDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(claim.status)}`}>
                      {claim.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
