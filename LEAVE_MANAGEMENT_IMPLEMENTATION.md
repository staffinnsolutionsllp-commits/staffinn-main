# Leave Management Module - Complete Implementation Guide

## Overview
A comprehensive Leave Management system integrated into the HRMS software with 6 main tabs: Dashboard, Leave Logs, Leave Rules, Leave Balance, Analytics, and Settings.

## Architecture

### Frontend Structure
```
src/
├── components/
│   ├── LeaveManagement.tsx          # Main component with tab navigation
│   └── Leave/
│       ├── LeaveDashboard.tsx       # Summary cards & calendar view
│       ├── LeaveLogs.tsx            # Leave applications table
│       ├── LeaveRules.tsx           # Policy configuration
│       ├── LeaveBalance.tsx         # Employee leave balances
│       ├── LeaveAnalytics.tsx       # Charts and reports
│       └── LeaveSettings.tsx        # System settings
├── services/
│   └── leaveService.js              # API service layer
└── App.tsx                          # Updated with leave route
```

### Backend Structure
```
Backend/
├── controllers/
│   └── hrms/
│       └── hrmsLeaveController.js   # All leave operations
└── routes/
    └── hrms/
        └── hrmsLeaveRoutes.js       # API endpoints
```

## Database Schema

### DynamoDB Table: HRMS-Leaves-Table
**Partition Key:** `leaveId` (String)

### Entity Types:

#### 1. LEAVE (Leave Applications)
```javascript
{
  leaveId: "uuid",
  entityType: "LEAVE",
  employeeId: "string",
  employeeName: "string",
  department: "string",
  leaveType: "string",
  startDate: "YYYY-MM-DD",
  endDate: "YYYY-MM-DD",
  numberOfDays: number,
  reason: "string",
  status: "Pending|Approved|Rejected",
  appliedOn: "ISO timestamp",
  approvedBy: "string|null",
  approvedOn: "ISO timestamp|null",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp"
}
```

#### 2. RULE (Leave Policies)
```javascript
{
  leaveId: "uuid",
  ruleId: "uuid",
  entityType: "RULE",
  leaveName: "string",
  leaveCode: "string",
  leaveCategory: "Paid|Unpaid",
  description: "string",
  effectiveFrom: "YYYY-MM-DD",
  totalLeavesPerYear: number,
  accrualType: "Monthly|Quarterly|Yearly|One-time",
  proRataCalculation: "Yes|No",
  applicableAfterProbation: "Yes|No",
  applicableDepartments: ["string"],
  minLeaveDuration: number,
  maxLeaveAtTime: number,
  advanceNoticeRequired: number,
  backdatedLeaveAllowed: "Yes|No",
  sandwichRuleEnabled: "Yes|No",
  carryForwardAllowed: "Yes|No",
  maxCarryForwardLimit: number,
  expiryPeriod: number,
  encashmentAllowed: "Yes|No",
  allowNegativeLeave: "Yes|No",
  maxNegativeLimit: number,
  approvalLevel: "Single|Multi",
  approverRole: "Manager|HR|Admin",
  autoApproval: "Yes|No",
  status: "Active|Inactive",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp"
}
```

#### 3. BALANCE (Employee Leave Balances)
```javascript
{
  leaveId: "uuid",
  entityType: "BALANCE",
  employeeId: "string",
  employeeName: "string",
  department: "string",
  leaveType: "string",
  totalAllocated: number,
  used: number,
  remaining: number,
  carryForward: number,
  lwp: number,
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp"
}
```

#### 4. ADJUSTMENT_LOG (Balance Adjustments)
```javascript
{
  leaveId: "uuid",
  entityType: "ADJUSTMENT_LOG",
  employeeId: "string",
  leaveType: "string",
  adjustmentType: "Add|Deduct",
  days: number,
  reason: "string",
  adjustedBy: "string",
  createdAt: "ISO timestamp"
}
```

