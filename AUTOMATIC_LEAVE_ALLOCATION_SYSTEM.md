# 🚀 Automatic Leave Allocation System

## Overview
Jab bhi HRMS Admin **Leave Rules** mein naya leave type create karta hai, automatically **SAARE active employees** ko us leave type ka balance allocate ho jata hai aur Employee Portal mein immediately show hota hai.

---

## 🎯 Flow Diagram

```
HRMS Admin (Leave Rules)
         ↓
   Create New Leave Type
   (e.g., "Sick Leave", 10 days/year)
         ↓
   ✅ Leave Rule Saved in DB
         ↓
   🚀 AUTO-TRIGGER: autoAllocateLeaveToAllEmployees()
         ↓
   Fetch All Active Employees (recruiterId filter)
         ↓
   For Each Employee:
     - Calculate Pro-rata leaves (based on joining date)
     - Create BALANCE entity in HRMS_LEAVES_TABLE
     - Set totalAllocated, used=0, remaining
         ↓
   ✅ All Employees Get Leave Balance
         ↓
   Employee Portal (Leave Page)
         ↓
   Fetch Leave Balances (companyId filter)
         ↓
   📊 Display Leave Balance Cards
```

---

## 🔧 Technical Implementation

### 1. Backend Changes (hrmsLeaveController.js)

#### A. Modified `createLeaveRule()` Function
```javascript
const createLeaveRule = async (req, res) => {
  // ... create leave rule logic ...
  
  // 🚀 AUTO-ALLOCATE: Automatically allocate this leave type to all employees
  await autoAllocateLeaveToAllEmployees(recruiterId, rule);
  
  res.status(201).json(successResponse(rule, 'Leave rule created and allocated to all employees successfully'));
};
```

#### B. New `autoAllocateLeaveToAllEmployees()` Function
```javascript
const autoAllocateLeaveToAllEmployees = async (recruiterId, rule) => {
  // 1. Fetch all active employees for this recruiterId
  // 2. For each employee:
  //    - Check if balance already exists (avoid duplicates)
  //    - Calculate pro-rata leaves based on joining date
  //    - Create BALANCE entity with:
  //      * employeeId, employeeName, department
  //      * leaveType (from rule.leaveName)
  //      * totalAllocated, used=0, remaining
  // 3. Return count of allocated balances
};
```

---

## 📊 Database Structure

### HRMS_LEAVES_TABLE

#### Entity Type: RULE (Leave Type Configuration)
```json
{
  "leaveId": "L123",
  "ruleId": "R456",
  "entityType": "RULE",
  "recruiterId": "REC001",
  "leaveName": "Sick Leave",
  "totalLeavesPerYear": 10,
  "accrualType": "Yearly",
  "isCarryForwardLeave": "No",
  "proRataCalculation": "Yes",
  "status": "Active",
  "createdAt": "2026-03-20T03:24:19Z"
}
```

#### Entity Type: BALANCE (Employee Leave Balance)
```json
{
  "leaveId": "B789",
  "entityType": "BALANCE",
  "employeeId": "EMP001",
  "employeeName": "Jasraj Bhavsar",
  "department": "Engineering",
  "leaveType": "Sick Leave",
  "totalAllocated": 10,
  "used": 0,
  "remaining": 10,
  "carryForward": 0,
  "lwp": 0,
  "createdAt": "2026-03-20T03:24:19Z"
}
```

---

## 🎨 Frontend Display (Employee Portal)

### Leave Balance Cards
```jsx
{balance.map((b, i) => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6">
    <h3>{b.leaveType}</h3>
    <p className="text-4xl font-bold">{b.balance || 0}</p>
    <p>Days Available</p>
    <div>
      <p>Total: {b.totalAllocated || 0}</p>
      <p>Used: {b.used || 0}</p>
    </div>
  </div>
))}
```

---

## ✅ Features

### 1. **Automatic Allocation**
- Jab HRMS Admin naya leave type create kare
- Automatically saare active employees ko allocate ho jaye
- No manual "Sync" button needed

### 2. **Pro-rata Calculation**
- Employee ki joining date ke basis par calculate hota hai
- Example: 
  - Leave Rule: 12 days/year
  - Employee joined in July (6 months remaining)
  - Allocated: (6/12) × 12 = 6 days

