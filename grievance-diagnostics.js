// Grievance Module Diagnostic Script
// Run this in your browser console while logged in to diagnose issues

async function diagnoseGrievanceIssues() {
  console.log('🔍 Starting Grievance Module Diagnostics...\n');
  
  const token = localStorage.getItem('employeeToken');
  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:4001/api/v1';
  
  if (!token) {
    console.error('❌ No authentication token found. Please log in first.');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // 1. Check Reporting Managers
    console.log('📋 Step 1: Checking Reporting Managers...');
    const managersResponse = await fetch(`${apiUrl}/employee/grievances/reporting-managers`, { headers });
    const managersData = await managersResponse.json();
    
    console.log('Response:', managersData);
    
    if (managersData.success) {
      const { immediateManager, nextLevelManager } = managersData.data;
      
      if (immediateManager) {
        console.log('✅ Immediate Manager Found:');
        console.log(`   Name: ${immediateManager.fullName}`);
        console.log(`   Email: ${immediateManager.email}`);
        console.log(`   Designation: ${immediateManager.designation}`);
      } else {
        console.warn('⚠️ No immediate manager found');
        console.log('   Possible reasons:');
        console.log('   - Employee not added to organization chart');
        console.log('   - No parent node assigned in organogram');
        console.log('   - Manager employee record is deleted');
      }
      
      if (nextLevelManager) {
        console.log('✅ Next Level Manager Found:');
        console.log(`   Name: ${nextLevelManager.fullName}`);
        console.log(`   Email: ${nextLevelManager.email}`);
        console.log(`   Designation: ${nextLevelManager.designation}`);
      } else {
        console.log('ℹ️ No next level manager (might be at top of hierarchy)');
      }
    } else {
      console.error('❌ Failed to fetch managers:', managersData.message);
    }
    
    console.log('\n');
    
    // 2. Check Organization Employees
    console.log('📋 Step 2: Checking Organization Employees...');
    const employeesResponse = await fetch(`${apiUrl}/employee/grievances/organization-employees`, { headers });
    const employeesData = await employeesResponse.json();
    
    console.log('Response:', employeesData);
    
    if (employeesData.success) {
      const employees = employeesData.data;
      console.log(`✅ Found ${employees.length} employees in organization`);
      
      if (employees.length > 0) {
        console.log('Sample employees:');
        employees.slice(0, 3).forEach(emp => {
          console.log(`   - ${emp.fullName} (${emp.designation}) - ${emp.email}`);
        });
      } else {
        console.warn('⚠️ No employees found');
        console.log('   Possible reasons:');
        console.log('   - No employees added to the system');
        console.log('   - All employees are marked as deleted');
        console.log('   - recruiterId mismatch');
      }
    } else {
      console.error('❌ Failed to fetch employees:', employeesData.message);
    }
    
    console.log('\n');
    
    // 3. Summary
    console.log('📊 Diagnostic Summary:');
    console.log('─────────────────────────────────────');
    
    const hasManagers = managersData.success && 
      (managersData.data.immediateManager || managersData.data.nextLevelManager);
    const hasEmployees = employeesData.success && employeesData.data.length > 0;
    
    if (hasManagers && hasEmployees) {
      console.log('✅ All checks passed! Grievance module should work correctly.');
    } else {
      console.log('⚠️ Issues detected:');
      if (!hasManagers) {
        console.log('   ❌ No managers found - Check organization chart setup');
      }
      if (!hasEmployees) {
        console.log('   ❌ No employees found - Check employee records');
      }
    }
    
    console.log('\n');
    console.log('💡 Recommendations:');
    console.log('1. Ensure all employees are added to the organization chart');
    console.log('2. Verify parent-child relationships in the organogram');
    console.log('3. Check that manager records are not marked as deleted');
    console.log('4. Verify recruiterId matches across all records');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    console.log('Please check:');
    console.log('- Backend server is running');
    console.log('- API URL is correct');
    console.log('- Authentication token is valid');
  }
}

// Run diagnostics
diagnoseGrievanceIssues();
