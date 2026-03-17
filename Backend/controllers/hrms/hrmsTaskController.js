const { dynamoClient, isUsingMockDB, mockDB } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

const HRMS_TASK_TABLE = 'HRMS-Task-Management';

const assignTask = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    console.log('=== ASSIGN TASK DEBUG ===');
    console.log('Recruiter ID:', recruiterId);
    console.log('Request body:', req.body);

    const { employeeIds, employeeEmails, title, description, priority, startDate, deadline, category, attachments } = req.body;

    const targetEmployees = [];
    if (employeeIds && Array.isArray(employeeIds)) {
      employeeIds.forEach(id => targetEmployees.push({ employeeId: id }));
    }
    if (employeeEmails && Array.isArray(employeeEmails)) {
      employeeEmails.forEach(email => targetEmployees.push({ employeeEmail: email }));
    }

    console.log('Target employees:', targetEmployees);

    if (targetEmployees.length === 0 || !title || !deadline) {
      return res.status(400).json(errorResponse('Missing required fields'));
    }

    const tasks = [];
    for (const target of targetEmployees) {
      const taskId = generateId();
      const task = {
        taskId,
        recruiterId,
        employeeId: target.employeeId || '',
        employeeEmail: target.employeeEmail || '',
        title,
        description: description || '',
        priority: priority || 'Medium',
        status: 'Pending',
        startDate: startDate || getCurrentTimestamp(),
        deadline,
        category: category || 'General',
        attachments: attachments || [],
        completionPercentage: 0,
        assignedBy: req.user.userId,
        assignedByName: req.user.name,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      };

      console.log('Creating task:', { taskId, employeeId: task.employeeId, employeeEmail: task.employeeEmail, title: task.title });

      if (isUsingMockDB()) {
        mockDB().put(HRMS_TASK_TABLE, task);
      } else {
        const putCommand = new PutCommand({ TableName: HRMS_TASK_TABLE, Item: task });
        await dynamoClient.send(putCommand);
      }
      tasks.push(task);
    }

    console.log(`✅ Successfully assigned ${tasks.length} task(s)`);
    res.status(201).json(successResponse(tasks, 'Task(s) assigned successfully'));
  } catch (error) {
    console.error('❌ Assign task error:', error);
    handleError(error, res);
  }
};

