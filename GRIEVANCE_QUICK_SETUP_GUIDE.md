# Quick Setup Guide - Grievance Hierarchical Workflow

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
# Navigate to Employee Portal
cd EmployeePortal

# Install socket.io-client
npm install socket.io-client@^4.7.2

# Verify installation
npm list socket.io-client
```

### Step 2: Start Backend Server
```bash
# Navigate to Backend
cd ../Backend

# Start server
npm start
```

**Expected Output:**
```
✅ Grievance escalation service started
⏰ Checking for escalations every 30 seconds
🚀 SERVER STARTED SUCCESSFULLY!
```

### Step 3: Start Employee Portal
```bash
# Navigate to Employee Portal
cd ../EmployeePortal

# Start development server
npm run dev
```

**Expected Output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

## ✅ Verification Checklist

### Backend Verification
- [ ] Server starts without errors
- [ ] Grievance escalation service is running
- [ ] WebSocket server is initialized
- [ ] All HRMS routes are registered

### Frontend Verification
- [ ] Employee Portal loads successfully
- [ ] Login page appears
- [ ] No console errors

## 🧪 Quick Test (2 Minutes)

### Test 1: Submit Grievance
1. Login to Employee Portal
2. Navigate to **Grievances** section
3. Click **Submit Grievance**
4. Fill in:
   - Title: "Test Grievance"
   - Category: "Work Environment"
   - Priority: "Medium"
   - Description: "This is a test grievance"
5. Click **Submit Grievance**
6. ✅ Should see success message
7. ✅ Grievance appears in "My Grievances" tab

### Test 2: Manager View
1. Login as a manager (employee who has subordinates in organogram)
2. Navigate to **Grievances** section
3. Click **Assigned to Me** tab
4. ✅ Should see grievances from subordinates
5. Click **View & Act** on any grievance
6. ✅ Modal opens with action buttons

### Test 3: Update Status
1. In the grievance detail modal
2. Add a remark: "Reviewing this issue"
3. Click **In Review**
4. ✅ Success message appears
5. ✅ Modal closes
6. ✅ Status updates in the table

### Test 4: Real-Time Updates
1. Open two browser windows
2. Window 1: Login as Employee
3. Window 2: Login as their Manager
4. Window 1: Submit a new grievance
5. Window 2: Check "Assigned to Me" tab
6. ✅ Grievance appears instantly (within 1-2 seconds)
7. Window 2: Resolve the grievance
8. Window 1: Check "My Grievances" tab
9. ✅ Status updates to "Resolved" instantly

### Test 5: Auto-Escalation (2 Minutes)
1. Login as Employee
2. Submit a grievance
3. Note the time
4. Wait 2 minutes without manager taking action
5. Login as the manager's manager
6. Check "Assigned to Me" tab
7. ✅ Grievance appears with "⚠️ Escalated (Level 1)" indicator

## 🔍 Troubleshooting

### Issue: "socket.io-client not found"
```bash
cd EmployeePortal
npm install socket.io-client@^4.7.2
```

### Issue: WebSocket not connecting
**Check Browser Console:**
```javascript
// Should see:
🔌 Connected to WebSocket
```

**If not connecting:**
1. Verify backend is running on port 4001
2. Check `.env` file has correct API URL
3. Clear browser cache and reload

### Issue: Grievances not appearing in "Assigned to Me"
**Verify Organogram Setup:**
1. Login to HRMS Portal
2. Go to Organization → Organogram
3. Verify employees have proper parent-child relationships
4. Ensure managers are assigned to parent nodes

### Issue: Escalation not working
**Check Backend Logs:**
```
🔍 Checking for grievances to escalate...
```

If not appearing:
1. Restart backend server
2. Verify escalation service started successfully
3. Check grievance has `escalationDeadline` field

## 📊 Expected Database Structure

### Organogram Table: `staffinn-hrms-organization-chart`
```javascript
{
  nodeId: "NODE_001",
  recruiterId: "REC_123",
  employeeId: "EMP_456",
  parentId: "NODE_000", // Parent node (manager)
  level: 2,
  position: "Software Engineer"
}
```

### Grievances Table: `staffinn-hrms-grievances`
```javascript
{
  grievanceId: "GRV_789",
  recruiterId: "REC_123",
  employeeId: "EMP_456",
  assignedTo: "EMP_789", // Manager's employeeId
  status: "Open",
  escalationDeadline: "2024-01-15T10:32:00.000Z",
  escalationLevel: 0
}
```

## 🎯 Key Features to Test

### ✅ Feature Checklist
- [ ] Grievance submission works
- [ ] Automatic assignment to immediate manager
- [ ] "My Grievances" tab shows employee's grievances
- [ ] "Assigned to Me" tab shows manager's assigned grievances
- [ ] Manager can view grievance details
- [ ] Manager can update status (In Review, Resolve, Close)
- [ ] Manager can add remarks
- [ ] Real-time updates work (WebSocket)
- [ ] Auto-escalation works after 2 minutes
- [ ] Escalation level indicator shows correctly
- [ ] Status history is tracked
- [ ] Multiple escalations work (up the hierarchy)

## 📝 Test Data Setup

### Create Test Hierarchy
1. **CEO** (Level 0)
   - **Director** (Level 1)
     - **Manager** (Level 2)
       - **Employee** (Level 3)

### Test Scenario
1. Employee submits grievance → Assigned to Manager
2. Manager doesn't act → Escalates to Director (after 2 min)
3. Director doesn't act → Escalates to CEO (after 2 min)
4. CEO resolves → Employee sees "Resolved" status instantly

## 🔧 Configuration

### Backend Configuration
**File:** `Backend/services/grievanceEscalationService.js`
```javascript
// Change escalation check interval (default: 30 seconds)
escalationInterval = setInterval(() => {
  checkAndEscalateGrievances();
}, 30000); // Change this value
```

### Escalation Deadline
**File:** `Backend/controllers/hrms/employeePortalController.js`
```javascript
// Change escalation deadline (default: 2 minutes)
escalationDeadline: new Date(Date.now() + 2 * 60 * 1000).toISOString()
// Change to 5 minutes: 5 * 60 * 1000
// Change to 10 minutes: 10 * 60 * 1000
```

## 📞 Support

### Common Questions

**Q: Can I change the escalation time from 2 minutes?**
A: Yes, modify the `escalationDeadline` calculation in `employeePortalController.js`

**Q: Can employees see who their grievance is assigned to?**
A: Yes, the `assignedToName` field is included in the grievance data

**Q: What happens if there's no parent node (top of hierarchy)?**
A: Escalation stops, and a warning is logged in the backend console

**Q: Can I disable auto-escalation?**
A: Yes, comment out the escalation service start in `server.js`

**Q: How do I add more action options?**
A: Add new buttons in the modal and handle them in `handleStatusUpdate` function

## 🎉 Success Indicators

You'll know everything is working when:
1. ✅ Grievances submit successfully
2. ✅ Managers see assigned grievances instantly
3. ✅ Status updates appear in real-time
4. ✅ Escalation happens automatically after 2 minutes
5. ✅ No errors in browser or backend console
6. ✅ WebSocket connection shows "Connected"

## 📚 Next Steps

After successful setup:
1. Test with real user data
2. Configure escalation times for production
3. Set up email notifications (optional)
4. Add custom grievance categories
5. Configure SLA tracking (optional)

---

**Need Help?** Check the full documentation: `GRIEVANCE_HIERARCHICAL_WORKFLOW_IMPLEMENTATION.md`
