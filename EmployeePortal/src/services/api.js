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
  getProfile: () => api.get('/employee/auth/profile'),
  // Forgot password
  forgotPasswordSendOTP: (email) => api.post('/employee/auth/forgot-password/send-otp', { email }),
  forgotPasswordVerifyOTP: (email, otp) => api.post('/employee/auth/forgot-password/verify-otp', { email, otp }),
  forgotPasswordReset: (email, resetToken, newPassword) => api.post('/employee/auth/forgot-password/reset', { email, resetToken, newPassword }),
  forgotPasswordResendOTP: (email) => api.post('/employee/auth/forgot-password/resend-otp', { email })
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
  getLeaveTypes: () => api.get('/employee/leaves/types'),
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
  // Legacy v1
  getMyClaims: () => api.get('/employee/claims'),
  getCategories: () => api.get('/employee/claims/categories'),
  submitClaim: (data) => api.post('/employee/claims', data),
  // V2 Enterprise
  getClaimTypes: () => api.get('/employee/v2/claim-types'),
  getMyClaimsV2: () => api.get('/employee/v2/claims/my'),
  getClaimStatsV2: () => api.get('/employee/v2/claims/stats'),
  getClaimById: (id) => api.get(`/employee/v2/claims/${id}`),
  createClaim: (data) => api.post('/employee/v2/claims', data),
  updateClaim: (id, data) => api.put(`/employee/v2/claims/${id}`, data),
  submitClaimV2: (id) => api.post(`/employee/v2/claims/${id}/submit`),
  addLineItem: (claimId, data) => api.post(`/employee/v2/claims/${claimId}/line-items`, data),
  deleteLineItem: (claimId, lineItemId) => api.delete(`/employee/v2/claims/${claimId}/line-items/${lineItemId}`),
  // Attachment upload
  uploadAttachment: (claimId, formData) => api.post(
    `/employee/claims/${claimId}/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
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
  updateGrievanceStatus: (id, data) => api.put(`/employee/grievances/${id}/status`, data),
  getOrganizationEmployees: () => api.get('/employee/grievances/organization-employees'),
  getReportingManagers: () => api.get('/employee/grievances/reporting-managers'),
  uploadDocument: (grievanceId, formData) => api.post(
    `/employee/grievances/${grievanceId}/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
};

export const organogramAPI = {
  getMyHierarchy: () => api.get('/employee/organogram'),
  getSubordinatesHierarchy: () => api.get('/employee/organogram/subordinates'),
  getFullOrganogram: () => api.get('/employee/organogram/full'),
  getNodeDetails: (nodeId) => api.get(`/employee/organogram/node/${nodeId}`)
};

export const notificationAPI = {
  getNotifications: (limit = 50) => api.get('/employee/notifications', { params: { limit } }),
  getUnreadCount: () => api.get('/employee/notifications/unread-count'),
  markAsRead: (notificationId) => api.put(`/employee/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/employee/notifications/mark-all-read')
};

export const separationAPI = {
  submitResignation: (data) => api.post('/employee/separation/resign', data),
  getMyResignation:  ()     => api.get('/employee/separation/my'),
  getMyNDC:          (separationId) => api.get(`/employee/separation/${separationId}/ndc`),
  submitDeclaration: (separationId) => api.put(`/employee/separation/${separationId}/declaration`, {})
};

export default api;
