/**
 * Simple test script to verify authentication flow
 */

const API_URL = 'http://localhost:5000/api/v1';

// Test staff registration
async function testStaffRegistration() {
  try {
    console.log('Testing staff registration...');
    
    const testData = {
      fullName: 'Test Staff User',
      email: 'teststaff@example.com',
      password: 'password123',
      phoneNumber: '1234567890'
    };
    
    const response = await fetch(`${API_URL}/staff/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const data = await response.json();
    console.log('Registration response:', data);
    
    if (data.success && data.data.accessToken) {
      console.log('✅ Registration successful');
      return data.data.accessToken;
    } else {
      console.log('❌ Registration failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
}

// Test staff login
async function testStaffLogin() {
  try {
    console.log('Testing staff login...');
    
    const loginData = {
      email: 'teststaff@example.com',
      password: 'password123'
    };
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    
    if (data.success && data.data.accessToken) {
      console.log('✅ Login successful');
      return data.data.accessToken;
    } else {
      console.log('❌ Login failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Test authenticated request
async function testAuthenticatedRequest(token) {
  try {
    console.log('Testing authenticated request...');
    
    const response = await fetch(`${API_URL}/staff/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Profile response:', data);
    
    if (data.success) {
      console.log('✅ Authenticated request successful');
      return true;
    } else {
      console.log('❌ Authenticated request failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('Authenticated request error:', error);
    return false;
  }
}

// Test toggle profile mode
async function testToggleProfileMode(token) {
  try {
    console.log('Testing toggle profile mode...');
    
    const response = await fetch(`${API_URL}/staff/toggle-mode`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isActiveStaff: true })
    });
    
    const data = await response.json();
    console.log('Toggle response:', data);
    
    if (data.success) {
      console.log('✅ Toggle profile mode successful');
      return true;
    } else {
      console.log('❌ Toggle profile mode failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('Toggle profile mode error:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting authentication tests...\n');
  
  // Test registration
  let token = await testStaffRegistration();
  
  if (!token) {
    // If registration fails, try login
    console.log('\nTrying login instead...');
    token = await testStaffLogin();
  }
  
  if (token) {
    console.log('\n📝 Token received:', token.substring(0, 20) + '...');
    
    // Test authenticated requests
    await testAuthenticatedRequest(token);
    await testToggleProfileMode(token);
  } else {
    console.log('❌ No token available, cannot test authenticated requests');
  }
  
  console.log('\n✅ Tests completed');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testStaffRegistration,
  testStaffLogin,
  testAuthenticatedRequest,
  testToggleProfileMode
};