import { useState, useEffect } from 'react';
import { leaveAPI } from '../services/api';

export default function Leave() {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    loadLeaves();
    loadBalance();
    loadLeaveTypes();
  }, []);

  const loadLeaves = async () => {
    try {
      const response = await leaveAPI.getMyLeaves();
      setLeaves(response.data.data);
    } catch (error) {
      console.error('Error loading leaves:', error);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await leaveAPI.getLeaveBalance();
      setBalance(response.data.data);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const response = await leaveAPI.getLeaveTypes();
      const types = response.data.data || [];
      setLeaveTypes(types);
      // Set first leave type as default if available
      if (types.length > 0 && !formData.leaveType) {
        setFormData(prev => ({ ...prev, leaveType: types[0] }));
      }
    } catch (error) {
      console.error('Error loading leave types:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.applyLeave(formData);
      alert('Leave applied successfully!');
      setShowForm(false);
      setFormData({ leaveType: leaveTypes[0] || '', startDate: '', endDate: '', reason: '' });
      loadLeaves();
      loadBalance();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to apply leave');
    }
  };

  const handleCancel = async (id) => {
    if (confirm('Are you sure you want to cancel this leave?')) {
      try {
        await leaveAPI.cancelLeave(id);
        alert('Leave cancelled successfully!');
        loadLeaves();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to cancel leave');
      }
    }
  };

  return (
    <div className="p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600 mt-1">Apply and track your leaves</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={leaveTypes.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Apply Leave
          </button>
        </div>

        {/* Leave Balance Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h2>
          {balance.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leave Balance Found</h3>
              <p className="text-gray-600 mb-4">Your leave balance hasn't been set up yet.</p>
              <p className="text-sm text-gray-500">Please contact HR to configure your leave balance.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {balance.map((b, i) => (
                <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">{b.leaveType}</h3>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-4xl font-bold text-blue-600">{b.balance || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Days Available</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 pt-3 border-t border-blue-200">
                    <div>
                      <p className="font-medium">Total: {b.totalAllocated || 0}</p>
                    </div>
                    <div>
                      <p className="font-medium">Used: {b.used || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave History */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Leave History</h2>
          </div>
          <div className="overflow-x-auto">
            {leaves.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No leave applications found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaves.map((leave) => (
                    <tr key={leave.leaveId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{leave.leaveType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{leave.startDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{leave.endDate}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {leave.status === 'Pending' && (
                          <button
                            onClick={() => handleCancel(leave.leaveId)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Apply Leave Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Apply for Leave</h3>
              
              {leaveTypes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Leave Types Available</h4>
                  <p className="text-sm text-gray-600 mb-6">Leave types haven't been configured yet. Please contact HR to set up leave types.</p>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                    <select
                      value={formData.leaveType}
                      onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {leaveTypes.map((type, index) => (
                        <option key={index} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      required
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
