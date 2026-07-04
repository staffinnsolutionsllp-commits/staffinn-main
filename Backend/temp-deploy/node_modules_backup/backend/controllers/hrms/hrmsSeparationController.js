const { dynamoClient, isUsingMockDB, mockDB } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

const HRMS_SEPARATION_TABLE = 'HRMS-seperation-table';

const createSeparation = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { employeeId, employeeName, department, resignationReason, lastWorkingDate, noticePeriodDays, resignationDocuments } = req.body;

    if (!employeeId || !resignationReason || !lastWorkingDate) {
      return res.status(400).json(errorResponse('Missing required fields'));
    }

    const separationId = generateId();
    const noticeStartDate = getCurrentTimestamp();
    const separation = {
      seperationtable: separationId,
      separationId,
      recruiterId,
      employeeId,
      employeeName: employeeName || '',
      department: department || '',
      resignationReason,
      lastWorkingDate,
      resignationDate: noticeStartDate,
      resignationStatus: 'Initiated',
      resignationDocuments: resignationDocuments || [],
      noticePeriod: {
        days: noticePeriodDays || 30,
        startDate: noticeStartDate,
        endDate: lastWorkingDate,
        remainingDays: noticePeriodDays || 30,
        earlyRelease: false,
        absconding: false,
        handoverCompleted: false
      },
      exitInterview: {
        status: 'Pending',
        scheduledDate: null,
        responses: [],
        hrRemarks: ''
      },
      fnfSettlement: {
        status: 'Pending',
        finalSalary: 0,
        leaveEncashment: 0,
        loanDeductions: 0,
        noticeShortfall: 0,
        bonus: 0,
        totalPayable: 0
      },
      exitDocuments: {
        experienceLetter: null,
        relievingLetter: null,
        noDuesCertificate: null,
        salaryCertificate: null
      },
      finalRating: {
        rating: 0,
        feedback: '',
        ratedBy: '',
        ratedByName: ''
      },
      remarks: [],
      statusHistory: [{
        status: 'Initiated',
        changedBy: req.user.userId,
        changedByName: req.user.name,
        timestamp: getCurrentTimestamp()
      }],
      createdBy: req.user.userId,
      createdByName: req.user.name,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_SEPARATION_TABLE, separation);
    } else {
      const putCommand = new PutCommand({ TableName: HRMS_SEPARATION_TABLE, Item: separation });
      await dynamoClient.send(putCommand);
    }

    res.status(201).json(successResponse(separation, 'Separation record created successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getSeparations = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { employeeId, status, department, startDate, endDate } = req.query;

    let separations;
    if (isUsingMockDB()) {
      separations = mockDB().scan(HRMS_SEPARATION_TABLE).filter(s => s.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_SEPARATION_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      separations = result.Items || [];
    }

    if (employeeId) separations = separations.filter(s => s.employeeId === employeeId);
    if (status) separations = separations.filter(s => s.resignationStatus === status);
    if (department) separations = separations.filter(s => s.department === department);
    if (startDate) separations = separations.filter(s => new Date(s.createdAt) >= new Date(startDate));
    if (endDate) separations = separations.filter(s => new Date(s.createdAt) <= new Date(endDate));

    res.json(successResponse(separations, 'Separations retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getSeparationById = async (req, res) => {
  try {
    const { separationId } = req.params;
    const recruiterId = req.user?.recruiterId || req.user?.userId;

    let separation;
    if (isUsingMockDB()) {
      separation = mockDB().get(HRMS_SEPARATION_TABLE, separationId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_SEPARATION_TABLE,
        FilterExpression: 'separationId = :separationId AND recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':separationId': separationId, ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      separation = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!separation) return res.status(404).json(errorResponse('Separation record not found'));

    res.json(successResponse(separation, 'Separation retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const updateResignationStatus = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { status, remark } = req.body;

    if (!status) return res.status(400).json(errorResponse('Status is required'));

    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation record not found'));

    const statusHistory = separation.statusHistory || [];
    statusHistory.push({
      status,
      changedBy: req.user.userId,
      changedByName: req.user.name,
      timestamp: getCurrentTimestamp(),
      remark: remark || ''
    });

    const remarks = separation.remarks || [];
    if (remark) {
      remarks.push({
        text: remark,
        addedBy: req.user.userId,
        addedByName: req.user.name,
        timestamp: getCurrentTimestamp()
      });
    }

    const updatedSeparation = {
      ...separation,
      resignationStatus: status,
      remarks,
      statusHistory,
      updatedAt: getCurrentTimestamp()
    };

    await saveSeparationRecord(updatedSeparation);
    res.json(successResponse(updatedSeparation, 'Status updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const updateNoticePeriod = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { earlyRelease, absconding, handoverCompleted } = req.body;

    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation record not found'));

    const updatedSeparation = {
      ...separation,
      noticePeriod: {
        ...separation.noticePeriod,
        earlyRelease: earlyRelease !== undefined ? earlyRelease : separation.noticePeriod.earlyRelease,
        absconding: absconding !== undefined ? absconding : separation.noticePeriod.absconding,
        handoverCompleted: handoverCompleted !== undefined ? handoverCompleted : separation.noticePeriod.handoverCompleted
      },
      updatedAt: getCurrentTimestamp()
    };

    await saveSeparationRecord(updatedSeparation);
    res.json(successResponse(updatedSeparation, 'Notice period updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const updateExitInterview = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { status, scheduledDate, responses, hrRemarks } = req.body;

    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation record not found'));

    const updatedSeparation = {
      ...separation,
      exitInterview: {
        status: status || separation.exitInterview.status,
        scheduledDate: scheduledDate || separation.exitInterview.scheduledDate,
        responses: responses || separation.exitInterview.responses,
        hrRemarks: hrRemarks || separation.exitInterview.hrRemarks,
        completedAt: status === 'Completed' ? getCurrentTimestamp() : separation.exitInterview.completedAt
      },
      updatedAt: getCurrentTimestamp()
    };

    await saveSeparationRecord(updatedSeparation);
    res.json(successResponse(updatedSeparation, 'Exit interview updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const updateFnFSettlement = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { status, finalSalary, leaveEncashment, loanDeductions, noticeShortfall, bonus } = req.body;

    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation record not found'));

    const totalPayable = (finalSalary || 0) + (leaveEncashment || 0) + (bonus || 0) - (loanDeductions || 0) - (noticeShortfall || 0);

    const updatedSeparation = {
      ...separation,
      fnfSettlement: {
        status: status || separation.fnfSettlement.status,
        finalSalary: finalSalary !== undefined ? finalSalary : separation.fnfSettlement.finalSalary,
        leaveEncashment: leaveEncashment !== undefined ? leaveEncashment : separation.fnfSettlement.leaveEncashment,
        loanDeductions: loanDeductions !== undefined ? loanDeductions : separation.fnfSettlement.loanDeductions,
        noticeShortfall: noticeShortfall !== undefined ? noticeShortfall : separation.fnfSettlement.noticeShortfall,
        bonus: bonus !== undefined ? bonus : separation.fnfSettlement.bonus,
        totalPayable,
        completedAt: status === 'Completed' ? getCurrentTimestamp() : separation.fnfSettlement.completedAt
      },
      updatedAt: getCurrentTimestamp()
    };

    await saveSeparationRecord(updatedSeparation);
    res.json(successResponse(updatedSeparation, 'F&F settlement updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const updateExitDocuments = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { experienceLetter, relievingLetter, noDuesCertificate, salaryCertificate } = req.body;

    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation record not found'));

    const updatedSeparation = {
      ...separation,
      exitDocuments: {
        experienceLetter: experienceLetter || separation.exitDocuments.experienceLetter,
        relievingLetter: relievingLetter || separation.exitDocuments.relievingLetter,
        noDuesCertificate: noDuesCertificate || separation.exitDocuments.noDuesCertificate,
        salaryCertificate: salaryCertificate || separation.exitDocuments.salaryCertificate
      },
      updatedAt: getCurrentTimestamp()
    };

    await saveSeparationRecord(updatedSeparation);
    res.json(successResponse(updatedSeparation, 'Exit documents updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const updateFinalRating = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { rating, feedback } = req.body;

    if (!rating) return res.status(400).json(errorResponse('Rating is required'));

    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation record not found'));

    const updatedSeparation = {
      ...separation,
      finalRating: {
        rating,
        feedback: feedback || '',
        ratedBy: req.user.userId,
        ratedByName: req.user.name,
        ratedAt: getCurrentTimestamp()
      },
      updatedAt: getCurrentTimestamp()
    };

    await saveSeparationRecord(updatedSeparation);
    res.json(successResponse(updatedSeparation, 'Final rating updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const getSeparationStats = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    let separations;
    if (isUsingMockDB()) {
      separations = mockDB().scan(HRMS_SEPARATION_TABLE).filter(s => s.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_SEPARATION_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      separations = result.Items || [];
    }

    const stats = {
      total: separations.length,
      active: separations.filter(s => s.resignationStatus === 'Approved' || s.resignationStatus === 'In Notice Period').length,
      inNoticePeriod: separations.filter(s => s.resignationStatus === 'In Notice Period').length,
      pendingFnF: separations.filter(s => s.fnfSettlement.status === 'Pending' || s.fnfSettlement.status === 'In Process').length,
      pendingExitInterview: separations.filter(s => s.exitInterview.status === 'Pending').length,
      completed: separations.filter(s => s.resignationStatus === 'Completed').length
    };

    const departmentBreakdown = {};
    separations.forEach(s => {
      if (s.department) {
        departmentBreakdown[s.department] = (departmentBreakdown[s.department] || 0) + 1;
      }
    });

    res.json(successResponse({ stats, departmentBreakdown }, 'Stats retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

async function getSeparationRecord(separationId) {
  if (isUsingMockDB()) {
    return mockDB().get(HRMS_SEPARATION_TABLE, separationId);
  } else {
    const scanCommand = new ScanCommand({
      TableName: HRMS_SEPARATION_TABLE,
      FilterExpression: 'separationId = :separationId',
      ExpressionAttributeValues: { ':separationId': separationId }
    });
    const result = await dynamoClient.send(scanCommand);
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  }
}

async function saveSeparationRecord(separation) {
  if (isUsingMockDB()) {
    mockDB().put(HRMS_SEPARATION_TABLE, separation);
  } else {
    const putCommand = new PutCommand({ TableName: HRMS_SEPARATION_TABLE, Item: separation });
    await dynamoClient.send(putCommand);
  }
}

module.exports = {
  createSeparation,
  getSeparations,
  getSeparationById,
  updateResignationStatus,
  updateNoticePeriod,
  updateExitInterview,
  updateFnFSettlement,
  updateExitDocuments,
  updateFinalRating,
  getSeparationStats
};
