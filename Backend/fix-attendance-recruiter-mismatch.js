/**
 * FIX: Attendance Recruiter ID Mismatch
 * 
 * Problem: Attendance records have wrong recruiterId because:
 * 1. Device was registered to multiple companies
 * 2. Old attendance records were synced with wrong company credentials
 * 
 * Solution:
 * 1. Fix existing attendance records by matching employee's recruiterId
 * 2. Remove duplicate device registrations
 * 3. Add validation to prevent future issues
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ATTENDANCE_TABLE = 'staffinn-hrms-attendance';
const EMPLOYEES_TABLE = 'staffinn-hrms-employees';
const COMPANIES_TABLE = 'staffinn-hrms-companies';

async function fixAttendanceRecords() {
  console.log('🔧 Starting attendance recruiter ID fix...\n');
  
  try {
    // Step 1: Get all attendance records for 2026-05-15
    console.log('📊 Step 1: Fetching attendance records for 2026-05-15...');
    const attendanceResult = await docClient.send(new ScanCommand({
      TableName: ATTENDANCE_TABLE,
      FilterExpression: '#d = :date',
      ExpressionAttributeNames: { '#d': 'date' },
      ExpressionAttributeValues: { ':date': '2026-05-15' }
    }));
    
    const attendanceRecords = attendanceResult.Items || [];
    console.log(`✅ Found ${attendanceRecords.length} attendance records\n`);
    
    if (attendanceRecords.length === 0) {
      console.log('ℹ️ No records to fix');
      return;
    }
    
    // Step 2: Fix each record
    console.log('🔧 Step 2: Fixing recruiter IDs...');
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const attendance of attendanceRecords) {
      try {
        // Get employee record to find correct recruiterId
        const employeeResult = await docClient.send(new GetCommand({
          TableName: EMPLOYEES_TABLE,
          Key: { employeeId: attendance.employeeId }
        }));
        
        if (!employeeResult.Item) {
          console.log(`⚠️ Employee not found: ${attendance.employeeId} - Skipping`);
          skippedCount++;
          continue;
        }
        
        const correctRecruiterId = employeeResult.Item.recruiterId;
        
        // Check if recruiterId needs fixing
        if (attendance.recruiterId === correctRecruiterId) {
          console.log(`✓ ${attendance.employeeId}: Already correct (${correctRecruiterId})`);
          skippedCount++;
          continue;
        }
        
        // Update attendance record with correct recruiterId
        await docClient.send(new UpdateCommand({
          TableName: ATTENDANCE_TABLE,
          Key: { attendanceId: attendance.attendanceId },
          UpdateExpression: 'SET recruiterId = :recruiterId',
          ExpressionAttributeValues: {
            ':recruiterId': correctRecruiterId
          }
        }));
        
        console.log(`✅ ${attendance.employeeId}: Fixed ${attendance.recruiterId} → ${correctRecruiterId}`);
        fixedCount++;
        
      } catch (error) {
        console.error(`❌ Error fixing ${attendance.employeeId}:`, error.message);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Fixed: ${fixedCount} records`);
    console.log(`   Skipped: ${skippedCount} records`);
    console.log(`   Total: ${attendanceRecords.length} records`);
    
    // Step 3: Remove duplicate device registration
    console.log('\n🔧 Step 3: Cleaning up duplicate device registrations...');
    await cleanupDuplicateDevices();
    
    console.log('\n✅ Fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  }
}

async function cleanupDuplicateDevices() {
  try {
    const deviceId = 'DEVICE-DE9DBFE1';
    const correctCompanyId = 'COMP-F86D581E'; // MER company
    const wrongCompanyId = 'COMP-725ACE7A'; // sunilchoudhary company
    
    // Get wrong company
    const wrongCompanyResult = await docClient.send(new GetCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId: wrongCompanyId }
    }));
    
    if (!wrongCompanyResult.Item) {
      console.log('ℹ️ Wrong company not found, skipping cleanup');
      return;
    }
    
    const wrongCompany = wrongCompanyResult.Item;
    const devices = wrongCompany.devices || [];
    
    // Remove device from wrong company
    const updatedDevices = devices.filter(d => d.deviceId !== deviceId);
    
    if (updatedDevices.length === devices.length) {
      console.log(`ℹ️ Device ${deviceId} not found in company ${wrongCompanyId}`);
      return;
    }
    
    await docClient.send(new UpdateCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId: wrongCompanyId },
      UpdateExpression: 'SET devices = :devices, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':devices': updatedDevices,
        ':updatedAt': new Date().toISOString()
      }
    }));
    
    console.log(`✅ Removed device ${deviceId} from company ${wrongCompanyId}`);
    console.log(`   Device now only registered to ${correctCompanyId}`);
    
  } catch (error) {
    console.error('❌ Device cleanup failed:', error.message);
  }
}

// Run the fix
fixAttendanceRecords()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
