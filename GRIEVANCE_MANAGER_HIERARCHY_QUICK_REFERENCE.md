# Grievance Manager Hierarchy - Quick Reference

## 🚀 Quick Start

### 1. Set Employee Managers (One-time setup)
```javascript
// Update employee records with managerId
{
  employeeId: "EMP001",
  managerId: "EMP002"  // Their immediate manager
}
```

### 2. Start Backend
```bash
cd Backend
npm start
# Look for: ✅ Grievance auto-escalation service started
```

### 3. Test Flow
1. Login as employee
2. Submit grievance → Select manager
3. Login as manager → See in "Assigned to Me"
4. Wait 2 minutes → Auto-escalates to next level

## 📡 API Quick Reference

```javascript
// Get reporting managers
GET /api/v1/employee/grievances/reporting-managers

// Submit grievance
POST /api/v1/employee/grievances
{ title, description, category, priority, assignedTo }

// Get assigned grievances
GET /api/v1/employee/grievances/assigned

// Update status
PUT /api/v1/employee/grievances/:id/status
{ status, remark }
```

## 🔧 Configuration

```env
ESCALATION_TIMEOUT_MINUTES=2
ESCALATION_CHECK_INTERVAL_MINUTES=1
```

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| No managers in dropdown | Add `managerId` to employee record |
| Escalation not working | Check backend logs, verify timeout config |
| Manager can't see grievance | Verify `assignedTo` matches manager ID |
| Duplicate escalations | Ensure only one server instance running |

## 📊 Database Fields

### Employee
- `managerId` - Immediate manager's employee ID

### Grievance
- `assignedTo` - Current assigned manager ID
- `escalationLevel` - Number of times escalated
- `escalationHistory` - Array of escalation events
- `statusHistory` - Array of all status changes

## 🔔 WebSocket Events

- `grievance-assigned` → Manager
- `grievance-escalated` → New manager
- `grievance-status-update` → Employee

## 📝 Key Files

**Backend:**
- `services/grievanceAutoEscalationService.js` - Escalation logic
- `controllers/hrms/hrmsGrievanceController.js` - API endpoints
- `routes/hrms/hrmsGrievanceRoutes.js` - Routes

**Frontend:**
- `EmployeePortal/src/pages/Grievances.jsx` - UI

**Docs:**
- `GRIEVANCE_MANAGER_HIERARCHY_SUMMARY.md` - Full details
- `GRIEVANCE_MANAGER_HIERARCHY_SETUP_GUIDE.md` - Setup steps

## ✅ Testing Checklist

- [ ] Submit grievance with manager
- [ ] Manager sees in "Assigned to Me"
- [ ] Wait 2 min → Auto-escalates
- [ ] Manager updates status
- [ ] WebSocket notifications work

## 🎯 Success Indicators

```
Backend logs:
✅ Grievance auto-escalation service started
🔍 Checking for grievances to escalate...
⬆️ Escalating grievance GRV_xxx (Level 0)
✅ Grievance escalated from Manager A to Manager B
```

## 💡 Pro Tips

1. **Test in Dev**: Use 1-minute timeout for faster testing
2. **Production**: Use 2-hour timeout (120 minutes)
3. **Monitoring**: Watch escalation logs regularly
4. **Hierarchy**: Keep max 3-4 levels for efficiency
5. **Notifications**: Add email for critical escalations

---

**Need Help?** Check `GRIEVANCE_MANAGER_HIERARCHY_SETUP_GUIDE.md`
