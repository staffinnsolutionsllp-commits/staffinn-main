const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.staffinn.com/api/v1/hrms'
  : 'http://localhost:4001/api/v1/hrms';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('hrms_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('hrms_token', token);
      console.log('Token set:', token.substring(0, 20) + '...');
    } else {
      localStorage.removeItem('hrms_token');
      console.log('Token removed');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    console.log('API Request:', { url, config });

    try {
      const response = await fetch(url, config);
      console.log('API Response status:', response.status);
      
      const data = await response.json();
      console.log('API Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth methods
  async checkRecruiterRegistration(recruiterId) {
    return this.request(`/auth/check-recruiter/${recruiterId}`);
  }

  async login(email, password, recruiterId = null) {
    const body = { email, password };
    if (recruiterId) body.recruiterId = recruiterId;
    
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async register(name, email, password, role = 'admin', recruiterId) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, recruiterId }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  logout() {
    this.setToken(null);
  }

  // Employee methods
  async getEmployees() {
    return this.request('/employees');
  }

  async createEmployee(employeeData) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  async updateEmployee(id, employeeData) {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  }

  async deleteEmployee(id) {
    return this.request(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Organization methods
  async getOrganizationChart() {
    return this.request('/organization');
  }

  async createOrgNode(nodeData) {
    return this.request('/organization', {
      method: 'POST',
      body: JSON.stringify(nodeData),
    });
  }

  async updateOrgNode(id, nodeData) {
    return this.request(`/organization/${id}`, {
      method: 'PUT',
      body: JSON.stringify(nodeData),
    });
  }

  async deleteOrgNode(id) {
    return this.request(`/organization/${id}`, {
      method: 'DELETE',
    });
  }

  // Grievance methods
  async getGrievances() {
    return this.request('/grievances');
  }

  async getMyGrievances() {
    return this.request('/grievances/my');
  }

  async createGrievance(grievanceData) {
    return this.request('/grievances', {
      method: 'POST',
      body: JSON.stringify(grievanceData),
    });
  }

  async addGrievanceComment(id, comment, isInternal = false) {
    return this.request(`/grievances/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment, isInternal }),
    });
  }

  // Attendance methods
  async getAttendanceStats(date = null) {
    const endpoint = date ? `/attendance/stats?date=${date}` : '/attendance/stats';
    return this.request(endpoint);
  }

  async getAttendanceByDate(date) {
    return this.request(`/attendance/date/${date}`);
  }

  async markAttendance(attendanceData) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  // Candidate methods
  async getCandidates() {
    return this.request('/candidates');
  }

  async getCandidateById(id) {
    return this.request(`/candidates/${id}`);
  }

  async getCandidateStats() {
    return this.request('/candidates/stats');
  }

  async createCandidate(candidateData) {
    console.log('API: Creating candidate with data:', candidateData);
    try {
      const response = await this.request('/candidates', {
        method: 'POST',
        body: JSON.stringify(candidateData),
      });
      console.log('API: Candidate creation response:', response);
      return response;
    } catch (error) {
      console.error('API: Candidate creation error:', error);
      throw error;
    }
  }

  async updateCandidate(id, candidateData) {
    return this.request(`/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(candidateData),
    });
  }

  async updateCandidateStatus(id, status, interviewDate, notes) {
    return this.request(`/candidates/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, interviewDate, notes }),
    });
  }

  async deleteCandidate(id) {
    return this.request(`/candidates/${id}`, {
      method: 'DELETE',
    });
  }

  // Leave Management methods
  async getLeaveStats() {
    const response = await this.request('/leaves/stats');
    return response.data || response;
  }

  async getLeaves(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await this.request(`/leaves${params ? `?${params}` : ''}`);
    return response.data || response;
  }

  async getLeaveById(leaveId) {
    const response = await this.request(`/leaves/${leaveId}`);
    return response.data || response;
  }

  async createLeave(leaveData) {
    return this.request('/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
  }

  async updateLeaveStatus(leaveId, status, approvedBy = null) {
    return this.request(`/leaves/${leaveId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, approvedBy }),
    });
  }

  async getLeaveRules() {
    const response = await this.request('/leaves/rules');
    return response.data || response;
  }

  async createLeaveRule(ruleData) {
    return this.request('/leaves/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  }

  async updateLeaveRule(ruleId, ruleData) {
    return this.request(`/leaves/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData),
    });
  }

  async deactivateLeaveRule(ruleId) {
    return this.request(`/leaves/rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  async getLeaveBalances(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await this.request(`/leaves/balances${params ? `?${params}` : ''}`);
    return response.data || response;
  }

  async adjustLeaveBalance(adjustmentData) {
    return this.request('/leaves/balances/adjust', {
      method: 'POST',
      body: JSON.stringify(adjustmentData),
    });
  }

  async getLeaveAnalytics(year) {
    const response = await this.request(`/leaves/analytics?year=${year}`);
    return response.data || response;
  }

  async getLeaveSettings() {
    const response = await this.request('/leaves/settings');
    return response.data || response;
  }

  async updateLeaveSettings(settings) {
    return this.request('/leaves/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Company methods
  async registerCompany(companyName, adminEmail, adminPassword) {
    return this.request('/company/register', {
      method: 'POST',
      body: JSON.stringify({ companyName, adminEmail, adminPassword }),
    });
  }

  async getCompanyProfile(companyId) {
    return this.request(`/company/${companyId}/profile`);
  }

  async getCompanyCredentials() {
    return this.request('/company/credentials');
  }

  async syncLeaveBalances() {
    return this.request('/leaves/balances/sync', {
      method: 'POST',
    });
  }

  async processCarryForwardLeaves(year) {
    return this.request('/leaves/balances/carry-forward', {
      method: 'POST',
      body: JSON.stringify({ year }),
    });
  }

  // Claim Management methods
  async getClaimStats() {
    return this.request('/claims/stats');
  }

  async getClaims(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/claims${params ? `?${params}` : ''}`);
  }

  async createClaim(claimData) {
    return this.request('/claims', {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  }

  async updateClaimStatus(claimId, status, remarks) {
    return this.request(`/claims/${claimId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, remarks }),
    });
  }

  async exportClaims() {
    alert('Export functionality will be implemented');
  }

  async getClaimCategories() {
    return this.request('/claims/categories');
  }

  async createClaimCategory(categoryData) {
    return this.request('/claims/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateClaimCategory(categoryId, categoryData) {
    return this.request(`/claims/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteClaimCategory(categoryId) {
    return this.request(`/claims/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Task & Performance methods
  async assignTask(taskData) {
    return this.request('/tasks/assign', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async getTasks(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/tasks${params ? `?${params}` : ''}`);
  }

  async getTaskById(taskId) {
    return this.request(`/tasks/${taskId}`);
  }

  async updateTaskStatus(taskId, statusData) {
    return this.request(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  async getTaskStats() {
    return this.request('/tasks/stats');
  }

  async getPerformanceChart(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/tasks/performance${params ? `?${params}` : ''}`);
  }

  async addRating(ratingData) {
    return this.request('/tasks/ratings', {
      method: 'POST',
      body: JSON.stringify(ratingData),
    });
  }

  async getRatings(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/tasks/ratings/list${params ? `?${params}` : ''}`);
  }

  // Grievance Management methods
  async createGrievance(grievanceData) {
    return this.request('/grievance-management', {
      method: 'POST',
      body: JSON.stringify(grievanceData),
    });
  }

  async getGrievances(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/grievance-management${params ? `?${params}` : ''}`);
  }

  async getGrievanceById(grievanceId) {
    return this.request(`/grievance-management/${grievanceId}`);
  }

  async updateGrievanceStatus(grievanceId, statusData) {
    console.log('=== UPDATE GRIEVANCE STATUS ===');
    console.log('Input statusData:', statusData);
    console.log('Type:', typeof statusData);
    console.log('Is string?', typeof statusData === 'string');
    if (typeof statusData === 'string') {
      console.log('ERROR: statusData is already a string!');
    }
    return this.request(`/grievance-management/${grievanceId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  async addGrievanceRemark(grievanceId, remark) {
    return this.request(`/grievance-management/${grievanceId}/remarks`, {
      method: 'POST',
      body: JSON.stringify({ remark }),
    });
  }

  async getGrievanceStats() {
    return this.request('/grievance-management/stats');
  }

  // Separation Management methods
  async createSeparation(separationData) {
    return this.request('/separation', {
      method: 'POST',
      body: JSON.stringify(separationData),
    });
  }

  async getSeparations(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/separation${params ? `?${params}` : ''}`);
  }

  async getSeparationById(separationId) {
    return this.request(`/separation/${separationId}`);
  }

  async updateSeparationStatus(separationId, statusData) {
    return this.request(`/separation/${separationId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  async updateNoticePeriod(separationId, noticeData) {
    return this.request(`/separation/${separationId}/notice-period`, {
      method: 'PUT',
      body: JSON.stringify(noticeData),
    });
  }

  async updateExitInterview(separationId, interviewData) {
    return this.request(`/separation/${separationId}/exit-interview`, {
      method: 'PUT',
      body: JSON.stringify(interviewData),
    });
  }

  async updateFnFSettlement(separationId, fnfData) {
    return this.request(`/separation/${separationId}/fnf-settlement`, {
      method: 'PUT',
      body: JSON.stringify(fnfData),
    });
  }

  async updateExitDocuments(separationId, documentsData) {
    return this.request(`/separation/${separationId}/exit-documents`, {
      method: 'PUT',
      body: JSON.stringify(documentsData),
    });
  }

  async updateFinalRating(separationId, ratingData) {
    return this.request(`/separation/${separationId}/final-rating`, {
      method: 'PUT',
      body: JSON.stringify(ratingData),
    });
  }

  async getSeparationStats() {
    return this.request('/separation/stats');
  }

  // Payroll methods
  async runPayroll(month) {
    return this.request('/payroll/run', {
      method: 'POST',
      body: JSON.stringify({ month }),
    });
  }

  async getPayrollByMonth(month) {
    return this.request(`/payroll/month/${month}`);
  }

  async getPayrollSummary(month = null) {
    const endpoint = month ? `/payroll/summary?month=${month}` : '/payroll/summary';
    return this.request(endpoint);
  }

  async getEmployeePayrollHistory(employeeId) {
    return this.request(`/payroll/employee/${employeeId}`);
  }

  async getPayrollRecord(payrollRecordId, month) {
    return this.request(`/payroll/${payrollRecordId}/${month}`);
  }

  async getEmployeeCredentials(employeeId) {
    return this.request(`/employees/${employeeId}/credentials`);
  }
}

export const apiService = new ApiService();