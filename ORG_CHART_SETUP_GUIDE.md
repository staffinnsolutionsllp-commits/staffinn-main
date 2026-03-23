# Organization Chart Setup Guide for Grievance Module

## 🎯 Goal
Set up your organization chart correctly so that the Grievance module can:
1. Show managers in the "Assign to Manager" dropdown
2. Assign complaints to the correct manager

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Admin/HR access to the HRMS system
- [ ] List of all employees
- [ ] Understanding of your company's reporting structure

---

## 🔧 Step-by-Step Setup

### Step 1: Access Organization Chart

1. Login to HRMS as Admin/HR
2. Navigate to **Organization Chart** or **Organogram** section
3. You should see a visual representation of your organization

### Step 2: Create Root Node (Top Level)

1. Click "Add Node" or "Create Node"
2. Fill in details:
   - **Position:** CEO / Managing Director / Owner
   - **Level:** 0 (top level)
   - **Employee:** Select the top-level employee
   - **Parent:** Leave empty (this is the root)
3. Save the node

**Example:**
```
Position: CEO
Level: 0
Employee: John Doe
Parent: (none)
```

### Step 3: Create Department Heads

1. Click "Add Node" under the CEO
2. Fill in details:
   - **Position:** Department Head / Manager
   - **Level:** 1
   - **Employee:** Select the department head
   - **Parent:** Select the CEO node
3. Repeat for all department heads

**Example:**
```
Position: HR Manager
Level: 1
Employee: Jane Smith
Parent: CEO (John Doe)
```

### Step 4: Create Team Leads / Supervisors

1. Click "Add Node" under each Department Head
2. Fill in details:
   - **Position:** Team Lead / Supervisor
   - **Level:** 2
   - **Employee:** Select the team lead
   - **Parent:** Select the Department Head node
3. Repeat for all team leads

**Example:**
```
Position: HR Team Lead
Level: 2
Employee: Bob Johnson
Parent: HR Manager (Jane Smith)
```

### Step 5: Add Team Members

1. Click "Add Node" under each Team Lead
2. Fill in details:
   - **Position:** Employee / Staff
   - **Level:** 3
   - **Employee:** Select the team member
   - **Parent:** Select the Team Lead node
3. Repeat for all team members

**Example:**
```
Position: HR Executive
Level: 3
Employee: Alice Brown
Parent: HR Team Lead (Bob Johnson)
```

---

## 📊 Example Organization Structure

```
CEO (John Doe)
├── HR Manager (Jane Smith)
│   ├── HR Team Lead (Bob Johnson)
│   │   ├── HR Executive (Alice Brown)
│   │   └── HR Executive (Charlie Davis)
│   └── Recruitment Lead (David Wilson)
│       ├── Recruiter (Emma Taylor)
│       └── Recruiter (Frank Miller)
├── IT Manager (George Anderson)
│   ├── Dev Team Lead (Helen White)
│   │   ├── Developer (Ian Clark)
│   │   └── Developer (Julia Martinez)
│   └── Support Lead (Kevin Lee)
│       └── Support Engineer (Laura Garcia)
└── Finance Manager (Michael Brown)
    └── Accountant (Nancy Wilson)
```

---

## ✅ Verification

### Method 1: Run Diagnostic Script

```bash
cd d:\Staffinn-main
node check-org-hierarchy.js
```

**Expected Output:**
```
✅ All employees are assigned to the organization chart!
✅ No orphaned nodes found!
```

### Method 2: Visual Check

1. Go to Organization Chart in HRMS
2. Verify:
   - [ ] All employees are visible in the chart
   - [ ] Each employee (except CEO) has a line connecting to their manager
   - [ ] No broken connections or missing nodes

### Method 3: Test Grievance Module

1. Login as a team member (e.g., Alice Brown)
2. Go to Grievances → Submit Grievance
3. Select "General Grievance"
4. Check "Assign to Manager" dropdown
5. Should show:
   - Bob Johnson (Immediate Manager)
   - Jane Smith (Next Level Manager)

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Not Assigning Employees to Nodes
```
Position: HR Manager
Employee: (empty)  ← WRONG!
```
**Fix:** Always assign an employee to each node

### ❌ Mistake 2: Circular References
```
Node A → Parent: Node B
Node B → Parent: Node A  ← WRONG!
```
**Fix:** Ensure parent-child relationships flow in one direction

### ❌ Mistake 3: Orphaned Nodes
```
Node A → Parent: Node X (doesn't exist)  ← WRONG!
```
**Fix:** Ensure all parent references are valid

### ❌ Mistake 4: Multiple Root Nodes Without Connection
```
CEO (John)
HR Manager (Jane) ← Not connected to CEO
IT Manager (George) ← Not connected to CEO
```
**Fix:** Connect all department heads to the CEO

---

## 🔄 Updating the Organization Chart

### Adding a New Employee

1. Create employee record in HRMS
2. Go to Organization Chart
3. Find their manager's node
4. Click "Add Child Node"
5. Assign the new employee
6. Save

### Changing an Employee's Manager

1. Go to Organization Chart
2. Find the employee's node
3. Click "Edit Node"
4. Change the "Parent" to the new manager's node
5. Save

### Removing an Employee

1. Go to Organization Chart
2. Find the employee's node
3. Click "Delete Node"
4. If they have subordinates, reassign them first

---

## 📝 Best Practices

1. **Keep it Updated:** Update the org chart whenever there are changes
2. **Regular Audits:** Run the diagnostic script monthly
3. **Clear Hierarchy:** Maintain clear reporting lines
4. **Document Changes:** Keep a log of organizational changes
5. **Test After Changes:** Test grievance module after any org chart updates

---

## 🆘 Troubleshooting

### Issue: Employee can't see their manager

**Check:**
1. Is the employee in the org chart?
2. Does their node have a parent?
3. Is the parent node assigned to an employee?

**Fix:**
```bash
node check-org-hierarchy.js
```
Look for the employee in "EMPLOYEES NOT IN ORGANIZATION CHART"

### Issue: Complaint not assigning to manager

**Check:**
1. Is the target employee in the org chart?
2. Does the target employee have a manager?
3. Check backend logs for error messages

**Fix:**
Ensure the target employee has a valid parent node with an assigned employee

---

## 📞 Need Help?

If you're still having issues:

1. Run the diagnostic script and save the output
2. Take screenshots of your organization chart
3. Check browser console and backend logs
4. Share all information for support

---

## 🎓 Summary

**Key Points:**
- Every employee must be in the organization chart
- Each employee (except CEO) must have a parent (manager)
- Parent nodes must have employees assigned
- Test after setup using the grievance module

**Success Criteria:**
- ✅ Diagnostic script shows no issues
- ✅ All employees can see their managers
- ✅ Complaints assign to correct managers
- ✅ No error messages in console

---

**Next Steps:**
1. Set up your organization chart following this guide
2. Run `node check-org-hierarchy.js` to verify
3. Test the grievance module
4. Refer to `GRIEVANCE_QUICK_FIX_GUIDE.md` if issues arise
