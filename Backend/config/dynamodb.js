/**
 * DynamoDB Configuration
 * Sets up DynamoDB tables and configuration
 */
const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const awsConfig = require('./aws');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient(awsConfig);

// Define table names
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'staffinn-users';
const STAFF_TABLE = process.env.STAFF_TABLE || 'staffinn-staff-profiles';
const INSTITUTE_PROFILES_TABLE = 'staffinn-institute-profiles';
const CONTACT_TABLE = process.env.CONTACT_HISTORY_TABLE || 'staffinn-contact-history';
const HIRING_TABLE = process.env.HIRING_TABLE || 'staffinn-hiring-records';
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE || 'staffinn-notifications';
const INSTITUTE_COURSES_TABLE = process.env.INSTITUTE_COURSES_TABLE || 'staffinn-institute-courses';
const INSTITUTE_STUDENTS_TABLE = process.env.INSTITUTE_STUDENTS_TABLE || 'staffinn-institute-students';
const JOBS_TABLE = process.env.JOBS_TABLE || 'staffinn-jobs';
const JOB_APPLICATIONS_TABLE = process.env.JOB_APPLICATIONS_TABLE || 'staffinn-job-applications';

// Define table schemas
const usersTableSchema = {
  TableName: USERS_TABLE,
  KeySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

const staffTableSchema = {
  TableName: STAFF_TABLE,
  KeySchema: [
    { AttributeName: 'staffId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'staffId', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

const contactTableSchema = {
  TableName: CONTACT_TABLE,
  KeySchema: [
    { AttributeName: 'contactId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'contactId', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

const hiringTableSchema = {
  TableName: HIRING_TABLE,
  KeySchema: [
    { AttributeName: 'hiringId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'hiringId', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

const instituteProfilesTableSchema = {
  TableName: INSTITUTE_PROFILES_TABLE,
  KeySchema: [
    { AttributeName: 'instituteId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'instituteId', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

const notificationsTableSchema = {
  TableName: NOTIFICATIONS_TABLE,
  KeySchema: [
    { AttributeName: 'notificationId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'notificationId', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

const instituteCoursesTableSchema = {
  TableName: INSTITUTE_COURSES_TABLE,
  KeySchema: [
    { AttributeName: 'instituteCourseID', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'instituteCourseID', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

const instituteStudentsTableSchema = {
  TableName: INSTITUTE_STUDENTS_TABLE,
  KeySchema: [
    { AttributeName: 'instituteStudntsID', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'instituteStudntsID', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

const jobsTableSchema = {
  TableName: JOBS_TABLE,
  KeySchema: [
    { AttributeName: 'jobId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'jobId', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

const jobApplicationsTableSchema = {
  TableName: JOB_APPLICATIONS_TABLE,
  KeySchema: [
    { AttributeName: 'staffinnjob', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'staffinnjob', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

/**
 * Check if a table exists
 * @param {string} tableName - Table name to check
 * @returns {Promise} - True if table exists, false otherwise
 */
const tableExists = async (tableName) => {
  try {
    const command = new ListTablesCommand({});
    const response = await dynamoClient.send(command);
    return response.TableNames.includes(tableName);
  } catch (error) {
    console.error('Error checking if table exists:', error);
    return false;
  }
};

/**
 * Create DynamoDB tables if they don't exist
 */
const createTablesIfNotExist = async () => {
  try {
    // Check if users table exists
    const usersExists = await tableExists(USERS_TABLE);
    
    if (!usersExists) {
      // Create users table
      await dynamoClient.send(new CreateTableCommand(usersTableSchema));
      console.log(`Created table: ${USERS_TABLE}`);
    } else {
      console.log(`Table already exists: ${USERS_TABLE}`);
    }
    
    // Check if staff table exists
    const staffExists = await tableExists(STAFF_TABLE);
    
    if (!staffExists) {
      // Create staff table
      await dynamoClient.send(new CreateTableCommand(staffTableSchema));
      console.log(`Created table: ${STAFF_TABLE}`);
    } else {
      console.log(`Table already exists: ${STAFF_TABLE}`);
    }
    
    // Check if contact history table exists
    const contactExists = await tableExists(CONTACT_TABLE);
    
    if (!contactExists) {
      // Create contact history table
      await dynamoClient.send(new CreateTableCommand(contactTableSchema));
      console.log(`Created table: ${CONTACT_TABLE}`);
    } else {
      console.log(`Table already exists: ${CONTACT_TABLE}`);
    }
    
    // Check if hiring table exists
    const hiringExists = await tableExists(HIRING_TABLE);
    
    if (!hiringExists) {
      // Create hiring table
      await dynamoClient.send(new CreateTableCommand(hiringTableSchema));
      console.log(`Created table: ${HIRING_TABLE}`);
    } else {
      console.log(`Table already exists: ${HIRING_TABLE}`);
    }
    
    // Check if institute profiles table exists
    const instituteProfilesExists = await tableExists(INSTITUTE_PROFILES_TABLE);
    
    if (!instituteProfilesExists) {
      // Create institute profiles table
      await dynamoClient.send(new CreateTableCommand(instituteProfilesTableSchema));
      console.log(`Created table: ${INSTITUTE_PROFILES_TABLE}`);
    } else {
      console.log(`Table already exists: ${INSTITUTE_PROFILES_TABLE}`);
    }
    
    // Check if notifications table exists
    const notificationsExists = await tableExists(NOTIFICATIONS_TABLE);
    
    if (!notificationsExists) {
      // Create notifications table
      await dynamoClient.send(new CreateTableCommand(notificationsTableSchema));
      console.log(`Created table: ${NOTIFICATIONS_TABLE}`);
    } else {
      console.log(`Table already exists: ${NOTIFICATIONS_TABLE}`);
    }
    
    // Check if institute courses table exists
    const instituteCoursesExists = await tableExists(INSTITUTE_COURSES_TABLE);
    
    if (!instituteCoursesExists) {
      // Create institute courses table
      await dynamoClient.send(new CreateTableCommand(instituteCoursesTableSchema));
      console.log(`Created table: ${INSTITUTE_COURSES_TABLE}`);
    } else {
      console.log(`Table already exists: ${INSTITUTE_COURSES_TABLE}`);
    }
    
    // Check if institute students table exists
    const instituteStudentsExists = await tableExists(INSTITUTE_STUDENTS_TABLE);
    
    if (!instituteStudentsExists) {
      // Create institute students table
      await dynamoClient.send(new CreateTableCommand(instituteStudentsTableSchema));
      console.log(`Created table: ${INSTITUTE_STUDENTS_TABLE}`);
    } else {
      console.log(`Table already exists: ${INSTITUTE_STUDENTS_TABLE}`);
    }
    
    // Check if jobs table exists
    const jobsExists = await tableExists(JOBS_TABLE);
    
    if (!jobsExists) {
      // Create jobs table
      await dynamoClient.send(new CreateTableCommand(jobsTableSchema));
      console.log(`Created table: ${JOBS_TABLE}`);
    } else {
      console.log(`Table already exists: ${JOBS_TABLE}`);
    }
    
    // Check if job applications table exists
    const jobApplicationsExists = await tableExists(JOB_APPLICATIONS_TABLE);
    
    if (!jobApplicationsExists) {
      // Create job applications table
      await dynamoClient.send(new CreateTableCommand(jobApplicationsTableSchema));
      console.log(`Created table: ${JOB_APPLICATIONS_TABLE}`);
    } else {
      console.log(`Table already exists: ${JOB_APPLICATIONS_TABLE}`);
    }
  } catch (error) {
    // ResourceInUseException means table already exists
    if (error.name === 'ResourceInUseException') {
      console.log('Table already exists');
    } else {
      console.error('Error creating DynamoDB tables:', error);
      throw error;
    }
  }
};

module.exports = {
  dynamoClient,
  USERS_TABLE,
  STAFF_TABLE,
  INSTITUTE_PROFILES_TABLE,
  CONTACT_TABLE,
  HIRING_TABLE,
  NOTIFICATIONS_TABLE,
  INSTITUTE_COURSES_TABLE,
  INSTITUTE_STUDENTS_TABLE,
  JOBS_TABLE,
  JOB_APPLICATIONS_TABLE,
  createTablesIfNotExist
};