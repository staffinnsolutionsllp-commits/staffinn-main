const { dynamoClient, isUsingMockDB, mockDB } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

const HRMS_GRIEVANCES_TABLE = 'staffinn-hrms-grievances';

const createGrievance = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { employeeId, employeeName, category, subject, description, department, isConfidential, attachments } = req.body;

    if (!employeeId || !category || !subject || !description) {
      return res.status(400).json(errorResponse('Missing required fields'));
    }

    const grievanceId = generateId();
    const grievance = {
      grievanceId,
      recruiterId,
      employeeId,
      employeeName: employeeName || '',
      category,
      subject,
      description,
      department: department || '',
      isConfidential: isConfidential || false,
      status: 'Open',
      priority: 'Medium',
      attachments: attachments || [],
      remarks: [],
      statusHistory: [{
        status: 'Open',
        changedBy: req.user.userId,
        changedByName: req.user.name,
        timestamp: getCurrentTimestamp()
      }],
      submittedBy: req.user.userId,
      submittedByName: req.user.name,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_GRIEVANCES_TABLE, grievance);
    } else {
      const putCommand = new PutCommand({ TableName: HRMS_GRIEVANCES_TABLE, Item: grievance });
      await dynamoClient.send(putCommand);
    }

    res.status(201).json(successResponse(grievance, 'Grievance submitted successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getGrievances = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { employeeId, category, status, department, startDate, endDate } = req.query;

    let grievances;
    if (isUsingMockDB()) {
      grievances = mockDB().scan(HRMS_GRIEVANCES_TABLE).filter(g => g.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      grievances = result.Items || [];
    }

    if (employeeId) grievances = grievances.filter(g => g.employeeId === employeeId);
    if (category) grievances = grievances.filter(g => g.category === category);
    if (status) grievances = grievances.filter(g => g.status === status);
    if (department) grievances = grievances.filter(g => g.department === department);
    if (startDate) grievances = grievances.filter(g => new Date(g.createdAt) >= new Date(startDate));
    if (endDate) grievances = grievances.filter(g => new Date(g.createdAt) <= new Date(endDate));

    if (req.user.role === 'employee') {
      grievances = grievances.filter(g => g.employeeId === req.user.userId);
    }

    res.json(successResponse(grievances, 'Grievances retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getGrievanceById = async (req, res) => {
  try {
    const { grievanceId } = req.params;
    const recruiterId = req.user?.recruiterId || req.user?.userId;

    let grievance;
    if (isUsingMockDB()) {
      grievance = mockDB().get(HRMS_GRIEVANCES_TABLE, grievanceId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        FilterExpression: 'grievanceId = :grievanceId AND recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':grievanceId': grievanceId, ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      grievance = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!grievance) return res.status(404).json(errorResponse('Grievance not found'));

    if (req.user.role === 'employee' && grievance.employeeId !== req.user.userId) {
      return res.status(403).json(errorResponse('Access denied'));
    }

    res.json(successResponse(grievance, 'Grievance retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const updateGrievanceStatus = async (req, res) => {
  try {
    const { grievanceId } = req.params;
    const { status, priority, remark } = req.body;

    if (!status) return res.status(400).json(errorResponse('Status is required'));

    let grievance;
    if (isUsingMockDB()) {
      grievance = mockDB().get(HRMS_GRIEVANCES_TABLE, grievanceId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        FilterExpression: 'grievanceId = :grievanceId',
        ExpressionAttributeValues: { ':grievanceId': grievanceId }
      });
      const result = await dynamoClient.send(scanCommand);
      grievance = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!grievance) return res.status(404).json(errorResponse('Grievance not found'));

    const statusHistory = grievance.statusHistory || [];
    statusHistory.push({
      status,
      changedBy: req.user.userId,
      changedByName: req.user.name,
      timestamp: getCurrentTimestamp(),
      remark: remark || ''
    });

    const remarks = grievance.remarks || [];
    if (remark) {
      remarks.push({
        text: remark,
        addedBy: req.user.userId,
        addedByName: req.user.name,
        timestamp: getCurrentTimestamp()
      });
    }

    const updatedGrievance = {
      ...grievance,
      status,
      priority: priority || grievance.priority,
      remarks,
      statusHistory,
      updatedAt: getCurrentTimestamp(),
      resolvedAt: status === 'Resolved' || status === 'Closed' ? getCurrentTimestamp() : grievance.resolvedAt
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_GRIEVANCES_TABLE, updatedGrievance);
    } else {
      const putCommand = new PutCommand({ TableName: HRMS_GRIEVANCES_TABLE, Item: updatedGrievance });
      await dynamoClient.send(putCommand);
    }

    res.json(successResponse(updatedGrievance, 'Grievance updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const addRemark = async (req, res) => {
  try {
    const { grievanceId } = req.params;
    const { remark } = req.body;

    if (!remark) return res.status(400).json(errorResponse('Remark is required'));

    let grievance;
    if (isUsingMockDB()) {
      grievance = mockDB().get(HRMS_GRIEVANCES_TABLE, grievanceId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        FilterExpression: 'grievanceId = :grievanceId',
        ExpressionAttributeValues: { ':grievanceId': grievanceId }
      });
      const result = await dynamoClient.send(scanCommand);
      grievance = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!grievance) return res.status(404).json(errorResponse('Grievance not found'));

    const remarks = grievance.remarks || [];
    remarks.push({
      text: remark,
      addedBy: req.user.userId,
      addedByName: req.user.name,
      timestamp: getCurrentTimestamp()
    });

    const updatedGrievance = {
      ...grievance,
      remarks,
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_GRIEVANCES_TABLE, updatedGrievance);
    } else {
      const putCommand = new PutCommand({ TableName: HRMS_GRIEVANCES_TABLE, Item: updatedGrievance });
      await dynamoClient.send(putCommand);
    }

    res.json(successResponse(updatedGrievance, 'Remark added successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getGrievanceStats = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    let grievances;
    if (isUsingMockDB()) {
      grievances = mockDB().scan(HRMS_GRIEVANCES_TABLE).filter(g => g.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_GRIEVANCES_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      grievances = result.Items || [];
    }

    const stats = {
      total: grievances.length,
      open: grievances.filter(g => g.status === 'Open').length,
      inProgress: grievances.filter(g => g.status === 'In Progress').length,
      resolved: grievances.filter(g => g.status === 'Resolved').length,
      closed: grievances.filter(g => g.status === 'Closed').length,
      pending: grievances.filter(g => g.status === 'Open' || g.status === 'In Progress').length
    };

    const categoryBreakdown = {};
    grievances.forEach(g => {
      categoryBreakdown[g.category] = (categoryBreakdown[g.category] || 0) + 1;
    });

    const departmentBreakdown = {};
    grievances.forEach(g => {
      if (g.department) {
        departmentBreakdown[g.department] = (departmentBreakdown[g.department] || 0) + 1;
      }
    });

    res.json(successResponse({ stats, categoryBreakdown, departmentBreakdown }, 'Stats retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  createGrievance,
  getGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  addRemark,
  getGrievanceStats
};
