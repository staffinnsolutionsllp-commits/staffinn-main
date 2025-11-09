/**
 * Debug Institutes and Students Count
 * Test script to debug the counting issues
 */

const dynamoService = require('./services/dynamoService');

async function debugInstitutesAndStudents() {
  try {
    console.log('🔍 Debugging Institutes and Students Count...\n');
    
    // Check Users table for institutes
    console.log('1. Checking Users table for institutes...');
    const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'staffinn-users';
    const allUsers = await dynamoService.scanItems(USERS_TABLE);
    console.log('Total users found:', allUsers.length);
    
    const institutes = allUsers.filter(user => user.role === 'institute');
    console.log('Total institutes found:', institutes.length);
    
    if (institutes.length > 0) {
      console.log('Sample institute user:', {
        userId: institutes[0].userId,
        email: institutes[0].email,
        role: institutes[0].role,
        createdAt: institutes[0].createdAt
      });
    }
    
    // Check Students table
    console.log('\n2. Checking Students table...');
    const STUDENTS_TABLE = 'staffinn-institute-students';
    
    try {
      const allStudents = await dynamoService.scanItems(STUDENTS_TABLE);
      console.log('Total students found:', allStudents.length);
      
      if (allStudents.length > 0) {
        console.log('Sample student:', {
          studentId: allStudents[0].studentId || allStudents[0].instituteStudntsID,
          instituteId: allStudents[0].instituteId,
          fullName: allStudents[0].fullName || allStudents[0].name,
          createdAt: allStudents[0].createdAt || allStudents[0].addedDate
        });
      }
    } catch (error) {
      console.error('❌ Error accessing students table:', error.message);
      console.log('Table might not exist or be empty');
    }
    
    // Check Institute Profiles table
    console.log('\n3. Checking Institute Profiles table...');
    const INSTITUTE_PROFILES_TABLE = 'staffinn-institute-profiles';
    
    try {
      const instituteProfiles = await dynamoService.scanItems(INSTITUTE_PROFILES_TABLE);
      console.log('Total institute profiles found:', instituteProfiles.length);
      
      if (instituteProfiles.length > 0) {
        console.log('Sample institute profile:', {
          instituteId: instituteProfiles[0].instituteId,
          instituteName: instituteProfiles[0].instituteName,
          createdAt: instituteProfiles[0].createdAt
        });
      }
    } catch (error) {
      console.error('❌ Error accessing institute profiles table:', error.message);
      console.log('Table might not exist or be empty');
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('- Users with role "institute":', institutes.length);
    console.log('- Students in students table: Checking...');
    
    try {
      const studentCount = await dynamoService.scanItems(STUDENTS_TABLE);
      console.log('- Students in students table:', studentCount.length);
    } catch (error) {
      console.log('- Students in students table: 0 (table error)');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Load environment variables
require('dotenv').config();

// Run the debug
debugInstitutesAndStudents();