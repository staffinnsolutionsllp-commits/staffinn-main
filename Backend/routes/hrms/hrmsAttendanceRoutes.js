const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendanceByDate,
  getEmployeeAttendance,
  getAttendanceStats,
  getDeviceStatus,
  syncFromBridge
} = require('../../controllers/hrms/hrmsAttendanceController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');

// Heartbeat endpoint - no auth required
router.post('/heartbeat', (req, res) => {
  const { deviceHeartbeats } = require('../../controllers/hrms/hrmsAttendanceController');
  const companyId = req.body.companyId;
  if (companyId) {
    deviceHeartbeats.set(companyId, Date.now());
    console.log(`💓 Heartbeat received from company: ${companyId}`);
  }
  res.json({ success: true });
});

// Bridge attendance endpoint - uses company ID and API key for auth
router.post('/bridge-attendance', async (req, res) => {
  try {
    const { employeeId, checkIn, date, source, deviceId } = req.body;
    const companyId = req.headers['x-company-id'];
    const apiKey = req.headers['x-api-key'];
    
    if (!companyId || !apiKey) {
      return res.status(401).json({ success: false, message: 'Company ID and API Key required' });
    }
    
    // Validate company credentials and get recruiterId
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
    
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
    const docClient = DynamoDBDocumentClient.from(client);
    const COMPANIES_TABLE = 'staffinn-hrms-companies';
    
    const companyResult = await docClient.send(new GetCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId }
    }));
    
    if (!companyResult.Item) {
      console.log('❌ Company not found:', companyId);
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    if (companyResult.Item.apiKey !== apiKey) {
      console.log('❌ Invalid API key for company:', companyId);
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }
    
    if (!companyResult.Item.recruiterId) {
      console.log('⚠️ Company missing recruiterId:', companyId);
      return res.status(400).json({ 
        success: false, 
        message: 'Company not linked to recruiter. Please contact support.' 
      });
    }
    
    // Set recruiterId from company record
    req.user = { recruiterId: companyResult.Item.recruiterId };
    console.log(`✅ Bridge request authenticated: Company ${companyId} → Recruiter ${companyResult.Item.recruiterId}`);
    
    await markAttendance(req, res);
  } catch (error) {
    console.error('❌ Bridge attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bridge sync endpoint - no auth required for bridge service
router.post('/bridge-sync', syncFromBridge);

// Manual stats endpoint for testing - no auth required
router.get('/manual-stats', async (req, res) => {
  try {
    const { getAttendanceStats } = require('../../controllers/hrms/hrmsAttendanceController');
    await getAttendanceStats(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manual sync endpoint for testing - no auth required
router.get('/manual-sync', async (req, res) => {
  try {
    const { syncFromBridge } = require('../../controllers/hrms/hrmsAttendanceController');
    await syncFromBridge(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.use(authenticateToken);

router.post('/', authorizeRoles('admin', 'hr', 'manager', 'employee'), markAttendance);
router.get('/stats', getAttendanceStats);
router.get('/device-status', getDeviceStatus);
router.get('/date/:date', getAttendanceByDate);
router.get('/employee/:employeeId', getEmployeeAttendance);

module.exports = router;