#### 5. SETTINGS (System Configuration)
```javascript
{
  leaveId: "uuid",
  entityType: "SETTINGS",
  holidayList: [{
    id: "string",
    date: "YYYY-MM-DD",
    name: "string",
    type: "Public|Optional"
  }],
  workingDays: ["Monday", "Tuesday", ...],
  weekendDays: ["Saturday", "Sunday"],
  financialYearStart: "MM-DD",
  payrollIntegration: "Yes|No",
  attendanceSync: "Yes|No",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp"
}
```

## API Endpoints

### Base URL: `/api/v1/hrms/leaves`

#### Dashboard & Stats
- `GET /stats` - Get leave statistics
- `GET /` - Get all leaves (with filters: year, department, status)
- `GET /:leaveId` - Get specific leave details

#### Leave Operations
- `POST /` - Create new leave application
- `PUT /:leaveId/status` - Update leave status (approve/reject)

#### Leave Rules
- `GET /rules` - Get all active leave rules
- `POST /rules` - Create new leave rule
- `PUT /rules/:ruleId` - Update leave rule
- `DELETE /rules/:ruleId` - Deactivate leave rule

#### Leave Balances
- `GET /balances` - Get all employee leave balances (filter by department)
- `POST /balances/adjust` - Manual balance adjustment

#### Analytics
- `GET /analytics?year=2024` - Get leave analytics and reports

#### Settings
- `GET /settings` - Get leave system settings
- `PUT /settings` - Update leave system settings

## Features by Tab

### 1️⃣ Leave Dashboard
- **Summary Cards:**
  - Total Leave Requests
  - Approved Leaves
  - Pending Requests
  - Rejected Requests
- **Calendar View:** Visual representation of employee leaves
- **Filters:** Date range and department filters

### 2️⃣ Leave Logs
- **Table Columns:**
  - Employee ID, Name, Department
  - Leave Type, Start/End Date, Days
  - Status, Applied On, Approved By
  - Actions (View/Approve/Reject)
- **Features:**
  - Search by name/ID
  - Filter by status and year
  - Bulk approval
  - Export to CSV
  - Pagination (10 items per page)

### 3️⃣ Leave Rules (Policy Configuration)
- **Basic Information:** Name, Code, Category, Description, Effective Date
- **Allocation Rules:** Total leaves, Accrual type, Pro-rata, Probation
- **Usage Rules:** Min/Max duration, Advance notice, Backdating, Sandwich rule
- **Carry Forward:** Allowed, Limit, Expiry, Encashment
- **Negative Balance:** Allowed, Maximum limit
- **Approval Workflow:** Single/Multi-level, Approver role, Auto-approval
- **Actions:** Edit, Deactivate, Version history

### 4️⃣ Leave Balance
- **Display:** Employee-wise leave balances by type
- **Columns:** Name, Type, Allocated, Used, Remaining, Carry Forward, LWP
- **Features:**
  - Department filter
  - Manual adjustment (Add/Deduct)
  - Adjustment reason logging
  - Color-coded remaining balance

### 5️⃣ Leave Analytics
- **Reports:**
  - Department-wise leave usage (bar chart)
  - Monthly leave trend (line chart)
  - Most used leave types (bar chart)
  - Leave liability report
  - LWP impact on payroll
- **Features:**
  - Year filter
  - Download reports
  - Key insights cards

### 6️⃣ Settings
- **Holiday List:** Add/remove holidays with dates
- **Working Days:** Configure working days (checkbox)
- **Weekend Definition:** Auto-calculated from working days
- **Financial Year:** Start date (MM-DD format)
- **Integrations:**
  - Payroll Integration toggle
  - Attendance Sync toggle
- **Status Indicators:** Real-time integration status

## System Integration

### Attendance Sync
When `attendanceSync` is enabled:
- Leave applications automatically mark attendance as "On Leave"
- LWP (Leave Without Pay) is tracked separately
- Attendance records are updated when leave is approved

