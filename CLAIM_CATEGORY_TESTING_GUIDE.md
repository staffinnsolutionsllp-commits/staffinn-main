# Claim Category Management - Testing Guide

## ✅ Feature Overview

**Admin HRMS** can create unlimited claim categories
**Employee Portal** automatically shows only their recruiter's categories

---

## 🧪 Test Flow

### Step 1: Admin Creates Multiple Categories (HRMS Admin)

1. **HRMS Admin Portal kholo**
2. **Claim Management** section mein jao
3. **Manage Categories** button click karo
4. **Multiple categories add karo:**

```
Category 1:
- Name: Travel
- Description: Travel and transportation expenses

Category 2:
- Name: Medical
- Description: Medical and health expenses

Category 3:
- Name: Food
- Description: Food and meal expenses

Category 4:
- Name: Internet
- Description: Internet and communication expenses

Category 5:
- Name: Office Supplies
- Description: Office equipment and supplies
```

5. Har category ke liye:
   - Name field mein type karo
   - Description field mein type karo
   - **Plus (+)** button click karo

**Expected Result**: ✅ Saare categories list mein dikhai dene chahiye

---

### Step 2: Verify Categories in Database

Categories DynamoDB table mein save ho gaye:

**Table**: `HRMS-Claim-Management`

**Structure**:
```json
{
  "claimmanagement": "CATEGORY",
  "categoryId": "unique-id",
  "entityType": "CATEGORY",
  "recruiterId": "your-recruiter-id",
  "name": "Travel",
  "description": "Travel and transportation expenses",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

---

### Step 3: Employee Portal Mein Check Karo

1. **Employee Portal kholo**: `http://localhost:5173`
2. **Login karo** (same recruiter ka employee)
3. **Claim Management** par click karo
4. **Submit New Claim** button click karo
5. **Category dropdown** check karo

**Expected Result**: ✅ Saare 5 categories dropdown mein dikhai dene chahiye:
- Travel
- Medical
- Food
- Internet
- Office Supplies

---

### Step 4: Data Isolation Test

#### Setup:
```
Recruiter A (ID: rec-001)
├─ Categories: Travel, Medical, Food
└─ Employee: E1

Recruiter B (ID: rec-002)
├─ Categories: Internet, Office Supplies
└─ Employee: E2
```

#### Test:

**Part A: Employee E1 Login**
1. E1 se login karo (rec-001 ka employee)
2. Claim Management → Submit New Claim
3. Category dropdown check karo

**Expected**: ✅ Sirf Travel, Medical, Food dikhne chahiye

**Part B: Employee E2 Login**
1. E2 se login karo (rec-002 ka employee)
2. Claim Management → Submit New Claim
3. Category dropdown check karo

**Expected**: ✅ Sirf Internet, Office Supplies dikhne chahiye

---

### Step 5: Submit Claim with Category

1. Employee Portal mein **Submit New Claim** click karo
2. Form fill karo:
   - **Category**: Travel (dropdown se select)
   - **Amount**: 5000
   - **Description**: Client meeting travel
3. **Submit Claim** click karo

**Expected Result**: ✅ Claim submit ho gaya with selected category

---

### Step 6: Verify in HRMS Admin

1. HRMS Admin Portal kholo
2. Claim Management section mein jao
3. Latest claim check karo

**Expected Result**: ✅ Claim dikhai de raha hai with correct category "Travel"

---

## 🔧 API Endpoints

### Admin HRMS APIs

```javascript
// Get all categories (filtered by recruiterId)
GET /api/v1/hrms/claims/categories
Response: {
  success: true,
  data: [
    { categoryId: "cat-1", name: "Travel", description: "..." },
    { categoryId: "cat-2", name: "Medical", description: "..." }
  ]
}

// Create new category
POST /api/v1/hrms/claims/categories
Body: {
  name: "Travel",
  description: "Travel expenses"
}

// Update category
PUT /api/v1/hrms/claims/categories/:categoryId
Body: {
  name: "Updated Travel",
  description: "Updated description"
}

// Delete category
DELETE /api/v1/hrms/claims/categories/:categoryId
```

