# HRMS Payroll System - Complete Implementation Guide

## 🎯 Overview
Fully automated payroll system integrated with Employee Onboarding, Attendance Management, and Leave Management modules.

## 📊 Database Schema

### Table: `staffinn-hrms-payroll`
- **Partition Key:** `payrollRecordId` (String) - Format: `PRE-{YYYY-MM}-{employeeId}`
- **Sort Key:** `month` (String) - Format: `YYYY-MM`

### Global Secondary Indexes (GSI):
1. **recruiterId-month-index**
   - Partition Key: `recruiterId`
   - Sort Key: `month`
   - Purpose: Get all payroll records for a recruiter for specific month

2. **employeeId-month-index**
   - Partition Key: `employeeId`
   - Sort Key: `month`
   - Purpose: Get payroll history for specific employee

## 🔧 Backend Implementation

### Files Created/Modified:

#### 1. **Controller:** `Backend/controllers/hrms/hrmsPayrollController.js`
**Functions:**
- `runPayroll(req, res)` - Process payroll for all employees for a month
- `calculateEmployeePayroll(employee, month, recruiterId)` - Calculate individual payroll
- `getEmployeeAttendance(employeeId, startDate, endDate)` - Fetch attendance data
- `getEmployeeLeaves(employeeId, startDate, endDate)` - Fetch leave data
- `getWorkingDaysInMonth(year, month)` - Calculate working days (excluding Sundays)
- `getPayrollByMonth(req, res)` - Get all payroll records for a month
- `getEmployeePayrollHistory(req, res)` - Get payroll history for an employee
- `getPayrollRecord(req, res)` - Get single payroll record
- `getPayrollSummary(req, res)` - Get payroll summary/statistics

#### 2. **Routes:** `Backend/routes/hrms/hrmsPayrollRoutes.js`
```
POST   /api/v1/hrms/payroll/run                    - Run payroll for a month
GET    /api/v1/hrms/payroll/month/:month           - Get payroll by month
GET    /api/v1/hrms/payroll/summary                - Get payroll summary
GET    /api/v1/hrms/payroll/employee/:employeeId   - Get employee payroll history
GET    /api/v1/hrms/payroll/:payrollRecordId/:month - Get single payroll record
```

#### 3. **Employee Model Updates:** `Backend/controllers/hrms/hrmsEmployeeController.js`
**New Fields Added:**
- `basicSalary` - Basic salary amount
- `salaryType` - Monthly/Daily/Hourly
- `paymentCycle` - Monthly
- `allowances` - Array of allowance objects
- `bonus` - Bonus amount
- `deductions` - Array of deduction objects
- `overtimeRate` - Hourly overtime rate

#### 4. **Config Updates:** `Backend/config/dynamodb-wrapper.js`
- Added `HRMS_PAYROLL_TABLE` constant
- Registered table in mock DB initialization

#### 5. **Server Updates:** `Backend/server.js`
- Registered payroll routes: `/api/v1/hrms/payroll/*`

## 💰 Payroll Calculation Logic

### Earnings Calculation:
```
Total Earnings = Basic Salary + Allowances + Bonus + Overtime
```

### Deductions Calculation:
```
Total Deductions = Statutory Deductions (PF, ESI, Tax) + LWP Deduction + Custom Deductions

LWP Deduction = (Unpaid Absences + Unpaid Leaves) × Per Day Salary
Per Day Salary = Basic Salary / Total Working Days
```

### Net Salary:
```
Net Salary = Total Earnings - Total Deductions
```

## 📋 Employee Onboarding Form Fields

### Salary Structure:
```javascript
{
  basicSalary: 30000,
  salaryType: "Monthly", // Monthly/Daily/Hourly
  paymentCycle: "Monthly",
  overtimeRate: 150 // Per hour
}
```

### Allowances (Array):
```javascript
allowances: [
  {
    name: "HRA",
    amount: 12000,
    type: "Fixed", // Fixed/Variable
    taxable: true,
    carryForward: false
  },
  {
    name: "Transport Allowance",
    amount: 2000,
    type: "Fixed",
    taxable: false,
    carryForward: false
  }
]
```

### Deductions (Array):
```javascript
deductions: [
  {
    name: "PF",
    amount: 3600,
    type: "Fixed"
  },
  {
    name: "ESI",
    amount: 750,
    type: "Fixed"
  },
  {
    name: "Professional Tax",
    amount: 200,
    type: "Fixed"
  }
]
```

### Bonus:
```javascript
{
  bonus: 5000 // Fixed or performance-based
}
```

## 🔄 Automated Workflow

### 1. Employee Onboarding
- HR adds employee with complete salary structure
- Data stored in `staffinn-hrms-employees` table
- Includes: basic salary, allowances, deductions, bonus

### 2. Attendance Tracking
- Daily attendance marked (manual/biometric)
- Stored in `staffinn-hrms-attendance` table
- Tracks: check-in, check-out, hours, overtime

### 3. Leave Management
- Employees apply for leaves
- Approved leaves stored in `HRMS-Leaves-Table`
- Categorized as: Paid Leave or Leave Without Pay (LWP)

### 4. Payroll Processing
**API Call:**
```bash
POST /api/v1/hrms/payroll/run
Authorization: Bearer <token>
Content-Type: application/json

{
  "month": "2024-03"
}
```

**Process:**
1. Fetch all active employees for the recruiter
2. For each employee:
   - Get attendance data for the month
   - Get leave data for the month
   - Calculate working days
   - Calculate earnings (basic + allowances + bonus + overtime)
   - Calculate deductions (statutory + LWP + custom)
   - Compute net salary
