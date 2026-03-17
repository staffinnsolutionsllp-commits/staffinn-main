# HRMS Employee Portal - Testing Checklist

## ✅ Test 1: Login Test

### Steps:
1. Employee Portal kholo: `http://localhost:5173`
2. Login karo:
   - Email: `test.employee@company.com`
   - Password: `Test@123`
3. Dashboard dikhai dena chahiye

**Expected Result**: ✅ Login successful, Dashboard page khul gaya

---

## ✅ Test 2: Sidebar Menu Test

### Steps:
1. Left sidebar mein check karo:
   - Dashboard ✓
   - Attendance ✓
   - Leave ✓
   - Payroll ✓
   - **Claim Management** ← NEW
   - **Tasks & Performance** ← NEW
   - **Grievances** ← NEW
   - **Organogram** ← NEW
   - Profile ✓

**Expected Result**: ✅ Saare 9 menu items dikh rahe hain

---

## ✅ Test 3: Claim Management Test

### Part A: Claim Submit Karo (Employee Portal)

1. **Claim Management** par click karo
2. **Submit New Claim** button click karo
3. Form fill karo:
   - Category: Travel
   - Amount: 5000
   - Description: Client meeting travel
4. **Submit Claim** click karo

**Expected Result**: ✅ "Claim submitted successfully" message

### Part B: HRMS Admin Mein Check Karo

1. HRMS Admin Portal kholo
2. **Claim Management** section mein jao
3. Abhi submit kiya hua claim dikhai dena chahiye

**Expected Result**: ✅ Claim HRMS mein instantly visible hai

### Part C: Claim Approve Karo (HRMS Admin)

1. HRMS mein claim select karo
2. Status change karo: **Approved**
3. Save karo

### Part D: Employee Portal Mein Check Karo

1. Employee Portal refresh karo
2. Claim Management page kholo
3. Status **Approved** dikhai dena chahiye

**Expected Result**: ✅ Status instantly update ho gaya

---

## ✅ Test 4: Task Assignment Test

### Part A: Task Assign Karo (HRMS Admin)

1. HRMS Admin Portal kholo
2. **Task Management** section mein jao
3. **Assign Task** click karo
4. Form fill karo:
   - Employee: Test Employee select karo
   - Title: Complete Monthly Report
   - Description: Submit report by end of month
   - Priority: High
   - Deadline: Koi future date
5. **Assign** click karo

**Expected Result**: ✅ "Task assigned successfully" message

### Part B: Employee Portal Mein Check Karo

1. Employee Portal kholo
2. **Tasks & Performance** par click karo
3. Abhi assign kiya hua task dikhai dena chahiye

**Expected Result**: ✅ Task instantly visible hai

### Part C: Task Update Karo (Employee Portal)

1. Task par **Start** button click karo
2. Status **In Progress** ho jayega
3. Ya **Complete** button click karo

### Part D: HRMS Admin Mein Check Karo

1. HRMS refresh karo
2. Task Management mein jao
3. Updated status dikhai dena chahiye

**Expected Result**: ✅ Status instantly update ho gaya

---

## ✅ Test 5: Grievance Test

### Part A: Grievance Submit Karo (Employee Portal)

1. **Grievances** par click karo
2. **Submit New Grievance** click karo
3. Form fill karo:
   - Title: Laptop Issue
   - Category: Work Environment
   - Priority: Medium
   - Description: Need new laptop for work
4. **Submit Grievance** click karo

**Expected Result**: ✅ "Grievance submitted successfully" message

### Part B: HRMS Admin Mein Check Karo

1. HRMS Admin Portal kholo
2. **Grievance Management** section mein jao
3. Abhi submit kiya hua grievance dikhai dena chahiye

**Expected Result**: ✅ Grievance HRMS mein instantly visible hai

---

## ✅ Test 6: Organogram Test

### Part A: Organization Chart Setup (HRMS Admin)

1. HRMS Admin Portal kholo
2. **Organization Chart** section mein jao
3. Hierarchy create karo:
   ```
   CEO (Level 0)
     └─ CTO (Level 1)
         └─ Team Lead (Level 2)
             └─ Test Employee (Level 3)
   ```

