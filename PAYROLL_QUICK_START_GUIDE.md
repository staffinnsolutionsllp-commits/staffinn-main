# 🚀 HRMS Payroll System - Quick Start Guide

## 📦 What's Implemented

### ✅ Backend (Node.js + DynamoDB)
- Automated payroll calculation engine
- Integration with Employee, Attendance, Leave modules
- RESTful API endpoints
- Multi-tenant data isolation

### ✅ Frontend (React + TypeScript)
- Modern payroll dashboard
- One-click payroll processing
- Payslip generation & download
- CSV export functionality

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Start Servers

**Terminal 1 - Backend:**
```bash
cd d:\Staffinn-main\Backend
npm start
```
Server runs on: `http://localhost:4001`

**Terminal 2 - HRMS Frontend:**
```bash
cd "d:\Staffinn-main\HRMS Staffinn\Staffinn HR Manager_files"
npm run dev
```
HRMS runs on: `http://localhost:5175`

### Step 2: Access HRMS
1. Open browser: `http://localhost:5175`
2. Login with your HRMS credentials
3. Navigate to **Payroll** section in sidebar

### Step 3: Run Your First Payroll
1. Select current month from dropdown
2. Click **"Run Payroll"** button
3. Confirm the action
4. Wait for processing (few seconds)
5. View results in the table

---

## 📋 Complete Workflow

### 1️⃣ Employee Onboarding (One-time Setup)

**Location:** HRMS → Employees → Add Employee

**Required Fields:**
- Name, Email, Position, Department
- Annual Salary

**Payroll Fields (Stored Automatically):**
```javascript
{
  basicSalary: 30000,        // Monthly basic
  salaryType: "Monthly",     // Monthly/Daily/Hourly
  allowances: [              // Dynamic allowances
    { name: "HRA", amount: 12000, type: "Fixed", taxable: true },
    { name: "Transport", amount: 2000, type: "Fixed", taxable: false }
  ],
  deductions: [              // Statutory deductions
    { name: "PF", amount: 3600, type: "Fixed" },
    { name: "ESI", amount: 750, type: "Fixed" }
  ],
  bonus: 5000,               // Monthly bonus
  overtimeRate: 150          // Per hour rate
}
```

### 2️⃣ Daily Operations

**Attendance Tracking:**
```
HRMS → Attendance → Mark Attendance
- Check-in time
- Check-out time
- Overtime hours (auto-calculated)
```

**Leave Management:**
```
HRMS → Leave Management
- Apply leaves (Paid/LWP)
- Approve/Reject leaves
- Track leave balances
```

### 3️⃣ Monthly Payroll Processing

**Location:** HRMS → Payroll

**Process:**
1. **Select Month:** Choose month from dropdown (e.g., "2024-03")
2. **Run Payroll:** Click "Run Payroll" button
3. **Confirm:** System shows confirmation dialog
4. **Processing:** Backend automatically:
   - Fetches all active employees
   - Gets attendance data (present, absent, overtime)
   - Gets leave data (paid leaves, LWP)
   - Calculates earnings and deductions
   - Generates payroll records
5. **Results:** View summary and employee-wise records

**What Gets Calculated:**
```
Earnings:
✓ Basic Salary
✓ All Allowances (HRA, Transport, etc.)
✓ Bonus
✓ Overtime Pay

Deductions:
✓ PF, ESI, Professional Tax
✓ LWP Deduction (auto-calculated)
✓ Custom Deductions (Loan, Advance)

Net Salary = Total Earnings - Total Deductions
```

### 4️⃣ Payslip Management

**View Details:**
- Click 👁️ icon to view complete breakdown
- Shows: Attendance, Earnings, Deductions, Net Salary

**Download Payslip:**
- Click 📄 icon to download individual payslip
- Format: Text file with complete details

**Export All:**
- Click "Export" button
- Downloads CSV with all employee records

---

## 💡 Key Features

### 🤖 Fully Automated
- No manual salary entry required
- Automatic attendance integration
- Automatic leave deduction
- One-click processing

