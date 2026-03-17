import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('employeeToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/employee/auth/login', { email, password }),
  changePassword: (currentPassword, newPassword) => api.post('/employee/auth/change-password', { currentPassword, newPassword }),
  getProfile: () => api.get('/employee/auth/profile')
};

export const dashboardAPI = {
  getStats: () => api.get('/employee/dashboard/stats')
};

export const attendanceAPI = {
  getMyAttendance: (month, year) => api.get('/employee/attendance', { params: { month, year } }),
  markAttendance: (type) => api.post('/employee/attendance/mark', { type })
};

export const leaveAPI = {
  getMyLeaves: () => api.get('/employee/leaves'),
  getLeaveBalance: () => api.get('/employee/leaves/balance'),
  applyLeave: (data) => api.post('/employee/leaves/apply', data),
  cancelLeave: (id) => api.delete(`/employee/leaves/${id}`)
};

export const payrollAPI = {
  getMyPayslips: () => api.get('/employee/payslips')
};

export const profileAPI = {
  updateProfile: (data) => api.put('/employee/profile', data)
};

export const claimAPI = {
  getMyClaims: () => api.get('/employee/claims'),
  getCategories: () => api.get('/employee/claims/categories'),
  submitClaim: (data) => api.post('/employee/claims', data)
};

export const taskAPI = {
  getMyTasks: () => api.get('/employee/tasks'),
  updateTask: (id, data) => api.put(`/employee/tasks/${id}`, data),
  getMyRatings: () => api.get('/employee/tasks/ratings')
};

export const grievanceAPI = {
  getMyGrievances: () => api.get('/employee/grievances'),
  submitGrievance: (data) => api.post('/employee/grievances', data),
  getAssignedGrievances: () => api.get('/employee/grievances/assigned'),
  updateGrievanceStatus: (id, data) => api.put(`/employee/grievances/${id}/status`, data)
};

export const organogramAPI = {
  getMyHierarchy: () => api.get('/employee/organogram'),
  getFullOrganogram: () => api.get('/employee/organogram/full'),
  getNodeDetails: (nodeId) => api.get(`/employee/organogram/node/${nodeId}`)
};

export default api;