### Employee Portal APIs

```javascript
// Get categories (filtered by employee's recruiterId)
GET /api/employee-portal/claims/categories
Response: {
  success: true,
  data: [
    { categoryId: "cat-1", name: "Travel", description: "..." }
  ]
}

// Submit claim with category
POST /api/employee-portal/claims
Body: {
  category: "Travel",
  amount: 5000,
  description: "Client meeting"
}
```

---

## 🎯 Key Features

### ✅ Unlimited Categories
- Admin can add as many categories as needed
- No limit on number of categories

### ✅ Data Isolation
- Each recruiter's categories are separate
- Employees see only their recruiter's categories
- Filter by `recruiterId` ensures isolation

### ✅ Real-Time Sync
- Admin adds category → Instantly available in Employee Portal
- Admin deletes category → Instantly removed from Employee Portal

### ✅ CRUD Operations
- **Create**: Add new category
- **Read**: View all categories
- **Update**: Edit category name/description
- **Delete**: Remove category

---

## 🐛 Troubleshooting

### Issue 1: Categories not showing in Employee Portal

**Check:**
```bash
# Browser console (F12)
# Network tab → Check API call
GET /api/employee-portal/claims/categories

# Response should have categories
```

**Solution:**
- Verify employee's `companyId` matches recruiter's `recruiterId`
- Check JWT token has correct `companyId`
- Verify categories exist in database with correct `recruiterId`

### Issue 2: Wrong categories showing

**Check:**
```javascript
// JWT token payload
{
  userId: "emp-001",
  employeeId: "emp-001",
  companyId: "rec-001",  // ← This should match recruiterId
  email: "employee@company.com"
}
```

**Solution:**
- Employee user ka `companyId` correct hai verify karo
- Database mein category ka `recruiterId` match kar raha hai check karo

### Issue 3: Cannot add category in HRMS

**Check:**
- Backend server running hai?
- JWT token valid hai?
- Network tab mein error dekho

**Solution:**
```bash
# Backend logs check karo
cd Backend
node server.js

# Error messages dikhenge
```

---

## 📊 Testing Checklist

```
Admin HRMS:
□ Can open Manage Categories modal
□ Can add multiple categories (5+)
□ Can edit category
□ Can delete category
□ Categories persist after refresh

Employee Portal:
□ Categories load in dropdown
□ Only recruiter's categories visible
□ Can select category from dropdown
□ Can submit claim with category
□ Claim shows correct category in HRMS

Data Isolation:
□ Recruiter A's categories not visible to Recruiter B's employees
□ Recruiter B's categories not visible to Recruiter A's employees
□ Each recruiter sees only their categories

Real-Time:
□ New category instantly available in Employee Portal
□ Deleted category instantly removed from Employee Portal
```

---

## 🚀 Quick Test Script

```bash
# Terminal 1: Start Backend
cd Backend
node server.js

# Terminal 2: Start HRMS Admin
cd "HRMS Staffinn/Staffinn HR Manager_files"
npm run dev

# Terminal 3: Start Employee Portal
cd EmployeePortal
npm run dev

# Terminal 4: Create test data
cd Backend
node test-create-employee.js
```

---

## ✅ Success Criteria

**Test Pass Hoga Agar:**

1. ✅ Admin 5+ categories add kar sakta hai
2. ✅ Saare categories HRMS mein dikhai de rahe hain
3. ✅ Employee Portal mein dropdown mein saare categories hain
4. ✅ Employee claim submit kar sakta hai with category
5. ✅ HRMS mein claim correct category ke saath dikhai de raha hai
6. ✅ Different recruiters ke categories isolated hain
7. ✅ Real-time sync kaam kar raha hai

**Sab green? Perfect! Feature working! 🎉**
