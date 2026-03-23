# Grievance Manager Hierarchy - Setup Guide

## Overview
This guide will help you set up the manager-based grievance assignment system with automatic escalation.

## Prerequisites
- Backend server running
- Employee Portal running
- DynamoDB tables created
- WebSocket configured

## Step 1: Update Employee Records with Manager Hierarchy

You need to add `managerId` field to employee records to establish the reporting hierarchy.

### Option A: Manual Update via DynamoDB Console
1. Open AWS DynamoDB Console
2. Navigate to `staffinn-hrms-employees` table
3. For each employee, add:
   - `managerId`: Employee ID of their immediate manager
   
### Option B: Bulk Update via Script

Create a script `update-employee-managers.js`:

```javascript
const { dynamoClient, HRMS_EMPLOYEES_TABLE } = require('./config/dynamodb-wrapper');
const { ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

async function updateEmployeeManagers() {
  // Define your organizational hierarchy
  const managerAssignments = {
    'EMP001': null,          // CEO - no manager
    'EMP002': 'EMP001',      // Reports to CEO
    'EMP003': 'EMP001',      // Reports to CEO
    'EMP004': 'EMP002',      // Reports to EMP002
    'EMP005': 'EMP002',      // Reports to EMP002
    'EMP006': 'EMP003',      // Reports to EMP003
    // Add more as needed
  };

  for (const [employeeId, managerId] of Object.entries(managerAssignments)) {
    try {
      const updateCommand = new UpdateCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId },
        UpdateExpression: 'SET managerId = :managerId',
        ExpressionAttributeValues: {
          ':managerId': managerId
        }
      });
      
      await dynamoClient.send(updateCommand);
      console.log(`✅ Updated ${employeeId} with manager ${managerId}`);
    } catch (error) {
      console.error(`❌ Error updating ${employeeId}:`, error);
    }
  }
  
  console.log('✅ All employee managers updated');
}

updateEmployeeManagers();
```

Run: `node update-employee-managers.js`

## Step 2: Configure Environment Variables

Add to your `.env` file:

```env
# Grievance Escalation Configuration
ESCALATION_TIMEOUT_MINUTES=2
ESCALATION_CHECK_INTERVAL_MINUTES=1
```

## Step 3: Restart Backend Server

```bash
cd Backend
npm start
```

You should see:
```
✅ Grievance auto-escalation service started
⏱️ Escalation timeout: 2 minutes
🔄 Check interval: 1 minute(s)
```

## Step 4: Test the Feature

### Test 1: Submit Grievance with Manager Selection

1. Login to Employee Portal
2. Go to Grievances section
3. Click "Submit Grievance"
4. Fill in the form
5. Select a manager from dropdown (should show immediate and next-level managers)
6. Submit

**Expected Result:**
- Grievance created successfully
- Manager sees it in "Assigned to Me" tab
- WebSocket notification sent to manager

### Test 2: Verify Manager Visibility

1. Login as the assigned manager
2. Go to Grievances section
3. Click "Assigned to Me" tab

**Expected Result:**
- Grievance appears in the list
- Shows employee name, priority, status
- Can view details and take action

### Test 3: Test Auto-Escalation

1. Submit a grievance assigned to immediate manager
2. Wait for 2 minutes without taking action
3. Check the grievance status

**Expected Result:**
- After 2 minutes, grievance automatically escalates
- Assigned to next-level manager
- Escalation level increments
- Both managers and employee receive notifications
- Escalation history is recorded

### Test 4: Manager Actions

1. As manager, open assigned grievance
2. Add a remark
3. Change status to "In Review"

**Expected Result:**
- Status updated successfully
- Status history recorded
- Employee receives notification
- Escalation stops (no further auto-escalation)

## Step 5: Monitor Escalation Service

Check backend logs for escalation activity:

```
🔍 Checking for grievances to escalate...
📋 Found 1 grievance(s) to escalate
⬆️ Escalating grievance GRV_xxx (Level 0)
✅ Grievance GRV_xxx escalated from Manager A to Manager B
✅ Escalation check completed
```

## Troubleshooting

### Issue: No managers showing in dropdown

**Solution:**
- Verify employee has `managerId` set in database
- Check that manager employee record exists
- Ensure manager has valid `employeeId`

### Issue: Escalation not working

