/**
 * Script to add 5 mock employees with complete data for payroll testing
 * Run: node add-mock-payroll-data.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-south-1' });
const dynamoDB = DynamoDBDocumentClient.from(client);

// Get recruiterId from command line or use default
const recruiterId = process.argv[2] || 'c56ae435-f8ea-46e2-95a0-839187fb2c4f';

console.log(`🚀 Adding mock payroll data for recruiterId: ${recruiterId}`);

const mockEmployees = [
  {
    employeeId: '2001',
    fullName: 'Rajesh Kumar',
    email: 'rajesh.kumar@company.com',
    designation: 'Senior Developer',
    department: 'Engineering',
    basicSalary: 50000,
    salaryType: 'Monthly',
    paymentCycle: 'Monthly',
    allowances: [
      { name: 'HRA', amount: 20000, type: 'Fixed', taxable: true, carryForward: false },
      { name: 'Transport', amount: 3000, type: 'Fixed', taxable: false, carryForward: false }
    ],
    deductions: [
      { name: 'PF', amount: 6000, type: 'Fixed' },
      { name: 'ESI', amount: 1200, type: 'Fixed' },
      { name: 'Professional Tax', amount: 200, type: 'Fixed' }
    ],
    bonus: 5000,
    overtimeRate: 300,
    dateOfJoining: '2023-01-15',
    checkInTime: '09:00',
    checkOutTime: '18:00'
  },
  {
    employeeId: '2002',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@company.com',
    designation: 'HR Manager',
    department: 'Human Resources',
    basicSalary: 45000,
    salaryType: 'Monthly',
    paymentCycle: 'Monthly',
    allowances: [
      { name: 'HRA', amount: 18000, type: 'Fixed', taxable: true, carryForward: false },
      { name: 'Transport', amount: 2500, type: 'Fixed', taxable: false, carryForward: false }
    ],
    deductions: [
      { name: 'PF', amount: 5400, type: 'Fixed' },
      { name: 'ESI', amount: 1000, type: 'Fixed' }
    ],
    bonus: 4000,
    overtimeRate: 250,
    dateOfJoining: '2023-02-01',
    checkInTime: '09:00',
    checkOutTime: '18:00'
  },
  {
    employeeId: '2003',
    fullName: 'Amit Patel',
    email: 'amit.patel@company.com',
    designation: 'Marketing Executive',
    department: 'Marketing',
    basicSalary: 35000,
    salaryType: 'Monthly',
    paymentCycle: 'Monthly',
    allowances: [
      { name: 'HRA', amount: 14000, type: 'Fixed', taxable: true, carryForward: false },
      { name: 'Travel', amount: 5000, type: 'Variable', taxable: false, carryForward: false }
    ],
    deductions: [
      { name: 'PF', amount: 4200, type: 'Fixed' },
      { name: 'Professional Tax', amount: 200, type: 'Fixed' }
    ],
    bonus: 3000,
    overtimeRate: 200,
    dateOfJoining: '2023-03-10',
    checkInTime: '09:00',
    checkOutTime: '18:00'
  },
  {
    employeeId: '2004',
    fullName: 'Sneha Reddy',
    email: 'sneha.reddy@company.com',
    designation: 'Accountant',
    department: 'Finance',
    basicSalary: 40000,
    salaryType: 'Monthly',
    paymentCycle: 'Monthly',
    allowances: [
      { name: 'HRA', amount: 16000, type: 'Fixed', taxable: true, carryForward: false },
      { name: 'Transport', amount: 2000, type: 'Fixed', taxable: false, carryForward: false }
    ],
    deductions: [
      { name: 'PF', amount: 4800, type: 'Fixed' },
      { name: 'ESI', amount: 900, type: 'Fixed' },
      { name: 'Loan', amount: 2000, type: 'Fixed' }
    ],
    bonus: 3500,
    overtimeRate: 220,
    dateOfJoining: '2023-04-01',
    checkInTime: '09:00',
    checkOutTime: '18:00'
  },
  {
    employeeId: '2005',
    fullName: 'Vikram Singh',
    email: 'vikram.singh@company.com',
    designation: 'Sales Manager',
    department: 'Sales',
    basicSalary: 48000,
    salaryType: 'Monthly',
    paymentCycle: 'Monthly',
    allowances: [
      { name: 'HRA', amount: 19000, type: 'Fixed', taxable: true, carryForward: false },
      { name: 'Travel', amount: 6000, type: 'Variable', taxable: false, carryForward: false },
      { name: 'Mobile', amount: 1500, type: 'Fixed', taxable: false, carryForward: false }
    ],
    deductions: [
      { name: 'PF', amount: 5760, type: 'Fixed' },
      { name: 'ESI', amount: 1100, type: 'Fixed' }
    ],
    bonus: 8000,
    overtimeRate: 280,
    dateOfJoining: '2023-01-20',
    checkInTime: '09:00',
    checkOutTime: '18:00'
  }
];

// Generate attendance for current month (last 20 days)
const generateAttendance = (employeeId, scenario) => {
  const attendance = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Generate for last 20 days of current month
  for (let day = 1; day <= 20; day++) {
    const date = new Date(currentYear, currentMonth, day);
    if (date.getDay() === 0) continue; // Skip Sundays
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Different scenarios for different employees
    if (scenario === 'perfect') {
      // Perfect attendance with some overtime
      attendance.push({
        attendanceId: `ATT-${employeeId}-${dateStr}`,
        employeeId,
        date: dateStr,
        checkIn: '09:00',
        checkOut: day % 5 === 0 ? '20:00' : '18:00', // Overtime every 5th day
        hours: day % 5 === 0 ? 11 : 9,
        status: 'present',
        source: 'manual',
        createdAt: new Date().toISOString()
      });
    } else if (scenario === 'some-absent') {
      // Some absences
      if (day === 5 || day === 12) {
        // Absent days - no record
        continue;
      }
      attendance.push({
        attendanceId: `ATT-${employeeId}-${dateStr}`,
        employeeId,
        date: dateStr,
        checkIn: '09:00',
        checkOut: '18:00',
        hours: 9,
        status: 'present',
        source: 'manual',
        createdAt: new Date().toISOString()
      });
    } else if (scenario === 'late-some') {
      // Some late arrivals
      attendance.push({
        attendanceId: `ATT-${employeeId}-${dateStr}`,
        employeeId,
        date: dateStr,
        checkIn: day % 4 === 0 ? '10:00' : '09:00',
        checkOut: '18:00',
        hours: day % 4 === 0 ? 8 : 9,
        status: day % 4 === 0 ? 'late' : 'present',
        source: 'manual',
        createdAt: new Date().toISOString()
      });
    } else {
      // Regular attendance
      attendance.push({
        attendanceId: `ATT-${employeeId}-${dateStr}`,
        employeeId,
        date: dateStr,
        checkIn: '09:00',
        checkOut: '18:00',
        hours: 9,
        status: 'present',
        source: 'manual',
        createdAt: new Date().toISOString()
      });
    }
  }
  
  return attendance;
};

// Generate leaves for current month
const generateLeaves = (employeeId, employeeName, scenario) => {
  const leaves = [];
  const balances = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const leaveTypes = ['Casual Leave', 'Sick Leave', 'Earned Leave'];
  
  // Create leave balances
  leaveTypes.forEach(leaveType => {
    balances.push({
      balanceId: `BAL-${employeeId}-${leaveType.replace(/\s/g, '')}`,
      entityType: 'BALANCE',
      recruiterId,
      employeeId,
      employeeName,
      department: mockEmployees.find(e => e.employeeId === employeeId).department,
      leaveType,
      totalLeaves: leaveType === 'Casual Leave' ? 12 : leaveType === 'Sick Leave' ? 7 : 15,
      usedLeaves: scenario === 'with-lwp' ? (leaveType === 'Casual Leave' ? 2 : 0) : 1,
      availableLeaves: scenario === 'with-lwp' ? (leaveType === 'Casual Leave' ? 10 : leaveType === 'Sick Leave' ? 7 : 15) : (leaveType === 'Casual Leave' ? 11 : leaveType === 'Sick Leave' ? 6 : 15),
      year: currentYear,
      createdAt: new Date().toISOString()
    });
  });
  
  // Create leave applications
  if (scenario === 'with-lwp') {
    // Casual Leave (Paid)
    leaves.push({
      leaveId: `LV-${employeeId}-001`,
      entityType: 'LEAVE',
      recruiterId,
      employeeId,
      employeeName,
      department: mockEmployees.find(e => e.employeeId === employeeId).department,
      leaveType: 'Casual Leave',
      startDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-08`,
      endDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-09`,
      days: 2,
      reason: 'Personal work',
      status: 'Approved',
      appliedDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    
    // Leave Without Pay
    leaves.push({
      leaveId: `LV-${employeeId}-002`,
      entityType: 'LEAVE',
      recruiterId,
      employeeId,
      employeeName,
      department: mockEmployees.find(e => e.employeeId === employeeId).department,
      leaveType: 'Leave Without Pay',
      startDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`,
      endDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`,
      days: 1,
      reason: 'Emergency',
      status: 'Approved',
      appliedDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  } else if (scenario === 'paid-only') {
    // Only paid leave
    leaves.push({
      leaveId: `LV-${employeeId}-001`,
      entityType: 'LEAVE',
      recruiterId,
      employeeId,
      employeeName,
      department: mockEmployees.find(e => e.employeeId === employeeId).department,
      leaveType: 'Sick Leave',
      startDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`,
      endDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`,
      days: 1,
      reason: 'Fever',
      status: 'Approved',
      appliedDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  }
  
  return { leaves, balances };
};

const addMockData = async () => {
  try {
    console.log('\n📝 Step 1: Adding Employees...');
    
    for (const emp of mockEmployees) {
      const employeeData = {
        employeeId: emp.employeeId,
        recruiterId,
        fullName: emp.fullName,
        name: emp.fullName,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        annualCTC: emp.basicSalary * 12,
        basicSalary: emp.basicSalary,
        basicPay: emp.basicSalary,
        salaryType: emp.salaryType,
        paymentCycle: emp.paymentCycle,
        allowances: emp.allowances,
        deductions: emp.deductions,
        bonus: emp.bonus,
        overtimeRate: emp.overtimeRate,
        dateOfJoining: emp.dateOfJoining,
        checkInTime: emp.checkInTime,
        checkOutTime: emp.checkOutTime,
        employmentType: 'Full-Time',
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      await dynamoDB.send(new PutCommand({
        TableName: 'staffinn-hrms-employees',
        Item: employeeData
      }));
      
      console.log(`✅ Added employee: ${emp.fullName} (${emp.employeeId})`);
    }
    
    console.log('\n📅 Step 2: Adding Attendance Records...');
    
    const attendanceScenarios = ['perfect', 'some-absent', 'late-some', 'perfect', 'perfect'];
    
    for (let i = 0; i < mockEmployees.length; i++) {
      const emp = mockEmployees[i];
      const attendance = generateAttendance(emp.employeeId, attendanceScenarios[i]);
      
      for (const att of attendance) {
        await dynamoDB.send(new PutCommand({
          TableName: 'staffinn-hrms-attendance',
          Item: att
        }));
      }
      
      console.log(`✅ Added ${attendance.length} attendance records for ${emp.fullName}`);
    }
    
    console.log('\n🏖️ Step 3: Adding Leave Records...');
    
    const leaveScenarios = ['paid-only', 'with-lwp', 'paid-only', 'with-lwp', 'paid-only'];
    
    for (let i = 0; i < mockEmployees.length; i++) {
      const emp = mockEmployees[i];
      const { leaves, balances } = generateLeaves(emp.employeeId, emp.fullName, leaveScenarios[i]);
      
      // Add leave balances
      for (const balance of balances) {
        await dynamoDB.send(new PutCommand({
          TableName: 'HRMS-Leaves-Table',
          Item: balance
        }));
      }
      
      // Add leave applications
      for (const leave of leaves) {
        await dynamoDB.send(new PutCommand({
          TableName: 'HRMS-Leaves-Table',
          Item: leave
        }));
      }
      
      console.log(`✅ Added ${leaves.length} leaves and ${balances.length} balances for ${emp.fullName}`);
    }
    
    console.log('\n🎉 Mock data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Employees: ${mockEmployees.length}`);
    console.log(`   - Attendance records: ~${mockEmployees.length * 18} (20 days, excluding Sundays)`);
    console.log(`   - Leave records: ${mockEmployees.length * 3} balances + applications`);
    console.log('\n🚀 Now you can:');
    console.log('   1. Go to HRMS → Payroll');
    console.log('   2. Select current month');
    console.log('   3. Click "Run Payroll"');
    console.log('   4. View calculated salaries with:');
    console.log('      - Attendance-based calculations');
    console.log('      - Leave deductions (LWP)');
    console.log('      - Overtime payments');
    console.log('      - Allowances & Deductions');
    
  } catch (error) {
    console.error('❌ Error adding mock data:', error);
  }
};

addMockData();
