/**
 * Test script for enhanced Master Admin Panel features
 * Tests the new functionality for Recruiter Institutes and Jobs sections
 */

const adminAPI = {
  baseURL: 'http://localhost:4001/api/v1',
  token: null,

  async login() {
    try {
      const response = await fetch(`${this.baseURL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminId: 'admin', 
          password: 'admin123' 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        this.token = data.data.accessToken;
        console.log('✅ Admin login successful');
        return true;
      } else {
        console.log('❌ Admin login failed:', data.message);
        return false;
      }
    } catch (error) {
      console.log('❌ Admin login error:', error.message);
      return false;
    }
  },

  async testGetRecruiters() {
    try {
      const response = await fetch(`${this.baseURL}/admin/recruiter/users`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('✅ Get recruiters successful');
        console.log(`Found ${data.data.length} recruiters`);
        return data.data;
      } else {
        console.log('❌ Get recruiters failed:', data.message);
        return [];
      }
    } catch (error) {
      console.log('❌ Get recruiters error:', error.message);
      return [];
    }
  },

  async testGetRecruiterInstitutes(recruiterId) {
    try {
      const response = await fetch(`${this.baseURL}/admin/recruiter/${recruiterId}/institutes`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('✅ Get recruiter institutes successful');
        console.log(`Found ${data.data.length} institutes for recruiter ${recruiterId}`);
        data.data.forEach(institute => {
          console.log(`  - ${institute.instituteName}: ${institute.studentsCount} students, ${institute.jobsApplied} jobs applied`);
          console.log(`    Location: ${institute.instituteLocation}`);
        });
        return data.data;
      } else {
        console.log('❌ Get recruiter institutes failed:', data.message);
        return [];
      }
    } catch (error) {
      console.log('❌ Get recruiter institutes error:', error.message);
      return [];
    }
  },

  async testGetRecruiterJobs(recruiterId) {
    try {
      const response = await fetch(`${this.baseURL}/admin/recruiter/${recruiterId}/jobs`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('✅ Get recruiter jobs successful');
        console.log(`Found ${data.data.length} jobs for recruiter ${recruiterId}`);
        data.data.forEach(job => {
          console.log(`  - ${job.jobTitle}: ${job.totalApplications} total applications`);
          console.log(`    Staff: ${job.staffApplications}, Students: ${job.instituteApplications}`);
        });
        return data.data;
      } else {
        console.log('❌ Get recruiter jobs failed:', data.message);
        return [];
      }
    } catch (error) {
      console.log('❌ Get recruiter jobs error:', error.message);
      return [];
    }
  }
};

async function runTests() {
  console.log('🚀 Starting Enhanced Master Admin Panel Feature Tests\n');
  
  // Login first
  const loginSuccess = await adminAPI.login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without admin login');
    return;
  }
  
  console.log('\n📋 Testing Recruiter Management...');
  
  // Get all recruiters
  const recruiters = await adminAPI.testGetRecruiters();
  
  if (recruiters.length > 0) {
    const testRecruiterId = recruiters[0].userId;
    console.log(`\n🏢 Testing with recruiter: ${recruiters[0].companyName || 'Unknown Company'} (${testRecruiterId})`);
    
    // Test institutes for this recruiter
    console.log('\n📚 Testing Recruiter Institutes...');
    const institutes = await adminAPI.testGetRecruiterInstitutes(testRecruiterId);
    
    // Test jobs for this recruiter
    console.log('\n💼 Testing Recruiter Jobs...');
    const jobs = await adminAPI.testGetRecruiterJobs(testRecruiterId);
  } else {
    console.log('⚠️ No recruiters found to test with');
  }
  
  console.log('\n✅ All tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, adminAPI };