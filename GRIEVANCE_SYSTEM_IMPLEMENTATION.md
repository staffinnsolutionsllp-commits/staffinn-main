# Grievance System Implementation

## Overview
Implemented automatic hierarchical grievance routing and escalation system with two types of grievances.

## Features Implemented

### 1. General Grievance
- **Automatic Assignment**: Grievance is automatically assigned to the employee's immediate reporting manager (identified from organogram)
- **No Manual Selection**: Removed manual manager selection - system automatically determines the correct manager
- **Hierarchical Routing**: Uses organization chart to find the correct reporting manager
- **Error Handling**: Shows error if employee has no manager assigned in the hierarchy

### 2. Complaint Against Employee
- **Employee Selection**: User can select any employee from the organization
- **Automatic Assignment**: Complaint is automatically assigned to the selected employee's manager
- **Visual Employee Cards**: Enhanced UI with employee cards showing avatar, name, designation, and department
- **Manager Identification**: System automatically finds the target employee's manager from organogram

### 3. Automatic Escalation (Both Types)
- **2-Day Timer**: If no action is taken within 2 days, grievance automatically escalates
- **Next Level Manager**: Escalates to the next level in the hierarchy (manager's manager)
- **Escalation History**: Tracks escalation level and history
- **Real-time Updates**: WebSocket notifications for escalations
- **Continuous Monitoring**: Background job checks for pending escalations

## Technical Implementation

### Backend Changes (`employeePortalController.js`)

#### submitGrievance Function
```javascript
- Determines grievance type (general or complaint)
- For general grievances: Finds submitter's immediate manager
- For complaints: Finds target employee's manager
- Automatically assigns to appropriate manager
- Sets 2-day escalation deadline
- Creates status history
- Stores complaint details if applicable
```

#### Escalation Logic
```javascript
- escalationDeadline: 2 days (2 * 24 * 60 * 60 * 1000 ms)
- Resets timer on any status update
- Escalates to parent node in hierarchy
- Tracks escalation level
- Sends real-time notifications
```

### Frontend Changes (`Grievances.jsx`)

#### UI Enhancements
1. **Grievance Type Selection**
   - Two clear buttons: General Grievance vs Complaint Against Employee
   - Visual distinction with icons and colors
   - Descriptive text for each type

2. **General Grievance**
   - Removed manual manager selection dropdown
   - Added informative blue box explaining automatic assignment
   - Shows escalation timeline (2 days)

3. **Complaint Against Employee**
   - Grid layout of employee cards
   - Avatar with first letter of name
   - Employee details: name, designation, department
   - Visual selection indicator
   - Info message about automatic assignment to employee's manager

4. **Form Validation**
   - Removed manager selection requirement for general grievances
   - Only validates employee selection for complaints
   - Better error messages from backend

## Database Schema

### Grievance Object
```javascript
{
  grievanceId: string,
  recruiterId: string,
  employeeId: string,
  employeeEmail: string,
  employeeName: string,
  title: string,
  description: string,
  category: string,
  priority: string,
  grievanceType: 'general' | 'complaint',
  status: string,
  assignedTo: string,
  assignedToName: string,
  currentLevel: number,
  escalationLevel: number,
  escalationDeadline: ISO timestamp,
  lastActionTime: ISO timestamp,
  complaintAgainstEmployeeId: string | null,
  complaintAgainstEmployeeName: string | null,
  complaintAgainstEmployeeEmail: string | null,
  statusHistory: array,
  submittedDate: ISO timestamp,
  resolvedDate: ISO timestamp | null,
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp
}
```

## Escalation Flow

### General Grievance
1. Employee submits grievance
2. System finds employee's node in organogram
3. Gets parent node (immediate manager)
4. Assigns grievance to manager
5. Sets 2-day deadline
6. If no action in 2 days → escalates to manager's manager
7. Continues until resolved or reaches top of hierarchy

### Complaint Against Employee
1. Employee selects target employee
2. System finds target employee's node in organogram
3. Gets parent node (target's manager)
4. Assigns complaint to target's manager
5. Sets 2-day deadline
6. If no action in 2 days → escalates to target's manager's manager
7. Continues until resolved or reaches top of hierarchy

## Error Handling

1. **No Manager Found**: Shows error if employee/target has no manager in hierarchy
2. **Not in Organogram**: Error if employee not found in organization chart
3. **Invalid Employee**: Error if complaint target employee doesn't exist
4. **Backend Validation**: Proper error messages returned to frontend

## Real-time Features

- WebSocket notifications for:
  - New grievance assignments
  - Status updates
  - Escalations
- Automatic UI refresh on updates
- Live escalation monitoring

## Background Jobs

- `checkAndEscalateGrievances()`: Runs periodically to check for expired deadlines
- Automatically escalates pending grievances
- Logs all escalation actions

## User Experience

### Before
- Manual manager selection required
- Confusing for users who don't know their reporting structure
- No automatic escalation
- Single grievance type

### After
- Fully automatic assignment based on organogram
- Clear distinction between grievance types
- Visual employee selection for complaints
- Automatic 2-day escalation
- Better error messages and guidance
- Real-time updates

## Testing Checklist

- [ ] Submit general grievance - check automatic assignment
- [ ] Submit complaint against employee - check automatic assignment to target's manager
- [ ] Verify 2-day escalation timer
- [ ] Test escalation to next level
- [ ] Check status history tracking
- [ ] Verify WebSocket notifications
- [ ] Test error cases (no manager, not in organogram)
- [ ] Check UI responsiveness
- [ ] Verify employee card selection
- [ ] Test with multiple hierarchy levels

## Future Enhancements

1. Email notifications on assignment and escalation
2. SMS alerts for high-priority grievances
3. Analytics dashboard for grievance trends
4. Anonymous grievance option
5. Attachment support
6. Grievance templates
7. SLA tracking and reporting
8. Manager workload balancing