3. Save payroll records to `staffinn-hrms-payroll` table
4. Return summary

**Response:**
```json
{
  "success": true,
  "message": "Payroll processed successfully",
  "data": {
    "month": "2024-03",
    "totalEmployees": 50,
    "totalGrossSalary": 2500000,
    "totalDeductions": 250000,
    "totalNetSalary": 2250000,
    "records": [...]
  }
}
```

## 📊 Payroll Record Structure

```javascript
{
  payrollRecordId: "PRE-2024-03-EMP001",
  month: "2024-03",
  recruiterId: "REC123",
  employeeId: "EMP001",
  employeeName: "John Doe",
  department: "Engineering",
  designation: "Software Engineer",
  
  // Salary structure
  basicSalary: 30000,
  salaryType: "Monthly",
  
  // Attendance
  totalWorkingDays: 26,
  daysPresent: 24,
  daysAbsent: 2,
  halfDays: 0,
  paidLeaves: 1,
  unpaidLeaves: 1,
  overtimeHours: 10,
  
  // Earnings
  allowances: [
    { name: "HRA", amount: 12000, type: "Fixed", taxable: true },
    { name: "Transport", amount: 2000, type: "Fixed", taxable: false }
  ],
  bonus: 5000,
  overtime: 1500,
  totalEarnings: 50500,
  
  // Deductions
  deductions: [
    { name: "PF", amount: 3600, type: "Fixed" },
    { name: "ESI", amount: 750, type: "Fixed" },
    { name: "Professional Tax", amount: 200, type: "Fixed" },
    { name: "Leave Without Pay", amount: 1154, type: "Calculated" }
  ],
  totalDeductions: 5704,
  
  // Net salary
  netSalary: 44796,
  
  // Payment status
  paymentStatus: "pending", // pending/paid
  paymentDate: null,
  
  createdAt: "2024-03-31T10:00:00Z",
  createdBy: "admin@company.com"
}
```

## 🔒 Data Isolation

### Multi-Tenant Security:
- All queries filter by `recruiterId`
- Payroll records tagged with `recruiterId`
- No cross-organization data access
- GSI ensures efficient recruiter-specific queries

### Access Control:
- `authenticateHRMS` middleware validates JWT token
- Extracts `recruiterId` from token
- All operations scoped to authenticated recruiter

## 📈 API Usage Examples

### 1. Run Monthly Payroll
```bash
POST /api/v1/hrms/payroll/run
{
  "month": "2024-03"
}
```

### 2. Get Payroll for March 2024
```bash
GET /api/v1/hrms/payroll/month/2024-03
```

### 3. Get Employee Payroll History
```bash
GET /api/v1/hrms/payroll/employee/EMP001
```

### 4. Get Payroll Summary
```bash
GET /api/v1/hrms/payroll/summary?month=2024-03
```

### 5. Get Single Payroll Record
```bash
GET /api/v1/hrms/payroll/PRE-2024-03-EMP001/2024-03
```

## ✅ Features Implemented

### ✓ Automated Salary Calculation
- Fetches employee salary structure from onboarding data
- No manual entry required each month

### ✓ Attendance Integration
- Automatically calculates days present/absent
- Deducts salary for unpaid absences
- Includes overtime calculation

### ✓ Leave Integration
- Respects paid leave (no deduction)
- Deducts salary for Leave Without Pay (LWP)
- Integrates with leave balance system

### ✓ Flexible Salary Structure
- Multiple allowances (fixed/variable, taxable/non-taxable)
- Multiple deductions (PF, ESI, Tax, Loan, Custom)
- Bonus and incentives support
- Overtime calculation

### ✓ Data Isolation
- Complete separation between HRMS instances
- recruiterId-based filtering
- Secure multi-tenant architecture

### ✓ Payroll History
- Complete audit trail
- Month-wise payroll records
- Employee-wise history
- Downloadable payslips (ready for PDF generation)

## 🚀 Next Steps (Frontend Integration)

### Required Frontend Components:
1. **Payroll Dashboard**
   - Run payroll button
   - Month selector
   - Summary cards (total employees, gross, deductions, net)

2. **Payroll Records Table**
   - Employee-wise breakdown
   - Earnings/deductions columns
   - Payment status
   - Actions (view details, download payslip)

3. **Employee Onboarding Form Updates**
   - Salary structure section
   - Dynamic allowances input
   - Dynamic deductions input
   - Bonus/incentive fields

4. **Payslip Generation**
   - PDF generation library (e.g., jsPDF, pdfmake)
   - Payslip template
   - Download functionality

## 🧪 Testing Checklist

- [ ] Create employee with complete salary structure
- [ ] Mark attendance for the month
- [ ] Apply and approve leaves (paid and LWP)
- [ ] Run payroll for the month
- [ ] Verify salary calculations
- [ ] Check LWP deductions
- [ ] Verify overtime calculations
- [ ] Test data isolation (multiple recruiters)
- [ ] Get payroll history
- [ ] Get payroll summary

## 📝 Notes

- Working days calculation excludes Sundays
- Overtime calculated for hours > 8 per day
- Per day salary = Basic Salary / Total Working Days
- All monetary values rounded to 2 decimal places
- Payroll records are immutable once created
- Payment status can be updated separately

## 🔧 Configuration

### Environment Variables:
```
HRMS_PAYROLL_TABLE=staffinn-hrms-payroll
```

### Dependencies:
- AWS SDK (DynamoDB)
- Express.js
- JWT authentication
- Existing HRMS modules (Employee, Attendance, Leave)

---

**Implementation Status:** ✅ Backend Complete
**Next Phase:** Frontend Integration & Payslip PDF Generation
