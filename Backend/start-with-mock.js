// Force mock database usage
process.env.USE_MOCK_DB = 'true';

// Start the server
require('./server.js');