**Solution:**
- Check backend logs for escalation service status
- Verify `ESCALATION_TIMEOUT_MINUTES` is set
- Ensure WebSocket is connected
- Check that grievance has `assignedTo` field

### Issue: Manager not seeing assigned grievances

**Solution:**
- Verify manager is logged in with correct employee ID
- Check that grievance `assignedTo` matches manager's `employeeId`
- Clear browser cache and reload

### Issue: Duplicate escalations

**Solution:**
- Check that only one instance of backend server is running
- Verify `lastEscalatedAt` timestamp is being updated
- Review escalation service logs

## API Testing with Postman

### 1. Get Reporting Managers
```
GET /api/v1/employee/grievances/reporting-managers
Headers:
  Authorization: Bearer <employee_token>
```

### 2. Submit Grievance
```
POST /api/v1/employee/grievances
Headers:
  Authorization: Bearer <employee_token>
Body:
{
  "title": "Test Grievance",
  "description": "Test description",
  "category": "Workplace Harassment",
  "priority": "high",
  "assignedTo": "EMP002"
}
```

### 3. Get Assigned Grievances
```
GET /api/v1/employee/grievances/assigned
Headers:
  Authorization: Bearer <manager_token>
```

### 4. Update Grievance Status
```
PUT /api/v1/employee/grievances/:id/status
Headers:
  Authorization: Bearer <manager_token>
Body:
{
  "status": "In Review",
  "remark": "Looking into this issue"
}
```

## Database Verification

### Check Employee Hierarchy
```javascript
// Query employee with manager
const employee = await dynamoClient.send(new GetCommand({
  TableName: 'staffinn-hrms-employees',
  Key: { employeeId: 'EMP004' }
}));

console.log('Employee:', employee.Item.fullName);
console.log('Manager ID:', employee.Item.managerId);
```

### Check Grievance Escalation
```javascript
// Query grievance
const grievance = await dynamoClient.send(new GetCommand({
  TableName: 'staffinn-hrms-grievances',
  Key: { grievanceId: 'GRV_xxx' }
}));

console.log('Assigned To:', grievance.Item.assignedTo);
console.log('Escalation Level:', grievance.Item.escalationLevel);
console.log('Escalation History:', grievance.Item.escalationHistory);
```

## Production Deployment

### 1. Update Environment Variables
```env
ESCALATION_TIMEOUT_MINUTES=120  # 2 hours in production
ESCALATION_CHECK_INTERVAL_MINUTES=30  # Check every 30 minutes
```

### 2. Enable Logging
Add to your logging configuration:
```javascript
// Log all escalations
escalationService.on('escalate', (data) => {
  logger.info('Grievance escalated', data);
});
```

### 3. Set up Monitoring
- Monitor escalation service uptime
- Track escalation metrics
- Set up alerts for failed escalations

### 4. Email Notifications (Optional)
Integrate email service to notify managers:
```javascript
// In escalateGrievance function
await emailService.send({
  to: nextManager.email,
  subject: 'Grievance Escalated to You',
  template: 'grievance-escalation',
  data: { grievance, manager: nextManager }
});
```

## Security Considerations

1. **Data Isolation**: Each recruiter's data is isolated by `recruiterId`
2. **Authorization**: Only assigned managers can view/act on grievances
3. **Audit Trail**: All actions are logged in `statusHistory`
4. **Validation**: Manager must exist in same organization
5. **Rate Limiting**: Consider adding rate limits to prevent abuse

## Performance Optimization

1. **Caching**: Cache manager hierarchy for faster lookups
2. **Batch Processing**: Process multiple escalations in batches
3. **Indexing**: Add GSI on `assignedTo` field for faster queries
4. **WebSocket**: Use rooms for targeted notifications

## Support

For issues or questions:
1. Check backend logs: `tail -f logs/server.log`
2. Review escalation service logs
3. Test with Postman/curl
4. Check DynamoDB records directly

## Next Steps

1. ✅ Set up employee manager hierarchy
2. ✅ Configure environment variables
3. ✅ Test grievance submission
4. ✅ Verify auto-escalation
5. ✅ Test manager actions
6. ⬜ Add email notifications
7. ⬜ Set up monitoring
8. ⬜ Deploy to production

## Conclusion

Your grievance manager hierarchy system is now set up! Employees can submit grievances to their managers, and the system will automatically escalate if no action is taken within the configured timeout period.
