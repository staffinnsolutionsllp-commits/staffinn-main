# Implementation Guide: Admin Onboarding, Organogram View & Task Assignment

## Overview

This document outlines the implementation of three key features:

1. **Admin Self-Onboarding** - First-time login flow for HR/Admin
2. **Employee Organogram View** - View hierarchy below current employee
3. **Hierarchy-Based Task Assignment** - Only employees with subordinates can assign tasks

---

## Feature 1: Admin Self-Onboarding

### Requirement
When an Admin (HR) accesses the HRMS system for the first time, they should go through a self-onboarding process. Since this is their first login, no employee credentials will exist initially in the Employee Portal.

### Implementation Steps

#### Step 1: Add `isOnboarded` flag to HRMS Users

**File:** `Backend/controllers/hrms/hrmsAuthController.js`

Add flag during registration:
```javascript
const user = {
  userId: generateId(),
  // ... other fields
  isOnboarded: false,  // NEW FIELD
  isFirstLogin: true,  // NEW FIELD
  createdAt: getCurrentTimestamp()
};
```

#### Step 2: Check onboarding status on login

**File:** `Backend/controllers/hrms/hrmsAuthController.js`

In login response, include:
```javascript
res.json(successResponse({
  token,
  user: {
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    isOnboarded: user.isOnboarded || false,  // NEW
    isFirstLogin: user.isFirstLogin || false  // NEW
  }
}, 'Login successful'));
```

#### Step 3: Create Onboarding Component

