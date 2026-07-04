const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const RECRUITER_ID = '7e0dd1ad-e456-444f-8992-5a66af451238';
const TARGET_DATE = '2026-05-15';

async function testAttendanceSystem() {
  console.log('='.repeat(80));
  console.log('🔍 COMPLETE ATTENDANCE SYSTEM TESTING');
  console.log('='.repeat(80));
  console.log(`📋 Recruiter ID: ${RECRUITER_ID}`);
  console.log(`📅 Target Date: ${TARGET_DATE}`);
  console.log('='.repeat(80));
  console.log('');

  try {
    // TEST 1: Check if employees exist for this recruiter
    console.log('📊 TEST 1: CHECKING EMPLOYEES');
    console.log('-'.repeat(80));
    
    const employeesCommand = new ScanCommand({
      TableName: 'staffinn-hrms-employees',
      FilterExpression: 'recruiterId = :rid',
      ExpressionAttributeValues: {
        ':rid': RECRUITER_ID
      }
    });
    
    const employeesResult = await docClient.send(employeesCommand);
    const employees = employeesResult.Items || [];
    
    console.log(`✅ Total Employees Found: ${employees.length}`);
    
    if (employees.length > 0) {
      console.log('\n📋 Employee List:');
      employees.forEach((emp, index) => {
        console.log(`   ${index + 1}. ${emp.employeeId} - ${emp.fullName || emp.name || 'Unknown'}`);
        console.log(`      Department: ${emp.department || 'N/A'}`);
        console.log(`      Shift: ${emp.checkInTime || 'N/A'} - ${emp.checkOutTime || 'N/A'}`);
      });
    } else {
      console.log('⚠️  NO EMPLOYEES FOUND for this recruiter!');
      console.log('   This could be why attendance is not showing.');
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('');

    // TEST 2: Check attendance records for today
    console.log('📊 TEST 2: CHECKING ATTENDANCE RECORDS FOR TODAY');
    console.log('-'.repeat(80));
    
    const attendanceCommand = new ScanCommand({
      TableName: 'staffinn-hrms-attendance',
      FilterExpression: 'recruiterId = :rid AND #date = :date',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':rid': RECRUITER_ID,
        ':date': TARGET_DATE
      }
    });
    
    const attendanceResult = await docClient.send(attendanceCommand);
    const todayAttendance = attendanceResult.Items || [];
    
    console.log(`✅ Total Attendance Records for ${TARGET_DATE}: ${todayAttendance.length}`);
    
    if (todayAttendance.length > 0) {
      console.log('\n📋 Today\'s Attendance Records:');
      todayAttendance.forEach((att, index) => {
        const employee = employees.find(e => e.employeeId === att.employeeId);
        console.log(`   ${index + 1}. Employee: ${att.employeeId} (${employee?.fullName || 'Unknown'})`);
        console.log(`      Check In: ${att.checkIn || 'N/A'}`);
        console.log(`      Check Out: ${att.checkOut || 'N/A'}`);
        console.log(`      Hours: ${att.hours || 0}`);
        console.log(`      Status: ${att.status || 'N/A'}`);
        console.log(`      Source: ${att.source || 'N/A'}`);
        console.log(`      Device ID: ${att.deviceId || 'N/A'}`);
        console.log(`      Created At: ${att.createdAt || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  NO ATTENDANCE RECORDS FOUND for today!');
      console.log('   Checking if records exist for other dates...');
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('');

    // TEST 3: Check all attendance records for this recruiter (any date)
    console.log('📊 TEST 3: CHECKING ALL ATTENDANCE RECORDS (ANY DATE)');
    console.log('-'.repeat(80));
    
    const allAttendanceCommand = new ScanCommand({
      TableName: 'staffinn-hrms-attendance',
      FilterExpression: 'recruiterId = :rid',
      ExpressionAttributeValues: {
        ':rid': RECRUITER_ID
      }
    });
    
    const allAttendanceResult = await docClient.send(allAttendanceCommand);
    const allAttendance = allAttendanceResult.Items || [];
    
    console.log(`✅ Total Attendance Records (All Dates): ${allAttendance.length}`);
    
    if (allAttendance.length > 0) {
      // Group by date
      const byDate = {};
      allAttendance.forEach(att => {
        const date = att.date || 'Unknown';
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(att);
      });
      
      console.log('\n📋 Attendance Records by Date:');
      Object.keys(byDate).sort().forEach(date => {
        console.log(`   📅 ${date}: ${byDate[date].length} records`);
      });
      
      // Show last 5 records
      console.log('\n📋 Last 5 Attendance Records:');
      const sortedRecords = allAttendance.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date);
        const dateB = new Date(b.createdAt || b.date);
        return dateB - dateA;
      }).slice(0, 5);
      
      sortedRecords.forEach((att, index) => {
        const employee = employees.find(e => e.employeeId === att.employeeId);
        console.log(`   ${index + 1}. ${att.employeeId} (${employee?.fullName || 'Unknown'})`);
        console.log(`      Date: ${att.date}`);
        console.log(`      Check In: ${att.checkIn || 'N/A'}`);
        console.log(`      Check Out: ${att.checkOut || 'N/A'}`);
        console.log(`      Source: ${att.source || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  NO ATTENDANCE RECORDS FOUND AT ALL!');
      console.log('   This means Bridge has never synced any data.');
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('');

    // TEST 4: Check employee-device mappings
    console.log('📊 TEST 4: CHECKING EMPLOYEE-DEVICE MAPPINGS');
    console.log('-'.repeat(80));
    
    try {
      const mappingsCommand = new ScanCommand({
        TableName: 'staffinn-hrms-employee-device-mappings',
        FilterExpression: 'recruiterId = :rid',
        ExpressionAttributeValues: {
          ':rid': RECRUITER_ID
        }
      });
      
      const mappingsResult = await docClient.send(mappingsCommand);
      const mappings = mappingsResult.Items || [];
      
      console.log(`✅ Total Mappings Found: ${mappings.length}`);
      
      if (mappings.length > 0) {
        console.log('\n📋 Employee-Device Mappings:');
        mappings.forEach((map, index) => {
          const employee = employees.find(e => e.employeeId === map.employeeId);
          console.log(`   ${index + 1}. Employee: ${map.employeeId} (${employee?.fullName || 'Unknown'})`);
          console.log(`      Device User ID: ${map.deviceUserId}`);
          console.log(`      Created: ${map.createdAt || 'N/A'}`);
        });
      } else {
        console.log('⚠️  NO MAPPINGS FOUND!');
        console.log('   ❌ CRITICAL ISSUE: Without mappings, Bridge cannot identify employees!');
        console.log('   📝 Action Required: Create mappings in HRMS Device Setup');
      }
    } catch (error) {
      console.log('❌ ERROR: Mappings table might not exist');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('');

    // TEST 5: Check company/recruiter configuration
    console.log('📊 TEST 5: CHECKING COMPANY CONFIGURATION');
    console.log('-'.repeat(80));
    
    try {
      const companiesCommand = new ScanCommand({
        TableName: 'staffinn-hrms-companies',
        FilterExpression: 'recruiterId = :rid',
        ExpressionAttributeValues: {
          ':rid': RECRUITER_ID
        }
      });
      
      const companiesResult = await docClient.send(companiesCommand);
      const companies = companiesResult.Items || [];
      
      console.log(`✅ Companies Found: ${companies.length}`);
      
      if (companies.length > 0) {
        companies.forEach((company, index) => {
          console.log(`\n   ${index + 1}. Company ID: ${company.companyId}`);
          console.log(`      Company Name: ${company.companyName || 'N/A'}`);
          console.log(`      API Key: ${company.apiKey ? '***' + company.apiKey.slice(-4) : 'N/A'}`);
          console.log(`      Active: ${company.isActive ? 'Yes' : 'No'}`);
        });
      } else {
        console.log('⚠️  NO COMPANY FOUND!');
        console.log('   ❌ CRITICAL ISSUE: Bridge needs company credentials to authenticate!');
      }
    } catch (error) {
      console.log('❌ ERROR: Companies table might not exist');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('');

    // TEST 6: Check devices
    console.log('📊 TEST 6: CHECKING REGISTERED DEVICES');
    console.log('-'.repeat(80));
    
    try {
      const devicesCommand = new ScanCommand({
        TableName: 'staffinn-hrms-devices',
        FilterExpression: 'recruiterId = :rid',
        ExpressionAttributeValues: {
          ':rid': RECRUITER_ID
        }
      });
      
      const devicesResult = await docClient.send(devicesCommand);
      const devices = devicesResult.Items || [];
      
      console.log(`✅ Devices Found: ${devices.length}`);
      
      if (devices.length > 0) {
        devices.forEach((device, index) => {
          console.log(`\n   ${index + 1}. Device ID: ${device.deviceId}`);
          console.log(`      Device Name: ${device.deviceName || 'N/A'}`);
          console.log(`      IP Address: ${device.ipAddress || 'N/A'}`);
          console.log(`      Port: ${device.port || 'N/A'}`);
          console.log(`      Active: ${device.isActive ? 'Yes' : 'No'}`);
          console.log(`      Last Sync: ${device.lastSyncTime || 'Never'}`);
        });
      } else {
        console.log('⚠️  NO DEVICES REGISTERED!');
        console.log('   This is optional but helps with tracking.');
      }
    } catch (error) {
      console.log('❌ ERROR: Devices table might not exist');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('');

    // FINAL ANALYSIS
    console.log('📊 FINAL ANALYSIS & DIAGNOSIS');
    console.log('='.repeat(80));
    console.log('');
    
    console.log('🔍 SYSTEM STATUS:');
    console.log(`   Employees: ${employees.length > 0 ? '✅ Found' : '❌ Not Found'}`);
    console.log(`   Today's Attendance: ${todayAttendance.length > 0 ? '✅ Found' : '❌ Not Found'}`);
    console.log(`   All Attendance: ${allAttendance.length > 0 ? '✅ Found' : '❌ Not Found'}`);
    
    console.log('');
    console.log('🎯 ROOT CAUSE ANALYSIS:');
    console.log('');
    
    if (employees.length === 0) {
      console.log('❌ ISSUE #1: NO EMPLOYEES FOUND');
      console.log('   Reason: No employees exist for this recruiter ID');
      console.log('   Impact: Cannot show attendance even if data exists');
      console.log('   Solution: Add employees in HRMS Onboarding');
      console.log('');
    }
    
    if (todayAttendance.length === 0 && allAttendance.length > 0) {
      console.log('❌ ISSUE #2: NO ATTENDANCE FOR TODAY\'S DATE');
      console.log(`   Reason: Records exist but not for ${TARGET_DATE}`);
      console.log('   Impact: Frontend shows empty table for today');
      console.log('   Possible Causes:');
      console.log('      1. Device clock might be set to different date');
      console.log('      2. Bridge is syncing old records');
      console.log('      3. No actual punches happened today');
      console.log('   Solution: Check device date/time settings');
      console.log('');
      
      // Show which dates have records
      const dates = [...new Set(allAttendance.map(a => a.date))].sort();
      console.log('   📅 Dates with attendance records:');
      dates.forEach(date => {
        const count = allAttendance.filter(a => a.date === date).length;
        console.log(`      - ${date}: ${count} records`);
      });
      console.log('');
    }
    
    if (allAttendance.length === 0) {
      console.log('❌ ISSUE #3: NO ATTENDANCE RECORDS AT ALL');
      console.log('   Reason: Bridge has never synced any data');
      console.log('   Possible Causes:');
      console.log('      1. Bridge software not running');
      console.log('      2. Bridge cannot connect to device');
      console.log('      3. Bridge authentication failing');
      console.log('      4. No employee-device mappings configured');
      console.log('      5. Device has no attendance logs');
      console.log('   Solution: Check Bridge logs and device connection');
      console.log('');
    }
    
    if (todayAttendance.length > 0) {
      console.log('✅ GOOD NEWS: Attendance records exist for today!');
      console.log(`   Total records: ${todayAttendance.length}`);
      console.log('   This means:');
      console.log('      ✅ Bridge is working');
      console.log('      ✅ Device is connected');
      console.log('      ✅ Data is being synced');
      console.log('      ✅ Backend is saving records');
      console.log('');
      console.log('   If frontend is not showing data, check:');
      console.log('      1. Frontend date filter (should be 2026-05-15)');
      console.log('      2. Frontend API call (check Network tab)');
      console.log('      3. Frontend authentication (check token)');
      console.log('      4. Browser console for errors');
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('');
    
    // RECOMMENDATIONS
    console.log('💡 RECOMMENDATIONS:');
    console.log('');
    
    if (employees.length === 0) {
      console.log('1. ⚠️  URGENT: Add employees in HRMS');
      console.log('   - Go to HRMS → Onboarding');
      console.log('   - Add at least one employee');
      console.log('   - Note the Employee ID');
      console.log('');
    }
    
    if (allAttendance.length === 0) {
      console.log('2. ⚠️  URGENT: Check Bridge Software');
      console.log('   - Verify Bridge is running');
      console.log('   - Check Bridge console logs');
      console.log('   - Verify device connection');
      console.log('   - Check company credentials');
      console.log('');
    }
    
    console.log('3. 📝 Create Employee-Device Mappings');
    console.log('   - Go to HRMS → Device Setup → Employee Mapping');
    console.log('   - Map each Employee ID to Device User ID');
    console.log('   - Example: EMP001 ↔ 1001');
    console.log('');
    
    console.log('4. 🔍 Test with Fresh Punch');
    console.log('   - Clear device attendance logs');
    console.log('   - Clear Bridge database');
    console.log('   - Restart Bridge');
    console.log('   - Employee scans fingerprint');
    console.log('   - Check if appears in HRMS within 10 seconds');
    console.log('');
    
    console.log('='.repeat(80));
    console.log('✅ TESTING COMPLETE');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ TESTING FAILED:', error);
    console.error('Error Details:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testAttendanceSystem()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAttendanceSystem };
