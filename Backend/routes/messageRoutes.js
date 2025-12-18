const express = require('express');
const MessageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Send a new message
router.post('/send', MessageController.sendMessage);

// Get inbox messages
router.get('/inbox', MessageController.getInboxMessages);

// Get sent messages
router.get('/sent', MessageController.getSentMessages);

// Get unread message count
router.get('/unread-count', MessageController.getUnreadCount);

// Get conversation with specific user
router.get('/conversation/:userId', MessageController.getConversation);

// Get contact history
router.get('/contact-history', MessageController.getContactHistory);

// Get unread count for specific conversation
router.get('/conversation/:userId/unread-count', MessageController.getConversationUnreadCount);

// Get specific message
router.get('/:messageId/:createdAt', MessageController.getMessage);

// Mark message as read
router.put('/:messageId/:createdAt/read', MessageController.markAsRead);

// Delete message
router.delete('/:messageId/:createdAt', MessageController.deleteMessage);

module.exports = router;