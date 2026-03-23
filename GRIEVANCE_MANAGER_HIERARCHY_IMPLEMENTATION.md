# Grievance Manager Hierarchy Implementation

## Overview
This document outlines the implementation of manager-based grievance assignment with automatic escalation based on organizational hierarchy.

## Features Implemented

### 1. Manager Hierarchy in Employee Model
- Added `managerId` field to employee records
- Added `managerLevel` field (1 = immediate manager, 2 = next level, etc.)
- API to fetch reporting managers (immediate + next level)

### 2. Manager Selection in Grievance Form
- Dropdown to select manager while submitting grievance
- Only shows immediate manager and next-level manager
- Based on organizational hierarchy

### 3. Automatic Escalation
- Grievances auto-escalate after 2 minutes if not acted upon
- Escalates from immediate manager to next-level manager
- Maintains escalation history and level tracking

### 4. Assigned Grievances Visibility
- Managers see grievances assigned to them in "Assigned to Me" tab
- Real-time updates via WebSocket
- Status tracking and action capabilities

## Database Schema Changes

### Employee Table (staffinn-hrms-employees)
```javascript
{
  employeeId: string,
  fullName: string,
  email: string,
  department: string,
  designation: string,
  managerId: string,        // NEW: ID of immediate manager
  managerLevel: number,     // NEW: 1 = immediate, 2 = next level
  // ... other fields
}
```

### Grievance Table (staffinn-hrms-grievances)
```javascript
{
  grievanceId: string,
  employeeId: string,
  employeeName: string,
  title: string,
  description: string,
  category: string,
  priority: string,
  status: string,
  assignedTo: string,           // NEW: Manager ID
  assignedToName: string,       // NEW: Manager name
  assignedToEmail: string,      // NEW: Manager email
  escalationLevel: number,      // NEW: 0 = initial, 1+ = escalated
  escalationHistory: array,     // NEW: Track escalation path
  lastEscalatedAt: timestamp,   // NEW: When last escalated
  statusHistory: array,         // Track all status changes
  submittedDate: timestamp,
  // ... other fields
}
```

## API Endpoints

### 1. Get Reporting Managers
```
GET /api/v1/employee/reporting-managers
Response: {
  success: true,
  data: {
    immediateManager: { employeeId, fullName, email, designation },
    nextLevelManager: { employeeId, fullName, email, designation }
  }
}
```

### 2. Submit Grievance with Manager
```
POST /api/v1/employee/grievances
Body: {
  title: string,
  description: string,
  category: string,
  priority: string,
  assignedTo: string  // Manager ID
}
```

### 3. Get Assigned Grievances
```
GET /api/v1/employee/grievances/assigned
Response: {
  success: true,
  data: [/* grievances assigned to logged-in manager */]
}
```

### 4. Update Grievance Status
```
PUT /api/v1/employee/grievances/:id/status
Body: {
  status: string,
  remark: string
}
```

## Escalation Service

### Auto-Escalation Logic
1. Runs every minute via cron job
2. Checks grievances with status "submitted" or "open"
3. If grievance is older than 2 minutes and not acted upon:
   - Find next-level manager
   - Reassign grievance
   - Increment escalation level
   - Add to escalation history
   - Send notification

### Escalation Flow
```
Employee → Immediate Manager (Level 0)
  ↓ (2 minutes, no action)
Immediate Manager → Next Level Manager (Level 1)
  ↓ (2 minutes, no action)
Next Level Manager → Department Head (Level 2)
  ↓ (continues up the hierarchy)
```

## Frontend Changes

### Grievance Form
- Added manager selection dropdown
- Fetches reporting managers on component mount
- Shows immediate and next-level managers only
- Required field validation

### Grievances List
- Shows escalation indicator
- Displays escalation level
- Color-coded priority and status
- Real-time updates

### Assigned to Me Tab
- Shows grievances assigned to logged-in manager
- Action buttons (In Review, Resolve, Close)
- Remark/comment functionality
- Status history display

## Data Integrity

### Separation of Concerns
- Each recruiter's data is isolated by `recruiterId`
- Managers can only see grievances assigned to them
- Employees can only see their own grievances
- No cross-company data leakage

### Validation
- Manager must exist in same organization
- Manager must be in reporting hierarchy
- Status transitions are validated
- Escalation prevents infinite loops

## Testing Checklist

- [ ] Employee can submit grievance with manager selection
- [ ] Manager sees grievance in "Assigned to Me"
- [ ] Auto-escalation works after 2 minutes
- [ ] Escalation history is tracked correctly
- [ ] Status updates work properly
- [ ] Real-time notifications work
- [ ] Data isolation is maintained
- [ ] No duplicate escalations occur

## Configuration

### Environment Variables
```
ESCALATION_TIMEOUT_MINUTES=2
ESCALATION_CHECK_INTERVAL_MINUTES=1
```

### WebSocket Events
- `grievance-created`: New grievance submitted
- `grievance-assigned`: Grievance assigned to manager
- `grievance-escalated`: Grievance escalated
- `grievance-status-update`: Status changed

## Deployment Notes

1. Update employee records with manager hierarchy
2. Deploy backend changes
3. Deploy frontend changes
4. Start escalation service
5. Monitor logs for escalation activity
6. Test end-to-end flow

## Future Enhancements

- Email notifications for escalations
- SMS alerts for high-priority grievances
- Dashboard for escalation metrics
- Custom escalation rules per department
- SLA tracking and reporting
