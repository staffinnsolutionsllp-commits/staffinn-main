/**
 * Test Script for OTP Email Verification
 * Run this to test the OTP flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4001/api';
const TEST_EMAIL = 'test@example.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`)
};

async function testOTPFlow() {
  console.log('\n=== Testing OTP Email Verification Flow ===\n');

  try {
    // Test 1: Send OTP
    log.info('Test 1: Sending OTP to email...');
    const sendOTPResponse = await axios.post(`${BASE_URL}/auth/send-otp`, {
      email: TEST_EMAIL
    });

    if (sendOTPResponse.data.success) {
      log.success('OTP sent successfully');
      console.log('Response:', sendOTPResponse.data);
    } else {
      log.error('Failed to send OTP');
      console.log('Response:', sendOTPResponse.data);
      return;
    }

    // Wait for user to enter OTP
    console.log('\n');
    log.warning('Check your email and enter the OTP below:');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Enter OTP: ', async (otp) => {
      readline.close();

      // Test 2: Verify OTP
      log.info('\nTest 2: Verifying OTP...');
      try {
        const verifyOTPResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
          email: TEST_EMAIL,
          otp: otp.trim()
        });

        if (verifyOTPResponse.data.success) {
          log.success('OTP verified successfully');
          console.log('Response:', verifyOTPResponse.data);

          // Test 3: Register Staff
          log.info('\nTest 3: Registering staff with verified email...');
          const registerResponse = await axios.post(`${BASE_URL}/staff/register`, {
            fullName: 'Test User',
            email: TEST_EMAIL,
            password: 'TestPass123',
            confirmPassword: 'TestPass123',
            phoneNumber: '9876543210'
          });

          if (registerResponse.data.success) {
            log.success('Staff registered successfully');
            console.log('Response:', registerResponse.data);
            console.log('\n=== All Tests Passed! ===\n');
          } else {
            log.error('Registration failed');
            console.log('Response:', registerResponse.data);
          }
        } else {
          log.error('OTP verification failed');
          console.log('Response:', verifyOTPResponse.data);
        }
      } catch (error) {
        log.error('Error during verification or registration');
        console.log('Error:', error.response?.data || error.message);
      }
    });

  } catch (error) {
    log.error('Error during OTP send');
    console.log('Error:', error.response?.data || error.message);
  }
}

// Test error cases
async function testErrorCases() {
  console.log('\n=== Testing Error Cases ===\n');

  try {
    // Test 1: Send OTP without email
    log.info('Test 1: Sending OTP without email...');
    try {
      await axios.post(`${BASE_URL}/auth/send-otp`, {});
    } catch (error) {
      if (error.response?.status === 400) {
        log.success('Correctly rejected request without email');
      } else {
        log.error('Unexpected error');
      }
    }

    // Test 2: Verify OTP without email
    log.info('Test 2: Verifying OTP without email...');
    try {
      await axios.post(`${BASE_URL}/auth/verify-otp`, { otp: '123456' });
    } catch (error) {
      if (error.response?.status === 400) {
        log.success('Correctly rejected verification without email');
      } else {
        log.error('Unexpected error');
      }
    }

    // Test 3: Verify with invalid OTP
    log.info('Test 3: Verifying with invalid OTP...');
    try {
      await axios.post(`${BASE_URL}/auth/verify-otp`, {
        email: TEST_EMAIL,
        otp: '000000'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        log.success('Correctly rejected invalid OTP');
      } else {
        log.error('Unexpected error');
      }
    }

    // Test 4: Register without email verification
    log.info('Test 4: Registering without email verification...');
    try {
      await axios.post(`${BASE_URL}/staff/register`, {
        fullName: 'Test User',
        email: 'unverified@example.com',
        password: 'TestPass123',
        confirmPassword: 'TestPass123',
        phoneNumber: '9876543210'
      });
    } catch (error) {
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('verify')) {
        log.success('Correctly rejected registration without verification');
      } else {
        log.error('Unexpected error');
      }
    }

    console.log('\n=== Error Case Tests Complete ===\n');

  } catch (error) {
    log.error('Error during error case testing');
    console.log('Error:', error.message);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--errors')) {
  testErrorCases();
} else if (args.includes('--help')) {
  console.log(`
Usage: node test-otp-flow.js [options]

Options:
  --errors    Test error cases only
  --help      Show this help message

Default: Run complete OTP flow test
  `);
} else {
  testOTPFlow();
}
