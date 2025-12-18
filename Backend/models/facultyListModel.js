const { dynamoClient, FACULTY_LIST_TABLE } = require('../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const facultyListModel = {
  async create(data) {
    try {
      const id = uuidv4();
      const fullAddress = [data.currentAddress, data.currentVillage, data.currentCity, data.currentState, data.currentDistrict].filter(v => v && v.trim()).join(', ');
      
      const item = {
        misfaculty: id,
        instituteId: data.instituteId || '',
        name: data.name || '',
        enrollmentNo: data.enrollmentNo || '',
        dob: data.dob || '',
        gender: data.gender || '',
        mobile: data.mobile || '',
        email: data.email || '',
        qualification: data.qualification || '',
        skills: data.skills || '',
        trainerCode: data.trainerCode || '',
        address: fullAddress || '',
        selectedCourses: data.selectedCourses || []
      };
      
      if (data.profilePhotoUrl && data.profilePhotoUrl.trim()) item.profilePhotoUrl = data.profilePhotoUrl;
      if (data.certificateUrl && data.certificateUrl.trim()) item.certificateUrl = data.certificateUrl;
      if (data.maritalStatus && data.maritalStatus.trim()) item.maritalStatus = data.maritalStatus;
      if (data.registrationDate && data.registrationDate.trim()) item.registrationDate = data.registrationDate;
      if (data.educationStream && data.educationStream.trim()) item.educationStream = data.educationStream;
      
      console.log('Saving to DynamoDB:', item);
      await dynamoClient.send(new PutCommand({ TableName: FACULTY_LIST_TABLE, Item: item }));
      console.log('Saved successfully');
      
      return { id, ...item };
    } catch (error) {
      console.error('Model error:', error);
      throw error;
    }
  },

  async getAll() {
    const { Items } = await dynamoClient.send(new ScanCommand({ TableName: FACULTY_LIST_TABLE }));
    return Items.map(item => ({ id: item.misfaculty, ...item }));
  },

  async getById(id) {
    const { Item } = await dynamoClient.send(new GetCommand({ TableName: FACULTY_LIST_TABLE, Key: { misfaculty: id } }));
    return Item ? { id: Item.misfaculty, ...Item } : null;
  },

  async update(id, data) {
    const fullAddress = [data.currentAddress, data.currentVillage, data.currentCity, data.currentState, data.currentDistrict].filter(Boolean).join(', ');
    const fields = {
      instituteId: data.instituteId,
      profilePhotoUrl: data.profilePhotoUrl,
      enrollmentNo: data.enrollmentNo,
      dob: data.dob,
      name: data.name,
      mobile: data.mobile,
      gender: data.gender,
      email: data.email,
      maritalStatus: data.maritalStatus,
      registrationDate: data.registrationDate,
      qualification: data.qualification,
      educationStream: data.educationStream,
      skills: data.skills,
      trainerCode: data.trainerCode,
      certificateUrl: data.certificateUrl,
      address: fullAddress,
      selectedCourses: data.selectedCourses || []
    };
    
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(fields).forEach((key, index) => {
      if (fields[key] !== undefined && fields[key] !== null) {
        updateExpressions.push(`#attr${index} = :val${index}`);
        expressionAttributeNames[`#attr${index}`] = key;
        expressionAttributeValues[`:val${index}`] = fields[key];
      }
    });

    if (updateExpressions.length > 0) {
      await dynamoClient.send(new UpdateCommand({
        TableName: FACULTY_LIST_TABLE,
        Key: { misfaculty: id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      }));
    }
    return { id, ...fields };
  },

  async delete(id) {
    await dynamoClient.send(new DeleteCommand({ TableName: FACULTY_LIST_TABLE, Key: { misfaculty: id } }));
    return { id };
  },

  async getByInstitute(instituteId) {
    const { Items } = await dynamoClient.send(new ScanCommand({ 
      TableName: FACULTY_LIST_TABLE,
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    }));
    return Items.map(item => ({ id: item.misfaculty, ...item }));
  }
};

module.exports = facultyListModel;
