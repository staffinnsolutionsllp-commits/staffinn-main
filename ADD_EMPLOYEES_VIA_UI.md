# 🎯 Add Employees to Organization Chart (Using HRMS UI)

## ✅ This method works with REAL AWS DynamoDB

Since the script is having AWS credential issues, use the HRMS admin panel instead.

---

## 📋 Step-by-Step Instructions

### Step 1: Login to HRMS Admin Panel

1. Open your browser
2. Go to HRMS admin URL (usually `http://localhost:3000` or your HRMS URL)
3. Login with admin credentials

### Step 2: Go to Organization Chart

1. Look for **"Organization Chart"** or **"Organogram"** in the sidebar
2. Click on it

### Step 3: Create Root Node (CEO/Owner)

1. Click **"Add Node"** or **"Create Node"**
2. Fill in the details:
   - **Position:** CEO / Owner / Managing Director
   - **Level:** 0
   - **Employee:** Select the top-level employee from dropdown
   - **Parent:** Leave empty (this is the root)
3. Click **Save**

### Step 4: Add Other Employees

For each remaining employee:

1. Click **"Add Node"** under the CEO node
2. Fill in:
   - **Position:** Their designation (Manager, Developer, etc.)
   - **Level:** 1 (or appropriate level)
   - **Employee:** Select the employee
   - **Parent:** Select their manager (CEO for now)
3. Click **Save**
4. Repeat for all 7 employees

### Step 5: Verify

1. You should see a tree structure with all employees
2. Each employee should have a line connecting to their manager

### Step 6: Test Grievances

1. Logout from admin
2. Login as a regular employee
3. Go to **Grievances** module
4. Click **"Submit Grievance"**
5. Select **"General Grievance"**
6. Check if managers appear in the dropdown ✅

---

## 🔧 Alternative: Fix AWS Credentials

If you want to use the script, fix your AWS credentials first:

### Option A: Update .env file

Edit `Backend/.env` and update:
```
AWS_ACCESS_KEY_ID=your_new_access_key
AWS_SECRET_ACCESS_KEY=your_new_secret_key
```

### Option B: Check IAM Permissions

Your IAM user needs these permissions:
- `dynamodb:Scan`
- `dynamodb:PutItem`
- `dynamodb:GetItem`
- `dynamodb:Query`

### Then run the script:
```bash
cd d:\Staffinn-main\Backend
node scripts/add-employees-to-org.cjs
```

---

## 📊 Expected Result

After adding employees to org chart, when you check backend logs:

```
============================================================
🔍 getReportingManagers called
📊 Total nodes in organogram: 7  ← Should show your employee count
📋 Current node found: Yes (nodeId: xxx, parentId: yyy)
✅ Immediate manager: [Manager Name]
============================================================
```

---

## ⚡ Quick Summary

**Easiest way:** Use HRMS UI to add employees to organization chart

**Steps:**
1. Login to HRMS admin
2. Go to Organization Chart
3. Add all employees with proper hierarchy
4. Test Grievances module

**This will save data to your real AWS DynamoDB!** ✅

---

## 🆘 Still Having Issues?

1. Make sure your backend server is running
2. Check that you're logged in as admin
3. Verify employees exist in the system
4. Check browser console for errors

The UI method is the most reliable way to add employees to the org chart with real AWS.
