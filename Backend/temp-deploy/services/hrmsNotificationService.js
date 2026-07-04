const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const NOTIFICATIONS_TABLE = 'staffinn-hrms-notifications';

// Notification types
const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_UPDATED: 'TASK_UPDATED',
  LEAVE_APPROVED: 'LEAVE_APPROVED',
  LEAVE_REJECTED: 'LEAVE_REJECTED',
  CLAIM_APPROVED: 'CLAIM_APPROVED',
  CLAIM_REJECTED: 'CLAIM_REJECTED',
  GRIEVANCE_ASSIGNED: 'GRIEVANCE_ASSIGNED',
  GRIEVANCE_UPDATE: 'GRIEVANCE_UPDATE',
  GRIEVANCE_RESOLVED: 'GRIEVANCE_RESOLVED',
  PAYROLL_PROCESSED: 'PAYROLL_PROCESSED',
  ATTENDANCE_ALERT: 'ATTENDANCE_ALERT',
  PERFORMANCE_RATING: 'PERFORMANCE_RATING'
};

// Priority levels
const PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

/**
 * Create a notification
 */
const createNotification = async ({
  employeeId,
  recruiterId,
  type,
  title,
  message,
  relatedEntityId = null,
  relatedEntityType = null,
  actionUrl = null,
  priority = PRIORITY.MEDIUM
}) => {
  try {
    const notificationId = `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const notification = {
      notificationId,
      employeeId,
      recruiterId,
      type,
      title,
      message,
      relatedEntityId,
      relatedEntityType,
      actionUrl,
      priority,
      isRead: false,
      readAt: null,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: NOTIFICATIONS_TABLE,
      Item: notification
    }));

    console.log(`✅ Notification created: ${notificationId} for employee ${employeeId}`);

    // Emit real-time notification via WebSocket
    try {
      const { emitEmployeeNotification } = require('../websocket/websocketServer');
      emitEmployeeNotification(employeeId, notification);
    } catch (wsError) {
      console.error('⚠️ WebSocket emission failed:', wsError.message);
    }

    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

/**
 * Get notifications for an employee
 */
const getEmployeeNotifications = async (employeeId, limit = 50) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: NOTIFICATIONS_TABLE,
      IndexName: 'employeeId-createdAt-index',
      KeyConditionExpression: 'employeeId = :eid',
      ExpressionAttributeValues: { ':eid': employeeId },
      ScanIndexForward: false, // Sort descending (newest first)
      Limit: limit
    }));

    return result.Items || [];
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (employeeId) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: NOTIFICATIONS_TABLE,
      IndexName: 'employeeId-createdAt-index',
      KeyConditionExpression: 'employeeId = :eid',
      FilterExpression: 'isRead = :false',
      ExpressionAttributeValues: { ':eid': employeeId, ':false': false }
    }));

    return result.Items?.length || 0;
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId) => {
  try {
    await docClient.send(new UpdateCommand({
      TableName: NOTIFICATIONS_TABLE,
      Key: { notificationId },
      UpdateExpression: 'SET isRead = :true, readAt = :now, updatedAt = :now',
      ExpressionAttributeValues: {
        ':true': true,
        ':now': new Date().toISOString()
      }
    }));

    console.log(`✅ Notification marked as read: ${notificationId}`);
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for an employee
 */
const markAllAsRead = async (employeeId) => {
  try {
    const notifications = await getEmployeeNotifications(employeeId);
    const unreadNotifications = notifications.filter(n => !n.isRead);

    for (const notification of unreadNotifications) {
      await markAsRead(notification.notificationId);
    }

    console.log(`✅ Marked ${unreadNotifications.length} notifications as read for employee ${employeeId}`);
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    throw error;
  }
};

/**
 * Helper functions for specific notification types
 */

// Task notifications
const notifyTaskAssigned = async (employeeId, recruiterId, taskId, taskTitle, assignedByName) => {
  return createNotification({
    employeeId,
    recruiterId,
    type: NOTIFICATION_TYPES.TASK_ASSIGNED,
    title: 'New Task Assigned',
    message: `${assignedByName} assigned you a new task: ${taskTitle}`,
    relatedEntityId: taskId,
    relatedEntityType: 'TASK',
    actionUrl: `/tasks`,
    priority: PRIORITY.HIGH
  });
};

const notifyTaskUpdated = async (employeeId, recruiterId, taskId, taskTitle, status) => {
  return createNotification({
    employeeId,
    recruiterId,
    type: NOTIFICATION_TYPES.TASK_UPDATED,
    title: 'Task Status Updated',
    message: `Task "${taskTitle}" status updated to ${status}`,
    relatedEntityId: taskId,
    relatedEntityType: 'TASK',
    actionUrl: `/tasks`,
    priority: PRIORITY.MEDIUM
  });
};

// Leave notifications
const notifyLeaveApproved = async (employeeId, recruiterId, leaveId, startDate, endDate) => {
  return createNotification({
    employeeId,
    recruiterId,
    type: NOTIFICATION_TYPES.LEAVE_APPROVED,
    title: 'Leave Approved',
    message: `Your leave request from ${startDate} to ${endDate} has been approved`,
    relatedEntityId: leaveId,
    relatedEntityType: 'LEAVE',
    actionUrl: `/leave`,
    priority: PRIORITY.HIGH
  });
};

const notifyLeaveRejected = async (employeeId, recruiterId, leaveId, startDate, endDate, reason) => {
  return createNotification({
    employeeId,
    recruiterId,
    type: NOTIFICATION_TYPES.LEAVE_REJECTED,
    title: 'Leave Rejected',
    message: `Your leave request from ${startDate} to ${endDate} has been rejected. Reason: ${reason || 'Not specified'}`,
    relatedEntityId: leaveId,
    relatedEntityType: 'LEAVE',
    actionUrl: `/leave`,
    priority: PRIORITY.HIGH
  });
};

// Claim notifications
const notifyClaimApproved = async (employeeId, recruiterId, claimId, amount) => {
  return createNotification({
    employeeId,
    recruiterId,
    type: NOTIFICATION_TYPES.CLAIM_APPROVED,
    title: 'Claim Approved',
    message: `Your claim of ₹${amount} has been approved`,
    relatedEntityId: claimId,
    relatedEntityType: 'CLAIM',
    actionUrl: `/claims`,
    priority: PRIORITY.HIGH
  });
};

const notifyClaimRejected = async (employeeId, recruiterId, claimId, amount, reason) => {
  return createNotification({
    employeeId,
    recruiterId,
    type: NOTIFICATION_TYPES.CLAIM_REJECTED,
    title: 'Claim Rejected',
    message: `Your claim of ₹${amount} has been rejected. Reason: ${reason || 'Not specified'}`,
    relatedEntityId: claimId,
    relatedEntityType: 'CLAIM',
    actionUrl: `/claims`,
    priority: PRIORITY.MEDIUM
  });
};

// Grievance notifications
const notifyGrievanceAssigned = async (employeeId, recruiterId, grievanceId, grievanceTitle) => {
  return createNotification({
    employeeId,
    recruiterId,
    type: NOTIFICATION_TYPES.GRIEVANCE_ASSIGNED,
    title: 'New Grievance Assigned',
    message: `A new grievance has been assigned to you: ${grievanceTitle}`,
    relatedEntityId: grievanceId,
    relatedEntityType: 'GRIEVANCE',
    actionUrl: `/grievances`,
    priority: PRIORITY.HIGH
  });
};

const notifyGrievanceUpdate = async (employeeId, recruiterId, grievanceId, status, updatedBy) => {
  return createNotification({
    employeeId,
    recruiterId,
    type: NOTIFICATION_TYPES.GRIEVANCE_UPDATE,
    title: 'Grievance Status Updated',
    message: `Your grievance status has been updated to ${status} by ${updatedBy}`,
    relatedEntityId: grievanceId,
    relatedEntityType: 'GRIEVANCE',
    actionUrl: `/grievances`,
    priority: PRIORITY.HIGH
  });
};

const notifyGrievanceResolved = async (employeeId, recruiterId, grievanceId) => {
  return createNotification({
    employeeId,
    recruiterId,
    type: NOTIFICATION_TYPES.GRIEVANCE_RESOLVED,
    title: 'Grievance Resolved',
    message: 'Your grievance has been resolved',
    relatedEntityId: grievanceId,
    relatedEntityType: 'GRIEVANCE',
    actionUrl: `/grievances`,
    priority: PRIORITY.HIGH
  });
};

// Payroll notifications
const notifyPayrollProcessed = async (employeeId, recruiterId, payrollId, month, year, amount) => {
  return createNotification({
    employeeId,
    recruiterId,
    type: NOTIFICATION_TYPES.PAYROLL_PROCESSED,
    title: 'Salary Processed',
    message: `Your salary for ${month} ${year} (₹${amount}) has been processed`,
    relatedEntityId: payrollId,
    relatedEntityType: 'PAYROLL',
    actionUrl: `/payroll`,
    priority: PRIORITY.HIGH
  });
};

// Performance notifications
const notifyPerformanceRating = async (employeeId, recruiterId, ratingId, rating, ratedBy) => {
  return createNotification({
    employeeId,
    recruiterId,
    type: NOTIFICATION_TYPES.PERFORMANCE_RATING,
    title: 'New Performance Rating',
    message: `You received a performance rating of ${rating}/5 from ${ratedBy}`,
    relatedEntityId: ratingId,
    relatedEntityType: 'RATING',
    actionUrl: `/tasks`,
    priority: PRIORITY.MEDIUM
  });
};

module.exports = {
  NOTIFICATION_TYPES,
  PRIORITY,
  createNotification,
  getEmployeeNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  // Helper functions
  notifyTaskAssigned,
  notifyTaskUpdated,
  notifyLeaveApproved,
  notifyLeaveRejected,
  notifyClaimApproved,
  notifyClaimRejected,
  notifyGrievanceAssigned,
  notifyGrievanceUpdate,
  notifyGrievanceResolved,
  notifyPayrollProcessed,
  notifyPerformanceRating
};
