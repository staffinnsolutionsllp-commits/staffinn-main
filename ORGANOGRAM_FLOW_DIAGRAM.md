# Onboarding → Organogram Auto-Generation Flow

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    HR STARTS ONBOARDING                          │
│                  (Clicks "Onboard Employee")                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STEP 1: BASIC INFO                          │
│  • Full Name, Gender, DOB                                        │
│  • Contact Details (Mobile, Email)                               │
│  • Emergency Contact                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                STEP 2: IDENTIFICATION & BANKING                  │
│  • Aadhaar, PAN, UAN                                             │
│  • Bank Account Details                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           STEP 3: EMPLOYMENT & ORGANOGRAM (CRITICAL)             │
│  • Department, Designation                                       │
│  • ⭐ Reporting Manager (Dropdown)                               │
│  • ⭐ Role Level (IC/Lead/Manager/Head)                          │
│  • ⭐ Is People Manager? (Yes/No)                                │
│  • Team Name                                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 4: COMPENSATION & SYSTEM ACCESS                │
│  • Annual CTC, Basic Pay, HRA                                    │
│  • Role-Based Access (Employee/Manager/HR/Admin)                 │
│  • ⭐ Employee ID Auto-Generated                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUBMIT ONBOARDING FORM                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND PROCESSING STARTS                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  CREATE EMPLOYEE RECORD  │  │  AUTO-CREATE ORG NODE    │
│                          │  │                          │
│  • Employee ID: EMP001   │  │  • Node ID: ORG001       │
│  • Name: John Doe        │  │  • Employee: EMP001      │
│  • Position: Manager     │  │  • Parent: ORG000        │
│  • Manager: EMP000       │  │  • Level: 2              │
│  • Role Level: Manager   │  │  • Position: Manager     │
└────────────┬─────────────┘  └────────────┬─────────────┘
             │                             │
             └──────────────┬──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              UPDATE PARENT NODE'S CHILDREN ARRAY                 │
│  Parent Node (ORG000) children: [..., ORG001]                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ORGANOGRAM AUTOMATICALLY UPDATED                │
│                                                                  │
│                         CEO (ORG000)                             │
│                             │                                    │
│                    ┌────────┴────────┐                          │
│                    │                 │                           │
│              CTO (ORG001)      CFO (ORG002)                     │
│                    │                                             │
│              ┌─────┴─────┐                                      │
│              │           │                                       │
│      Manager (ORG003) [NEW EMPLOYEE]                            │
│              │                                                   │
│         ┌────┴────┐                                             │
│         │         │                                              │
│    Dev1 (ORG004) Dev2 (ORG005)                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### Input (Onboarding Form)
```javascript
{
  fullName: "Rahul Kumar",
  designation: "Senior Developer",
  department: "Engineering",
  reportingManagerId: "EMP003", // Manager's Employee ID
  roleLevel: "Individual Contributor",
  isPeopleManager: "No",
  teamName: "Backend Team"
}
```

### Output 1: Employee Record
```javascript
{
  employeeId: "EMP010", // Auto-generated
  name: "Rahul Kumar",
  position: "Senior Developer",
  department: "Engineering",
  managerId: "EMP003",
  roleLevel: "Individual Contributor",
  isPeopleManager: "No",
  teamName: "Backend Team",
  status: "active"
}
```

### Output 2: Organogram Node (Auto-Created)
```javascript
{
  nodeId: "ORG010", // Auto-generated
  employeeId: "EMP010", // Links to employee
  parentId: "ORG003", // Manager's org node
  level: 4, // IC = Level 4
  position: "Senior Developer",
  children: [],
  createdAt: "2024-01-15T10:30:00Z"
}
```

### Result: Updated Hierarchy
```
Engineering Manager (ORG003)
├── Senior Developer (ORG008)
├── Senior Developer (ORG009)
└── Senior Developer (ORG010) ← NEW EMPLOYEE
```

## Organogram Edit Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              USER CLICKS "EDIT" ON ORG NODE                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EDIT FORM OPENS                               │
│  • Change Employee Assignment                                    │
│  • Change Reporting Manager (Parent)                             │
│  • Update Position Title                                         │
│  • Modify Hierarchy Level                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUBMIT CHANGES                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND UPDATES NODE                            │
│  • Remove from old parent's children                             │
│  • Add to new parent's children                                  │
│  • Update node properties                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ORGANOGRAM DIAGRAM REFRESHES                        │
│              Shows updated hierarchy                             │
└─────────────────────────────────────────────────────────────────┘
```

## Role Level to Hierarchy Level Mapping

```
┌──────────────────────┬─────────────────┬──────────────────┐
│    Role Level        │  Hierarchy Level│   Typical Title  │
├──────────────────────┼─────────────────┼──────────────────┤
│ Head                 │     Level 1     │ CEO, CTO, CFO    │
│ Manager              │     Level 2     │ Department Head  │
│ Team Lead            │     Level 3     │ Team Lead        │
│ Individual Contrib.  │     Level 4     │ Developer, Exec  │
└──────────────────────┴─────────────────┴──────────────────┘
```

## Workflow Integration

### Grievance Escalation Path
```
Employee (Level 4)
    ↓ Raises Grievance
Team Lead (Level 3)
    ↓ If not resolved
Manager (Level 2)
    ↓ If not resolved
HR Department
    ↓ If not resolved
Management (Level 1)
```

### Leave Approval Flow
```
Employee applies leave
    ↓
Reporting Manager (from organogram)
    ↓ Approves
HR processes
    ↓
Leave granted
```

## Key Features Summary

✅ **Automatic Creation**: Onboarding → Organogram (no manual work)
✅ **Visual Diagram**: SVG-based tree structure with connecting lines
✅ **List View**: Expandable/collapsible hierarchy
✅ **Edit Capability**: Change any node, reassign employees
✅ **Delete Safety**: Children auto-reassign to grandparent
✅ **Vacant Positions**: Plan future hires
✅ **Real-time Stats**: Total/Filled/Vacant positions
✅ **Workflow Ready**: Grievances, approvals follow hierarchy

## Benefits

1. **Zero Duplication**: HR enters data once, organogram builds automatically
2. **Always Accurate**: Changes reflect immediately
3. **Visual Clarity**: See entire company structure
4. **Easy Reorganization**: Edit reporting structure anytime
5. **Workflow Automation**: Escalations follow organogram
6. **Planning Tool**: Add vacant positions for future hiring
