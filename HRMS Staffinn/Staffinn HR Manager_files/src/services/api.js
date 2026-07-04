const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.staffinn.com/api/v1/hrms'
  : 'http://localhost:4001/api/v1/hrms';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.currentRecruiterId = null;
    this.token = this.getStoredToken();
  }

  getStoredToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const recruiterId = urlParams.get('recruiterId');
    
    if (recruiterId) {
      this.currentRecruiterId = recruiterId;
      const token = localStorage.getItem(`hrms_token_${recruiterId}`);
      return token;
    }
    
    const storedRecruiterId = sessionStorage.getItem('current_recruiter_id');
    if (storedRecruiterId) {
      this.currentRecruiterId = storedRecruiterId;
      return localStorage.getItem(`hrms_token_${storedRecruiterId}`);
    }
    
    return null;
  }

  setToken(token, recruiterId = null) {
    this.token = token;
    const targetRecruiterId = recruiterId || this.currentRecruiterId;
    
    if (token && targetRecruiterId) {
      localStorage.setItem(`hrms_token_${targetRecruiterId}`, token);
      sessionStorage.setItem('current_recruiter_id', targetRecruiterId);
      this.currentRecruiterId = targetRecruiterId;
      console.log('Token set for recruiter:', targetRecruiterId);
    } else if (!token && targetRecruiterId) {
      localStorage.removeItem(`hrms_token_${targetRecruiterId}`);
      sessionStorage.removeItem('current_recruiter_id');
      this.currentRecruiterId = null;
      console.log('Token removed for recruiter:', targetRecruiterId);
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
    if (recruiterId) {
      body.recruiterId = recruiterId;
      this.currentRecruiterId = recruiterId;
    }
    
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    if (response.success && response.data.token) {
      const userRecruiterId = response.data.user?.recruiterId || recruiterId;
      if (userRecruiterId) {
        this.setToken(response.data.token, userRecruiterId);
      } else {
        console.error('No recruiterId found in login response');
        throw new Error('Invalid session: recruiterId missing');
      }
    }
    
    return response;
  }

  async register(name, email, password, role = 'admin', recruiterId) {
    if (recruiterId) {
      this.currentRecruiterId = recruiterId;
    }
    
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, recruiterId }),
    });
    
    if (response.success && response.data.token && recruiterId) {
      this.setToken(response.data.token, recruiterId);
    }
    
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  logout() {
    const recruiterId = this.currentRecruiterId;
    this.setToken(null, recruiterId);
    this.currentRecruiterId = null;
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

  async getEmployeeAttendance(employeeId, startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate)   params.set('endDate', endDate);
    const qs = params.toString();
    return this.request(`/attendance/employee/${encodeURIComponent(employeeId)}${qs ? '?' + qs : ''}`);
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
    // Extract recruiterId from URL
    const urlParams = new URLSearchParams(window.location.search);
    const recruiterId = urlParams.get('recruiterId');
    
    return this.request('/company/register', {
      method: 'POST',
      body: JSON.stringify({ companyName, adminEmail, adminPassword, recruiterId }),
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

  // ── No Dues Clearance (NDC) ────────────────────────────────────────────
  async generateNDC(separationId) {
    return this.request(`/separation/${separationId}/generate-ndc`, { method: 'POST' });
  }

  async getNDC(separationId) {
    return this.request(`/separation/${separationId}/ndc`);
  }

  async updateITClearance(separationId, data) {
    return this.request(`/separation/${separationId}/ndc/it`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async updateMediaClearance(separationId, data) {
    return this.request(`/separation/${separationId}/ndc/media`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async updateProjectClearance(separationId, data) {
    return this.request(`/separation/${separationId}/ndc/project`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async updateAccountsClearance(separationId, data) {
    return this.request(`/separation/${separationId}/ndc/accounts`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async updateHRClearance(separationId, data) {
    return this.request(`/separation/${separationId}/ndc/hr`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async updateFinalNDCApproval(separationId, data) {
    return this.request(`/separation/${separationId}/ndc/final-approval`, { method: 'PUT', body: JSON.stringify(data) });
  }

  // Payroll methods — enhanced with date range, snapshots, runs
  async runPayroll(startDate, endDate, employeeId = null) {
    return this.request('/payroll/run', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate, employeeId }),
    });
  }

  async getPayrollRuns() {
    return this.request('/payroll/runs');
  }

  async getPayrollByRun(runId) {
    return this.request(`/payroll/run/${runId}`);
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

  // Holiday methods
  async getHolidays() {
    return this.request('/holidays');
  }

  async createHoliday(data) {
    return this.request('/holidays', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateHoliday(holidayId, data) {
    return this.request(`/holidays/${holidayId}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteHoliday(holidayId) {
    return this.request(`/holidays/${holidayId}`, { method: 'DELETE' });
  }

  async seedNationalHolidays() {
    return this.request('/holidays/seed-national', { method: 'POST' });
  }

  async getEmployeeCredentials(employeeId) {
    return this.request(`/employees/${employeeId}/credentials`);
  }

  // ── Forgot-Password (OTP flow) ──────────────────────────────────────────
  async forgotPasswordSendOTP(email) {    return this.request('/auth/forgot-password/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPasswordVerifyOTP(email, otp) {
    return this.request('/auth/forgot-password/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async forgotPasswordReset(email, resetToken, newPassword) {
    return this.request('/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify({ email, resetToken, newPassword }),
    });
  }

  async forgotPasswordResendOTP(email) {
    return this.request('/auth/forgot-password/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // ── Claim Management V2 ─────────────────────────────────────────────────
  async getClaimTypesV2()                          { return this.request('/v2/claim-types') }
  async createClaimTypeV2(data)                    { return this.request('/v2/claim-types', { method: 'POST', body: JSON.stringify(data) }) }
  async updateClaimTypeV2(id, data)                { return this.request(`/v2/claim-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }) }
  async deleteClaimTypeV2(id)                      { return this.request(`/v2/claim-types/${id}`, { method: 'DELETE' }) }
  async getClaimStatsV2()                          { return this.request('/v2/claims/stats') }
  async getMyClaimsV2()                            { return this.request('/v2/claims/my') }
  async getAllClaimsV2(filters = {})               { const p = new URLSearchParams(filters).toString(); return this.request(`/v2/claims${p ? '?'+p : ''}`) }
  async getPendingApprovalsV2()                    { return this.request('/v2/claims/pending-approvals') }
  async getClaimByIdV2(id)                         { return this.request(`/v2/claims/${id}`) }
  async createClaimV2(data)                        { return this.request('/v2/claims', { method: 'POST', body: JSON.stringify(data) }) }
  async updateClaimV2(id, data)                    { return this.request(`/v2/claims/${id}`, { method: 'PUT', body: JSON.stringify(data) }) }
  async submitClaimV2(id)                          { return this.request(`/v2/claims/${id}/submit`, { method: 'POST' }) }
  async processClaimActionV2(id, data)             { return this.request(`/v2/claims/${id}/action`, { method: 'POST', body: JSON.stringify(data) }) }
  async markClaimPaidV2(id, data)                  { return this.request(`/v2/claims/${id}/paid`, { method: 'POST', body: JSON.stringify(data) }) }
  async addLineItemV2(claimId, data)               { return this.request(`/v2/claims/${claimId}/line-items`, { method: 'POST', body: JSON.stringify(data) }) }
  async deleteLineItemV2(claimId, lineItemId)      { return this.request(`/v2/claims/${claimId}/line-items/${lineItemId}`, { method: 'DELETE' }) }

  // Employee-Device Mapping methods
  async getMappings() {
    return this.request('/attendance/mappings');
  }

  async createMapping(mappingData) {
    return this.request('/attendance/mappings', {
      method: 'POST',
      body: JSON.stringify(mappingData),
    });
  }

  async deleteMapping(mappingId) {
    return this.request(`/attendance/mappings/${mappingId}`, {
      method: 'DELETE',
    });
  }

  // Device Management methods
  async getDevices() {
    return this.request('/attendance/devices');
  }

  async registerDevice(deviceData) {
    return this.request('/attendance/devices', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  }

  async getDeviceStatus() {
    return this.request('/attendance/device-status');
  }
}

export const apiService = new ApiService();