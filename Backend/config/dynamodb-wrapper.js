/**
 * DynamoDB Wrapper
 * Provides fallback to mock service when DynamoDB Local is not available
 */

const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const awsConfig = require('./aws');

let useMockDB = false;
let mockDB = null;

// Try to initialize real DynamoDB client
const client = new DynamoDBClient(awsConfig);
const dynamoClient = DynamoDBDocumentClient.from(client);

// Test connection to DynamoDB
const testConnection = async () => {
  try {
    console.log('🔍 Testing AWS DynamoDB connection...');
    const command = new ListTablesCommand({});
    await client.send(command);
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
const REGISTRATION_REQUESTS_TABLE = process.env.REGISTRATION_REQUESTS_TABLE || 'staffinn-registration-requests';
const MIS_REQUESTS_TABLE = process.env.MIS_REQUESTS_TABLE || 'staffinn-mis-requests';
const MESSAGES_TABLE = process.env.MESSAGES_TABLE || 'Messages';
const FACULTY_LIST_TABLE = process.env.FACULTY_LIST_TABLE || 'mis-faculty-list';
const MIS_PLACEMENT_ANALYTICS_TABLE = process.env.MIS_PLACEMENT_ANALYTICS_TABLE || 'staffinn-mis-placement-analytics';

// HRMS Tables
const HRMS_USERS_TABLE = process.env.HRMS_USERS_TABLE || 'staffinn-hrms-users';
const HRMS_EMPLOYEES_TABLE = process.env.HRMS_EMPLOYEES_TABLE || 'staffinn-hrms-employees';
const HRMS_LEAVES_TABLE = process.env.HRMS_LEAVES_TABLE || 'HRMS-Leaves-Table';
const HRMS_ATTENDANCE_TABLE = process.env.HRMS_ATTENDANCE_TABLE || 'staffinn-hrms-attendance';
const HRMS_GRIEVANCES_TABLE = process.env.HRMS_GRIEVANCES_TABLE || 'staffinn-hrms-grievances';
const HRMS_GRIEVANCE_COMMENTS_TABLE = process.env.HRMS_GRIEVANCE_COMMENTS_TABLE || 'staffinn-hrms-grievance-comments';
const HRMS_ORGANIZATION_CHART_TABLE = process.env.HRMS_ORGANIZATION_CHART_TABLE || 'staffinn-hrms-organization-chart';
const HRMS_PAYROLL_TABLE = process.env.HRMS_PAYROLL_TABLE || 'staffinn-hrms-payroll';

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
      mockDB.createTable(REGISTRATION_REQUESTS_TABLE);
      mockDB.createTable(MIS_REQUESTS_TABLE);
      mockDB.createTable(MESSAGES_TABLE);
      mockDB.createTable(FACULTY_LIST_TABLE);
      mockDB.createTable(MIS_PLACEMENT_ANALYTICS_TABLE);
      
      // HRMS Tables
      mockDB.createTable(HRMS_USERS_TABLE);
      mockDB.createTable(HRMS_EMPLOYEES_TABLE);
      mockDB.createTable(HRMS_LEAVES_TABLE);
      mockDB.createTable(HRMS_ATTENDANCE_TABLE);
      mockDB.createTable(HRMS_GRIEVANCES_TABLE);
      mockDB.createTable(HRMS_GRIEVANCE_COMMENTS_TABLE);
      mockDB.createTable(HRMS_ORGANIZATION_CHART_TABLE);
      mockDB.createTable(HRMS_PAYROLL_TABLE);
      
      console.log('Mock database tables initialized (including HRMS tables)');
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
  REGISTRATION_REQUESTS_TABLE,
  MIS_REQUESTS_TABLE,
  MESSAGES_TABLE,
  FACULTY_LIST_TABLE,
  MIS_PLACEMENT_ANALYTICS_TABLE,
  // HRMS Tables
  HRMS_USERS_TABLE,
  HRMS_EMPLOYEES_TABLE,
  HRMS_LEAVES_TABLE,
  HRMS_ATTENDANCE_TABLE,
  HRMS_GRIEVANCES_TABLE,
  HRMS_GRIEVANCE_COMMENTS_TABLE,
  HRMS_ORGANIZATION_CHART_TABLE,
  HRMS_PAYROLL_TABLE,
  createTablesIfNotExist
};