const { dynamoClient, isUsingMockDB, mockDB, HRMS_GRIEVANCES_TABLE, HRMS_GRIEVANCE_COMMENTS_TABLE, HRMS_EMPLOYEES_TABLE, HRMS_USERS_TABLE, HRMS_ORGANIZATION_CHART_TABLE } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

const createGrievance = async (req, res) => {
  try {
    const { title, description, category, priority = 'medium', assignedTo, complaintAgainstEmployeeId } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json(errorResponse('Title, description, and category are required'));
    }

    let assignedManager = null;
    let complaintAgainstEmployee = null;
    let assignedManagerNode = null;

    // New flow: If complaint is against an employee, assign to their manager
    if (complaintAgainstEmployeeId) {
      console.log('🚨 Complaint against employee:', complaintAgainstEmployeeId);
      
      // Get the employee being complained against
      if (isUsingMockDB()) {
        complaintAgainstEmployee = mockDB().get(HRMS_EMPLOYEES_TABLE, complaintAgainstEmployeeId);
      } else {
        const getCommand = new GetCommand({
          TableName: HRMS_EMPLOYEES_TABLE,
          Key: { employeeId: complaintAgainstEmployeeId }
        });
        const result = await dynamoClient.send(getCommand);
        complaintAgainstEmployee = result.Item;
      }

      if (!complaintAgainstEmployee) {
        return res.status(400).json(errorResponse('Employee not found'));
      }

      console.log('👤 Complaint against:', complaintAgainstEmployee.fullName);

      // Get their node from organogram
      let targetEmployeeNode;
      if (isUsingMockDB()) {
        const allNodes = mockDB().scan(HRMS_ORGANIZATION_CHART_TABLE);
        targetEmployeeNode = allNodes.find(n => n.employeeId === complaintAgainstEmployeeId);
      } else {
        const nodeResult = await dynamoClient.send(new ScanCommand({
          TableName: HRMS_ORGANIZATION_CHART_TABLE,
          FilterExpression: 'employeeId = :eid',
          ExpressionAttributeValues: { ':eid': complaintAgainstEmployeeId }
        }));
        targetEmployeeNode = nodeResult.Items && nodeResult.Items.length > 0 ? nodeResult.Items[0] : null;
      }

      if (!targetEmployeeNode) {
        return res.status(400).json(errorResponse('Employee not found in organization hierarchy'));
      }

      console.log('📋 Target employee node:', targetEmployeeNode.nodeId);

      // Get their manager (parent node)
      if (!targetEmployeeNode.parentId) {
        return res.status(400).json(errorResponse('Selected employee does not have a manager in the organization hierarchy'));
      }

      console.log('🔍 Looking for manager with nodeId:', targetEmployeeNode.parentId);
      
      if (isUsingMockDB()) {
        assignedManagerNode = mockDB().get(HRMS_ORGANIZATION_CHART_TABLE, targetEmployeeNode.parentId);
      } else {
        const parentResult = await dynamoClient.send(new GetCommand({
          TableName: HRMS_ORGANIZATION_CHART_TABLE,
          Key: { nodeId: targetEmployeeNode.parentId }
        }));
        assignedManagerNode = parentResult.Item;
      }

      if (!assignedManagerNode || !assignedManagerNode.employeeId) {
        return res.status(400).json(errorResponse('Manager not found in organization hierarchy'));
      }

      console.log('✅ Manager node found:', assignedManagerNode.nodeId, 'employeeId:', assignedManagerNode.employeeId);
      
      // Get manager employee details
      if (isUsingMockDB()) {
        assignedManager = mockDB().get(HRMS_EMPLOYEES_TABLE, assignedManagerNode.employeeId);
      } else {
        const getCommand = new GetCommand({
          TableName: HRMS_EMPLOYEES_TABLE,
          Key: { employeeId: assignedManagerNode.employeeId }
        });
        const result = await dynamoClient.send(getCommand);
        assignedManager = result.Item;
      }

      if (!assignedManager) {
        return res.status(400).json(errorResponse('Manager employee record not found'));
      }

      console.log('✅ Assigning complaint to manager:', assignedManager.fullName);
    }
    // Old flow: Direct manager assignment
    else if (assignedTo) {
      console.log('📝 General grievance, assigning to:', assignedTo);
      
      if (isUsingMockDB()) {
        assignedManager = mockDB().get(HRMS_EMPLOYEES_TABLE, assignedTo);
      } else {
        const getCommand = new GetCommand({
          TableName: HRMS_EMPLOYEES_TABLE,
          Key: { employeeId: assignedTo }
        });
        const result = await dynamoClient.send(getCommand);
        assignedManager = result.Item;
      }

      if (!assignedManager) {
        return res.status(400).json(errorResponse('Assigned manager not found'));
      }
    } else {
      return res.status(400).json(errorResponse('Either assignedTo or complaintAgainstEmployeeId is required'));
    }

    const grievanceId = generateId();
    const timestamp = getCurrentTimestamp();
    
    const grievance = {
      grievanceId,
      recruiterId: req.user.recruiterId || req.user.companyId,
      employeeId: req.user.userId || req.user.employeeId,
      employeeEmail: req.user.email,
      employeeName: req.user.name || '',
      title,
      description,
      category,
      priority,
      status: 'submitted',
      submittedDate: timestamp,
      complaintAgainstEmployeeId: complaintAgainstEmployeeId || null,
      complaintAgainstEmployeeName: complaintAgainstEmployee ? complaintAgainstEmployee.fullName : null,
      complaintAgainstEmployeeEmail: complaintAgainstEmployee ? complaintAgainstEmployee.email : null,
      assignedTo: assignedManager ? assignedManager.employeeId : (assignedTo || null),
      assignedToName: assignedManager ? assignedManager.fullName : null,
      assignedToEmail: assignedManager ? assignedManager.email : null,
      escalationLevel: 0,
      escalationHistory: [],
      lastEscalatedAt: null,
      statusHistory: [{
        status: 'submitted',
        timestamp,
        changedBy: req.user.userId,
        changedByName: req.user.name,
        action: complaintAgainstEmployee 
          ? `Grievance submitted against ${complaintAgainstEmployee.fullName}, assigned to their manager ${assignedManager.fullName}`
          : 'Grievance submitted',
        assignedToName: assignedManager ? assignedManager.fullName : null
      }],
      resolvedDate: null,
      createdAt: timestamp
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_GRIEVANCES_TABLE, grievance);
    } else {
      const command = new PutCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        Item: grievance
      });
      await dynamoClient.send(command);
    }

    // Emit WebSocket event for real-time update
    if (global.io && assignedManager) {
      global.io.to(`employee-${assignedManager.employeeId}`).emit('grievance-assigned', {
        grievanceId,
        title,
        priority,
        employeeName: req.user.name,
        complaintAgainst: complaintAgainstEmployee ? complaintAgainstEmployee.fullName : null
      });
    }

    res.status(201).json(successResponse(grievance, 'Grievance submitted successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getAllGrievances = async (req, res) => {
  try {
    const { status, priority, employeeId } = req.query;
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    
    let grievances;
    if (isUsingMockDB()) {
      grievances = mockDB().scan(HRMS_GRIEVANCES_TABLE);
      
      // Filter by recruiterId for data isolation
      if (recruiterId) {
        grievances = grievances.filter(g => g.recruiterId === recruiterId);
      }
      
      // Apply filters
      if (status) grievances = grievances.filter(g => g.status === status);
      if (priority) grievances = grievances.filter(g => g.priority === priority);
      if (employeeId) grievances = grievances.filter(g => g.employeeId === employeeId);
    } else {
      // Add filters if provided
      const filterExpressions = [];
      const expressionAttributeValues = {};

      if (recruiterId) {
        filterExpressions.push('recruiterId = :recruiterId');
        expressionAttributeValues[':recruiterId'] = recruiterId;
      }

      if (status) {
        filterExpressions.push('status = :status');
        expressionAttributeValues[':status'] = status;
      }

      if (priority) {
        filterExpressions.push('priority = :priority');
        expressionAttributeValues[':priority'] = priority;
      }

      if (employeeId) {
        filterExpressions.push('employeeId = :employeeId');
        expressionAttributeValues[':employeeId'] = employeeId;
      }

      const scanParams = {
        TableName: HRMS_GRIEVANCES_TABLE
      };

      if (filterExpressions.length > 0) {
        scanParams.FilterExpression = filterExpressions.join(' AND ');
        scanParams.ExpressionAttributeValues = expressionAttributeValues;
      }

      const command = new ScanCommand(scanParams);
      const result = await dynamoClient.send(command);
      grievances = result.Items || [];
    }

    // Get employee details for each grievance
    const employeeIds = [...new Set(grievances.map(g => g.employeeId))];
    const employees = {};

    for (const empId of employeeIds) {
      try {
        let employee;
        if (isUsingMockDB()) {
          employee = mockDB().get(HRMS_EMPLOYEES_TABLE, empId);
          if (!employee) {
            // Try users table
            employee = mockDB().get(HRMS_USERS_TABLE, empId);
            if (employee) {
              employee = { name: employee.name, email: employee.email };
            }
          }
        } else {
          const getCommand = new GetCommand({
            TableName: HRMS_EMPLOYEES_TABLE,
            Key: { employeeId: empId }
          });
          const empResult = await dynamoClient.send(getCommand);
          
          if (empResult.Item) {
            employee = empResult.Item;
          } else {
            // Try users table
            const getUserCommand = new GetCommand({
              TableName: HRMS_USERS_TABLE,
              Key: { userId: empId }
            });
            const userResult = await dynamoClient.send(getUserCommand);
            
            if (userResult.Item) {
              employee = { name: userResult.Item.name, email: userResult.Item.email };
            }
          }
        }
        
        if (employee) {
          employees[empId] = employee;
        }
      } catch (err) {
        console.error('Error fetching employee details:', err);
      }
    }

    const enrichedGrievances = grievances.map(grievance => ({
      ...grievance,
      employee: employees[grievance.employeeId] || null
    }));

    res.json(successResponse(enrichedGrievances, 'Grievances retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getGrievanceById = async (req, res) => {
  try {
    const { id } = req.params;

    let grievance;
    if (isUsingMockDB()) {
      grievance = mockDB().get(HRMS_GRIEVANCES_TABLE, id);
      if (!grievance) {
        return res.status(404).json(errorResponse('Grievance not found'));
      }
      
      // Get comments for this grievance
      const allComments = mockDB().scan(HRMS_GRIEVANCE_COMMENTS_TABLE);
      const comments = allComments.filter(c => c.grievanceId === id)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      grievance.comments = comments;
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        Key: { grievanceId: id }
      });
      const result = await dynamoClient.send(getCommand);

      if (!result.Item) {
        return res.status(404).json(errorResponse('Grievance not found'));
      }

      grievance = result.Item;

      // Get comments for this grievance
      const scanCommand = new ScanCommand({
        TableName: HRMS_GRIEVANCE_COMMENTS_TABLE,
        FilterExpression: 'grievanceId = :grievanceId',
        ExpressionAttributeValues: {
          ':grievanceId': id
        }
      });
      const commentsResult = await dynamoClient.send(scanCommand);

      grievance.comments = (commentsResult.Items || [])
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    res.json(successResponse(grievance, 'Grievance retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const updateGrievanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, remark } = req.body;

    if (!status) {
      return res.status(400).json(errorResponse('Status is required'));
    }

    // Get existing grievance
    let existingGrievance;
    if (isUsingMockDB()) {
      existingGrievance = mockDB().get(HRMS_GRIEVANCES_TABLE, id);
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        Key: { grievanceId: id }
      });
      const result = await dynamoClient.send(getCommand);
      existingGrievance = result.Item;
    }

    if (!existingGrievance) {
      return res.status(404).json(errorResponse('Grievance not found'));
    }

    const timestamp = getCurrentTimestamp();
    const updates = { status };
    
    if (assignedTo) updates.assignedTo = assignedTo;
    if (status === 'resolved' || status === 'Resolved') {
      updates.resolvedDate = timestamp;
    }

    // Add to status history
    const statusHistory = existingGrievance.statusHistory || [];
    statusHistory.push({
      status,
      timestamp,
      changedBy: req.user.userId,
      changedByName: req.user.name,
      action: `Status changed to ${status}`,
      remark: remark || null
    });
    updates.statusHistory = statusHistory;

    if (isUsingMockDB()) {
      const updatedGrievance = { ...existingGrievance, ...updates };
      mockDB().put(HRMS_GRIEVANCES_TABLE, updatedGrievance);
      
      // Emit WebSocket event
      if (global.io) {
        global.io.to(`employee-${existingGrievance.employeeId}`).emit('grievance-status-update', {
          grievanceId: id,
          status,
          updatedBy: req.user.name
        });
      }
      
      res.json(successResponse(updatedGrievance, 'Grievance status updated successfully'));
    } else {
      const updateExpressions = [];
      const expressionAttributeValues = {};

      Object.keys(updates).forEach((key, index) => {
        updateExpressions.push(`${key} = :val${index}`);
        expressionAttributeValues[`:val${index}`] = updates[key];
      });

      const updateCommand = new UpdateCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        Key: { grievanceId: id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const result = await dynamoClient.send(updateCommand);
      
      // Emit WebSocket event
      if (global.io) {
        global.io.to(`employee-${existingGrievance.employeeId}`).emit('grievance-status-update', {
          grievanceId: id,
          status,
          updatedBy: req.user.name
        });
      }
      
      res.json(successResponse(result.Attributes, 'Grievance status updated successfully'));
    }

  } catch (error) {
    handleError(error, res);
  }
};

const addGrievanceComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isInternal = false } = req.body;

    if (!comment) {
      return res.status(400).json(errorResponse('Comment is required'));
    }

    // Check if grievance exists
    let grievance;
    if (isUsingMockDB()) {
      grievance = mockDB().get(HRMS_GRIEVANCES_TABLE, id);
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        Key: { grievanceId: id }
      });
      const result = await dynamoClient.send(getCommand);
      grievance = result.Item;
    }

    if (!grievance) {
      return res.status(404).json(errorResponse('Grievance not found'));
    }

    const commentId = generateId();
    const grievanceComment = {
      commentId,
      grievanceId: id,
      userId: req.user.userId,
      userName: req.user.name,
      comment,
      isInternal,
      timestamp: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_GRIEVANCE_COMMENTS_TABLE, grievanceComment);
    } else {
      const command = new PutCommand({
        TableName: HRMS_GRIEVANCE_COMMENTS_TABLE,
        Item: grievanceComment
      });
      await dynamoClient.send(command);
    }

    res.status(201).json(successResponse(grievanceComment, 'Comment added successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getMyGrievances = async (req, res) => {
  try {
    let grievances;
    if (isUsingMockDB()) {
      const allGrievances = mockDB().scan(HRMS_GRIEVANCES_TABLE);
      grievances = allGrievances.filter(g => g.employeeId === req.user.userId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        FilterExpression: 'employeeId = :employeeId',
        ExpressionAttributeValues: {
          ':employeeId': req.user.userId
        }
      });
      const result = await dynamoClient.send(scanCommand);
      grievances = result.Items || [];
    }

    res.json(successResponse(grievances, 'My grievances retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getAssignedGrievances = async (req, res) => {
  try {
    const managerId = req.user.userId || req.user.employeeId;
    
    let grievances;
    if (isUsingMockDB()) {
      const allGrievances = mockDB().scan(HRMS_GRIEVANCES_TABLE);
      grievances = allGrievances.filter(g => g.assignedTo === managerId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        FilterExpression: 'assignedTo = :managerId',
        ExpressionAttributeValues: {
          ':managerId': managerId
        }
      });
      const result = await dynamoClient.send(scanCommand);
      grievances = result.Items || [];
    }

    res.json(successResponse(grievances, 'Assigned grievances retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getReportingManagers = async (req, res) => {
  try {
    const employeeId = req.user.userId || req.user.employeeId;
    const recruiterId = req.user.companyId || req.user.recruiterId;
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 getReportingManagers called');
    console.log('👤 User info:', JSON.stringify({
      employeeId,
      recruiterId,
      userId: req.user.userId,
      userEmployeeId: req.user.employeeId,
      companyId: req.user.companyId,
      userRecruiterId: req.user.recruiterId,
      fullUser: req.user
    }, null, 2));
    
    const managers = {
      immediateManager: null,
      nextLevelManager: null
    };

    // Get all organization nodes to debug
    let allNodes;
    if (isUsingMockDB()) {
      allNodes = mockDB().scan(HRMS_ORGANIZATION_CHART_TABLE);
    } else {
      const allNodesResult = await dynamoClient.send(new ScanCommand({
        TableName: HRMS_ORGANIZATION_CHART_TABLE
      }));
      allNodes = allNodesResult.Items || [];
    }
    
    console.log('📊 Total nodes in organogram:', allNodes.length);
    if (allNodes.length > 0) {
      console.log('📋 Sample nodes:', allNodes.slice(0, 3).map(n => ({
        nodeId: n.nodeId,
        employeeId: n.employeeId,
        parentId: n.parentId,
        position: n.position
      })));
    }

    // Get employee's node from organogram
    let currentNode;
    if (isUsingMockDB()) {
      console.log('🔍 Looking for employeeId:', employeeId);
      currentNode = allNodes.find(n => n.employeeId === employeeId);
    } else {
      const nodeResult = await dynamoClient.send(new ScanCommand({
        TableName: HRMS_ORGANIZATION_CHART_TABLE,
        FilterExpression: 'employeeId = :eid',
        ExpressionAttributeValues: { ':eid': employeeId }
      }));
      currentNode = nodeResult.Items && nodeResult.Items.length > 0 ? nodeResult.Items[0] : null;
    }

    console.log('📋 Current node found:', currentNode ? `Yes (nodeId: ${currentNode.nodeId}, parentId: ${currentNode.parentId})` : 'No');

    if (!currentNode) {
      console.log('⚠️ Employee not found in organogram');
      console.log('💡 TIP: Run "node add-employees-to-org-chart.js" to add employees');
      console.log('='.repeat(60) + '\n');
      return res.json(successResponse(managers, 'Employee not found in organization hierarchy'));
    }

    // Get immediate manager (parent node)
    if (currentNode.parentId) {
      console.log('🔍 Looking for immediate manager with parentId:', currentNode.parentId);
      
      let parentNode;
      if (isUsingMockDB()) {
        parentNode = mockDB().get(HRMS_ORGANIZATION_CHART_TABLE, currentNode.parentId);
      } else {
        const parentResult = await dynamoClient.send(new ScanCommand({
          TableName: HRMS_ORGANIZATION_CHART_TABLE,
          FilterExpression: 'nodeId = :nid',
          ExpressionAttributeValues: { ':nid': currentNode.parentId }
        }));
        parentNode = parentResult.Items && parentResult.Items.length > 0 ? parentResult.Items[0] : null;
      }

      if (parentNode && parentNode.employeeId) {
        console.log('✅ Parent node found:', parentNode.nodeId, 'employeeId:', parentNode.employeeId);
        
        // Get manager employee details
        let managerEmployee;
        if (isUsingMockDB()) {
          managerEmployee = mockDB().get(HRMS_EMPLOYEES_TABLE, parentNode.employeeId);
        } else {
          const empResult = await dynamoClient.send(new GetCommand({
            TableName: HRMS_EMPLOYEES_TABLE,
            Key: { employeeId: parentNode.employeeId }
          }));
          managerEmployee = empResult.Item;
        }

        if (managerEmployee && (!managerEmployee.isDeleted || managerEmployee.isDeleted === false)) {
          managers.immediateManager = {
            employeeId: managerEmployee.employeeId,
            fullName: managerEmployee.fullName || managerEmployee.name,
            email: managerEmployee.email,
            designation: managerEmployee.designation
          };
          console.log('✅ Immediate manager:', managers.immediateManager.fullName);

          // Get next level manager (parent's parent)
          if (parentNode.parentId) {
            console.log('🔍 Looking for next level manager with parentId:', parentNode.parentId);
            
            let grandParentNode;
            if (isUsingMockDB()) {
              grandParentNode = mockDB().get(HRMS_ORGANIZATION_CHART_TABLE, parentNode.parentId);
            } else {
              const grandParentResult = await dynamoClient.send(new ScanCommand({
                TableName: HRMS_ORGANIZATION_CHART_TABLE,
                FilterExpression: 'nodeId = :nid',
                ExpressionAttributeValues: { ':nid': parentNode.parentId }
              }));
              grandParentNode = grandParentResult.Items && grandParentResult.Items.length > 0 ? grandParentResult.Items[0] : null;
            }

            if (grandParentNode && grandParentNode.employeeId) {
              let grandParentEmployee;
              if (isUsingMockDB()) {
                grandParentEmployee = mockDB().get(HRMS_EMPLOYEES_TABLE, grandParentNode.employeeId);
              } else {
                const empResult = await dynamoClient.send(new GetCommand({
                  TableName: HRMS_EMPLOYEES_TABLE,
                  Key: { employeeId: grandParentNode.employeeId }
                }));
                grandParentEmployee = empResult.Item;
              }

              if (grandParentEmployee && (!grandParentEmployee.isDeleted || grandParentEmployee.isDeleted === false)) {
                managers.nextLevelManager = {
                  employeeId: grandParentEmployee.employeeId,
                  fullName: grandParentEmployee.fullName || grandParentEmployee.name,
                  email: grandParentEmployee.email,
                  designation: grandParentEmployee.designation
                };
                console.log('✅ Next level manager:', managers.nextLevelManager.fullName);
              }
            }
          }
        }
      } else {
        console.log('⚠️ Parent node not found or has no employeeId');
      }
    } else {
      console.log('⚠️ Current node has no parentId (top of hierarchy)');
    }

    console.log('📤 Returning managers:', managers);
    console.log('='.repeat(60) + '\n');
    res.json(successResponse(managers, 'Reporting managers retrieved successfully'));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Error in getReportingManagers:', error);
    console.error('='.repeat(60) + '\n');
    handleError(error, res);
  }
};

const getOrganizationEmployees = async (req, res) => {
  try {
    const recruiterId = req.user?.companyId || req.user?.recruiterId;
    const currentEmployeeId = req.user?.employeeId || req.user?.userId;
    
    console.log('🔍 getOrganizationEmployees called');
    console.log('👤 Current user:', { recruiterId, currentEmployeeId, fullUser: req.user });
    
    if (!recruiterId) {
      console.error('❌ Recruiter ID not found');
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    let employees;
    if (isUsingMockDB()) {
      const allEmployees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      console.log('📊 Total employees in DB:', allEmployees.length);
      console.log('📋 Sample employee:', allEmployees[0]);
      employees = allEmployees.filter(e => 
        e.recruiterId === recruiterId && 
        (!e.isDeleted || e.isDeleted === false) &&
        e.employeeId !== currentEmployeeId // Exclude current user
      );
      console.log('✅ Filtered employees:', employees.length);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'recruiterId = :recruiterId AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
        ExpressionAttributeValues: {
          ':recruiterId': recruiterId,
          ':false': false
        }
      });
      const result = await dynamoClient.send(scanCommand);
      const allEmployees = result.Items || [];
      console.log('📊 Total employees from DynamoDB:', allEmployees.length);
      if (allEmployees.length > 0) {
        console.log('📋 Sample employee:', allEmployees[0]);
      }
      employees = allEmployees.filter(e => e.employeeId !== currentEmployeeId);
      console.log('✅ Filtered employees:', employees.length);
    }

    // Return only necessary fields
    const employeeList = employees.map(emp => ({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      email: emp.email,
      designation: emp.designation,
      department: emp.department
    }));

    console.log('📤 Returning employee list:', employeeList.length, 'employees');
    if (employeeList.length > 0) {
      console.log('📋 Sample returned employee:', employeeList[0]);
    }
    res.json(successResponse(employeeList, 'Organization employees retrieved successfully'));

  } catch (error) {
    console.error('❌ Error in getOrganizationEmployees:', error);
    handleError(error, res);
  }
};

module.exports = {
  createGrievance,
  getAllGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  addGrievanceComment,
  getMyGrievances,
  getAssignedGrievances,
  getReportingManagers,
  getOrganizationEmployees
};