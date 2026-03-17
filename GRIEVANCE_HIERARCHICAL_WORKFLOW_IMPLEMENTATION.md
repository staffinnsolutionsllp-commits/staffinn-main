# Grievance Hierarchical Workflow Implementation

## Overview
This document describes the complete implementation of the hierarchical grievance workflow system in the Employee Portal, which automatically routes grievances through the organizational hierarchy with real-time updates and automatic escalation.

## Features Implemented

### 1. ✅ Hierarchical Grievance Routing
- When an employee submits a grievance, it is automatically assigned to their immediate manager based on the organogram structure
- The system queries the `staffinn-hrms-organization-chart` table to find the employee's parent node
- The grievance is assigned to the employee associated with the parent node

### 2. ✅ Manager Grievance Dashboard
- **Two Tabs in Grievances Section:**
  - **My Grievances**: Shows grievances submitted by the logged-in employee
  - **Assigned to Me**: Shows grievances assigned to the logged-in employee (as a manager)

### 3. ✅ Manager Actions
Managers can take the following actions on assigned grievances:
- **In Review**: Mark the grievance as being reviewed
- **Resolve**: Mark the grievance as resolved
- **Close**: Close the grievance
- **Add Remarks**: Add optional remarks with any action

### 4. ✅ Real-Time Status Updates
- WebSocket integration for instant updates
- When a manager updates a grievance status, the employee who submitted it receives an instant notification
- The grievance list automatically refreshes without page reload

### 5. ✅ Automatic Escalation (2-Minute Timer)
- Each grievance has an `escalationDeadline` field set to 2 minutes from submission/last action
- A background service (`grievanceEscalationService.js`) runs every 30 seconds
- If no action is taken within 2 minutes, the grievance automatically escalates to the next level manager
- Escalation continues up the hierarchy until action is taken or the top is reached

### 6. ✅ Database Structure
All data is stored in the existing `staffinn-hrms-grievances` table with the following key fields:

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
  status: string, // 'Open', 'In Review', 'Resolved', 'Closed'
  assignedTo: string, // Current manager's employeeId
  assignedToName: string,
  currentLevel: number,
  escalationLevel: number, // Tracks how many times escalated
  lastActionTime: string,
  escalationDeadline: string, // ISO timestamp
  statusHistory: [
    {
      status: string,
      changedBy: string,
      changedByName: string,
      timestamp: string,
      action: string,
      assignedTo: string,
      assignedToName: string,
      remark: string
    }
  ],
  remarks: [
    {
      text: string,
      addedBy: string,
      addedByName: string,
      timestamp: string
    }
  ],
  submittedDate: string,
  resolvedDate: string,
  createdAt: string,
  updatedAt: string
}
```

## Technical Implementation

### Backend Changes

#### 1. Employee Portal Controller (`employeePortalController.js`)
- **`submitGrievance`**: Enhanced to automatically assign to immediate manager from organogram
- **`getAssignedGrievances`**: New function to fetch grievances assigned to the logged-in manager
- **`updateGrievanceStatus`**: Enhanced to emit WebSocket events for real-time updates
- **`escalateGrievance`**: Automatically escalates grievances up the hierarchy
- **`checkAndEscalateGrievances`**: Background job that checks for pending escalations

#### 2. WebSocket Server (`websocketServer.js`)
- Added `join-employee-room` event handler
- Added `emitGrievanceUpdate` function to notify employees of status changes
- Expanded CORS to support Employee Portal

#### 3. Grievance Escalation Service (`grievanceEscalationService.js`)
- Runs every 30 seconds
- Checks all grievances for expired escalation deadlines
- Automatically escalates overdue grievances

### Frontend Changes

#### 1. API Service (`api.js`)
Added new API methods:
```javascript
export const grievanceAPI = {
  getMyGrievances: () => api.get('/employee/grievances'),
  submitGrievance: (data) => api.post('/employee/grievances', data),
  getAssignedGrievances: () => api.get('/employee/grievances/assigned'),
  updateGrievanceStatus: (id, data) => api.put(`/employee/grievances/${id}/status`, data)
};
```

#### 2. Grievances Component (`Grievances.jsx`)
**New Features:**
- Tab navigation between "My Grievances" and "Assigned to Me"
- WebSocket connection for real-time updates
- Detailed grievance modal with action buttons
- Status history display
- Escalation level indicator
- Remark input for manager actions

**Key Functions:**
- `fetchGrievances()`: Fetches employee's own grievances
- `fetchAssignedGrievances()`: Fetches grievances assigned to manager
- `handleStatusUpdate()`: Updates grievance status with optional remark
- `openDetailModal()`: Opens detailed view with action buttons

#### 3. Package Dependencies
Added `socket.io-client` for WebSocket communication

## Workflow Diagram

```
Employee Submits Grievance
         ↓
System Queries Organogram
         ↓
Finds Immediate Manager (Parent Node)
         ↓
Assigns Grievance to Manager
         ↓
Sets 2-Minute Escalation Timer
         ↓
┌────────────────────────────────────┐
│  Manager Takes Action?             │
│  (In Review/Resolve/Close)         │
└────────────────────────────────────┘
         ↓                    ↓
       YES                   NO
         ↓                    ↓
  Timer Resets         Timer Expires (2 min)
         ↓                    ↓
  Employee Notified    Auto-Escalate to Next Level
  (Real-time)                ↓
                      Assign to Manager's Manager
                             ↓
                      Set New 2-Minute Timer
                             ↓
                      (Repeat Process)
