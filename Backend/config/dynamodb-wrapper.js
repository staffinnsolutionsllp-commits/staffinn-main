/**
 * DynamoDB Wrapper
 * Provides fallback to mock service when DynamoDB Local is not available
 */

const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const awsConfig = require('./aws');

let useMockDB = false;
let mockDB = null;

// Try to initialize real DynamoDB client
const dynamoClient = new DynamoDBClient(awsConfig);

// Test connection to DynamoDB
const testConnection = async () => {
  try {
    console.log('🔍 Testing AWS DynamoDB connection...');
    const command = new ListTablesCommand({});
    await dynamoClient.send(command);
    console.log('✅ Using real AWS DynamoDB');
    return true;
  } catch (error) {
    console.log('⚠️  AWS DynamoDB connection failed:', error.message);
    console.log('🔄 Falling back to mock database for local development');
    useMockDB = true;
    if (!mockDB) {
      mockDB = require('../mock-dynamodb');
    }
    return false;
  }
};

// Initialize connection
testConnection().catch(console.error);

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
const RECRUITER_NEWS_TABLE = process.env.RECRUITER_NEWS_TABLE || 'recruiter-news';
const ISSUES_TABLE = process.env.DYNAMODB_ISSUES_TABLE || 'staffinn-issue-section';
const ADMIN_TABLE = process.env.ADMIN_TABLE || 'staffinn-admin';
const QUIZ_PROGRESS_TABLE = process.env.QUIZ_PROGRESS_TABLE || 'user-quiz-progress';

const createTablesIfNotExist = async () => {
  try {
    await testConnection();
    
    if (useMockDB) {
      // Initialize mock tables
      mockDB.createTable(USERS_TABLE);
      mockDB.createTable(STAFF_TABLE);
      mockDB.createTable(INSTITUTE_PROFILES_TABLE);
      mockDB.createTable(CONTACT_TABLE);
      mockDB.createTable(HIRING_TABLE);
      mockDB.createTable(NOTIFICATIONS_TABLE);
      mockDB.createTable(INSTITUTE_COURSES_TABLE);
      mockDB.createTable(INSTITUTE_STUDENTS_TABLE);
      mockDB.createTable(JOBS_TABLE);
      mockDB.createTable(JOB_APPLICATIONS_TABLE);
      mockDB.createTable(RECRUITER_NEWS_TABLE);
      mockDB.createTable(ISSUES_TABLE);
      mockDB.createTable(ADMIN_TABLE);
      mockDB.createTable(QUIZ_PROGRESS_TABLE);
      console.log('Mock database tables initialized');
      return;
    }

    // Use original DynamoDB logic
    const originalConfig = require('./dynamodb');
    await originalConfig.createTablesIfNotExist();
  } catch (error) {
    console.error('Error creating tables:', error);
    // Fall back to mock DB
    useMockDB = true;
    if (!mockDB) mockDB = require('../mock-dynamodb');
  }
};

module.exports = {
  dynamoClient: useMockDB ? null : dynamoClient,
  mockDB: () => mockDB,
  isUsingMockDB: () => useMockDB,
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
  RECRUITER_NEWS_TABLE,
  ISSUES_TABLE,
  ADMIN_TABLE,
  QUIZ_PROGRESS_TABLE,
  createTablesIfNotExist
};