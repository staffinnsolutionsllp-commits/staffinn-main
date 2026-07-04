/**
 * Mock Database Initialization for Recruiter Campus Invites
 * Use this when AWS credentials are not available
 */

const fs = require('fs');
const path = require('path');

const MOCK_DATA_DIR = path.join(__dirname, '..', 'mock-data');
const INVITES_FILE = path.join(MOCK_DATA_DIR, 'recruiter-campus-invites.json');

const initMockDatabase = () => {
  try {
    // Create mock-data directory if it doesn't exist
    if (!fs.existsSync(MOCK_DATA_DIR)) {
      fs.mkdirSync(MOCK_DATA_DIR, { recursive: true });
      console.log('✅ Created mock-data directory');
    }

    // Initialize empty invites array if file doesn't exist
    if (!fs.existsSync(INVITES_FILE)) {
      const initialData = {
        invites: [],
        metadata: {
          tableName: 'recruiter-campus-invites',
          createdAt: new Date().toISOString(),
          description: 'Mock data for recruiter campus invites (RECRUITER → INSTITUTE flow)'
        }
      };
      
      fs.writeFileSync(INVITES_FILE, JSON.stringify(initialData, null, 2));
      console.log('✅ Created recruiter-campus-invites.json mock database');
      console.log(`📁 Location: ${INVITES_FILE}`);
    } else {
      console.log('ℹ️  Mock database already exists');
      console.log(`📁 Location: ${INVITES_FILE}`);
    }

    console.log('\n✨ Mock database initialization completed successfully!');
    console.log('🚀 You can now use the frontend components - they will work with mock data');
    
  } catch (error) {
    console.error('❌ Error initializing mock database:', error.message);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  initMockDatabase();
}

module.exports = { initMockDatabase };