### Part B: Employee Portal Mein Check Karo

1. Employee Portal kholo
2. **Organogram** par click karo
3. Hierarchy dikhai deni chahiye with Test Employee highlighted

**Expected Result**: ✅ Pura hierarchy dikh raha hai

---

## ✅ Test 7: Data Isolation Test

### Setup:
1. Do alag recruiters create karo:
   - Recruiter A (ID: rec-001)
   - Recruiter B (ID: rec-002)

2. Do employees create karo:
   - Employee E1 (companyId: rec-001)
   - Employee E2 (companyId: rec-002)

### Test Steps:

**Step 1**: E1 se login karo
- Claim submit karo
- Task check karo
- Grievance submit karo

**Step 2**: E2 se login karo
- Claims check karo → E1 ka claim NAHI dikhna chahiye
- Tasks check karo → E1 ka task NAHI dikhna chahiye
- Grievances check karo → E1 ka grievance NAHI dikhna chahiye

**Expected Result**: ✅ Complete data isolation

---

## ✅ Test 8: Real-Time Sync Test

### Test A: Claim Real-Time
1. Employee Portal: Claim submit karo
2. HRMS Admin: Immediately refresh → Claim dikhai dena chahiye (< 2 seconds)

### Test B: Task Real-Time
1. HRMS Admin: Task assign karo
2. Employee Portal: Immediately refresh → Task dikhai dena chahiye (< 2 seconds)

### Test C: Status Update Real-Time
1. HRMS Admin: Claim approve karo
2. Employee Portal: Immediately refresh → Status updated dikhai dena chahiye

**Expected Result**: ✅ Sab kuch real-time sync ho raha hai

---

## 🐛 Common Issues & Solutions

### Issue 1: Login nahi ho raha
**Solution**: 
- Check karo employee user create hua hai ya nahi
- Password correct hai ya nahi
- Backend server chal raha hai ya nahi

### Issue 2: Claims/Tasks nahi dikh rahe
**Solution**:
- Browser console check karo (F12)
- Network tab mein API calls check karo
- recruiterId match kar raha hai ya nahi verify karo

### Issue 3: Data isolation kaam nahi kar raha
**Solution**:
- JWT token mein companyId check karo
- Database queries mein recruiterId filter check karo
- Employee user ka companyId correct hai ya nahi verify karo

### Issue 4: Organogram khali hai
**Solution**:
- HRMS Admin mein organization chart create karo
- Employee ko kisi node mein assign karo
- recruiterId match kar raha hai verify karo

---

## 📊 Testing Report Template

```
Date: ___________
Tester: ___________

✅ Test 1: Login - PASS / FAIL
✅ Test 2: Sidebar Menu - PASS / FAIL
✅ Test 3: Claim Management - PASS / FAIL
✅ Test 4: Task Assignment - PASS / FAIL
✅ Test 5: Grievance - PASS / FAIL
✅ Test 6: Organogram - PASS / FAIL
✅ Test 7: Data Isolation - PASS / FAIL
✅ Test 8: Real-Time Sync - PASS / FAIL

Issues Found:
1. ___________
2. ___________

Overall Status: PASS / FAIL
```

---

## 🚀 Quick Test Commands

```bash
# Backend start
cd Backend && node server.js

# Employee Portal start
cd EmployeePortal && npm run dev

# HRMS Admin start
cd "HRMS Staffinn/Staffinn HR Manager_files" && npm run dev

# Create test employee
cd Backend && node test-create-employee.js

# Check logs
# Backend: Terminal mein logs dikhenge
# Frontend: Browser console (F12) mein logs dikhenge
```

---

## ✅ Final Checklist

- [ ] Backend server running
- [ ] Employee Portal running
- [ ] HRMS Admin running
- [ ] Test employee created
- [ ] Login successful
- [ ] All 9 menu items visible
- [ ] Claim submission working
- [ ] Task assignment working
- [ ] Grievance submission working
- [ ] Organogram displaying
- [ ] Data isolation verified
- [ ] Real-time sync verified

**Sab green ho gaya? Congratulations! 🎉**
**Integration successfully tested!**
