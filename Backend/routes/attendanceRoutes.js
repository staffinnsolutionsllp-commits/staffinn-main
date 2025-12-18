const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, attendanceController.markAttendance);
router.get('/', authenticate, attendanceController.getAttendance);
router.get('/all', authenticate, attendanceController.getAllAttendance);

module.exports = router;