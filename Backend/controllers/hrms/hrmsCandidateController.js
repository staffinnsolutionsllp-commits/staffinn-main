const { dynamoClient, isUsingMockDB, mockDB, HRMS_EMPLOYEES_TABLE, HRMS_LEAVES_TABLE } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, validateEmail, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

const createCandidate = async (req, res) => {
  try {
    console.log('=== DEBUGGING CANDIDATE CREATION ===');
    console.log('Request body received:', JSON.stringify(req.body, null, 2));
    console.log('Request body keys:', Object.keys(req.body));
    
    // Get recruiterId from authenticated user (from JWT token)
    const recruiterId = req.user?.recruiterId;
    
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found in authentication token'));
    }

    console.log('Creating candidate for recruiterId:', recruiterId);

    // Extract data with flexible field mapping
    const {
      fullName, name, // Try both field names
      email,
      designation, position, // Try both field names
      department,
      annualCTC, salary, // Try both field names
      basicPay,
      dateOfJoining, joinDate, // Try both field names
      dateOfBirth,
      bloodGroup,
      currentAddress,
      aadhaarNumber,
      bankName,
      accountNumber,
      employmentType,
      emergencyContactName,
      emergencyContactNumber,
      emergencyContactRelation,
      phone,
      ...otherFields
    } = req.body;

    // Use flexible field mapping
    const employeeName = fullName || name;
    const employeeDesignation = designation || position;
    const employeeSalary = annualCTC || salary;
    const employeeJoinDate = dateOfJoining || joinDate;

    console.log('Mapped values:');
    console.log('- Name:', employeeName);
    console.log('- Email:', email);
    console.log('- Designation:', employeeDesignation);
    console.log('- Department:', department);

    if (!employeeName || !email || !employeeDesignation) {
      console.log('Missing required fields:');
      console.log('- fullName/name:', employeeName);
      console.log('- email:', email);
      console.log('- designation/position:', employeeDesignation);
      return res.status(400).json(errorResponse('Name, email, and designation are required'));
    }

    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format'));
    }

    const employeeId = generateId();
    const employee = {
      employeeId,
      recruiterId,
      fullName: employeeName,
      email,
      designation: employeeDesignation,
      department: department || 'General',
      annualCTC: parseFloat(employeeSalary) || 0,
      basicPay: parseFloat(basicPay) || 0,
      dateOfJoining: employeeJoinDate || getCurrentTimestamp().split('T')[0],
      dateOfBirth: dateOfBirth || '',
      bloodGroup: bloodGroup || '',
      currentAddress: currentAddress || '',
      aadhaarNumber: aadhaarNumber || '',
      bankName: bankName || '',
      accountNumber: accountNumber || '',
      employmentType: employmentType || 'Full-time',
      emergencyContactName: emergencyContactName || '',
      emergencyContactNumber: emergencyContactNumber || phone || '',
      emergencyContactRelation: emergencyContactRelation || '',
      createdAt: getCurrentTimestamp(),
      createdBy: req.user ? req.user.userId : 'system',
      ...otherFields
    };

    console.log('Final employee object:', JSON.stringify(employee, null, 2));
    
    if (isUsingMockDB()) {
      mockDB().put(HRMS_EMPLOYEES_TABLE, employee);
    } else {
      const command = new PutCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Item: employee
      });
      await dynamoClient.send(command);
    }

    console.log('Employee created successfully');
    console.log('🔄 Starting leave allocation for employee:', employee.employeeId, employee.fullName);
    
    // Auto-allocate leave balances for new employee
    await allocateLeaveBalancesToEmployee(employee);
    
    console.log('✅ Leave allocation completed for:', employee.fullName);
    res.status(201).json(successResponse(employee, 'Employee onboarded successfully'));

  } catch (error) {
    console.error('Create candidate error:', error);
    handleError(error, res);
  }
};

