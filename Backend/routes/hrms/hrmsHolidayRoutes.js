const express = require('express');
const router = express.Router();
const c = require('../../controllers/hrms/hrmsHolidayController');
const { authenticateToken } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

router.get('/',           c.getHolidays);
router.post('/',          c.createHoliday);
router.put('/:holidayId', c.updateHoliday);
router.delete('/:holidayId', c.deleteHoliday);
router.post('/seed-national', c.seedNationalHolidays);

module.exports = router;
