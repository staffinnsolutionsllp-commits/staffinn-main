# Grievance Complaint Against Employee - Implementation Guide

## Overview
Enhanced the HRMS Employee Portal Grievances section to support filing complaints against employees. When a complaint is filed against an employee, it is automatically assigned to that employee's manager and follows the escalation hierarchy.

---

## Features Implemented

### 1. **Dual Grievance Flow**
- **General Grievance**: Submit to your reporting manager (existing flow)
- **Complaint Against Employee**: File complaint against any colleague (new flow)

### 2. **Automatic Manager Assignment**
- When complaint is filed against an employee, system automatically:
  - Fetches the employee's manager from organogram
  - Assigns grievance to that manager
  - Validates manager exists before submission

### 3. **Escalation Flow**
- If manager doesn't act within 2 minutes:
  - Grievance escalates to next level manager
  - Continues upward through hierarchy
  - Tracks escalation level and history
  - Sends real-time WebSocket notifications

### 4. **UI Enhancements**
- Type selection buttons (General vs Complaint)
- Employee dropdown with designation and department
- Visual indicators for complaint-against grievances
- Warning message about automatic manager assignment

---

## Technical Implementation

### Backend Changes

#### 1. **Controller: hrmsGrievanceController.js**

**New Endpoint: getOrganizationEmployees**
```javascript
GET /employee/grievances/organization-employees
```
- Returns all employees in organization (excluding current user)
- Filtered by recruiterId for data isolation
- Returns: employeeId, fullName, email, designation, department

**Enhanced: createGrievance**
- Added `complaintAgainstEmployeeId` parameter
- Logic flow:
  1. If `complaintAgainstEmployeeId` provided:
     - Fetch employee being complained against
     - Get their manager from `managerId` field
     - Assign grievance to that manager
  2. If `assignedTo` provided (old flow):
     - Direct manager assignment
- Stores complaint details in grievance record:
  - `complaintAgainstEmployeeId`
  - `complaintAgainstEmployeeName`
  - `complaintAgainstEmployeeEmail`

#### 2. **Routes: hrmsGrievanceRoutes.js**
```javascript
router.get('/organization-employees', getOrganizationEmployees);
```

#### 3. **Escalation Service: grievanceAutoEscalationService.js**
- No changes needed - works automatically with new flow
- Escalates based on `assignedTo` manager's hierarchy
- Continues escalation every 2 minutes if no action taken

---

### Frontend Changes

#### 1. **API Service: api.js**
```javascript
export const grievanceAPI = {
  getOrganizationEmployees: () => api.get('/employee/grievances/organization-employees')
};
```

#### 2. **Component: Grievances.jsx**

**New State Variables:**
```javascript
const [organizationEmployees, setOrganizationEmployees] = useState([]);
const [grievanceType, setGrievanceType] = useState('general'); // 'general' or 'complaint'
const [formData, setFormData] = useState({
  complaintAgainstEmployeeId: '' // New field
});
```

**New Functions:**
```javascript
fetchOrganizationEmployees() // Fetch all employees for dropdown
```

**Enhanced Form:**
- Grievance type selection (General / Complaint Against Employee)
- Conditional field rendering based on type
- Employee dropdown with full details
- Warning message about automatic assignment

**Enhanced Display:**
- Shows "🚨 Complaint against: [Name]" badge in list
- Displays complaint details in modal
- Red-themed UI for complaint grievances

---

## Data Flow

### Complaint Against Employee Flow

```
1. Employee selects "Complaint Against Employee"
   ↓
2. Selects target employee from dropdown
   ↓
3. Submits grievance with complaintAgainstEmployeeId
   ↓
4. Backend fetches target employee's manager
   ↓
5. Grievance assigned to manager
   ↓
6. WebSocket notification sent to manager
   ↓
7. If no action in 2 minutes → Escalate to next level
   ↓
8. Repeat escalation every 2 minutes until resolved
```

### Database Schema

**Grievance Record:**
```javascript
{
  grievanceId: "string",
  employeeId: "string", // Complainant
  employeeName: "string",
  complaintAgainstEmployeeId: "string", // NEW
  complaintAgainstEmployeeName: "string", // NEW
  complaintAgainstEmployeeEmail: "string", // NEW
  assignedTo: "string", // Target employee's manager
  assignedToName: "string",
  escalationLevel: 0,
  escalationHistory: [],
  statusHistory: [],
  // ... other fields
}
```

---

## Configuration

### Escalation Timeout
Set in environment variables:
```bash
ESCALATION_TIMEOUT_MINUTES=2  # Default: 2 minutes (testing)
# Recommended for production: 120 minutes
```

### WebSocket Events
- `grievance-assigned` - New grievance assigned to manager
- `grievance-escalated` - Grievance escalated to next level
- `grievance-status-update` - Status changed

---

## Testing Guide

### Test Scenario 1: Complaint Against Employee
1. Login as Employee A
2. Click "Submit Grievance"
3. Select "Complaint Against Employee"
4. Choose Employee B from dropdown
5. Fill form and submit
6. Verify: Grievance assigned to Employee B's manager
7. Login as Employee B's manager
8. Verify: Grievance appears in "Assigned to Me"

### Test Scenario 2: Escalation Flow
1. Submit complaint against employee
2. Wait 2 minutes without action
3. Verify: Grievance escalates to next level manager
4. Check escalation level indicator
5. Verify: WebSocket notification received

### Test Scenario 3: General Grievance (Old Flow)
1. Select "General Grievance"
2. Choose reporting manager
3. Submit
4. Verify: Works as before

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/employee/grievances/organization-employees` | Fetch all employees in organization |
| POST | `/employee/grievances` | Submit grievance (supports both flows) |
| GET | `/employee/grievances/assigned` | Get grievances assigned to me |
| PUT | `/employee/grievances/:id/status` | Update grievance status |

---

## Security & Validation

### Backend Validations
- ✅ Employee exists in organization
- ✅ Employee has a manager assigned
- ✅ Manager exists in system
- ✅ Data isolation by recruiterId
- ✅ Current user excluded from employee list

### Frontend Validations
- ✅ Required field validation
- ✅ Type-specific field validation
- ✅ Warning messages for user awareness

---

## UI/UX Features

### Visual Indicators
- 🚨 Red badge for complaint-against grievances
- ⚠️ Orange badge for escalated grievances
- Color-coded type selection buttons
- Warning message about automatic assignment

### User Experience
- Clear type selection with descriptions
- Searchable employee dropdown
- Real-time WebSocket updates
- Detailed grievance information in modal

---

## Files Modified

### Backend
1. `Backend/controllers/hrms/hrmsGrievanceController.js`
   - Added `getOrganizationEmployees()`
   - Enhanced `createGrievance()` with complaint flow

2. `Backend/routes/hrms/hrmsGrievanceRoutes.js`
   - Added `/organization-employees` route

### Frontend
1. `EmployeePortal/src/services/api.js`
   - Added `getOrganizationEmployees()` method

2. `EmployeePortal/src/pages/Grievances.jsx`
   - Added grievance type selection
   - Added employee dropdown
   - Enhanced display with complaint indicators
   - Updated form validation logic

---

## Future Enhancements

### Potential Improvements
1. **Anonymous Complaints**: Option to file anonymous complaints
2. **Complaint Categories**: Specific categories for employee complaints
3. **Investigation Workflow**: Dedicated investigation process
4. **Evidence Upload**: Attach documents/screenshots
5. **Witness Addition**: Add witnesses to complaint
6. **Resolution Templates**: Pre-defined resolution actions
7. **Complaint Analytics**: Dashboard for HR to track patterns

### Scalability Considerations
1. **Pagination**: For large employee lists
2. **Search/Filter**: In employee dropdown
3. **Bulk Actions**: For managers with many grievances
4. **Email Notifications**: In addition to WebSocket
5. **Mobile App**: Extend to mobile platform

---

## Troubleshooting

### Issue: Employee has no manager
**Solution**: Ensure all employees have `managerId` set in employee records

### Issue: Escalation not working
**Solution**: 
1. Check `grievanceAutoEscalationService` is running
2. Verify `ESCALATION_TIMEOUT_MINUTES` environment variable
3. Check manager hierarchy is properly configured

### Issue: WebSocket notifications not received
**Solution**:
1. Verify WebSocket connection in browser console
2. Check `global.io` is available in server
3. Ensure employee is in correct room: `employee-${employeeId}`

---

## Conclusion

The complaint-against-employee feature is fully integrated with the existing grievance system and escalation flow. It provides a structured way for employees to raise concerns about colleagues while ensuring proper management oversight and escalation through the organizational hierarchy.

**Key Benefits:**
- ✅ Automatic manager assignment based on organogram
- ✅ Seamless escalation through hierarchy
- ✅ Real-time notifications
- ✅ Complete audit trail
- ✅ Data isolation and security
- ✅ User-friendly interface

---

**Implementation Date**: January 2025  
**Status**: ✅ Complete and Tested  
**Version**: 1.0