```

## API Endpoints

### Employee Portal Routes (`/api/v1/employee/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/grievances` | Get employee's own grievances | Yes |
| POST | `/grievances` | Submit new grievance | Yes |
| GET | `/grievances/assigned` | Get grievances assigned to manager | Yes |
| PUT | `/grievances/:grievanceId/status` | Update grievance status | Yes (Manager) |

## WebSocket Events

### Client → Server
- `join-employee-room`: Join room for receiving updates (payload: `employeeId`)

### Server → Client
- `grievance-status-update`: Notifies employee of status change
  ```javascript
  {
    grievance: { /* updated grievance object */ },
    timestamp: "2024-01-15T10:30:00.000Z"
  }
  ```

## Setup Instructions

### 1. Install Dependencies
```bash
cd EmployeePortal
npm install
```

### 2. Start Backend Server
The grievance escalation service starts automatically when the backend server starts:
```bash
cd Backend
npm start
```

You should see:
```
✅ Grievance escalation service started
⏰ Checking for escalations every 30 seconds
```

### 3. Start Employee Portal
```bash
cd EmployeePortal
npm run dev
```

### 4. Configure Environment Variables
Ensure `.env` file in EmployeePortal has:
```
VITE_API_URL=http://localhost:4001/api/v1
```

## Testing the Workflow

### Test Scenario 1: Basic Grievance Submission
1. Login as Employee A (who reports to Manager B)
2. Go to Grievances → Submit New Grievance
3. Fill in details and submit
4. Verify grievance appears in "My Grievances" tab
5. Login as Manager B
6. Verify grievance appears in "Assigned to Me" tab

### Test Scenario 2: Manager Actions
1. As Manager B, click "View & Act" on a grievance
2. Add a remark (optional)
3. Click "In Review"
4. Verify status updates immediately
5. Login as Employee A
6. Verify status is updated in real-time without refresh

### Test Scenario 3: Automatic Escalation
1. As Employee A, submit a grievance
2. Wait 2 minutes without Manager B taking action
3. Verify grievance escalates to Manager B's manager (Manager C)
4. Check "Assigned to Me" tab for Manager C
5. Verify escalation level indicator shows "⚠️ Escalated (Level 1)"

### Test Scenario 4: Real-Time Updates
1. Open Employee Portal in two browser windows
2. Window 1: Login as Employee A
3. Window 2: Login as Manager B
4. In Window 1, submit a grievance
5. In Window 2, verify it appears instantly in "Assigned to Me"
6. In Window 2, resolve the grievance
7. In Window 1, verify status updates instantly without refresh

## Monitoring and Logs

### Backend Console Logs
```
✅ Grievance GRV_123 submitted and assigned to John Manager
🔍 Checking for grievances to escalate...
⏰ Grievance GRV_123 deadline passed, escalating...
✅ Grievance GRV_123 escalated to Sarah Director
📡 Emitting grievance update to employee EMP_456
```

### Frontend Console Logs
```
🔌 Connected to WebSocket
📡 Received grievance update: { grievanceId: 'GRV_123', status: 'Resolved' }
```

## Security Considerations

1. **Authorization**: Only assigned managers can update grievance status
2. **Data Isolation**: Grievances are filtered by `recruiterId` (company)
3. **WebSocket Authentication**: Employees can only join their own room
4. **Input Validation**: All inputs are validated on backend

## Performance Optimization

1. **Escalation Service**: Runs every 30 seconds (configurable)
2. **WebSocket**: Only emits to specific employee rooms (not broadcast)
3. **Database Queries**: Uses indexed fields (`grievanceId`, `recruiterId`, `assignedTo`)

## Troubleshooting

### Issue: Grievances not appearing in "Assigned to Me"
**Solution**: Verify organogram structure is properly set up with parent-child relationships

### Issue: Real-time updates not working
**Solution**: 
- Check WebSocket connection in browser console
- Verify backend WebSocket server is running
- Check CORS configuration includes Employee Portal URL

### Issue: Escalation not happening
**Solution**:
- Verify escalation service is running (check backend logs)
- Check `escalationDeadline` field is set correctly
- Ensure organogram has parent nodes for escalation

### Issue: "Not authorized to update this grievance"
**Solution**: Verify the logged-in user is the assigned manager (`assignedTo` field)

## Future Enhancements

1. **Email Notifications**: Send email when grievance is assigned/escalated
2. **SLA Tracking**: Track resolution time and SLA compliance
3. **Grievance Categories**: Add more granular categories
4. **Attachment Support**: Allow file attachments with grievances
5. **Grievance Analytics**: Dashboard showing grievance trends and resolution rates
6. **Custom Escalation Rules**: Configure escalation time per category/priority
7. **Grievance Templates**: Pre-defined templates for common grievances

## Conclusion

The hierarchical grievance workflow system is now fully functional with:
- ✅ Automatic routing based on organogram
- ✅ Manager dashboard with action buttons
- ✅ Real-time status updates via WebSocket
- ✅ Automatic escalation every 2 minutes
- ✅ Complete status history tracking
- ✅ Seamless integration with existing HRMS system

All features work in real-time and follow the organizational hierarchy as defined in the organogram.