### 3. **Data Isolation**
- Har HRMS ka apna `recruiterId` hai
- Employees sirf apne HRMS ke leave types dekhte hain
- Complete data separation

### 4. **Duplicate Prevention**
- Agar employee ko already us leave type ka balance hai
- Toh duplicate create nahi hoga
- Existing balance preserve rahega

### 5. **Real-time Display**
- Employee Portal automatically updated balances show karega
- No page refresh needed
- Dynamic leave type fetching

---

## 🧪 Testing Steps

### Step 1: HRMS Admin - Create Leave Type
1. Login to HRMS (localhost:5175)
2. Navigate to **Leave Rules** tab
3. Click **+ Add Leave Type**
4. Fill details:
   - Leave Name: "Medical Leave"
   - Total Days: 15
   - Accrual: Yearly
   - Pro-rata: Yes
5. Click **Save**

### Step 2: Verify Backend Logs
```
🔍 createLeaveRule - Using recruiterId: REC001
🚀 Auto-allocating leave type "Medical Leave" to all employees for recruiterId: REC001
📊 Found 5 active employees
✅ Allocated 15 Medical Leave to Jasraj Bhavsar
✅ Allocated 15 Medical Leave to Lakshya Sharma
✅ Allocated 12 Medical Leave to New Employee (pro-rata)
🎉 Auto-allocation complete: 5 new leave balances created
```

### Step 3: HRMS Admin - Check Leave Balance
1. Navigate to **Leave Balance** tab
2. Verify all employees have "Medical Leave" entry
3. Check allocated days are correct

### Step 4: Employee Portal - Verify Display
1. Login to Employee Portal (localhost:5177)
2. Navigate to **Leave** page
3. Verify new leave type card appears
4. Check balance shows correct days
5. Try applying leave with new type

---

## 🔄 Existing Manual Sync (Still Available)

HRMS Admin can still manually sync using **Sync Leave Balances** button:
- Useful for bulk updates
- Fixes any missing balances
- Cleans up orphaned records

---

## 🎯 Benefits

1. **Zero Manual Work**: Admin ko manually allocate nahi karna padta
2. **Instant Availability**: Employees ko turant leave type milta hai
3. **No Errors**: Automatic process reduces human errors
4. **Scalable**: 100 employees ho ya 10,000, same process
5. **Pro-rata Smart**: Joining date ke basis par accurate calculation

---

## 📝 API Endpoints

### HRMS Admin
- `POST /api/hrms/leaves/rules` - Create leave rule (triggers auto-allocation)
- `GET /api/hrms/leaves/balances` - View all employee balances
- `POST /api/hrms/leaves/sync` - Manual sync (optional)

### Employee Portal
- `GET /api/employee/leave/types` - Fetch available leave types
- `GET /api/employee/leave/balance` - Fetch my leave balances
- `POST /api/employee/leave/apply` - Apply for leave

---

## 🚨 Important Notes

1. **Active Employees Only**: Sirf active employees (isDeleted=false) ko allocate hota hai
2. **Duplicate Check**: Existing balances ko overwrite nahi karta
3. **RecruiterId Filter**: Har HRMS apne employees ko hi allocate karta hai
4. **Error Handling**: Agar koi employee fail ho, baaki continue rahenge
5. **Logging**: Detailed logs for debugging and monitoring

---

## 🎉 Success Criteria

✅ HRMS Admin creates "Casual Leave" (10 days)
✅ Backend logs show auto-allocation started
✅ All 5 employees get 10 days balance
✅ Leave Balance table shows all entries
✅ Employee Portal shows new leave card
✅ Employee can apply leave with new type
✅ No manual intervention needed

---

## 🔮 Future Enhancements

1. **Email Notifications**: Employee ko email jaye jab naya leave type allocate ho
2. **Bulk Import**: CSV se multiple leave types import kare
3. **Leave Policies**: Department-wise different allocations
4. **Approval Workflow**: Multi-level leave approvals
5. **Calendar Integration**: Leave calendar view

---

## 📞 Support

For any issues or questions:
- Check backend logs for detailed error messages
- Verify recruiterId is correctly set
- Ensure employees are not marked as deleted
- Contact development team for assistance

---

**Last Updated**: March 20, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
