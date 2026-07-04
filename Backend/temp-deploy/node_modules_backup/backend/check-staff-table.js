/**
 * Script to check staff table structure
 */

// Load environment variables
require('dotenv').config();

const dynamoService = require('./services/dynamoService');

async function checkStaffTable() {
  try {
    const STAFF_TABLE = process.env.STAFF_TABLE || 'staffinn-staff-profiles';
    
    console.log('Checking staff table:', STAFF_TABLE);
    
    // Try to scan the table to see its structure
    const items = await dynamoService.scanItems(STAFF_TABLE);
    console.log('Items in staff table:', items.length);
    
    if (items.length > 0) {
      console.log('Sample item:', JSON.stringify(items[0], null, 2));
    } else {
      console.log('Table is empty');
    }
    
    // Try to create a test item with userId as key
    const testItem = {
      userId: 'test-user-id',
      fullName: 'Test User',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    };
    
    console.log('Trying to put test item...');
    await dynamoService.putItem(STAFF_TABLE, testItem);
    console.log('✅ Test item created successfully');
    
    // Clean up test item
    await dynamoService.deleteItem(STAFF_TABLE, { userId: 'test-user-id' });
    console.log('✅ Test item deleted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
checkStaffTable();