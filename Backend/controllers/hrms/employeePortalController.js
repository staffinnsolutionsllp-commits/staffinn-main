const { dynamoClient, isUsingMockDB, mockDB, HRMS_ORGANIZATION_CHART_TABLE, HRMS_EMPLOYEES_TABLE } = require('../../config/dynamodb-wrapper');
const { QueryCommand, PutCommand, ScanCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp } = require('../../utils/hrmsHelpers');

// Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const { employeeId, companyId } = req.user;
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);

    // Get attendance for current month
    const attendanceResult = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-attendance',
      FilterExpression: 'employeeId = :eid AND recruiterId = :rid AND begins_with(#date, :month)',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: { ':eid': employeeId, ':rid': companyId, ':month': currentMonth }
    }));

    // Get leave balance
    const leaveBalanceResult = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-leaves',
      FilterExpression: 'employeeId = :eid AND recruiterId = :rid AND entityType = :type',
      ExpressionAttributeValues: { ':eid': employeeId, ':rid': companyId, ':type': 'BALANCE' }
    }));

    // Get pending leaves
    const pendingLeavesResult = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-leaves',
      FilterExpression: 'employeeId = :eid AND recruiterId = :rid AND entityType = :type AND #status = :pending',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':eid': employeeId, ':rid': companyId, ':type': 'REQUEST', ':pending': 'Pending' }
    }));

    const stats = {
      attendanceThisMonth: attendanceResult.Items?.length || 0,
      leaveBalance: leaveBalanceResult.Items || [],
      pendingLeaves: pendingLeavesResult.Items?.length || 0,
      todayAttendance: attendanceResult.Items?.find(a => a.date === today) || null
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get My Attendance
const getMyAttendance = async (req, res) => {
  try {
    const { employeeId, companyId } = req.user;
    const { month, year } = req.query;

    let filterExpression = 'employeeId = :eid AND recruiterId = :rid';
    let expressionValues = { ':eid': employeeId, ':rid': companyId };

    if (month && year) {
      filterExpression += ' AND begins_with(#date, :yearMonth)';
      expressionValues[':yearMonth'] = `${year}-${month.padStart(2, '0')}`;
    }

    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-attendance',
      FilterExpression: filterExpression,
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: expressionValues
    }));

    const attendance = (result.Items || []).sort((a, b) => b.date.localeCompare(a.date));
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark Attendance
const markAttendance = async (req, res) => {
  try {
    const { employeeId, companyId } = req.user;
    const { type } = req.body;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const attendanceId = `${employeeId}_${today}`;

    if (type === 'check-in') {
      await dynamoClient.send(new PutCommand({
        TableName: 'staffinn-hrms-attendance',
        Item: {
          attendanceId,
          employeeId,
          recruiterId: companyId,
          date: today,
          checkInTime: now,
          status: 'Present',
          createdAt: now
        }
      }));
      res.json({ success: true, message: 'Checked in successfully' });
    } else {
      const getResult = await dynamoClient.send(new GetCommand({
        TableName: 'staffinn-hrms-attendance',
        Key: { attendanceId }
      }));

      if (getResult.Item) {
        await dynamoClient.send(new PutCommand({
          TableName: 'staffinn-hrms-attendance',
          Item: { ...getResult.Item, checkOutTime: now }
        }));
        res.json({ success: true, message: 'Checked out successfully' });
      } else {
        res.status(400).json({ success: false, message: 'No check-in found for today' });
      }
    }
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get My Leaves
const getMyLeaves = async (req, res) => {
  try {
    const { employeeId, companyId } = req.user;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-leaves',
      FilterExpression: 'employeeId = :eid AND recruiterId = :rid AND entityType = :type',
      ExpressionAttributeValues: { ':eid': employeeId, ':rid': companyId, ':type': 'REQUEST' }
    }));

    res.json({ success: true, data: result.Items || [] });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Leave Balance
const getLeaveBalance = async (req, res) => {
  try {
    const { employeeId, companyId } = req.user;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-leaves',
      FilterExpression: 'employeeId = :eid AND recruiterId = :rid AND entityType = :type',
      ExpressionAttributeValues: { ':eid': employeeId, ':rid': companyId, ':type': 'BALANCE' }
    }));

    const balances = (result.Items || []).map(item => ({
      leaveType: item.leaveType,
      balance: item.remaining || 0,
      totalAllocated: item.totalAllocated || 0,
      used: item.used || 0
    }));

    res.json({ success: true, data: balances });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Apply Leave