### 📊 Comprehensive Dashboard
- Summary cards (Employees, Gross, Deductions, Net)
- Employee-wise breakdown
- Attendance summary
- Payment status tracking

### 📄 Payslip Generation
- Complete earnings breakdown
- Detailed deductions
- Attendance summary
- Downloadable format

### 🔒 Data Security
- Multi-tenant isolation
- recruiterId-based filtering
- No cross-organization access

---

## 📐 Salary Calculation Examples

### Example 1: Full Month Attendance
```
Employee: John Doe
Basic Salary: ₹30,000
Allowances: ₹14,000 (HRA + Transport)
Bonus: ₹5,000
Overtime: ₹1,500 (10 hours × ₹150)

Working Days: 26
Present: 26
Absent: 0
Paid Leaves: 0
Unpaid Leaves: 0

Earnings: ₹30,000 + ₹14,000 + ₹5,000 + ₹1,500 = ₹50,500
Deductions: ₹4,350 (PF + ESI + Tax)
Net Salary: ₹50,500 - ₹4,350 = ₹46,150
```

### Example 2: With Leave Without Pay
```
Employee: Jane Smith
Basic Salary: ₹25,000
Allowances: ₹10,000
Bonus: ₹3,000

Working Days: 26
Present: 23
Absent: 1
Paid Leaves: 1
Unpaid Leaves: 1

Per Day Salary: ₹25,000 / 26 = ₹961.54
LWP Deduction: ₹961.54 × 1 = ₹961.54

Earnings: ₹25,000 + ₹10,000 + ₹3,000 = ₹38,000
Deductions: ₹3,500 + ₹961.54 = ₹4,461.54
Net Salary: ₹38,000 - ₹4,461.54 = ₹33,538.46
```

---

## 🔧 Troubleshooting

### Issue: "No employees found"
**Solution:** Add employees first in Employees section

### Issue: "No payroll records"
**Solution:** Click "Run Payroll" to process salaries

### Issue: "Failed to run payroll"
**Solution:** 
1. Check backend server is running
2. Verify authentication token
3. Check browser console for errors

### Issue: "Incorrect salary calculation"
**Solution:**
1. Verify employee salary structure
2. Check attendance records
3. Verify leave records
4. Re-run payroll

---

## 📞 API Reference (For Developers)

### Run Payroll
```javascript
POST /api/v1/hrms/payroll/run
Headers: { Authorization: "Bearer <token>" }
Body: { "month": "2024-03" }
```

### Get Payroll Records
```javascript
GET /api/v1/hrms/payroll/month/2024-03
Headers: { Authorization: "Bearer <token>" }
```

### Get Summary
```javascript
GET /api/v1/hrms/payroll/summary?month=2024-03
Headers: { Authorization: "Bearer <token>" }
```

---

## 📊 Database Schema

### staffinn-hrms-payroll
```javascript
{
  payrollRecordId: "PRE-2024-03-EMP001",  // PK
  month: "2024-03",                        // SK
  recruiterId: "REC123",                   // GSI-1 PK
  employeeId: "EMP001",                    // GSI-2 PK
  employeeName: "John Doe",
  department: "Engineering",
  basicSalary: 30000,
  totalEarnings: 50500,
  totalDeductions: 4350,
  netSalary: 46150,
  paymentStatus: "pending",
  createdAt: "2024-03-31T10:00:00Z"
}
```

---

## ✅ Success Checklist

Before running payroll, ensure:
- [ ] Employees added with salary structure
- [ ] Attendance marked for the month
- [ ] Leaves applied and approved
- [ ] Backend server running
- [ ] HRMS frontend running
- [ ] Logged in to HRMS

---

## 🎉 You're Ready!

Your HRMS Payroll System is fully functional and ready to use!

**Need Help?**
- Check `PAYROLL_IMPLEMENTATION_COMPLETE.md` for technical details
- Check `HRMS_PAYROLL_SYSTEM_IMPLEMENTATION.md` for architecture
- Review backend logs for debugging

**Happy Payroll Processing! 💰**
