const { dynamoClient, isUsingMockDB, mockDB, HRMS_GRIEVANCES_TABLE, HRMS_EMPLOYEES_TABLE } = require('../config/dynamodb-wrapper');
const { ScanCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { getCurrentTimestamp } = require('../utils/hrmsHelpers');

// Configuration
const ESCALATION_TIMEOUT_MINUTES = parseInt(process.env.ESCALATION_TIMEOUT_MINUTES) || 2;
const ESCALATION_CHECK_INTERVAL_MINUTES = parseInt(process.env.ESCALATION_CHECK_INTERVAL_MINUTES) || 1;

class GrievanceEscalationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start the escalation service
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Escalation service is already running');
      return;
    }

    console.log(`🚀 Starting Grievance Escalation Service`);
    console.log(`⏱️ Escalation timeout: ${ESCALATION_TIMEOUT_MINUTES} minutes`);
    console.log(`🔄 Check interval: ${ESCALATION_CHECK_INTERVAL_MINUTES} minute(s)`);

    this.isRunning = true;
    
    // Run immediately on start
    this.checkAndEscalate();
    
    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.checkAndEscalate();
    }, ESCALATION_CHECK_INTERVAL_MINUTES * 60 * 1000);
  }

  /**
   * Stop the escalation service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Grievance Escalation Service stopped');
  }

  /**
   * Check and escalate grievances that need escalation
   */
  async checkAndEscalate() {
    try {
      console.log('🔍 Checking for grievances to escalate...');
      
      const grievancesToEscalate = await this.findGrievancesForEscalation();
      
      if (grievancesToEscalate.length === 0) {
        console.log('✅ No grievances need escalation at this time');
        return;
      }

      console.log(`📋 Found ${grievancesToEscalate.length} grievance(s) to escalate`);

      for (const grievance of grievancesToEscalate) {
        await this.escalateGrievance(grievance);
      }

      console.log('✅ Escalation check completed');
    } catch (error) {
      console.error('❌ Error in escalation service:', error);
    }
  }

  /**
   * Find grievances that need escalation
   */
  async findGrievancesForEscalation() {
    try {
      let grievances;
      
      if (isUsingMockDB()) {
        grievances = mockDB().scan(HRMS_GRIEVANCES_TABLE);
      } else {
        const scanCommand = new ScanCommand({
          TableName: HRMS_GRIEVANCES_TABLE
        });
        const result = await dynamoClient.send(scanCommand);
        grievances = result.Items || [];
      }

      // Filter grievances that need escalation
      const now = new Date();
      const escalationThreshold = ESCALATION_TIMEOUT_MINUTES * 60 * 1000; // Convert to milliseconds

      return grievances.filter(grievance => {
        // Only escalate if status is submitted or open
        const status = grievance.status?.toLowerCase();
        if (status !== 'submitted' && status !== 'open') {
          return false;
        }

        // Must have an assigned manager
        if (!grievance.assignedTo) {
          return false;
        }

        // Check if enough time has passed since submission or last escalation
        const referenceTime = grievance.lastEscalatedAt || grievance.submittedDate;
        if (!referenceTime) {
          return false;
        }

        const timeSinceReference = now - new Date(referenceTime);
        return timeSinceReference >= escalationThreshold;
      });
    } catch (error) {
      console.error('Error finding grievances for escalation:', error);
      return [];
    }
  }

  /**
   * Escalate a single grievance to the next level
   */
  async escalateGrievance(grievance) {
    try {
      console.log(`⬆️ Escalating grievance ${grievance.grievanceId} (Level ${grievance.escalationLevel || 0})`);

      // Get current assigned manager
      let currentManager;
      if (isUsingMockDB()) {
        currentManager = mockDB().get(HRMS_EMPLOYEES_TABLE, grievance.assignedTo);
      } else {
        const getCommand = new GetCommand({
          TableName: HRMS_EMPLOYEES_TABLE,
          Key: { employeeId: grievance.assignedTo }
        });
        const result = await dynamoClient.send(getCommand);
        currentManager = result.Item;
      }

      if (!currentManager) {
        console.log(`⚠️ Current manager not found for grievance ${grievance.grievanceId}`);
        return;
      }

      // Get next level manager (current manager's manager)
      if (!currentManager.managerId) {
        console.log(`⚠️ No next level manager found for grievance ${grievance.grievanceId} - reached top of hierarchy`);
        return;
      }

      let nextManager;
      if (isUsingMockDB()) {
        nextManager = mockDB().get(HRMS_EMPLOYEES_TABLE, currentManager.managerId);
      } else {
        const getCommand = new GetCommand({
          TableName: HRMS_EMPLOYEES_TABLE,
          Key: { employeeId: currentManager.managerId }
        });
        const result = await dynamoClient.send(getCommand);
        nextManager = result.Item;
      }

      if (!nextManager) {
        console.log(`⚠️ Next level manager not found for grievance ${grievance.grievanceId}`);
        return;
      }

      // Prepare escalation data
      const timestamp = getCurrentTimestamp();
      const newEscalationLevel = (grievance.escalationLevel || 0) + 1;
      
      const escalationHistory = grievance.escalationHistory || [];
      escalationHistory.push({
        level: newEscalationLevel,
        from: grievance.assignedTo,
        fromName: currentManager.fullName,
        to: nextManager.employeeId,
        toName: nextManager.fullName,
        timestamp,
        reason: 'Auto-escalated due to no action'
      });

      const statusHistory = grievance.statusHistory || [];
      statusHistory.push({
        status: grievance.status,
        timestamp,
        changedBy: 'system',
        changedByName: 'System',
        action: `Auto-escalated to ${nextManager.fullName}`,
        assignedToName: nextManager.fullName
      });

      // Update grievance
      const updates = {
        assignedTo: nextManager.employeeId,
        assignedToName: nextManager.fullName,
        assignedToEmail: nextManager.email,
        escalationLevel: newEscalationLevel,
        escalationHistory,
        statusHistory,
        lastEscalatedAt: timestamp
      };

      if (isUsingMockDB()) {
        const updatedGrievance = { ...grievance, ...updates };
        mockDB().put(HRMS_GRIEVANCES_TABLE, updatedGrievance);
      } else {
        const updateExpressions = [];
        const expressionAttributeValues = {};

        Object.keys(updates).forEach((key, index) => {
          updateExpressions.push(`${key} = :val${index}`);
          expressionAttributeValues[`:val${index}`] = updates[key];
        });

        const updateCommand = new UpdateCommand({
          TableName: HRMS_GRIEVANCES_TABLE,
          Key: { grievanceId: grievance.grievanceId },
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeValues: expressionAttributeValues
        });

        await dynamoClient.send(updateCommand);
      }

      console.log(`✅ Grievance ${grievance.grievanceId} escalated from ${currentManager.fullName} to ${nextManager.fullName}`);

      // Emit WebSocket event for real-time notification
      if (global.io) {
        // Notify new manager
        global.io.to(`employee-${nextManager.employeeId}`).emit('grievance-escalated', {
          grievanceId: grievance.grievanceId,
          title: grievance.title,
          priority: grievance.priority,
          escalationLevel: newEscalationLevel,
          employeeName: grievance.employeeName
        });

        // Notify employee
        global.io.to(`employee-${grievance.employeeId}`).emit('grievance-status-update', {
          grievanceId: grievance.grievanceId,
          status: 'escalated',
          escalationLevel: newEscalationLevel,
          assignedTo: nextManager.fullName
        });
      }

    } catch (error) {
      console.error(`❌ Error escalating grievance ${grievance.grievanceId}:`, error);
    }
  }

  /**
   * Get escalation statistics
   */
  async getEscalationStats() {
    try {
      let grievances;
      
      if (isUsingMockDB()) {
        grievances = mockDB().scan(HRMS_GRIEVANCES_TABLE);
      } else {
        const scanCommand = new ScanCommand({
          TableName: HRMS_GRIEVANCES_TABLE
        });
        const result = await dynamoClient.send(scanCommand);
        grievances = result.Items || [];
      }

      const stats = {
        total: grievances.length,
        escalated: grievances.filter(g => (g.escalationLevel || 0) > 0).length,
        level1: grievances.filter(g => g.escalationLevel === 1).length,
        level2: grievances.filter(g => g.escalationLevel === 2).length,
        level3Plus: grievances.filter(g => (g.escalationLevel || 0) >= 3).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting escalation stats:', error);
      return null;
    }
  }
}

// Create singleton instance
const escalationService = new GrievanceEscalationService();

module.exports = escalationService;