const applyLeave = async (req, res) => {
  try {
    const { employeeId, companyId, email, name } = req.user;
    const { leaveType, startDate, endDate, reason } = req.body;

    const leaveId = `LEAVE_${Date.now()}`;
    const now = getCurrentTimestamp();

    // Get employee details
    const empResult = await dynamoClient.send(new GetCommand({
      TableName: 'staffinn-hrms-employees',
      Key: { employeeId }
    }));

    const employee = empResult.Item || {};

    await dynamoClient.send(new PutCommand({
      TableName: 'staffinn-hrms-leaves',
      Item: {
        leaveId,
        entityType: 'REQUEST',
        employeeId,
        recruiterId: companyId,
        employeeEmail: email,
        employeeName: employee.name || name || '',
        department: employee.department || '',
        leaveType,
        startDate,
        endDate,
        reason,
        status: 'Pending',
        appliedDate: now,
        createdAt: now,
        updatedAt: now
      }
    }));

    res.json({ success: true, message: 'Leave applied successfully' });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cancel Leave
const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.user;

    const getResult = await dynamoClient.send(new GetCommand({
      TableName: 'staffinn-hrms-leaves',
      Key: { leaveId: id }
    }));

    if (!getResult.Item) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (getResult.Item.employeeId !== employeeId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (getResult.Item.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled' });
    }

    await dynamoClient.send(new UpdateCommand({
      TableName: 'staffinn-hrms-leaves',
      Key: { leaveId: id },
      UpdateExpression: 'SET #status = :cancelled',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':cancelled': 'Cancelled' }
    }));

    res.json({ success: true, message: 'Leave cancelled successfully' });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get My Payslips
const getMyPayslips = async (req, res) => {
  try {
    const { employeeId, companyId } = req.user;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-payroll',
      FilterExpression: 'employeeId = :eid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':eid': employeeId, ':rid': companyId }
    }));

    res.json({ success: true, data: result.Items || [] });
  } catch (error) {
    console.error('Get payslips error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update Profile (limited fields)
const updateProfile = async (req, res) => {
  try {
    const { employeeId, companyId } = req.user;
    const { phone, currentAddress, emergencyContactName, emergencyContactNumber, emergencyContactRelation } = req.body;

    const updates = {};
    if (phone) updates.emergencyContactNumber = phone;
    if (currentAddress) updates.currentAddress = currentAddress;
    if (emergencyContactName) updates.emergencyContactName = emergencyContactName;
    if (emergencyContactNumber) updates.emergencyContactNumber = emergencyContactNumber;
    if (emergencyContactRelation) updates.emergencyContactRelation = emergencyContactRelation;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      updateExpressions.push(`#${key} = :val${index}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:val${index}`] = updates[key];
    });

    await dynamoClient.send(new UpdateCommand({
      TableName: 'staffinn-hrms-employees',
      Key: { employeeId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }));

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Employee Claims
const getMyClaims = async (req, res) => {
  try {
    const { employeeId, companyId, email } = req.user;

    console.log('=== GET MY CLAIMS DEBUG ===');
    console.log('Employee ID:', employeeId);
    console.log('Employee Email:', email);
    console.log('Company ID (recruiterId):', companyId);

    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'HRMS-Claim-Management',
      FilterExpression: 'entityType = :type AND recruiterId = :rid AND (employeeId = :eid OR employeeEmail = :email)',
      ExpressionAttributeValues: { ':type': 'CLAIM', ':rid': companyId, ':eid': employeeId, ':email': email }
    }));

    const claims = result.Items || [];
    console.log(`✅ Found ${claims.length} claims for employee`);

    res.json({ success: true, data: claims });
  } catch (error) {
    console.error('❌ Get claims error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Claim Categories
const getClaimCategories = async (req, res) => {
  try {
    const { companyId, employeeId, email } = req.user;

    console.log('=== GET CLAIM CATEGORIES DEBUG ===');
    console.log('Employee ID:', employeeId);
    console.log('Employee Email:', email);
    console.log('Company ID (recruiterId):', companyId);

    if (!companyId) {
      console.error('❌ Company ID not found in user token');
      return res.status(400).json({ success: false, message: 'Company ID not found' });
    }

    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'HRMS-Claim-Management',
      FilterExpression: 'entityType = :type AND recruiterId = :rid',
      ExpressionAttributeValues: { ':type': 'CATEGORY', ':rid': companyId }
    }));

    const categories = result.Items || [];
    console.log(`✅ Found ${categories.length} categories for companyId: ${companyId}`);
    if (categories.length > 0) {
      console.log('Categories:', categories.map(c => ({ name: c.name, id: c.categoryId })));
    }

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('❌ Get claim categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Submit Claim
const submitClaim = async (req, res) => {
  try {
    const { employeeId, companyId, email } = req.user;
    const { category, amount, description } = req.body;

    const claimId = generateId();
    const claim = {
      claimmanagement: `CLAIM#${claimId}`,
      claimId,
      entityType: 'CLAIM',
      recruiterId: companyId,
      employeeId,
      employeeEmail: email,
      employeeName: req.user.name || '',
      category,
      amount: parseFloat(amount),
      description: description || '',
      status: 'Pending',
      submittedDate: getCurrentTimestamp(),
      remarks: '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    await dynamoClient.send(new PutCommand({
      TableName: 'HRMS-Claim-Management',
      Item: claim
    }));

    res.status(201).json({ success: true, message: 'Claim submitted successfully', data: claim });
  } catch (error) {
    console.error('Submit claim error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Employee Tasks
const getMyTasks = async (req, res) => {
  try {
    const { employeeId, companyId, email } = req.user;

    console.log('=== GET MY TASKS DEBUG ===');
    console.log('Employee ID:', employeeId);
    console.log('Employee Email:', email);
    console.log('Company ID (recruiterId):', companyId);

    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'HRMS-Task-Management',
      FilterExpression: 'recruiterId = :rid AND (employeeId = :eid OR employeeEmail = :email)',
      ExpressionAttributeValues: { ':rid': companyId, ':eid': employeeId, ':email': email }
    }));

    const allItems = result.Items || [];
    console.log(`Found ${allItems.length} total items for employee`);
    
    const tasks = allItems.filter(item => !item.type || item.type !== 'RATING');
    console.log(`✅ Found ${tasks.length} tasks (filtered out ${allItems.length - tasks.length} ratings)`);
    
    if (tasks.length > 0) {
      console.log('Tasks:', tasks.map(t => ({ title: t.title, status: t.status, taskId: t.taskId })));
    }

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update Task Status
const updateMyTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { employeeId } = req.user;
    const { status, completionPercentage, remarks } = req.body;

    const getResult = await dynamoClient.send(new ScanCommand({
      TableName: 'HRMS-Task-Management',
      FilterExpression: 'taskId = :tid',
      ExpressionAttributeValues: { ':tid': taskId }
    }));

    if (!getResult.Items || getResult.Items.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = getResult.Items[0];
    if (task.employeeId !== employeeId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updatedTask = {
      ...task,
      status: status || task.status,
      completionPercentage: completionPercentage !== undefined ? completionPercentage : task.completionPercentage,
      remarks: remarks || task.remarks,
      updatedAt: getCurrentTimestamp()
    };

    await dynamoClient.send(new PutCommand({
      TableName: 'HRMS-Task-Management',
      Item: updatedTask
    }));

    res.json({ success: true, message: 'Task updated successfully', data: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Performance Ratings
const getMyRatings = async (req, res) => {
  try {
    const { employeeId, companyId, email } = req.user;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'HRMS-Task-Management',
      FilterExpression: 'recruiterId = :rid AND (employeeId = :eid OR employeeEmail = :email) AND #type = :ratingType',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: { ':rid': companyId, ':eid': employeeId, ':email': email, ':ratingType': 'RATING' }
    }));

    res.json({ success: true, data: result.Items || [] });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Employee Grievances
const getMyGrievances = async (req, res) => {
  try {
    const { employeeId, companyId, email } = req.user;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-grievances',
      FilterExpression: 'recruiterId = :rid AND (employeeId = :eid OR employeeEmail = :email)',
      ExpressionAttributeValues: { ':rid': companyId, ':eid': employeeId, ':email': email }
    }));

    const grievances = (result.Items || []).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ success: true, data: grievances });
  } catch (error) {
    console.error('Get grievances error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Submit Grievance with Hierarchical Routing
const submitGrievance = async (req, res) => {
  try {
    const { employeeId, companyId, email } = req.user;
    const { title, description, category, priority = 'medium' } = req.body;

    // Get employee's immediate manager from organogram
    const orgResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_ORGANIZATION_CHART_TABLE,
      FilterExpression: 'recruiterId = :rid AND employeeId = :eid',
      ExpressionAttributeValues: { ':rid': companyId, ':eid': employeeId }
    }));

    let assignedTo = null;
    let assignedToName = null;
    let currentLevel = 0;

    if (orgResult.Items && orgResult.Items.length > 0) {
      const currentNode = orgResult.Items[0];
      currentLevel = currentNode.level || 0;

      // Get parent node (immediate manager)
      if (currentNode.parentId) {
        const parentResult = await dynamoClient.send(new ScanCommand({
          TableName: HRMS_ORGANIZATION_CHART_TABLE,
          FilterExpression: 'nodeId = :nid',
          ExpressionAttributeValues: { ':nid': currentNode.parentId }
        }));

        if (parentResult.Items && parentResult.Items.length > 0) {
          const parentNode = parentResult.Items[0];
          assignedTo = parentNode.employeeId;

          // Get manager's name
          if (assignedTo) {
            const managerResult = await dynamoClient.send(new ScanCommand({
              TableName: HRMS_EMPLOYEES_TABLE,
              FilterExpression: 'employeeId = :eid',
              ExpressionAttributeValues: { ':eid': assignedTo }
            }));
            if (managerResult.Items && managerResult.Items.length > 0) {
              assignedToName = managerResult.Items[0].fullName || managerResult.Items[0].name || 'Manager';
            }
          }
        }
      }
    }

    const grievanceId = generateId();
    const now = getCurrentTimestamp();
    const grievance = {
      grievanceId,
      recruiterId: companyId,
      employeeId,
      employeeEmail: email,
      employeeName: req.user.name || '',
      subject: title,
      title,
      description,
      category,
      priority,
      status: 'Open',
      submittedDate: now,
      assignedTo,
      assignedToName,
      currentLevel,
      escalationLevel: 0,
      lastActionTime: now,
      escalationDeadline: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes from now
      resolvedDate: null,
      remarks: [],
      statusHistory: [{
        status: 'Open',
        changedBy: employeeId,
        changedByName: req.user.name || '',
        timestamp: now,
        action: 'Submitted',
        assignedTo,
        assignedToName
      }],
      createdAt: now,
      updatedAt: now
    };

    await dynamoClient.send(new PutCommand({
      TableName: 'staffinn-hrms-grievances',
      Item: grievance
    }));

    console.log(`✅ Grievance ${grievanceId} submitted and assigned to ${assignedToName || 'No Manager'}`);

    res.status(201).json({ success: true, message: 'Grievance submitted successfully', data: grievance });
  } catch (error) {
    console.error('Submit grievance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Employee Hierarchy (Organogram)
const getMyHierarchy = async (req, res) => {
  try {
    const { employeeId, companyId, email } = req.user;

    console.log('=== GET MY HIERARCHY DEBUG ===');
    console.log('Employee ID:', employeeId);
    console.log('Company ID:', companyId);
    console.log('Email:', email);
    console.log('Table Names:', { HRMS_ORGANIZATION_CHART_TABLE, HRMS_EMPLOYEES_TABLE });

    // Get all org nodes for this recruiter
    const orgResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_ORGANIZATION_CHART_TABLE,
      FilterExpression: 'recruiterId = :rid',
      ExpressionAttributeValues: { ':rid': companyId }
    }));

    const orgNodes = orgResult.Items || [];
    console.log(`Found ${orgNodes.length} org nodes`);

    // Get all employees for this recruiter
    const empResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_EMPLOYEES_TABLE,
      FilterExpression: 'recruiterId = :rid',
      ExpressionAttributeValues: { ':rid': companyId }
    }));

    const employees = empResult.Items || [];
    console.log(`Found ${employees.length} employees`);
    if (employees.length > 0) {
      console.log('Sample employee:', employees[0]);
    }

    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.employeeId] = emp;
      console.log(`Mapped employee: ${emp.employeeId} -> ${emp.name}`);
    });

    console.log('Employee Map Keys:', Object.keys(employeeMap));
    console.log('Org Nodes Employee IDs:', orgNodes.map(n => n.employeeId));

    // Enrich nodes with employee data
    const enrichedNodes = orgNodes.map(node => {
      const enriched = {
        ...node,
        employee: employeeMap[node.employeeId] || null
      };
      console.log(`Node ${node.nodeId}: employeeId=${node.employeeId}, employee=${enriched.employee?.name || 'NULL'}`);
      return enriched;
    });

    console.log('Enriched nodes sample:', enrichedNodes[0]);

    // Find the current employee's node
    const currentNode = enrichedNodes.find(n => n.employeeId === employeeId);

    console.log('Current node found:', currentNode ? 'Yes' : 'No');
    if (currentNode) {
      console.log('Current node details:', currentNode);
    }

    if (!currentNode) {
      return res.json({ success: true, data: { currentEmployee: null, hierarchy: [] } });
    }

    // Build node map for easy lookup and preserve employee data
    const nodeMap = {};
    enrichedNodes.forEach(node => {
      nodeMap[node.nodeId] = { ...node, children: [] };
    });

    // Build parent-child relationships with enriched data
    enrichedNodes.forEach(node => {
      if (node.parentId && nodeMap[node.parentId]) {
        // Push the enriched node from nodeMap, not the original
        nodeMap[node.parentId].children.push(nodeMap[node.nodeId]);
      }
    });

    console.log('NodeMap with children:', Object.keys(nodeMap).map(k => ({
      nodeId: k,
      employeeName: nodeMap[k].employee?.name,
      childrenCount: nodeMap[k].children.length,
      childrenNames: nodeMap[k].children.map(c => c.employee?.name || 'NO EMPLOYEE')
    })));

    // Build hierarchy path from current employee to top
    const buildHierarchyPath = (nodeId, path = []) => {
      const node = nodeMap[nodeId];
      if (!node) return path;
      
      const nodeWithChildren = { ...node };
      path.unshift(nodeWithChildren);
      
      if (node.parentId && nodeMap[node.parentId]) {
        return buildHierarchyPath(node.parentId, path);
      }
      
      return path;
    };

    const hierarchyPath = buildHierarchyPath(currentNode.nodeId);

    res.json({ 
      success: true, 
      data: {
        currentEmployee: nodeMap[currentNode.nodeId],
        hierarchy: hierarchyPath,
        immediateManager: currentNode.parentId ? nodeMap[currentNode.parentId] : null
      }
    });
  } catch (error) {
    console.error('Get hierarchy error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Full Organogram (for navigation)
const getFullOrganogram = async (req, res) => {
  try {
    const { companyId } = req.user;

    // Get all org nodes for this recruiter
    const orgResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_ORGANIZATION_CHART_TABLE,
      FilterExpression: 'recruiterId = :rid',
      ExpressionAttributeValues: { ':rid': companyId }
    }));

    const orgNodes = orgResult.Items || [];

    // Get all employees for this recruiter
    const empResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_EMPLOYEES_TABLE,
      FilterExpression: 'recruiterId = :rid',
      ExpressionAttributeValues: { ':rid': companyId }
    }));

    const employees = empResult.Items || [];
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.employeeId] = emp;
    });

    // Enrich nodes with employee data
    const enrichedNodes = orgNodes.map(node => ({
      ...node,
      employee: employeeMap[node.employeeId] || null
    }));

    // Build hierarchical structure
    const nodeMap = {};
    const rootNodes = [];

    // First pass: create node map
    enrichedNodes.forEach(node => {
      nodeMap[node.nodeId] = { ...node, children: [] };
    });

    // Second pass: build hierarchy
    enrichedNodes.forEach(node => {
      if (node.parentId && nodeMap[node.parentId]) {
        nodeMap[node.parentId].children.push(nodeMap[node.nodeId]);
      } else {
        // This is a root node (no parent or parent doesn't exist)
        rootNodes.push(nodeMap[node.nodeId]);
      }
    });

    // Sort by level
    rootNodes.sort((a, b) => a.level - b.level);

    res.json({ 
      success: true, 
      data: {
        nodes: enrichedNodes,
        hierarchy: rootNodes,
        nodeMap
      }
    });
  } catch (error) {
    console.error('Get full organogram error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Node Details
const getNodeDetails = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { companyId } = req.user;

    // Get the specific node
    const nodeResult = await dynamoClient.send(new GetCommand({
      TableName: HRMS_ORGANIZATION_CHART_TABLE,
      Key: { nodeId }
    }));

    if (!nodeResult.Item || nodeResult.Item.recruiterId !== companyId) {
      return res.status(404).json({ success: false, message: 'Node not found' });
    }

    const node = nodeResult.Item;

    // Get employee details if assigned
    let employee = null;
    if (node.employeeId) {
      const empResult = await dynamoClient.send(new GetCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: node.employeeId }
      }));
      employee = empResult.Item || null;
    }

    // Get children nodes
    const childrenResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_ORGANIZATION_CHART_TABLE,
      FilterExpression: 'parentId = :pid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':pid': nodeId, ':rid': companyId }
    }));

    const children = childrenResult.Items || [];

    // Enrich children with employee data
    const enrichedChildren = [];
    for (const child of children) {
      let childEmployee = null;
      if (child.employeeId) {
        const childEmpResult = await dynamoClient.send(new GetCommand({
          TableName: HRMS_EMPLOYEES_TABLE,
          Key: { employeeId: child.employeeId }
        }));
        childEmployee = childEmpResult.Item || null;
      }
      enrichedChildren.push({ ...child, employee: childEmployee });
    }

    res.json({ 
      success: true, 
      data: {
        ...node,
        employee,
        children: enrichedChildren
      }
    });
  } catch (error) {
    console.error('Get node details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Grievances Assigned to Manager
const getAssignedGrievances = async (req, res) => {
  try {
    const { employeeId, companyId } = req.user;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-grievances',
      FilterExpression: 'recruiterId = :rid AND assignedTo = :eid',
      ExpressionAttributeValues: { ':rid': companyId, ':eid': employeeId }
    }));

    const grievances = (result.Items || []).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ success: true, data: grievances });
  } catch (error) {
    console.error('Get assigned grievances error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update Grievance Status (Manager Action)
const updateGrievanceStatus = async (req, res) => {
  try {
    const { grievanceId } = req.params;
    const { employeeId, companyId } = req.user;
    const { status, remark } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // Get existing grievance
    const getResult = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-grievances',
      FilterExpression: 'grievanceId = :gid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':gid': grievanceId, ':rid': companyId }
    }));

    if (!getResult.Items || getResult.Items.length === 0) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    const grievance = getResult.Items[0];

    // Verify the user is assigned to this grievance
    if (grievance.assignedTo !== employeeId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this grievance' });
    }

    const now = getCurrentTimestamp();
    const statusHistory = grievance.statusHistory || [];
    statusHistory.push({
      status,
      changedBy: employeeId,
      changedByName: req.user.name || '',
      timestamp: now,
      action: 'Status Updated',
      remark: remark || ''
    });

    const remarks = grievance.remarks || [];
    if (remark) {
      remarks.push({
        text: remark,
        addedBy: employeeId,
        addedByName: req.user.name || '',
        timestamp: now
      });
    }

    const updatedGrievance = {
      ...grievance,
      status,
      remarks,
      statusHistory,
      lastActionTime: now,
      escalationDeadline: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // Reset 2-minute timer
      resolvedDate: (status === 'Resolved' || status === 'Closed') ? now : grievance.resolvedDate,
      updatedAt: now
    };

    await dynamoClient.send(new PutCommand({
      TableName: 'staffinn-hrms-grievances',
      Item: updatedGrievance
    }));

    console.log(`✅ Grievance ${grievanceId} status updated to ${status} by ${req.user.name}`);

    // Emit real-time update to the employee who submitted the grievance
    try {
      const { emitGrievanceUpdate } = require('../../websocket/websocketServer');
      emitGrievanceUpdate(grievance.employeeId, updatedGrievance);
    } catch (wsError) {
      console.error('⚠️ WebSocket emission failed:', wsError.message);
    }

    res.json({ success: true, message: 'Grievance updated successfully', data: updatedGrievance });
  } catch (error) {
    console.error('Update grievance status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Escalate Grievance (Auto-escalation or Manual)
const escalateGrievance = async (grievanceId, companyId) => {
  try {
    console.log(`🔄 Escalating grievance ${grievanceId}`);

    // Get grievance
    const getResult = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-grievances',
      FilterExpression: 'grievanceId = :gid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':gid': grievanceId, ':rid': companyId }
    }));

    if (!getResult.Items || getResult.Items.length === 0) {
      console.log(`❌ Grievance ${grievanceId} not found`);
      return;
    }

    const grievance = getResult.Items[0];

    // Don't escalate if already resolved or closed
    if (grievance.status === 'Resolved' || grievance.status === 'Closed') {
      console.log(`⏭️ Grievance ${grievanceId} already ${grievance.status}, skipping escalation`);
      return;
    }

    // Get current assignee's node
    const currentAssignee = grievance.assignedTo;
    if (!currentAssignee) {
      console.log(`⚠️ No assignee for grievance ${grievanceId}, cannot escalate`);
      return;
    }

    const nodeResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_ORGANIZATION_CHART_TABLE,
      FilterExpression: 'recruiterId = :rid AND employeeId = :eid',
      ExpressionAttributeValues: { ':rid': companyId, ':eid': currentAssignee }
    }));

    if (!nodeResult.Items || nodeResult.Items.length === 0) {
      console.log(`⚠️ No org node found for assignee ${currentAssignee}`);
      return;
    }

    const currentNode = nodeResult.Items[0];

    // Get parent node (next level manager)
    if (!currentNode.parentId) {
      console.log(`⚠️ No parent node for ${currentAssignee}, reached top of hierarchy`);
      return;
    }

    const parentResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_ORGANIZATION_CHART_TABLE,
      FilterExpression: 'nodeId = :nid',
      ExpressionAttributeValues: { ':nid': currentNode.parentId }
    }));

    if (!parentResult.Items || parentResult.Items.length === 0) {
      console.log(`⚠️ Parent node ${currentNode.parentId} not found`);
      return;
    }

    const parentNode = parentResult.Items[0];
    const newAssignee = parentNode.employeeId;

    // Get new assignee's name
    let newAssigneeName = 'Manager';
    if (newAssignee) {
      const empResult = await dynamoClient.send(new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'employeeId = :eid',
        ExpressionAttributeValues: { ':eid': newAssignee }
      }));
      if (empResult.Items && empResult.Items.length > 0) {
        newAssigneeName = empResult.Items[0].fullName || empResult.Items[0].name || 'Manager';
      }
    }

    const now = getCurrentTimestamp();
    const statusHistory = grievance.statusHistory || [];
    statusHistory.push({
      status: grievance.status,
      changedBy: 'SYSTEM',
      changedByName: 'Auto-Escalation',
      timestamp: now,
      action: 'Escalated',
      assignedTo: newAssignee,
      assignedToName: newAssigneeName,
      remark: `Escalated due to no action within 2 minutes`
    });

    const updatedGrievance = {
      ...grievance,
      assignedTo: newAssignee,
      assignedToName: newAssigneeName,
      escalationLevel: (grievance.escalationLevel || 0) + 1,
      lastActionTime: now,
      escalationDeadline: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      statusHistory,
      updatedAt: now
    };

    await dynamoClient.send(new PutCommand({
      TableName: 'staffinn-hrms-grievances',
      Item: updatedGrievance
    }));

    console.log(`✅ Grievance ${grievanceId} escalated to ${newAssigneeName}`);

    // Emit real-time update to the employee who submitted the grievance
    try {
      const { emitGrievanceUpdate } = require('../../websocket/websocketServer');
      emitGrievanceUpdate(grievance.employeeId, updatedGrievance);
      // Also notify the new assignee
      emitGrievanceUpdate(newAssignee, updatedGrievance);
    } catch (wsError) {
      console.error('⚠️ WebSocket emission failed:', wsError.message);
    }
  } catch (error) {
    console.error(`❌ Error escalating grievance ${grievanceId}:`, error);
  }
};