const getTasks = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { employeeId, status, priority, category } = req.query;

    let tasks;
    if (isUsingMockDB()) {
      tasks = mockDB().scan(HRMS_TASK_TABLE).filter(t => t.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_TASK_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      tasks = result.Items || [];
    }

    if (employeeId) tasks = tasks.filter(t => t.employeeId === employeeId);
    if (status) tasks = tasks.filter(t => t.status === status);
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    if (category) tasks = tasks.filter(t => t.category === category);

    res.json(successResponse(tasks, 'Tasks retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const recruiterId = req.user?.recruiterId || req.user?.userId;

    let task;
    if (isUsingMockDB()) {
      task = mockDB().get(HRMS_TASK_TABLE, taskId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_TASK_TABLE,
        FilterExpression: 'taskId = :taskId AND recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':taskId': taskId, ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      task = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!task) return res.status(404).json(errorResponse('Task not found'));

    res.json(successResponse(task, 'Task retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, completionPercentage, remarks } = req.body;

    let task;
    if (isUsingMockDB()) {
      task = mockDB().get(HRMS_TASK_TABLE, taskId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_TASK_TABLE,
        FilterExpression: 'taskId = :taskId',
        ExpressionAttributeValues: { ':taskId': taskId }
      });
      const result = await dynamoClient.send(scanCommand);
      task = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!task) return res.status(404).json(errorResponse('Task not found'));

    const updatedTask = {
      ...task,
      status: status || task.status,
      completionPercentage: completionPercentage !== undefined ? completionPercentage : task.completionPercentage,
      remarks: remarks || task.remarks,
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_TASK_TABLE, updatedTask);
    } else {
      const putCommand = new PutCommand({ TableName: HRMS_TASK_TABLE, Item: updatedTask });
      await dynamoClient.send(putCommand);
    }

    res.json(successResponse(updatedTask, 'Task updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getTaskStats = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    let tasks;
    if (isUsingMockDB()) {
      tasks = mockDB().scan(HRMS_TASK_TABLE).filter(t => t.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_TASK_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      tasks = result.Items || [];
    }

    const now = new Date();
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'Pending').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      overdue: tasks.filter(t => new Date(t.deadline) < now && t.status !== 'Completed').length
    };

    res.json(successResponse(stats, 'Task stats retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getPerformanceChart = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { startDate, endDate, employeeId } = req.query;

    let tasks;
    if (isUsingMockDB()) {
      tasks = mockDB().scan(HRMS_TASK_TABLE).filter(t => t.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_TASK_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      tasks = result.Items || [];
    }

    if (employeeId) tasks = tasks.filter(t => t.employeeId === employeeId);
    if (startDate) tasks = tasks.filter(t => new Date(t.createdAt) >= new Date(startDate));
    if (endDate) tasks = tasks.filter(t => new Date(t.createdAt) <= new Date(endDate));

    const employeePerformance = {};
    tasks.forEach(task => {
      if (!employeePerformance[task.employeeId]) {
        employeePerformance[task.employeeId] = {
          employeeId: task.employeeId,
          totalTasks: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
          completionRate: 0
        };
      }
      employeePerformance[task.employeeId].totalTasks++;
      if (task.status === 'Completed') employeePerformance[task.employeeId].completed++;
      if (task.status === 'Pending') employeePerformance[task.employeeId].pending++;
      if (new Date(task.deadline) < new Date() && task.status !== 'Completed') {
        employeePerformance[task.employeeId].overdue++;
      }
    });

    Object.values(employeePerformance).forEach(emp => {
      emp.completionRate = emp.totalTasks > 0 ? ((emp.completed / emp.totalTasks) * 100).toFixed(2) : 0;
    });

    res.json(successResponse(Object.values(employeePerformance), 'Performance data retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const addRating = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { employeeId, cycle, year, workQuality, taskCompletion, discipline, teamCollaboration, overallPerformance, remarks } = req.body;

    if (!employeeId || !cycle || !year) {
      return res.status(400).json(errorResponse('Missing required fields'));
    }

    const ratingId = generateId();
    const rating = {
      taskId: ratingId,
      ratingId,
      recruiterId,
      employeeId,
      cycle,
      year,
      workQuality: workQuality || 0,
      taskCompletion: taskCompletion || 0,
      discipline: discipline || 0,
      teamCollaboration: teamCollaboration || 0,
      overallPerformance: overallPerformance || 0,
      remarks: remarks || '',
      ratedBy: req.user.userId,
      ratedByName: req.user.name,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      type: 'RATING'
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_TASK_TABLE, rating);
    } else {
      const putCommand = new PutCommand({ TableName: HRMS_TASK_TABLE, Item: rating });
      await dynamoClient.send(putCommand);
    }

    res.status(201).json(successResponse(rating, 'Rating added successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getRatings = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { employeeId, year } = req.query;

    let ratings;
    if (isUsingMockDB()) {
      ratings = mockDB().scan(HRMS_TASK_TABLE).filter(r => r.recruiterId === recruiterId && r.type === 'RATING');
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_TASK_TABLE,
        FilterExpression: 'recruiterId = :recruiterId AND #type = :type',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { ':recruiterId': recruiterId, ':type': 'RATING' }
      });
      const result = await dynamoClient.send(scanCommand);
      ratings = result.Items || [];
    }

    if (employeeId) ratings = ratings.filter(r => r.employeeId === employeeId);
    if (year) ratings = ratings.filter(r => r.year === parseInt(year));

    res.json(successResponse(ratings, 'Ratings retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  assignTask,
  getTasks,
  getTaskById,
  updateTaskStatus,
  getTaskStats,
  getPerformanceChart,
  addRating,
  getRatings
};
