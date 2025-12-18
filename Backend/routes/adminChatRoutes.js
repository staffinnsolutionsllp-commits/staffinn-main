const express = require('express');
const AdminChatController = require('../controllers/adminChatController');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Get all conversations
router.get('/conversations', AdminChatController.getAllConversations);

// Get chat history between two users
router.get('/history/:user1Id/:user2Id', AdminChatController.getChatHistory);

module.exports = router;