**File:** `HRMS Staffinn/Staffinn HR Manager_files/src/components/SelfOnboarding.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SelfOnboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    designation: '',
    department: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyContactName: ''
  });

  const handleSubmit = async () => {
    // Create employee record for admin
    // Add admin to organization chart as root node
    // Mark user as onboarded
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Welcome! Let's set up your profile</h1>
        
        {/* Multi-step form */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            {/* Form fields */}
          </div>
        )}
        
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Professional Details</h2>
            {/* Form fields */}
          </div>
        )}
        
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Emergency Contact</h2>
            {/* Form fields */}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Step 4: Add Onboarding Route Guard

**File:** `HRMS Staffinn/Staffinn HR Manager_files/src/App.tsx`

```typescript
function App() {
  const { user } = useAuth();
  
  // Redirect to onboarding if not completed
  if (user && !user.isOnboarded) {
    return <Navigate to="/onboarding" />;
  }
  
  return (
    <Routes>
      <Route path="/onboarding" element={<SelfOnboarding />} />
      {/* Other routes */}
    </Routes>
  );
}
```

#### Step 5: Create Backend Endpoint

**File:** `Backend/controllers/hrms/hrmsEmployeeController.js`

```javascript
const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user.userId;
    const employeeData = req.body;
    
    // 1. Create employee record
    const employeeId = generateId();
    const employee = {
      employeeId,
      recruiterId: req.user.userId,
      ...employeeData,
      createdAt: getCurrentTimestamp()
    };
    
    // Save to HRMS_EMPLOYEES_TABLE
    
    // 2. Create root node in organization chart
    const nodeId = generateId();
    const orgNode = {
      nodeId,
      recruiterId: req.user.userId,
      employeeId,
      level: 0,
      position: employeeData.designation,
      children: [],
      createdAt: getCurrentTimestamp()
    };
    
    // Save to HRMS_ORGANIZATION_CHART_TABLE
    
    // 3. Update user record
    const updatedUser = {
      ...req.user,
      isOnboarded: true,
      isFirstLogin: false,
      employeeId
    };
    
    // Update HRMS_USERS_TABLE
    
    res.json(successResponse({ employee, orgNode }, 'Onboarding completed'));
  } catch (error) {
    handleError(error, res);
  }
};
```

---

## Feature 2: Employee Organogram View (Subordinates Only)

### Requirement
In the Employee Portal, within the Organogram section, an employee should be able to view the entire hierarchical structure, including all employees who are positioned below them.

### Implementation Steps

#### Step 1: Create Backend Endpoint

**File:** `Backend/controllers/hrms/hrmsOrganizationController.js`

```javascript
const getSubordinatesHierarchy = async (req, res) => {
  try {
    const employeeId = req.user.userId || req.user.employeeId;
    const recruiterId = req.user.companyId || req.user.recruiterId;
    
    // Get all org nodes
    let allNodes;
    if (isUsingMockDB()) {
      allNodes = mockDB().scan(HRMS_ORGANIZATION_CHART_TABLE);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_ORGANIZATION_CHART_TABLE
      });
      const result = await dynamoClient.send(scanCommand);
      allNodes = result.Items || [];
    }
    
    // Find current employee's node
    const currentNode = allNodes.find(n => n.employeeId === employeeId);
    
    if (!currentNode) {
      return res.json(successResponse({
        currentEmployee: null,
        subordinates: [],
        hierarchy: []
      }, 'Employee not found in organization chart'));
    }
    
    // Get all employees
    let employees;
    if (isUsingMockDB()) {
      employees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE
      });
      const result = await dynamoClient.send(scanCommand);
      employees = result.Items || [];
    }
    
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.employeeId] = emp;
    });
    
    // Enrich nodes with employee data
    const enrichedNodes = allNodes.map(node => ({
      ...node,
      employee: employeeMap[node.employeeId] || null
    }));
    
    // Build subordinates tree (recursive function)
    const buildSubordinatesTree = (nodeId) => {
      const node = enrichedNodes.find(n => n.nodeId === nodeId);
      if (!node) return null;
      
      const children = enrichedNodes
        .filter(n => n.parentId === nodeId)
        .map(child => buildSubordinatesTree(child.nodeId))
        .filter(Boolean);
      
      return {
        ...node,
        children
      };
    };
    
    const subordinatesTree = buildSubordinatesTree(currentNode.nodeId);
    
    // Flatten subordinates for easy access
    const flattenSubordinates = (node, result = []) => {
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          result.push(child);
          flattenSubordinates(child, result);
        });
      }
      return result;
    };
    
    const subordinates = flattenSubordinates(subordinatesTree);
    
    res.json(successResponse({
      currentEmployee: subordinatesTree,
      subordinates,
      totalSubordinates: subordinates.length,
      hasSubordinates: subordinates.length > 0
    }, 'Subordinates hierarchy retrieved successfully'));
    
  } catch (error) {
    handleError(error, res);
  }
};
```

#### Step 2: Update Frontend Organogram Component

**File:** `EmployeePortal/src/pages/Organogram.jsx`

Update to show only subordinates:

```javascript
const fetchHierarchyData = async () => {
  try {
    setLoading(true);
    const response = await organogramAPI.getSubordinatesHierarchy();
    
    if (response.data.success) {
      const data = response.data.data;
      setHierarchyData(data);
      setHasSubordinates(data.hasSubordinates);
      
      // Show current employee and their subordinates
      if (data.currentEmployee) {
        setCurrentNode(data.currentEmployee);
        setSubordinates(data.currentEmployee.children || []);
      }
    }
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
  } finally {
    setLoading(false);
  }
};
```

#### Step 3: Add API Method

**File:** `EmployeePortal/src/services/api.js`

```javascript
export const organogramAPI = {
  getMyHierarchy: () => api.get('/employee/organogram'),
  getSubordinatesHierarchy: () => api.get('/employee/organogram/subordinates'),  // NEW
  getFullOrganogram: () => api.get('/employee/organogram/full'),
  getNodeDetails: (nodeId) => api.get(`/employee/organogram/node/${nodeId}`)
};
```

---

## Feature 3: Hierarchy-Based Task Assignment

### Requirement
Employees who are at the lowest level in the Organogram (i.e., they do not have any subordinates) will not be able to assign tasks. However, if an employee has even one subordinate under them, they should be able to go to the Task & Performance section and assign tasks to employees working under them.

### Implementation Steps

#### Step 1: Add Subordinates Check to Task Component

**File:** `EmployeePortal/src/pages/Tasks.jsx`

```javascript
export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [subordinates, setSubordinates] = useState([]);
  const [hasSubordinates, setHasSubordinates] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [activeTab, setActiveTab] = useState('my-tasks');

  useEffect(() => {
    fetchTasks();
    fetchSubordinates();
  }, []);

  const fetchSubordinates = async () => {
    try {
      const response = await organogramAPI.getSubordinatesHierarchy();
      if (response.data.success) {
        const data = response.data.data;
        setHasSubordinates(data.hasSubordinates);
        setSubordinates(data.subordinates || []);
      }
    } catch (error) {
      console.error('Error fetching subordinates:', error);
    }
  };

  const assignTask = async (taskData) => {
    try {
      await taskAPI.assignTask(taskData);
      alert('Task assigned successfully');
      setShowAssignForm(false);
      fetchAssignedTasks();
    } catch (error) {
      alert('Error assigning task');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks & Performance</h1>
        
        {/* Show Assign Task button only if has subordinates */}
        {hasSubordinates && (
          <button
            onClick={() => setShowAssignForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Assign Task
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('my-tasks')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'my-tasks' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500'
            }`}
          >
            My Tasks
          </button>
          
          {/* Show Assigned Tasks tab only if has subordinates */}
          {hasSubordinates && (
            <button
              onClick={() => setActiveTab('assigned-tasks')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'assigned-tasks' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              Assigned Tasks
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'performance' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500'
            }`}
          >
            Performance
          </button>
        </div>
      </div>

      {/* Task Assignment Form Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Assign Task</h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              // Handle form submission
            }}>
              {/* Select Subordinate */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Assign To <span className="text-red-500">*</span>
                </label>
                <select className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select Employee</option>
                  {subordinates.map(sub => (
                    <option key={sub.employeeId} value={sub.employeeId}>
                      {sub.employee?.fullName} - {sub.position}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Task Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="4"
                />
              </div>
              
              {/* Priority & Deadline */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAssignForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rest of the component */}
    </div>
  );
}
```

#### Step 2: Add Backend Validation

**File:** `Backend/controllers/hrms/hrmsTaskController.js`

```javascript
const assignTask = async (req, res) => {
  try {
    const assignerId = req.user.userId || req.user.employeeId;
    const recruiterId = req.user.recruiterId || req.user.companyId;
    
    // Check if assigner has subordinates
    const orgNodes = await getOrgNodes();
    const assignerNode = orgNodes.find(n => n.employeeId === assignerId);
    
    if (!assignerNode) {
      return res.status(403).json(errorResponse('You are not in the organization chart'));
    }
    
    // Check if assigner has any children (subordinates)
    const hasSubordinates = orgNodes.some(n => n.parentId === assignerNode.nodeId);
    
    if (!hasSubordinates) {
      return res.status(403).json(errorResponse('You do not have permission to assign tasks. Only employees with subordinates can assign tasks.'));
    }
    
    // Validate that target employee is a subordinate
    const { employeeIds } = req.body;
    const targetEmployeeId = employeeIds[0];
    
    const isSubordinate = await checkIfSubordinate(assignerNode.nodeId, targetEmployeeId, orgNodes);
    
    if (!isSubordinate) {
      return res.status(403).json(errorResponse('You can only assign tasks to your direct or indirect subordinates'));
    }
    
    // Continue with task assignment...
    
  } catch (error) {
    handleError(error, res);
  }
};

// Helper function
const checkIfSubordinate = (managerNodeId, employeeId, allNodes) => {
  const employeeNode = allNodes.find(n => n.employeeId === employeeId);
  if (!employeeNode) return false;
  
  // Traverse up the tree to see if we reach the manager
  let currentNode = employeeNode;
  while (currentNode.parentId) {
    if (currentNode.parentId === managerNodeId) {
      return true;
    }
    currentNode = allNodes.find(n => n.nodeId === currentNode.parentId);
    if (!currentNode) break;
  }
  
  return false;
};
```

---

## Summary of Changes

### Backend Files to Modify/Create:

1. `Backend/controllers/hrms/hrmsAuthController.js` - Add onboarding flags
2. `Backend/controllers/hrms/hrmsEmployeeController.js` - Add completeOnboarding endpoint
3. `Backend/controllers/hrms/hrmsOrganizationController.js` - Add getSubordinatesHierarchy endpoint
4. `Backend/controllers/hrms/hrmsTaskController.js` - Add subordinate validation
5. `Backend/routes/hrms/hrmsEmployeeRoutes.js` - Add onboarding route
6. `Backend/routes/hrms/hrmsOrganizationRoutes.js` - Add subordinates route

### Frontend Files to Modify/Create:

1. `HRMS/src/components/SelfOnboarding.tsx` - New onboarding component
2. `HRMS/src/App.tsx` - Add onboarding route guard
3. `EmployeePortal/src/pages/Organogram.jsx` - Update to show subordinates only
4. `EmployeePortal/src/pages/Tasks.jsx` - Add task assignment with subordinate check
5. `EmployeePortal/src/services/api.js` - Add new API methods

---

## Testing Checklist

### Admin Onboarding:
- [ ] First-time admin login redirects to onboarding
- [ ] Onboarding form saves employee record
- [ ] Admin is added as root node in org chart
- [ ] After onboarding, admin can access HRMS normally

### Organogram View:
- [ ] Employee sees only themselves and subordinates
- [ ] Employee at lowest level sees only themselves
- [ ] Manager sees all levels below them
- [ ] Navigation works correctly

### Task Assignment:
- [ ] Employee without subordinates cannot see "Assign Task" button
- [ ] Employee with subordinates can assign tasks
- [ ] Can only assign to direct/indirect subordinates
- [ ] Backend validates subordinate relationship
- [ ] Error message shown if trying to assign to non-subordinate

---

## Next Steps

1. Implement admin onboarding flow
2. Update organogram to show subordinates only
3. Add task assignment restrictions
4. Test all three features together
5. Update documentation

Would you like me to start implementing any of these features?
