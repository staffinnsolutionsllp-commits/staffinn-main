# Employee Portal - Complete Documentation

## 🎯 Overview
Complete Employee HRMS Portal with role-based access control and multi-tenant data isolation.

---

## 🔐 Data Isolation Architecture

### How It Works:
1. **Each Recruiter = Separate Company**
   - Every recruiter has unique `recruiterId` (also called `companyId`)
   - All employee data is tagged with `recruiterId`
   - Employees can ONLY access data from their own company

2. **Database Structure:**
   ```
   staffinn-hrms-employees
   ├── employeeId (Primary Key)
   ├── recruiterId (Company ID) ← ISOLATION KEY
   ├── email
   └── ...other fields

   staffinn-hrms-employee-users
   ├── userId (Primary Key)
   ├── employeeId
   ├── companyId (recruiterId) ← ISOLATION KEY
   ├── email
   └── password

   staffinn-hrms-attendance
   ├── attendanceId (Primary Key)
   ├── employeeId
   ├── recruiterId ← ISOLATION KEY
   └── ...

   staffinn-hrms-leaves
   ├── leaveId (Primary Key)
   ├── employeeId
   ├── recruiterId ← ISOLATION KEY
   └── ...

   staffinn-hrms-payroll
   ├── payrollId (Primary Key)
   ├── employeeId
   ├── recruiterId ← ISOLATION KEY
   └── ...
   ```

3. **API Level Isolation:**
   - JWT token contains `companyId` (recruiterId)
   - Every API query filters by `recruiterId`
   - Employee can NEVER access another company's data

---

## 🚀 Setup Guide

### 1. Backend Setup
```bash
cd Backend

# Create tables
node scripts/create-hrms-employee-users-table.js
node scripts/create-hrms-roles-table.js
node scripts/insert-default-roles.js

# Start server
npm start
```

### 2. Employee Portal Setup
```bash
cd EmployeePortal

# Install dependencies
npm install

# Start development server
npm run dev
```

**Portal URL:** http://localhost:5177

---

## 👥 User Flow

### Admin/HR Side (HRMS Admin Panel):
1. HR logs into HRMS Admin Panel
2. Goes to "Onboarding" section
3. Adds new employee:
   - Employee ID: `1001`
   - Email: `employee@company.com`
   - Name: `John Doe`
   - Department: `IT`
   - Designation: `Developer`

4. **System automatically:**
   - Creates employee record in `staffinn-hrms-employees`
   - Generates login credentials
   - Creates user account in `staffinn-hrms-employee-users`
   - Password: `Emp@1001` (format: Emp@{employeeId})
   - Links to recruiter's company

### Employee Side (Employee Portal):
1. Employee receives credentials (email/manual)
2. Opens Employee Portal: http://localhost:5177
3. Logs in with:
   - Email: `employee@company.com`
   - Password: `Emp@1001`
4. **First Login:** Forced to change password
5. After password change → Dashboard access

---

## 📱 Features

### ✅ Implemented Features:

#### 1. **Dashboard**
- Welcome message with employee details
- Quick stats:
  - Attendance this month
  - Pending leaves
  - Today's status (Present/Absent)
- Quick access cards to all modules

#### 2. **Attendance Management**
- Mark attendance (Check-in/Check-out)
- View attendance history
- Monthly attendance calendar
- Attendance summary

#### 3. **Leave Management**
- View leave balance by type
- Apply for leave
- View leave history
- Cancel pending leaves
- Leave status tracking (Pending/Approved/Rejected)

#### 4. **Payroll**
- View all payslips
- Payslip details:
  - Basic salary
  - Allowances
  - Deductions
  - Net salary
- Download payslips (future)

#### 5. **Profile Management**
- View complete profile
- Edit limited fields:
  - Phone number
  - Address
  - Emergency contact details
- View employment details (read-only)

#### 6. **Security**
- JWT authentication
- Role-based access control
- Permission-based features
- First login password change
- Session management

---

## 🔑 API Endpoints

### Authentication
```
POST   /api/v1/employee/auth/login
POST   /api/v1/employee/auth/change-password
GET    /api/v1/employee/auth/profile
```

### Dashboard
```
GET    /api/v1/employee/dashboard/stats
```

### Attendance
```
GET    /api/v1/employee/attendance
POST   /api/v1/employee/attendance/mark
```

