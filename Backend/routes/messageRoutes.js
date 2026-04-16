const express = require('express');
const MessageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// All routes require authentication
router.use(authenticate);

// Send a new message
router.post('/send', MessageController.sendMessage);

// Send file message
router.post('/send-file', upload.single('file'), MessageController.sendFileMessage);

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

// Edit message
router.put('/:messageId/:createdAt/edit', MessageController.editMessage);

// Mark message as read
router.put('/:messageId/:createdAt/read', MessageController.markAsRead);

// Delete message
router.delete('/:messageId/:createdAt', MessageController.deleteMessage);

// Delete multiple messages
router.post('/delete-multiple', MessageController.deleteMultipleMessages);

module.exports = router;