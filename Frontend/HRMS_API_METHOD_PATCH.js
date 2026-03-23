// Add this method to apiService object in api.js (before the closing brace)

  // HRMS Access Control API
  generateHRMSAccessToken: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      console.log('🔑 Generating HRMS access token...');
      const response = await fetch(`${API_URL}/hrms-access/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      console.log('✅ HRMS access token generated:', result);
      return result;
    } catch (error) {
      console.error('❌ Generate HRMS access token error:', error);
      return { success: false, message: 'Failed to generate HRMS access token' };
    }
  }
