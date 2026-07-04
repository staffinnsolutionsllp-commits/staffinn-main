/**
 * Test script to simulate MIS approval for testing real-time updates
 * Run this script to test the real-time approval flow
 */

const { emitMisStatusUpdate } = require('./websocket/websocketServer');

// Test function to simulate admin approval
const testMisApproval = (instituteId, status = 'approved') => {
    console.log(`🧪 Testing MIS ${status} for institute: ${instituteId}`);
    
    // Emit the status update
    emitMisStatusUpdate(instituteId, status);
    
    console.log(`📡 MIS status update emitted: ${status}`);
    console.log(`🎯 Institute ${instituteId} should receive real-time update`);
};

// Export for use in other files
module.exports = { testMisApproval };

// If run directly, test with sample data
if (require.main === module) {
    // Sample institute ID - replace with actual ID for testing
    const sampleInstituteId = 'test-institute-123';
    
    console.log('🚀 Starting MIS approval test...');
    
    // Test approval
    setTimeout(() => {
        testMisApproval(sampleInstituteId, 'approved');
    }, 2000);
    
    // Test rejection (optional)
    setTimeout(() => {
        testMisApproval(sampleInstituteId, 'rejected');
    }, 5000);
    
    console.log('✅ Test script running. Check frontend for real-time updates.');
}