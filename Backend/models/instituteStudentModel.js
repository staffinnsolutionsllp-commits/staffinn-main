const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const INSTITUTE_STUDENTS_TABLE = 'staffinn-institute-students';

const createStudent = async (instituteId, studentData) => {
  try {
    const student = {
      instituteStudntsID: uuidv4(),
      instituteId,
      fullName: studentData.fullName,
      email: studentData.email,
      phoneNumber: studentData.phoneNumber,
      dateOfBirth: studentData.dateOfBirth,
      gender: studentData.gender,
      address: studentData.address,
      profilePhoto: studentData.profilePhoto || null,
      resume: studentData.resume || null,
      certificates: studentData.certificates || [],
      tenthGradeDetails: studentData.tenthGradeDetails,
      tenthPercentage: studentData.tenthPercentage,
      tenthYearOfPassing: studentData.tenthYearOfPassing,
      twelfthGradeDetails: studentData.twelfthGradeDetails,
      twelfthPercentage: studentData.twelfthPercentage,
      twelfthYearOfPassing: studentData.twelfthYearOfPassing,
      degreeName: studentData.degreeName,
      specialization: studentData.specialization,
      expectedYearOfPassing: studentData.expectedYearOfPassing,
      currentlyPursuing: studentData.currentlyPursuing || false,
      skills: studentData.skills || [],
      placementStatus: 'Not Placed',
      recruiter: null,
      appliedJob: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(INSTITUTE_STUDENTS_TABLE, student);
    return student;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

const getStudentsByInstitute = async (instituteId) => {
  try {
    const params = {
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    };
    return await dynamoService.scanItems(INSTITUTE_STUDENTS_TABLE, params);
  } catch (error) {
    console.error('Error getting students:', error);
    return [];
  }
};

const updateStudentPlacementStatus = async (studentId, status) => {
  try {
    const key = { instituteStudntsID: studentId };
    const updateParams = {
      UpdateExpression: 'SET placementStatus = :status, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }
    };
    await dynamoService.updateItem(INSTITUTE_STUDENTS_TABLE, key, updateParams);
    return true;
  } catch (error) {
    console.error('Error updating placement status:', error);
    return false;
  }
};

const updateStudentPlacementDetails = async (studentId, placementData) => {
  try {
    const key = { instituteStudntsID: studentId };
    const updateParams = {
      UpdateExpression: 'SET placementStatus = :status, recruiter = :recruiter, appliedJob = :appliedJob, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':status': placementData.status,
        ':recruiter': placementData.recruiter,
        ':appliedJob': placementData.appliedJob,
        ':updatedAt': new Date().toISOString()
      }
    };
    await dynamoService.updateItem(INSTITUTE_STUDENTS_TABLE, key, updateParams);
    return true;
  } catch (error) {
    console.error('Error updating placement details:', error);
    return false;
  }
};

const getStudentStats = async (instituteId) => {
  try {
    const students = await getStudentsByInstitute(instituteId);
    const totalStudents = students.length;
    
    if (totalStudents === 0) {
      return { totalStudents: 0, placedStudents: 0, placementRate: 0, avgSalaryPackage: 0 };
    }
    
    // Get job applications to find students hired at least once
    const jobApplicationModel = require('./jobApplicationModel');
    const uniqueHiredStudents = await jobApplicationModel.getUniqueHiredStudentsByInstitute(instituteId);
    const avgSalaryPackage = await jobApplicationModel.getAverageSalaryPackage(instituteId);
    
    const placedStudents = uniqueHiredStudents.length;
    const placementRate = Math.round((placedStudents / totalStudents) * 100);
    
    return {
      totalStudents,
      placedStudents,
      placementRate,
      avgSalaryPackage
    };
  } catch (error) {
    console.error('Error getting student stats:', error);
    return { totalStudents: 0, placedStudents: 0, placementRate: 0, avgSalaryPackage: 0 };
  }
};

const getStudentById = async (studentId) => {
  try {
    return await dynamoService.getItem(INSTITUTE_STUDENTS_TABLE, { instituteStudntsID: studentId });
  } catch (error) {
    console.error('Error getting student by ID:', error);
    return null;
  }
};

const updateStudent = async (studentId, updateData) => {
  try {
    const key = { instituteStudntsID: studentId };
    const updateParams = {
      UpdateExpression: 'SET',
      ExpressionAttributeValues: {},
      ExpressionAttributeNames: {}
    };
    
    const updateExpressions = [];
    Object.keys(updateData).forEach((key, index) => {
      if (key !== 'instituteStudntsID') {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        updateParams.ExpressionAttributeNames[attrName] = key;
        updateParams.ExpressionAttributeValues[attrValue] = updateData[key];
      }
    });
    
    updateParams.UpdateExpression += ` ${updateExpressions.join(', ')}, updatedAt = :updatedAt`;
    updateParams.ExpressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    await dynamoService.updateItem(INSTITUTE_STUDENTS_TABLE, key, updateParams);
    return true;
  } catch (error) {
    console.error('Error updating student:', error);
    return false;
  }
};

const deleteStudent = async (studentId) => {
  try {
    await dynamoService.deleteItem(INSTITUTE_STUDENTS_TABLE, { instituteStudntsID: studentId });
    return true;
  } catch (error) {
    console.error('Error deleting student:', error);
    return false;
  }
};

module.exports = {
  createStudent,
  getStudentsByInstitute,
  getStudentById,
  updateStudent,
  deleteStudent,
  updateStudentPlacementStatus,
  updateStudentPlacementDetails,
  getStudentStats
};