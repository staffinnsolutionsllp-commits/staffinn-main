# Employee Portal - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Start Backend
```bash
cd Backend
npm start
```
✅ Backend running on: http://localhost:4001

### Step 2: Start Employee Portal
```bash
cd EmployeePortal
npm run dev
```
✅ Portal running on: http://localhost:5177

---

## 👤 Create Test Employee

### Via HRMS Admin Panel:
1. Login to HRMS Admin
2. Go to "Onboarding" → "Add Employee"
3. Fill details:
   - Employee ID: `1001`
   - Email: `test@company.com`
   - Name: `Test Employee`
   - Department: `IT`
   - Designation: `Developer`
4. Click "Save"

### Auto-Generated Credentials:
- **Email:** `test@company.com`
- **Password:** `Emp@1001`

---

## 🔐 Login to Employee Portal

1. Open: http://localhost:5177
2. Enter credentials:
   - Email: `test@company.com`
   - Password: `Emp@1001`
3. **First Login:** Change password
4. Access Dashboard ✅

---

## ✅ Features Available

| Feature | Status | Description |
|---------|--------|-------------|
| 🏠 Dashboard | ✅ | Stats & quick access |
| 📅 Attendance | ✅ | Mark & view attendance |
| 🏖️ Leave | ✅ | Apply & manage leaves |
| 💰 Payroll | ✅ | View payslips |
| 👤 Profile | ✅ | View & edit profile |
| 🔒 Security | ✅ | RBAC & JWT auth |

---

## 🔒 Data Isolation

### ✅ Guaranteed:
- Each recruiter has separate data
- Employees see ONLY their company data
- No cross-company access
- Secure JWT authentication

### How to Verify:
```bash
cd Backend
node scripts/verify-data-isolation.js
```

---

## 🧪 Test Scenarios

### Scenario 1: Single Company
1. Create 3 employees under Recruiter A
2. Login as Employee 1 → See only Recruiter A's data ✅

### Scenario 2: Multiple Companies
1. Create employees under Recruiter A
2. Create employees under Recruiter B
3. Login as Recruiter A's employee → See only A's data ✅
4. Login as Recruiter B's employee → See only B's data ✅

---

## 📱 Pages

1. **Login** - `/login`
2. **Dashboard** - `/dashboard`
3. **Attendance** - `/attendance`
4. **Leave** - `/leave`
5. **Payroll** - `/payroll`
6. **Profile** - `/profile`
7. **Change Password** - `/change-password`

---

## 🔑 Default Credentials Format

**Pattern:** `Emp@{employeeId}`

**Examples:**
- Employee ID: `1001` → Password: `Emp@1001`
- Employee ID: `2050` → Password: `Emp@2050`
- Employee ID: `9999` → Password: `Emp@9999`

---

## 🐛 Quick Troubleshooting

### Can't Login?
- ✅ Check employee exists in HRMS
- ✅ Verify password: `Emp@{employeeId}`
- ✅ Check backend is running

### No Data Showing?
- ✅ Check if data exists for that recruiter
- ✅ Verify JWT token in localStorage
- ✅ Check browser console for errors

### Backend Error?
- ✅ Check AWS credentials in `.env`
- ✅ Verify DynamoDB tables exist
- ✅ Check port 4001 is free

---

## 📊 API Endpoints

**Base URL:** `http://localhost:4001/api/v1`

### Quick Test:
```bash
# Test backend
curl http://localhost:4001/health

# Test login
curl -X POST http://localhost:4001/api/v1/employee/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@company.com","password":"Emp@1001"}'
```

---

## ✅ Production Checklist

- [ ] Change default password format
- [ ] Setup email notifications
- [ ] Configure production URLs
- [ ] Setup SSL certificates
- [ ] Test with real data
- [ ] Setup monitoring
- [ ] Configure backups
- [ ] Setup error tracking

---

## 🎯 Next Steps

1. ✅ Test all features
2. ✅ Verify data isolation
3. ✅ Create multiple test employees
4. ✅ Test different roles
5. ⏳ Setup email notifications (optional)
6. ⏳ Deploy to production

---

**Ready to use!** 🚀

For detailed documentation, see: `EMPLOYEE_PORTAL_DOCUMENTATION.md`
