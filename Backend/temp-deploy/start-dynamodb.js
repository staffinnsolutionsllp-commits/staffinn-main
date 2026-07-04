const DynamoDbLocal = require('dynamodb-local');

console.log('Starting DynamoDB Local on port 8000...');

DynamoDbLocal.launch(8000, null, ['-sharedDb'], true)
  .then(() => {
    console.log('✅ DynamoDB Local started successfully on port 8000');
    console.log('📍 Endpoint: http://localhost:8000');
  })
  .catch((error) => {
    console.error('❌ Failed to start DynamoDB Local:', error);
    process.exit(1);
  });