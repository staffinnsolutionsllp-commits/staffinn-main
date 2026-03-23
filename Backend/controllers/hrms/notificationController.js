const {
  getEmployeeNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require('../../services/hrmsNotificationService');

// Get all notifications for logged-in employee
const getMyNotifications = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const limit = parseInt(req.query.limit) || 50;

    console.log(`📬 Fetching notifications for employee: ${employeeId}`);

    const notifications = await getEmployeeNotifications(employeeId, limit);

    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get unread notification count
const getUnreadNotificationCount = async (req, res) => {
  try {
    const { employeeId } = req.user;

    const count = await getUnreadCount(employeeId);

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('❌ Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark single notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await markAsRead(notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { employeeId } = req.user;

    await markAllAsRead(employeeId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('❌ Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