### Leave
```
GET    /api/v1/employee/leaves
GET    /api/v1/employee/leaves/balance
POST   /api/v1/employee/leaves/apply
DELETE /api/v1/employee/leaves/:id
```

### Payroll
```
GET    /api/v1/employee/payslips
```

### Profile
```
PUT    /api/v1/employee/profile
```

---

## 🧪 Testing

### Test Data Isolation:
```bash
cd Backend
node scripts/verify-data-isolation.js
```

### Test Employee Login:
1. Create employee via HRMS Admin
2. Note the auto-generated credentials
3. Login to Employee Portal
4. Verify only that company's data is visible

### Test Multiple Companies:
1. Create employees under Recruiter A
2. Create employees under Recruiter B
3. Login as Recruiter A's employee → See only Recruiter A's data
4. Login as Recruiter B's employee → See only Recruiter B's data

---

## 🔒 Security Features

### 1. **Data Isolation**
- Every query filters by `recruiterId`
- JWT token contains company context
- No cross-company data access

### 2. **Authentication**
- Bcrypt password hashing
- JWT tokens with 24h expiry
- Secure token storage

### 3. **Authorization**
- Role-based permissions
- Permission checking middleware
- Route-level protection

### 4. **Password Policy**
- Minimum 8 characters
- Forced change on first login
- Secure password storage

---

## 📊 Database Tables

### Created Tables:
1. ✅ `staffinn-hrms-employee-users` - Employee login credentials
2. ✅ `staffinn-hrms-roles` - Role definitions
3. ✅ `staffinn-hrms-employees` - Employee master data (existing)
4. ✅ `staffinn-hrms-attendance` - Attendance records (existing)
5. ✅ `staffinn-hrms-leaves` - Leave management (existing)
6. ✅ `staffinn-hrms-payroll` - Payroll data (existing)

---

## 🎨 UI/UX

### Design Principles:
- Clean, minimal interface
- Easy navigation
- Mobile-responsive (basic)
- Intuitive workflows
- Clear status indicators

### Color Coding:
- Blue (#3b82f6) - Primary actions
- Green (#10b981) - Success/Positive
- Yellow (#f59e0b) - Warning/Pending
- Red (#ef4444) - Danger/Negative
- Gray (#6b7280) - Neutral/Secondary

---

## 🔄 Auto-Credential Generation

### How It Works:
```javascript
// When HR creates employee:
1. Employee record created in staffinn-hrms-employees
2. System generates:
   - userId: USER_{employeeId}_{timestamp}
   - password: Emp@{employeeId}
3. Password is hashed with bcrypt
4. User account created in staffinn-hrms-employee-users
5. Linked to recruiter's company (companyId)
6. isFirstLogin = true (forces password change)
```

### Password Format:
- Pattern: `Emp@{employeeId}`
- Example: Employee ID `1001` → Password `Emp@1001`

---

## 🚧 Future Enhancements (Not Implemented)

### Phase 2:
- [ ] Email notifications for credentials
- [ ] Forgot password functionality
- [ ] Document upload/download
- [ ] Profile picture upload

### Phase 3:
- [ ] Manager features (approve leaves, view team)
- [ ] Company announcements
- [ ] Performance reviews
- [ ] Request/Ticket system

### Phase 4:
- [ ] Audit logs
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] Push notifications

---

## 🐛 Troubleshooting

### Issue: Employee can't login
**Solution:**
1. Check if employee exists in `staffinn-hrms-employees`
2. Check if user account exists in `staffinn-hrms-employee-users`
3. Verify password format: `Emp@{employeeId}`
4. Check `isActive` flag

### Issue: No data showing
**Solution:**
1. Verify JWT token contains correct `companyId`
2. Check if data exists for that `recruiterId`
3. Verify API filters by `recruiterId`

### Issue: Cross-company data visible
**Solution:**
1. Check all API queries include `recruiterId` filter
2. Verify JWT token has correct `companyId`
3. Check middleware authentication

---

## 📞 Support

For issues or questions:
1. Check console logs (Backend & Frontend)
2. Verify database records
3. Test API endpoints directly
4. Check JWT token payload

---

## ✅ Checklist

### Before Going Live:
- [ ] Test with multiple recruiters
- [ ] Verify data isolation
- [ ] Test all features
- [ ] Check password security
- [ ] Verify JWT expiry
- [ ] Test error handling
- [ ] Check mobile responsiveness
- [ ] Setup email notifications
- [ ] Configure production URLs
- [ ] Setup SSL certificates

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