### Payroll Integration
When `payrollIntegration` is enabled:
- LWP days automatically deduct from salary
- Leave encashment is calculated
- Carry forward leaves are tracked for liability

### Audit Logs
All actions are logged:
- Leave applications
- Status changes (with approver info)
- Balance adjustments (with reason)
- Rule modifications
- Settings updates

## Usage Instructions

### For Employees:
1. Navigate to Leave Management
2. View Dashboard for leave summary
3. Check Leave Balance tab for available leaves
4. Apply for leave (if application feature is added)

### For HR/Admin:
1. **Configure Policies:**
   - Go to Leave Rules tab
   - Click "Add Leave Rule"
   - Fill all policy details
   - Save rule

2. **Manage Applications:**
   - Go to Leave Logs tab
   - Review pending requests
   - Approve/Reject individually or in bulk
   - Export reports as needed

3. **Adjust Balances:**
   - Go to Leave Balance tab
   - Click "Manual Adjustment"
   - Select employee and leave type
   - Add/Deduct days with reason

4. **Configure System:**
   - Go to Settings tab
   - Add holidays
   - Set working days
   - Enable integrations

5. **View Analytics:**
   - Go to Analytics tab
   - Select year
   - Review charts and reports
   - Download for records

## Installation & Setup

### Frontend Setup:
```bash
cd "HRMS Staffinn/Staffinn HR Manager_files"
npm install
npm run dev
```

### Backend Setup:
```bash
cd Backend
npm install
npm start
```

### DynamoDB Table Creation:
The table will be auto-created on first API call, or manually create:
```javascript
{
  TableName: "HRMS-Leaves-Table",
  KeySchema: [
    { AttributeName: "leaveId", KeyType: "HASH" }
  ],
  AttributeDefinitions: [
    { AttributeName: "leaveId", AttributeType: "S" }
  ],
  BillingMode: "PAY_PER_REQUEST"
}
```

## Testing

### Test Leave Application:
```bash
curl -X POST http://localhost:4001/api/v1/hrms/leaves \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "department": "Engineering",
    "leaveType": "Casual Leave",
    "startDate": "2024-02-01",
    "endDate": "2024-02-02",
    "numberOfDays": 2,
    "reason": "Personal work"
  }'
```

### Test Leave Approval:
```bash
curl -X PUT http://localhost:4001/api/v1/hrms/leaves/LEAVE_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "Approved",
    "approvedBy": "HR Manager"
  }'
```

## Security

- All endpoints require authentication via `authenticateHRMS` middleware
- JWT token validation
- Role-based access control (can be enhanced)
- Audit logging for all operations

## Future Enhancements

1. **Email Notifications:** Send emails on leave approval/rejection
2. **Mobile App:** React Native app for leave management
3. **Calendar Integration:** Sync with Google Calendar/Outlook
4. **Advanced Analytics:** ML-based leave prediction
5. **Multi-language Support:** Internationalization
6. **Workflow Automation:** Auto-approval based on rules
7. **Document Attachments:** Upload medical certificates
8. **Leave Delegation:** Transfer leaves to colleagues

## Troubleshooting

### Issue: Leave not appearing in logs
- Check if `entityType` is set to "LEAVE"
- Verify DynamoDB table name is correct
- Check API response in browser console

### Issue: Cannot approve leave
- Verify authentication token is valid
- Check user has HR/Admin role
- Ensure leave status is "Pending"

### Issue: Analytics not loading
- Check if leaves exist for selected year
- Verify date format in startDate field
- Check browser console for errors

## Support

For issues or questions:
- Check browser console for errors
- Review backend logs
- Verify DynamoDB table structure
- Test API endpoints with Postman

## License

Proprietary - Staffinn HRMS System

---

**Implementation Date:** January 2024  
**Version:** 1.0.0  
**Status:** Production Ready ✅
