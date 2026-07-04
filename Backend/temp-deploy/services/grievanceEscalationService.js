/**
 * Grievance Escalation Service
 * Automatically escalates grievances that have no action within 2 minutes
 */

const { checkAndEscalateGrievances } = require('../controllers/hrms/employeePortalController');

let escalationInterval = null;

const startEscalationService = () => {
  if (escalationInterval) {
    console.log('⚠️ Escalation service already running');
    return;
  }

  console.log('🚀 Starting Grievance Escalation Service...');
  console.log('⏰ Checking for escalations every 30 seconds');

  // Run immediately on start
  checkAndEscalateGrievances();

  // Then run every 30 seconds
  escalationInterval = setInterval(() => {
    checkAndEscalateGrievances();
  }, 30000); // 30 seconds

  console.log('✅ Grievance Escalation Service started');
};

const stopEscalationService = () => {
  if (escalationInterval) {
    clearInterval(escalationInterval);
    escalationInterval = null;
    console.log('🛑 Grievance Escalation Service stopped');
  }
};

module.exports = {
  startEscalationService,
  stopEscalationService
};
