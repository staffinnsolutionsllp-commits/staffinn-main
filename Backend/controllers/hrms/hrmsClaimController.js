const { dynamoClient, isUsingMockDB, mockDB } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

const HRMS_CLAIMS_TABLE = 'HRMS-Claim-Management';

const getClaimStats = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    let claims;
    if (isUsingMockDB()) {
      const allClaims = mockDB().scan(HRMS_CLAIMS_TABLE);
      claims = allClaims.filter(c => c.entityType === 'CLAIM' && c.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_CLAIMS_TABLE,
        FilterExpression: 'entityType = :type AND recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':type': 'CLAIM', ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      claims = result.Items || [];
    }

    const stats = {
      total: claims.length,
      pending: claims.filter(c => c.status === 'Pending').length,
      approved: claims.filter(c => c.status === 'Approved').length,
      rejected: claims.filter(c => c.status === 'Rejected').length
    };

    res.json(successResponse(stats, 'Stats retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getClaimCategories = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    let categories;
    if (isUsingMockDB()) {
      const allCategories = mockDB().scan(HRMS_CLAIMS_TABLE);
      categories = allCategories.filter(c => c.entityType === 'CATEGORY' && c.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_CLAIMS_TABLE,
        FilterExpression: 'entityType = :type AND recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':type': 'CATEGORY', ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      categories = result.Items || [];
    }

    res.json(successResponse(categories, 'Categories retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const createClaimCategory = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { name, description } = req.body;
    if (!name) return res.status(400).json(errorResponse('Category name is required'));

    const categoryId = generateId();
    const category = {
      claimmanagement: `CATEGORY#${categoryId}`,
      categoryId,
      entityType: 'CATEGORY',
      recruiterId,
      name,
      description: description || '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_CLAIMS_TABLE, category);
    } else {
      const putCommand = new PutCommand({ TableName: HRMS_CLAIMS_TABLE, Item: category });
      await dynamoClient.send(putCommand);
    }

    res.status(201).json(successResponse(category, 'Category created successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const updateClaimCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    let category;
    if (isUsingMockDB()) {
      const allCategories = mockDB().scan(HRMS_CLAIMS_TABLE);
      category = allCategories.find(c => c.categoryId === categoryId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_CLAIMS_TABLE,
        FilterExpression: 'categoryId = :categoryId',
        ExpressionAttributeValues: { ':categoryId': categoryId }
      });
      const result = await dynamoClient.send(scanCommand);
      category = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!category) return res.status(404).json(errorResponse('Category not found'));

    const updatedCategory = {
      ...category,
      name: name || category.name,
      description: description || category.description,
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_CLAIMS_TABLE, updatedCategory);
    } else {
      const putCommand = new PutCommand({ TableName: HRMS_CLAIMS_TABLE, Item: updatedCategory });
      await dynamoClient.send(putCommand);
    }

    res.json(successResponse(updatedCategory, 'Category updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const deleteClaimCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    let category;
    if (isUsingMockDB()) {
      const allCategories = mockDB().scan(HRMS_CLAIMS_TABLE);
      category = allCategories.find(c => c.categoryId === categoryId);
      if (category) mockDB().delete(HRMS_CLAIMS_TABLE, categoryId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_CLAIMS_TABLE,
        FilterExpression: 'categoryId = :categoryId',
        ExpressionAttributeValues: { ':categoryId': categoryId }
      });
      const result = await dynamoClient.send(scanCommand);
      category = result.Items && result.Items.length > 0 ? result.Items[0] : null;
      
      if (category) {
        const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
        const deleteCommand = new DeleteCommand({
          TableName: HRMS_CLAIMS_TABLE,
          Key: { claimmanagement: category.claimmanagement, categoryId: category.categoryId }
        });
        await dynamoClient.send(deleteCommand);
      }
    }

    if (!category) return res.status(404).json(errorResponse('Category not found'));

    res.json(successResponse(null, 'Category deleted successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getClaims = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { category, status, employeeId } = req.query;

    let claims;
    if (isUsingMockDB()) {
      const allClaims = mockDB().scan(HRMS_CLAIMS_TABLE);
      claims = allClaims.filter(c => c.entityType === 'CLAIM' && c.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_CLAIMS_TABLE,
        FilterExpression: 'entityType = :type AND recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':type': 'CLAIM', ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      claims = result.Items || [];
    }

    if (category) claims = claims.filter(c => c.category === category);
    if (status) claims = claims.filter(c => c.status === status);
    if (employeeId) claims = claims.filter(c => c.employeeId === employeeId);

    res.json(successResponse(claims, 'Claims retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const createClaim = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { employeeId, employeeEmail, employeeName, category, amount, description } = req.body;

    if ((!employeeId && !employeeEmail) || !category || !amount) {
      return res.status(400).json(errorResponse('Missing required fields'));
    }

    const claimId = generateId();
    const claim = {
      claimmanagement: `CLAIM#${claimId}`,
      claimId,
      entityType: 'CLAIM',
      recruiterId,
      employeeId: employeeId || '',
      employeeEmail: employeeEmail || '',
      employeeName: employeeName || '',
      category,
      amount: parseFloat(amount),
      description: description || '',
      status: 'Pending',
      submittedDate: getCurrentTimestamp(),
      remarks: '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_CLAIMS_TABLE, claim);
    } else {
      const putCommand = new PutCommand({ TableName: HRMS_CLAIMS_TABLE, Item: claim });
      await dynamoClient.send(putCommand);
    }

    res.status(201).json(successResponse(claim, 'Claim created successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const updateClaimStatus = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status, remarks } = req.body;

    if (!status) return res.status(400).json(errorResponse('Status is required'));

    let claim;
    if (isUsingMockDB()) {
      const allClaims = mockDB().scan(HRMS_CLAIMS_TABLE);
      claim = allClaims.find(c => c.claimId === claimId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_CLAIMS_TABLE,
        FilterExpression: 'claimId = :claimId',
        ExpressionAttributeValues: { ':claimId': claimId }
      });
      const result = await dynamoClient.send(scanCommand);
      claim = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!claim) return res.status(404).json(errorResponse('Claim not found'));

    const updatedClaim = {
      ...claim,
      status,
      remarks: remarks || '',
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_CLAIMS_TABLE, updatedClaim);
    } else {
      const putCommand = new PutCommand({ TableName: HRMS_CLAIMS_TABLE, Item: updatedClaim });
      await dynamoClient.send(putCommand);
    }

    res.json(successResponse(updatedClaim, 'Claim status updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  getClaimStats,
  getClaimCategories,
  createClaimCategory,
  updateClaimCategory,
  deleteClaimCategory,
  getClaims,
  createClaim,
  updateClaimStatus
};
