const { dynamoClient, isUsingMockDB, mockDB, HRMS_GRIEVANCES_TABLE, HRMS_GRIEVANCE_COMMENTS_TABLE, HRMS_EMPLOYEES_TABLE, HRMS_USERS_TABLE } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

const createGrievance = async (req, res) => {
  try {
    const { title, description, category, priority = 'medium' } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json(errorResponse('Title, description, and category are required'));
    }

    const grievanceId = generateId();
    const grievance = {
      grievanceId,
      employeeId: req.user.userId,
      title,
      description,
      category,
      priority,
      status: 'submitted',
      submittedDate: getCurrentTimestamp(),
      assignedTo: null,
      resolvedDate: null,
      createdAt: getCurrentTimestamp()
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

    res.status(201).json(successResponse(grievance, 'Grievance submitted successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getAllGrievances = async (req, res) => {
  try {
    const { status, priority, employeeId } = req.query;
    
    let grievances;
    if (isUsingMockDB()) {
      grievances = mockDB().scan(HRMS_GRIEVANCES_TABLE);
      
      // Apply filters
      if (status) grievances = grievances.filter(g => g.status === status);
      if (priority) grievances = grievances.filter(g => g.priority === priority);
      if (employeeId) grievances = grievances.filter(g => g.employeeId === employeeId);
    } else {
      // Add filters if provided
      const filterExpressions = [];
      const expressionAttributeValues = {};

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
    const { status, assignedTo } = req.body;

    if (!status) {
      return res.status(400).json(errorResponse('Status is required'));
    }

    const updates = { status };
    if (assignedTo) updates.assignedTo = assignedTo;
    if (status === 'resolved') updates.resolvedDate = getCurrentTimestamp();

    if (isUsingMockDB()) {
      const existingGrievance = mockDB().get(HRMS_GRIEVANCES_TABLE, id);
      if (!existingGrievance) {
        return res.status(404).json(errorResponse('Grievance not found'));
      }
      
      const updatedGrievance = { ...existingGrievance, ...updates };
      mockDB().put(HRMS_GRIEVANCES_TABLE, updatedGrievance);
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

module.exports = {
  createGrievance,
  getAllGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  addGrievanceComment,
  getMyGrievances
};