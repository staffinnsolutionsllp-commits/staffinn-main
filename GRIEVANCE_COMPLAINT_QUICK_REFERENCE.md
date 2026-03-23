# Complaint Against Employee - Quick Reference

## 🎯 Feature Summary
Employees can now file complaints against colleagues. The complaint is automatically assigned to the target employee's manager and escalates through the hierarchy if unresolved.

---

## 🚀 How to Use

### For Employees Filing Complaints

1. **Navigate to Grievances**
   - Click "Submit Grievance" button

2. **Select Grievance Type**
   - Choose "Complaint Against Employee" (red button)

3. **Fill the Form**
   - Title: Brief description
   - Category: Select appropriate category
   - Priority: Low/Medium/High
   - **Complaint Against Employee**: Select from dropdown
   - Description: Detailed explanation

4. **Submit**
   - System automatically assigns to target employee's manager
   - You'll receive confirmation

### For Managers Receiving Complaints

1. **Check "Assigned to Me" Tab**
   - Red badge indicates complaint-against-employee
   - Shows complainant and target employee

2. **Review Details**
   - Click "View & Act" button
   - See full complaint details
   - Check "Complaint Against" section

3. **Take Action**
   - Mark "In Review" to acknowledge
   - Add remarks (optional)
   - Resolve or Close when done

4. **Escalation Warning**
   - ⚠️ If no action in 2 minutes, escalates to your manager
   - Act promptly to prevent escalation

---

## 📊 Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| 🚨 Complaint against: [Name] | This is a complaint against an employee |
| ⚠️ Escalated (Level 1) | Escalated once to next manager |
| ⚠️ Escalated (Level 2) | Escalated twice, at higher level |
| 🟢 Resolved | Complaint resolved |
| 🟡 In Review | Manager is reviewing |

---

## 🔄 Escalation Flow

```
Complaint Filed
    ↓
Assigned to Target Employee's Manager
    ↓
⏱️ 2 Minutes Timer Starts
    ↓
No Action? → Escalate to Next Level Manager
    ↓
⏱️ 2 Minutes Timer Starts Again
    ↓
Repeat Until Resolved
```

---

## 🎨 UI Components

### Grievance Type Selection
```
┌─────────────────────────────────────────────────┐
│  [General Grievance]  [Complaint Against Emp]   │
│   Submit to manager    File against colleague   │
└─────────────────────────────────────────────────┘
```

### Employee Dropdown
```
┌─────────────────────────────────────────────────┐
│ Complaint Against Employee *                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ Select Employee                             ▼│ │
│ │ • John Doe - Manager (Engineering)           │ │
│ │ • Jane Smith - Developer (Engineering)       │ │
│ │ • Bob Wilson - HR Manager (Human Resources)  │ │
│ └─────────────────────────────────────────────┘ │
│ ⚠️ Will be assigned to selected employee's mgr  │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Escalation timeout (minutes)
ESCALATION_TIMEOUT_MINUTES=2

# Check interval (minutes)
ESCALATION_CHECK_INTERVAL_MINUTES=1
```

### Production Recommendation
```bash
ESCALATION_TIMEOUT_MINUTES=120  # 2 hours
```

---

## 📱 Real-time Notifications

### WebSocket Events
- **grievance-assigned**: New complaint assigned to you
- **grievance-escalated**: Complaint escalated to you
- **grievance-status-update**: Status changed by someone

### Browser Notification
```
🔔 New Grievance Assigned
Complaint against [Employee Name]
Priority: High
```

---

## ✅ Validation Rules

### Backend
- ✅ Target employee must exist
- ✅ Target employee must have a manager
- ✅ Manager must exist in system
- ✅ Cannot file complaint against yourself

### Frontend
- ✅ Must select an employee
- ✅ All required fields must be filled
- ✅ Description minimum length

---

## 🔍 Troubleshooting

### "Employee does not have a manager assigned"
**Solution**: Contact HR to assign a manager to the employee

### "Manager not found for the selected employee"
**Solution**: The manager record is missing, contact system admin

### Escalation not happening
**Solution**: Check escalation service is running on server

### Not receiving notifications
**Solution**: Check WebSocket connection in browser console

---

## 📞 Support

### For Technical Issues
- Check server logs: `Backend/logs/`
- Check browser console for errors
- Verify WebSocket connection

### For Process Questions
- Contact HR department
- Refer to company grievance policy
- Check employee handbook

---

## 🎓 Best Practices

### For Employees
1. ✅ Be specific and factual in description
2. ✅ Choose appropriate priority level
3. ✅ Provide evidence if available
4. ✅ Follow up if no response

### For Managers
1. ✅ Acknowledge within 2 minutes to prevent escalation
2. ✅ Add detailed remarks when taking action
3. ✅ Investigate thoroughly before resolving
4. ✅ Document all actions taken

### For HR/Admins
1. ✅ Ensure all employees have managers assigned
2. ✅ Monitor escalation patterns
3. ✅ Review resolved complaints regularly
4. ✅ Update policies based on trends

---

## 📈 Metrics to Track

### For Managers
- Number of complaints assigned
- Average resolution time
- Escalation rate
- Status distribution

### For HR
- Total complaints filed
- Most common categories
- Escalation patterns
- Department-wise breakdown

---

## 🔐 Privacy & Security

### Data Protection
- ✅ Complaints visible only to assigned managers
- ✅ Data isolated by company (recruiterId)
- ✅ Complete audit trail maintained
- ✅ Secure WebSocket connections

### Access Control
- ✅ Employees can only see their own complaints
- ✅ Managers see only assigned complaints
- ✅ HR/Admin can see all complaints
- ✅ Cannot file complaint against yourself

---

## 📋 Checklist for Implementation

### Backend Setup
- [ ] Deploy updated controller
- [ ] Deploy updated routes
- [ ] Verify escalation service is running
- [ ] Set environment variables
- [ ] Test WebSocket connections

### Frontend Setup
- [ ] Deploy updated Grievances component
- [ ] Deploy updated API service
- [ ] Clear browser cache
- [ ] Test in different browsers
- [ ] Verify mobile responsiveness

### Data Setup
- [ ] Ensure all employees have managers
- [ ] Verify manager hierarchy is correct
- [ ] Test with sample data
- [ ] Train managers on new flow
- [ ] Communicate to all employees

---

## 🎉 Success Criteria

✅ Employees can select colleagues from dropdown  
✅ Complaints auto-assign to target's manager  
✅ Escalation works every 2 minutes  
✅ Real-time notifications received  
✅ Visual indicators display correctly  
✅ Audit trail is complete  
✅ No data leakage between companies  

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