// Helper function to allocate leave balances to new employee
const allocateLeaveBalancesToEmployee = async (employee) => {
  try {
    console.log('=== LEAVE ALLOCATION START ===');
    console.log('Allocating leave balances for employee:', employee.employeeId, employee.fullName);
    console.log('Employee department:', employee.department);
    console.log('Employee join date:', employee.dateOfJoining);
    
    // Get all active leave rules
    let rules;
    if (isUsingMockDB()) {
      const allRules = mockDB().scan(HRMS_LEAVES_TABLE);
      console.log('Total rules in DB:', allRules.length);
      rules = allRules.filter(r => r.entityType === 'RULE' && r.status === 'Active');
      console.log('Active rules found:', rules.length);
      rules.forEach(r => console.log('Rule:', r.leaveName, 'Days:', r.totalLeavesPerYear));
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type AND #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':type': 'RULE', ':status': 'Active' }
      });
      const result = await dynamoClient.send(scanCommand);
      rules = result.Items || [];
      console.log('Active rules found:', rules.length);
    }

    if (rules.length === 0) {
      console.log('⚠️ No active leave rules found!');
      return;
    }

    // Create balance for each leave rule
    for (const rule of rules) {
      console.log('\nProcessing rule:', rule.leaveName);
      
      // Check applicability
      if (rule.applicableTo === 'Department' && rule.applicableDepartments && rule.applicableDepartments.length > 0) {
        console.log('Department-specific rule. Applicable to:', rule.applicableDepartments);
        if (!rule.applicableDepartments.includes(employee.department)) {
          console.log('Skipping - employee department not in list');
          continue;
        }
      }

      // Calculate pro-rata leaves based on joining date
      const allocatedLeaves = calculateProRataLeaves(employee.dateOfJoining, rule);
      console.log('Allocated leaves:', allocatedLeaves);

      const leaveId = generateId();
      const balance = {
        leaveId,
        entityType: 'BALANCE',
        employeeId: employee.employeeId,
        employeeName: employee.fullName,
        department: employee.department,
        leaveType: rule.leaveName,
        totalAllocated: allocatedLeaves,
        used: 0,
        remaining: allocatedLeaves,
        carryForward: 0,
        lwp: 0,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      };

      console.log('Creating balance entry:', balance);

      if (isUsingMockDB()) {
        mockDB().put(HRMS_LEAVES_TABLE, balance);
        console.log('✅ Balance saved to mock DB');
      } else {
        const putCommand = new PutCommand({
          TableName: HRMS_LEAVES_TABLE,
          Item: balance
        });
        await dynamoClient.send(putCommand);
        console.log('✅ Balance saved to DynamoDB');
      }

      console.log(`✅ Created balance for ${rule.leaveName}: ${allocatedLeaves} leaves`);
    }

    console.log('=== LEAVE ALLOCATION COMPLETE ===\n');
  } catch (error) {
    console.error('❌ ERROR in allocateLeaveBalancesToEmployee:', error);
    console.error('Error stack:', error.stack);
  }
};

// Calculate pro-rata leaves based on joining date
const calculateProRataLeaves = (joinDate, rule) => {
  const totalLeavesPerYear = parseInt(rule.totalLeavesPerYear) || 0;
  
  // If pro-rata is disabled, give full allocation
  if (rule.proRataCalculation === 'No') {
    return totalLeavesPerYear;
  }

  // Calculate remaining months in the year
  const joiningDate = new Date(joinDate);
  const joiningMonth = joiningDate.getMonth();
  const remainingMonths = 12 - joiningMonth;
  
  // Pro-rata calculation: (Remaining months / 12) * Annual leaves
  const proRataLeaves = Math.round((remainingMonths / 12) * totalLeavesPerYear);
  
  return proRataLeaves;
};

const getAllCandidates = async (req, res) => {
  try {
    // Get recruiterId from authenticated user (from JWT token)
    const recruiterId = req.user?.recruiterId;
    
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found in authentication token'));
    }

    console.log('getAllCandidates called for recruiterId:', recruiterId);

    let candidates;
    if (isUsingMockDB()) {
      const allEmployees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      console.log('Total employees in DB:', allEmployees.length);
      candidates = allEmployees.filter(e => e.recruiterId === recruiterId);
    } else {
      const command = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: {
          ':recruiterId': recruiterId
        }
      });
      const result = await dynamoClient.send(command);
      candidates = result.Items || [];
    }

    console.log(`Found ${candidates.length} employees for recruiter ${recruiterId}`);
    res.json(successResponse(candidates, 'Employees retrieved successfully'));

  } catch (error) {
    console.error('Get candidates error:', error);
    handleError(error, res);
  }
};

const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;

    let candidate;
    if (isUsingMockDB()) {
      candidate = mockDB().get(HRMS_EMPLOYEES_TABLE, id);
    } else {
      const command = new GetCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: id }
      });
      const result = await dynamoClient.send(command);
      candidate = result.Item;
    }

    if (!candidate) {
      return res.status(404).json(errorResponse('Candidate not found'));
    }

    res.json(successResponse(candidate, 'Candidate retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.employeeId;
    delete updates.createdAt;
    delete updates.createdBy;

    if (updates.email && !validateEmail(updates.email)) {
      return res.status(400).json(errorResponse('Invalid email format'));
    }

    // Check if candidate exists
    let existingCandidate;
    if (isUsingMockDB()) {
      existingCandidate = mockDB().get(HRMS_EMPLOYEES_TABLE, id);
      if (!existingCandidate) {
        return res.status(404).json(errorResponse('Candidate not found'));
      }
      
      const updatedCandidate = { ...existingCandidate, ...updates };
      mockDB().put(HRMS_EMPLOYEES_TABLE, updatedCandidate);
      res.json(successResponse(updatedCandidate, 'Candidate updated successfully'));
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: id }
      });
      const getResult = await dynamoClient.send(getCommand);

      if (!getResult.Item) {
        return res.status(404).json(errorResponse('Candidate not found'));
      }

      // Build update expression
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updates).forEach((key, index) => {
        updateExpressions.push(`#${key} = :val${index}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:val${index}`] = updates[key];
      });

      const updateCommand = new UpdateCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const result = await dynamoClient.send(updateCommand);
      res.json(successResponse(result.Attributes, 'Candidate updated successfully'));
    }

  } catch (error) {
    handleError(error, res);
  }
};

const updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, interviewDate, notes } = req.body;

    const updates = {};
    if (interviewDate) updates.interviewDate = interviewDate;
    if (notes) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json(errorResponse('No valid fields to update'));
    }

    if (isUsingMockDB()) {
      const existingCandidate = mockDB().get(HRMS_EMPLOYEES_TABLE, id);
      if (!existingCandidate) {
        return res.status(404).json(errorResponse('Candidate not found'));
      }
      
      const updatedCandidate = { ...existingCandidate, ...updates };
      mockDB().put(HRMS_EMPLOYEES_TABLE, updatedCandidate);
      res.json(successResponse(updatedCandidate, 'Candidate updated successfully'));
    } else {
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updates).forEach((key, index) => {
        updateExpressions.push(`#${key} = :val${index}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:val${index}`] = updates[key];
      });

      const updateCommand = new UpdateCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const result = await dynamoClient.send(updateCommand);
      res.json(successResponse(result.Attributes, 'Candidate updated successfully'));
    }

  } catch (error) {
    handleError(error, res);
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if candidate exists
    let existingCandidate;
    if (isUsingMockDB()) {
      existingCandidate = mockDB().get(HRMS_EMPLOYEES_TABLE, id);
      if (!existingCandidate) {
        return res.status(404).json(errorResponse('Candidate not found'));
      }
      mockDB().delete(HRMS_EMPLOYEES_TABLE, id);
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: id }
      });
      const getResult = await dynamoClient.send(getCommand);

      if (!getResult.Item) {
        return res.status(404).json(errorResponse('Candidate not found'));
      }

      const deleteCommand = new DeleteCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: id }
      });
      await dynamoClient.send(deleteCommand);
    }

    // Clean up leave balances for deleted employee
    await cleanupLeaveBalancesForEmployee(id);

    res.json(successResponse(null, 'Candidate deleted successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

// Helper function to clean up leave balances when employee is deleted
const cleanupLeaveBalancesForEmployee = async (employeeId) => {
  try {
    console.log('🧹 Cleaning up leave balances for deleted employee:', employeeId);
    
    let balances;
    if (isUsingMockDB()) {
      const allBalances = mockDB().scan(HRMS_LEAVES_TABLE);
      balances = allBalances.filter(b => b.entityType === 'BALANCE' && b.employeeId === employeeId);
      balances.forEach(b => mockDB().delete(HRMS_LEAVES_TABLE, b.leaveId));
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type AND employeeId = :empId',
        ExpressionAttributeValues: {
          ':type': 'BALANCE',
          ':empId': employeeId
        }
      });
      const result = await dynamoClient.send(scanCommand);
      balances = result.Items || [];

      // Delete each balance
      for (const balance of balances) {
        const deleteCommand = new DeleteCommand({
          TableName: HRMS_LEAVES_TABLE,
          Key: { leaveId: balance.leaveId }
        });
        await dynamoClient.send(deleteCommand);
      }
    }

    console.log(`✅ Cleaned up ${balances.length} leave balance records for employee ${employeeId}`);
  } catch (error) {
    console.error('❌ Error cleaning up leave balances:', error);
  }
};

const getCandidateStats = async (req, res) => {
  try {
    // Get recruiterId from authenticated user (from JWT token)
    const recruiterId = req.user?.recruiterId;
    
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found in authentication token'));
    }

    let candidates;
    if (isUsingMockDB()) {
      const allEmployees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      candidates = allEmployees.filter(e => e.recruiterId === recruiterId);
    } else {
      const command = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: {
          ':recruiterId': recruiterId
        }
      });
      const result = await dynamoClient.send(command);
      candidates = result.Items || [];
    }

    const stats = {
      total: candidates.length
    };

    res.json(successResponse(stats, 'Employee statistics retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  updateCandidateStatus,
  deleteCandidate,
  getCandidateStats
};