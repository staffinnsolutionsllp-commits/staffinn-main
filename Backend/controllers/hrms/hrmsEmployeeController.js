const bcrypt = require('bcryptjs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { dynamoClient, isUsingMockDB, mockDB, HRMS_EMPLOYEES_TABLE, HRMS_LEAVES_TABLE } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, generateNumericEmployeeId, getCurrentTimestamp, validateEmail, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const createEmployee = async (req, res) => {
  try {
    console.log('=== DEBUGGING EMPLOYEE CREATION ===');
    console.log('Request body received:', JSON.stringify(req.body, null, 2));
    
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found in authentication token'));
    }

    // Check if this is the first employee
    let existingEmployees;
    if (isUsingMockDB()) {
      const allEmployees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      existingEmployees = allEmployees.filter(e => 
        e.recruiterId === recruiterId && 
        (!e.isDeleted || e.isDeleted === false)
      );
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'recruiterId = :rid AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
        ExpressionAttributeValues: {
          ':rid': recruiterId,
          ':false': false
        }
      });
      const result = await dynamoClient.send(scanCommand);
      existingEmployees = result.Items || [];
    }
    
    const isFirstEmployee = existingEmployees.length === 0;
    console.log(`👑 Is first employee: ${isFirstEmployee}`);
    
    const { 
      employeeId,
      fullName, name,
      email,
      designation, position,
      department,
      annualCTC, salary,
      basicPay, basicSalary,
      salaryType,
      paymentCycle,
      allowances,
      bonus,
      deductions,
      overtimeRate,
      dateOfJoining, joinDate,
      dateOfBirth, 
      bloodGroup, 
      currentAddress, 
      aadhaarNumber, 
      bankName, 
      accountNumber, 
      employmentType,
      checkInTime,
      checkOutTime,
      emergencyContactName, 
      emergencyContactNumber, 
      emergencyContactRelation,
      phone
    } = req.body;

    const employeeName = fullName || name;
    const employeeDesignation = designation || position;
    const employeeSalary = annualCTC || salary;
    const employeeJoinDate = dateOfJoining || joinDate;

    if (!employeeName || !email || !employeeDesignation || !department) {
      return res.status(400).json(errorResponse('Name, email, designation, and department are required'));
    }

    if (!employeeId) {
      return res.status(400).json(errorResponse('Employee ID is required'));
    }

    if (!/^\d+$/.test(employeeId)) {
      return res.status(400).json(errorResponse('Employee ID must contain only numeric values'));
    }

    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format'));
    }

    let existingId;
    if (isUsingMockDB()) {
      const allEmployees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      // Exclude soft-deleted employees — a deleted ID should be reusable
      existingId = allEmployees.find(e => 
        e.employeeId === employeeId && 
        e.recruiterId === recruiterId && 
        (!e.isDeleted || e.isDeleted === false)
      );
    } else {
      // Exclude soft-deleted employees — a deleted ID should be reusable
      const scanCommand = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'employeeId = :employeeId AND recruiterId = :recruiterId AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
        ExpressionAttributeValues: {
          ':employeeId': employeeId,
          ':recruiterId': recruiterId,
          ':false': false
        }
      });
      const result = await dynamoClient.send(scanCommand);
      existingId = result.Items && result.Items.length > 0;
    }
    
    if (existingId) {
      return res.status(400).json(errorResponse('Employee ID already exists in your organization. Please use a different ID.'));
    }
    
    console.log('Using Employee ID:', employeeId);

    let existingEmployee;
    if (isUsingMockDB()) {
      const employees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      // Exclude soft-deleted employees — deleted email should be reusable
      existingEmployee = employees.find(e => 
        e.email === email && 
        e.recruiterId === recruiterId && 
        (!e.isDeleted || e.isDeleted === false)
      );
    } else {
      // Exclude soft-deleted employees — deleted email should be reusable
      const command = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'email = :email AND recruiterId = :recruiterId AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
        ExpressionAttributeValues: { 
          ':email': email,
          ':recruiterId': recruiterId,
          ':false': false
        }
      });
      const result = await dynamoClient.send(command);
      existingEmployee = result.Items && result.Items.length > 0;
    }

    if (existingEmployee) {
      return res.status(400).json(errorResponse('Employee with this email already exists in your organization'));
    }

    const employee = {
      employeeId,
      recruiterId,
      fullName: employeeName,
      email,
      designation: employeeDesignation,
      department,
      annualCTC: parseFloat(employeeSalary) || 0,
      basicPay: parseFloat(basicPay || basicSalary) || 0,
      basicSalary: parseFloat(basicPay || basicSalary) || 0,
      salaryType: salaryType || 'Monthly',
      paymentCycle: paymentCycle || 'Monthly',
      allowances: allowances || [],
      bonus: parseFloat(bonus) || 0,
      deductions: deductions || [],
      overtimeRate: parseFloat(overtimeRate) || 0,
      dateOfJoining: employeeJoinDate || getCurrentTimestamp().split('T')[0],
      dateOfBirth: dateOfBirth || '',
      bloodGroup: bloodGroup || '',
      currentAddress: currentAddress || '',
      aadhaarNumber: aadhaarNumber || '',
      bankName: bankName || '',
      accountNumber: accountNumber || '',
      employmentType: employmentType || 'Full-time',
      checkInTime: checkInTime || '09:00',
      checkOutTime: checkOutTime || '18:00',
      emergencyContactName: emergencyContactName || '',
      emergencyContactNumber: emergencyContactNumber || phone || '',
      emergencyContactRelation: emergencyContactRelation || '',
      isFirstEmployee,
      isHRAdmin: isFirstEmployee,
      createdAt: getCurrentTimestamp(),
      createdBy: req.user?.userId || 'system'
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_EMPLOYEES_TABLE, employee);
    } else {
      const command = new PutCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Item: employee
      });
      await dynamoClient.send(command);
    }

    // Only create portal credentials if NOT first employee
    if (!isFirstEmployee) {
      try {
        const tempPassword = `Emp@${employeeId}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const userId = `USER_${employeeId}_${Date.now()}`;

        const employeeUser = {
          userId,
          employeeId,
          email,
          password: hashedPassword,
          roleId: 'ROLE_EMPLOYEE',
          companyId: recruiterId,
          isFirstLogin: true,
          isActive: true,
          createdAt: getCurrentTimestamp()
        };

        await docClient.send(new PutCommand({
          TableName: 'staffinn-hrms-employee-users',
          Item: employeeUser
        }));

        console.log('✅ Employee credentials created:', { email, tempPassword });
        
      } catch (credError) {
        console.error('❌ Error creating employee credentials:', credError);
      }
    } else {
      console.log('⚠️ First employee (HR Admin) - skipping portal credentials creation');
    }

    console.log('Employee created successfully with ID:', employeeId);
    res.status(201).json(successResponse(employee, 'Employee created successfully'));

  } catch (error) {
    console.error('Create employee error:', error);
    handleError(error, res);
  }
};

const getAllEmployees = async (req, res) => {
  try {
    // Get recruiterId from authenticated user (from JWT token)
    const recruiterId = req.user?.recruiterId;
    
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found in authentication token'));
    }

    console.log('getAllEmployees called for recruiterId:', recruiterId);

    let employees;
    if (isUsingMockDB()) {
      const allEmployees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      console.log('Total employees in DB:', allEmployees.length);
      employees = allEmployees.filter(e => e.recruiterId === recruiterId && (!e.isDeleted || e.isDeleted === false));
    } else {
      const command = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'recruiterId = :recruiterId AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
        ExpressionAttributeValues: {
          ':recruiterId': recruiterId,
          ':false': false
        }
      });
      const result = await dynamoClient.send(command);
      employees = result.Items || [];
    }

    console.log(`Found ${employees.length} active employees for recruiter ${recruiterId}`);
    res.json(successResponse(employees, 'Employees retrieved successfully'));

  } catch (error) {
    console.error('Get employees error:', error);
    handleError(error, res);
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    let employee;
    if (isUsingMockDB()) {
      employee = mockDB().get(HRMS_EMPLOYEES_TABLE, id);
    } else {
      const command = new GetCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: id }
      });
      const result = await dynamoClient.send(command);
      employee = result.Item;
    }

    if (!employee) {
      return res.status(404).json(errorResponse('Employee not found'));
    }

    res.json(successResponse(employee, 'Employee retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Syncs email in staffinn-hrms-employee-users when admin changes it via HRMS onboarding.
 * Password is NOT touched — employee keeps whatever password they set (or temp if never changed).
 */
const syncEmployeeLoginEmail = async (employeeId, newEmail) => {
  try {
    console.log(`🔄 Syncing login email for employeeId ${employeeId} → ${newEmail}`);

    // Find the login record by employeeId (scan, since employeeId is not the PK)
    const scanResult = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employee-users',
      FilterExpression: 'employeeId = :empId',
      ExpressionAttributeValues: { ':empId': employeeId }
    }));

    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log(`⚠️  No login record found for employeeId ${employeeId} — skipping email sync`);
      return;
    }

    const loginRecord = scanResult.Items[0];

    // Only update if email actually changed
    if (loginRecord.email === newEmail) {
      console.log('✅ Login email already up to date — no sync needed');
      return;
    }

    await docClient.send(new UpdateCommand({
      TableName: 'staffinn-hrms-employee-users',
      Key: { userId: loginRecord.userId },
      UpdateExpression: 'SET email = :newEmail, updatedAt = :now',
      ExpressionAttributeValues: {
        ':newEmail': newEmail,
        ':now': getCurrentTimestamp()
      }
    }));

    console.log(`✅ Login email synced: ${loginRecord.email} → ${newEmail} (password unchanged)`);
  } catch (err) {
    // Non-fatal — log and continue so employee data update still succeeds
    console.error('❌ Failed to sync login email:', err);
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('=== UPDATING EMPLOYEE ===');
    console.log('Employee ID:', id);
    console.log('Updates:', JSON.stringify(updates, null, 2));

    // Remove fields that shouldn't be updated
    delete updates.employeeId;
    delete updates.createdAt;
    delete updates.createdBy;
    delete updates.recruiterId;

    // Remove undefined/null values to prevent overwriting existing data
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined || updates[key] === null || updates[key] === '') {
        delete updates[key];
      }
    });

    if (updates.email && !validateEmail(updates.email)) {
      return res.status(400).json(errorResponse('Invalid email format'));
    }

    // Check if employee exists
    let existingEmployee;
    if (isUsingMockDB()) {
      existingEmployee = mockDB().get(HRMS_EMPLOYEES_TABLE, id);
      if (!existingEmployee) {
        return res.status(404).json(errorResponse('Employee not found'));
      }
      
      // Merge updates with existing data, keeping existing values for missing fields
      const updatedEmployee = { 
        ...existingEmployee, 
        ...updates,
        updatedAt: getCurrentTimestamp()
      };
      mockDB().put(HRMS_EMPLOYEES_TABLE, updatedEmployee);
      
      // Update leave balances if name or department changed
      if (updates.fullName || updates.department) {
        await updateLeaveBalancesForEmployee(id, {
          employeeName: updates.fullName || existingEmployee.fullName,
          department: updates.department || existingEmployee.department
        });
      }

      // Sync login email if email changed
      if (updates.email && updates.email !== existingEmployee.email) {
        await syncEmployeeLoginEmail(id, updates.email);
      }
      
      res.json(successResponse(updatedEmployee, 'Employee updated successfully'));
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: id }
      });
      const getResult = await dynamoClient.send(getCommand);

      if (!getResult.Item) {
        return res.status(404).json(errorResponse('Employee not found'));
      }

      // Build update expression only for fields that have values
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updates).forEach((key, index) => {
        updateExpressions.push(`#${key} = :val${index}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:val${index}`] = updates[key];
      });

      // Add updatedAt timestamp
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = getCurrentTimestamp();

      const updateCommand = new UpdateCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const result = await dynamoClient.send(updateCommand);
      
      // Update leave balances if name or department changed
      if (updates.fullName || updates.department) {
        await updateLeaveBalancesForEmployee(id, {
          employeeName: updates.fullName || getResult.Item.fullName,
          department: updates.department || getResult.Item.department
        });
      }

      // Sync login email if email changed
      if (updates.email && updates.email !== getResult.Item.email) {
        await syncEmployeeLoginEmail(id, updates.email);
      }
      
      res.json(successResponse(result.Attributes, 'Employee updated successfully'));
    }

  } catch (error) {
    console.error('Update employee error:', error);
    handleError(error, res);
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    let existingEmployee;
    if (isUsingMockDB()) {
      existingEmployee = mockDB().get(HRMS_EMPLOYEES_TABLE, id);
      if (!existingEmployee) {
        return res.status(404).json(errorResponse('Employee not found'));
      }
      // Soft delete: mark as deleted instead of removing
      const deletedEmployee = {
        ...existingEmployee,
        isDeleted: true,
        deletedAt: getCurrentTimestamp()
      };
      mockDB().put(HRMS_EMPLOYEES_TABLE, deletedEmployee);
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: id }
      });
      const getResult = await dynamoClient.send(getCommand);

      if (!getResult.Item) {
        return res.status(404).json(errorResponse('Employee not found'));
      }

      // Soft delete: mark as deleted instead of removing
      const updateCommand = new UpdateCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId: id },
        UpdateExpression: 'SET isDeleted = :true, deletedAt = :deletedAt',
        ExpressionAttributeValues: {
          ':true': true,
          ':deletedAt': getCurrentTimestamp()
        }
      });
      await dynamoClient.send(updateCommand);
    }

    res.json(successResponse(null, 'Employee deleted successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getEmployeesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    let employees;
    if (isUsingMockDB()) {
      const allEmployees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      employees = allEmployees.filter(e => e.department === departmentId);
    } else {
      const command = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'department = :departmentId',
        ExpressionAttributeValues: {
          ':departmentId': departmentId
        }
      });
      const result = await dynamoClient.send(command);
      employees = result.Items || [];
    }

    res.json(successResponse(employees, 'Department employees retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getEmployeeStats = async (req, res) => {
  try {
    // Get recruiterId from authenticated user (from JWT token)
    const recruiterId = req.user?.recruiterId;
    
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found in authentication token'));
    }

    let employees;
    if (isUsingMockDB()) {
      const allEmployees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      employees = allEmployees.filter(e => e.recruiterId === recruiterId && (!e.isDeleted || e.isDeleted === false));
    } else {
      const command = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'recruiterId = :recruiterId AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
        ExpressionAttributeValues: {
          ':recruiterId': recruiterId,
          ':false': false
        }
      });
      const result = await dynamoClient.send(command);
      employees = result.Items || [];
    }

    const stats = {
      totalEmployees: employees.length
    };

    res.json(successResponse(stats, 'Employee statistics retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getEmployeeCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user?.recruiterId;

    const getEmpCommand = new GetCommand({
      TableName: HRMS_EMPLOYEES_TABLE,
      Key: { employeeId: id }
    });
    const empResult = await dynamoClient.send(getEmpCommand);

    if (!empResult.Item || empResult.Item.recruiterId !== recruiterId) {
      return res.status(404).json(errorResponse('Employee not found'));
    }

    const scanCommand = new ScanCommand({
      TableName: 'staffinn-hrms-employee-users',
      FilterExpression: 'employeeId = :empId',
      ExpressionAttributeValues: { ':empId': id }
    });
    const result = await docClient.send(scanCommand);

    if (!result.Items || result.Items.length === 0) {
      const tempPassword = `Emp@${id}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const userId = `USER_${id}_${Date.now()}`;

      const employeeUser = {
        userId,
        employeeId: id,
        email: empResult.Item.email,
        password: hashedPassword,
        roleId: 'ROLE_EMPLOYEE',
        companyId: recruiterId,
        isFirstLogin: true,
        isActive: true,
        createdAt: getCurrentTimestamp()
      };

      await docClient.send(new PutCommand({
        TableName: 'staffinn-hrms-employee-users',
        Item: employeeUser
      }));

      return res.json(successResponse({ email: empResult.Item.email, password: tempPassword }, 'Credentials generated'));
    }

    const tempPassword = `Emp@${id}`;
    res.json(successResponse({ email: result.Items[0].email, password: tempPassword }, 'Credentials retrieved'));
  } catch (error) {
    handleError(error, res);
  }
};

// Helper function to update leave balances when employee info changes
const updateLeaveBalancesForEmployee = async (employeeId, updates) => {
  try {
    console.log('🔄 Updating leave balances for employee:', employeeId);
    console.log('Updates:', updates);
    
    // Get all leave balances for this employee
    let balances;
    if (isUsingMockDB()) {
      const allBalances = mockDB().scan(HRMS_LEAVES_TABLE);
      balances = allBalances.filter(b => b.entityType === 'BALANCE' && b.employeeId === employeeId);
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
    }

    console.log(`Found ${balances.length} leave balance records to update`);

    // Update each balance record
    for (const balance of balances) {
      const updatedBalance = {
        ...balance,
        employeeName: updates.employeeName || balance.employeeName,
        department: updates.department || balance.department,
        updatedAt: getCurrentTimestamp()
      };

      if (isUsingMockDB()) {
        mockDB().put(HRMS_LEAVES_TABLE, updatedBalance);
      } else {
        const putCommand = new PutCommand({
          TableName: HRMS_LEAVES_TABLE,
          Item: updatedBalance
        });
        await dynamoClient.send(putCommand);
      }
    }

    console.log('✅ Leave balances updated successfully');
  } catch (error) {
    console.error('❌ Error updating leave balances:', error);
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByDepartment,
  getEmployeeStats,
  getEmployeeCredentials
};