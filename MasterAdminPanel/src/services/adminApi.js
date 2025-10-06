/**
 * Admin API Service
 * Handles API calls for Master Admin Panel
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';


class AdminAPI {
  constructor() {
    this.token = localStorage.getItem('adminToken');
  }

  // Set authorization header
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  // Update token
  setToken(token) {
    this.token = token;
    localStorage.setItem('adminToken', token);
  }

  // Remove token
  removeToken() {
    this.token = null;
    localStorage.removeItem('adminToken');
  }

  /**
   * Authentication APIs
   */
  
  // Admin login
  async login(adminId, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        this.setToken(data.data.accessToken);
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Change admin password
  async changePassword(adminId, currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ adminId, currentPassword, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
      
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Initialize admin (for setup)
  async initializeAdmin() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Initialize admin error:', error);
      throw error;
    }
  }

  /**
   * Staff Management APIs
   */
  
  // Get all staff users
  async getAllStaffUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/staff/users`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get staff users');
      }
      
      return data;
    } catch (error) {
      console.error('Get staff users error:', error);
      throw error;
    }
  }

  // Get staff dashboard data
  async getStaffDashboardData() {
    try {
      console.log('Attempting to fetch from:', `${API_BASE_URL}/admin/staff/dashboard`);
      console.log('Headers:', this.getHeaders());
      
      const response = await fetch(`${API_BASE_URL}/admin/staff/dashboard`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get staff dashboard data');
      }
      
      return data;
    } catch (error) {
      console.error('Get staff dashboard data error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        apiUrl: `${API_BASE_URL}/admin/staff/dashboard`
      });
      throw error;
    }
  }

  // Get specific staff profile
  async getStaffProfile(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/staff/profile/${userId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get staff profile');
      }
      
      return data;
    } catch (error) {
      console.error('Get staff profile error:', error);
      throw error;
    }
  }

  // Toggle staff profile visibility
  async toggleStaffVisibility(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/staff/toggle-visibility/${userId}`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle staff visibility');
      }
      
      return data;
    } catch (error) {
      console.error('Toggle staff visibility error:', error);
      throw error;
    }
  }

  // Toggle staff block status
  async toggleStaffBlock(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/staff/toggle-block/${userId}`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle staff block status');
      }
      
      return data;
    } catch (error) {
      console.error('Toggle staff block error:', error);
      throw error;
    }
  }

  // Delete staff user
  async deleteStaffUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/staff/delete/${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete staff user');
      }
      
      return data;
    } catch (error) {
      console.error('Delete staff user error:', error);
      throw error;
    }
  }

  /**
   * Recruiter Management APIs
   */
  
  // Get all recruiters
  async getAllRecruiters() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/recruiter/users`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get recruiters');
      }
      
      return data;
    } catch (error) {
      console.error('Get recruiters error:', error);
      throw error;
    }
  }

  // Get specific recruiter profile
  async getRecruiterProfile(recruiterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/recruiter/profile/${recruiterId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get recruiter profile');
      }
      
      return data;
    } catch (error) {
      console.error('Get recruiter profile error:', error);
      throw error;
    }
  }

  // Toggle recruiter visibility
  async toggleRecruiterVisibility(recruiterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/recruiter/toggle-visibility/${recruiterId}`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle recruiter visibility');
      }
      
      return data;
    } catch (error) {
      console.error('Toggle recruiter visibility error:', error);
      throw error;
    }
  }

  // Toggle recruiter block status
  async toggleRecruiterBlock(recruiterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/recruiter/toggle-block/${recruiterId}`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle recruiter block status');
      }
      
      return data;
    } catch (error) {
      console.error('Toggle recruiter block error:', error);
      throw error;
    }
  }

  // Delete recruiter
  async deleteRecruiter(recruiterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/recruiter/delete/${recruiterId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete recruiter');
      }
      
      return data;
    } catch (error) {
      console.error('Delete recruiter error:', error);
      throw error;
    }
  }

  // Get recruiter institutes
  async getRecruiterInstitutes(recruiterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/recruiter/${recruiterId}/institutes`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get recruiter institutes');
      }
      
      return data;
    } catch (error) {
      console.error('Get recruiter institutes error:', error);
      throw error;
    }
  }

  // Get recruiter jobs
  async getRecruiterJobs(recruiterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/recruiter/${recruiterId}/jobs`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get recruiter jobs');
      }
      
      return data;
    } catch (error) {
      console.error('Get recruiter jobs error:', error);
      throw error;
    }
  }

  // Get recruiter hiring history
  async getRecruiterHiringHistory(recruiterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/recruiter/${recruiterId}/hiring-history`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get recruiter hiring history');
      }
      
      return data;
    } catch (error) {
      console.error('Get recruiter hiring history error:', error);
      throw error;
    }
  }

  // Get recruiter dashboard
  async getRecruiterDashboard(recruiterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/recruiter/${recruiterId}/dashboard`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get recruiter dashboard');
      }
      
      return data;
    } catch (error) {
      console.error('Get recruiter dashboard error:', error);
      throw error;
    }
  }

  // Get institute students for a recruiter
  async getInstituteStudents(instituteId, recruiterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute/${instituteId}/students?recruiterId=${recruiterId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get institute students');
      }
      
      return data;
    } catch (error) {
      console.error('Get institute students error:', error);
      throw error;
    }
  }

  // Get student profile
  async getStudentProfile(studentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/student/profile/${studentId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get student profile');
      }
      
      return data;
    } catch (error) {
      console.error('Get student profile error:', error);
      throw error;
    }
  }

  // Get job candidates (staff and students)
  async getJobCandidates(jobId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/job/${jobId}/candidates`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get job candidates');
      }
      
      return data;
    } catch (error) {
      console.error('Get job candidates error:', error);
      throw error;
    }
  }

  // Get staff profile (alias for getStaffProfileForAdmin)
  async getStaffProfile(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/staff/profile/${userId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get staff profile');
      }
      
      return data;
    } catch (error) {
      console.error('Get staff profile error:', error);
      throw error;
    }
  }

  /**
   * Institute Management APIs
   */
  
  // Get institute dashboard data
  async getInstituteDashboardData() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute/dashboard`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get institute dashboard data');
      }
      
      return data;
    } catch (error) {
      console.error('Get institute dashboard data error:', error);
      throw error;
    }
  }

  // Get all institutes
  async getAllInstitutes() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute/users`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get institutes');
      }
      
      return data;
    } catch (error) {
      console.error('Get institutes error:', error);
      throw error;
    }
  }

  // Get specific institute profile
  async getInstituteProfile(instituteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute/profile/${instituteId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get institute profile');
      }
      
      return data;
    } catch (error) {
      console.error('Get institute profile error:', error);
      throw error;
    }
  }

  // Toggle institute visibility
  async toggleInstituteVisibility(instituteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute/toggle-visibility/${instituteId}`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle institute visibility');
      }
      
      return data;
    } catch (error) {
      console.error('Toggle institute visibility error:', error);
      throw error;
    }
  }

  // Toggle institute block status
  async toggleInstituteBlock(instituteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute/toggle-block/${instituteId}`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle institute block status');
      }
      
      return data;
    } catch (error) {
      console.error('Toggle institute block error:', error);
      throw error;
    }
  }

  // Delete institute
  async deleteInstitute(instituteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute/delete/${instituteId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete institute');
      }
      
      return data;
    } catch (error) {
      console.error('Delete institute error:', error);
      throw error;
    }
  }

  // Get all students
  async getAllStudents(instituteId = null) {
    try {
      const url = instituteId 
        ? `${API_BASE_URL}/admin/institute/students?instituteId=${instituteId}`
        : `${API_BASE_URL}/admin/institute/students`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get students');
      }
      
      return data;
    } catch (error) {
      console.error('Get students error:', error);
      throw error;
    }
  }

  // Get student profile with full details
  async getStudentProfileForAdmin(studentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute/student/${studentId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get student profile');
      }
      
      return data;
    } catch (error) {
      console.error('Get student profile error:', error);
      throw error;
    }
  }

  // Get all courses
  async getAllCourses(instituteId = null) {
    try {
      const url = instituteId 
        ? `${API_BASE_URL}/admin/institute/courses?instituteId=${instituteId}`
        : `${API_BASE_URL}/admin/institute/courses`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get courses');
      }
      
      return data;
    } catch (error) {
      console.error('Get courses error:', error);
      throw error;
    }
  }

  /**
   * Dashboard APIs
   */
  
  // Get dashboard data
  async getDashboardData(month = null, year = null) {
    try {
      const url = month && year 
        ? `${API_BASE_URL}/admin/dashboard?month=${month}&year=${year}`
        : `${API_BASE_URL}/admin/dashboard`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get dashboard data');
      }
      
      return data;
    } catch (error) {
      console.error('Get dashboard data error:', error);
      throw error;
    }
  }

  /**
   * Issue Management APIs
   */
  
  // Get all issues
  async getAllIssues() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/issues`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get issues');
      }
      
      return data;
    } catch (error) {
      console.error('Get issues error:', error);
      throw error;
    }
  }

  // Resolve issue and unblock user
  async resolveIssue(issueId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/issues/${issueId}/resolve`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resolve issue');
      }
      
      return data;
    } catch (error) {
      console.error('Resolve issue error:', error);
      throw error;
    }
  }

  // Delete issue
  async deleteIssue(issueId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/issues/${issueId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete issue');
      }
      
      return data;
    } catch (error) {
      console.error('Delete issue error:', error);
      throw error;
    }
  }

  /**
   * Notification APIs
   */
  
  // Send notification to users
  async sendNotification(notificationData) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(notificationData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send notification');
      }
      
      return data;
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  }

  /**
   * Government Schemes APIs
   */
  
  // Get all government schemes
  async getGovernmentSchemes() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/government-schemes`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get government schemes');
      }
      
      return data;
    } catch (error) {
      console.error('Get government schemes error:', error);
      throw error;
    }
  }

  // Add new government scheme
  async addGovernmentScheme(schemeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/government-schemes`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(schemeData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add government scheme');
      }
      
      return data;
    } catch (error) {
      console.error('Add government scheme error:', error);
      throw error;
    }
  }

  // Update government scheme
  async updateGovernmentScheme(schemeId, schemeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/government-schemes/${schemeId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(schemeData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update government scheme');
      }
      
      return data;
    } catch (error) {
      console.error('Update government scheme error:', error);
      throw error;
    }
  }

  // Delete government scheme
  async deleteGovernmentScheme(schemeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/government-schemes/${schemeId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete government scheme');
      }
      
      return data;
    } catch (error) {
      console.error('Delete government scheme error:', error);
      throw error;
    }
  }

  // Logout
  logout() {
    this.removeToken();
  }
}

// Create and export a singleton instance
const adminAPI = new AdminAPI();
export default adminAPI;