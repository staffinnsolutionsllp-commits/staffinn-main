# Grievance Integration Fix

## Problem
Employee Portal grievances were not appearing in HRMS Grievance Management due to:
1. Incorrect API endpoint in frontend (`/employee-portal/grievances` instead of `/employee/grievances`)
2. Different database tables being used (Employee Portal used `HRMS-Grievances`, HRMS used `staffinn-hrms-grievances`)
3. Mismatched data structure between the two systems

## Solution

### 1. Frontend Changes (EmployeePortal/src/pages/Grievances.jsx)
- Fixed API endpoint from `/employee-portal/grievances` to `/employee/grievances`
- Updated status color mapping to match HRMS values:
  - `Open` (yellow)
  - `In Progress` (blue)
  - `Resolved` (green)
  - `Closed` (gray)
- Made priority color mapping case-insensitive

### 2. Backend Changes (Backend/controllers/hrms/employeePortalController.js)
- Changed table from `HRMS-Grievances` to `staffinn-hrms-grievances`
- Updated grievance data structure to match HRMS Grievance Management:
  - Added `subject` field (same as title)
  - Changed status from `submitted` to `Open`
  - Added `statusHistory` array with initial entry
  - Added `remarks` array (empty initially)
  - Added proper timestamp fields

## How It Works Now

### Employee Submits Grievance:
1. Employee fills form in Employee Portal with:
   - Title
   - Category
   - Priority
   - Description

2. Backend creates grievance with:
   - `grievanceId`: Unique ID
   - `recruiterId`: Company ID (from employee token)
   - `employeeId`: Employee ID
   - `employeeEmail`: Employee Email
   - `status`: "Open"
   - `statusHistory`: Initial entry with "Open" status

3. Grievance is saved to `staffinn-hrms-grievances` table

### HRMS Views Grievance:
1. HRMS Grievance Management queries `staffinn-hrms-grievances` table
2. Filters by `recruiterId` to show only grievances from their company
3. Matches employees using:
   - `employeeId`
   - `employeeEmail`

## Data Isolation
- Each grievance is tagged with `recruiterId` (company ID)
- HRMS can only see grievances from employees in their company
- Matching is done using both Employee ID and Employee Email for reliability

## Testing
1. Login to Employee Portal
2. Submit a grievance
3. Login to HRMS with the same company
4. Navigate to Grievance Management
5. Verify the grievance appears with correct employee details