// Check and Escalate Pending Grievances (Background Job)
const checkAndEscalateGrievances = async () => {
  try {
    console.log('🔍 Checking for grievances to escalate...');

    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-grievances'
    }));

    const grievances = result.Items || [];
    const now = new Date();

    for (const grievance of grievances) {
      // Skip if resolved or closed
      if (grievance.status === 'Resolved' || grievance.status === 'Closed') {
        continue;
      }

      // Check if escalation deadline has passed
      if (grievance.escalationDeadline) {
        const deadline = new Date(grievance.escalationDeadline);
        if (now > deadline) {
          console.log(`⏰ Grievance ${grievance.grievanceId} deadline passed, escalating...`);
          await escalateGrievance(grievance.grievanceId, grievance.recruiterId);
        }
      }
    }

    console.log('✅ Escalation check completed');
  } catch (error) {
    console.error('❌ Error checking grievances for escalation:', error);
  }
};

module.exports = {
  getDashboardStats,
  getMyAttendance,
  markAttendance,
  getMyLeaves,
  getLeaveBalance,
  applyLeave,
  cancelLeave,
  getMyPayslips,
  updateProfile,
  getMyClaims,
  getClaimCategories,
  submitClaim,
  getMyTasks,
  updateMyTask,
  getMyRatings,
  getMyGrievances,
  submitGrievance,
  getAssignedGrievances,
  updateGrievanceStatus,
  checkAndEscalateGrievances,
  getMyHierarchy,
  getFullOrganogram,
  getNodeDetails
};
