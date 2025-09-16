#!/usr/bin/env node

const { runAllTests } = require('./test-course-flow');

console.log('🧪 Course Submission Flow Test Runner');
console.log('=====================================\n');

// Instructions for running tests
console.log('📋 Test Instructions:');
console.log('1. Make sure the backend server is running on port 4001');
console.log('2. Update TEST_TOKEN in test-course-flow.js with a valid institute token');
console.log('3. Ensure you have proper AWS S3 credentials configured');
console.log('4. Run: node run-course-tests.js\n');

// Check for required dependencies
try {
  require('form-data');
  require('node-fetch');
  console.log('✅ Required dependencies found\n');
} catch (error) {
  console.log('❌ Missing dependencies. Please install:');
  console.log('npm install form-data node-fetch\n');
  process.exit(1);
}

// Run the tests
runAllTests()
  .then(() => {
    console.log('\n✅ Test execution completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });