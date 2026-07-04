const express = require('express');
const router = express.Router();
const c = require('../../controllers/hrms/hrmsPayrollController');
const { authenticateToken } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

router.post('/run',                          c.runPayroll);
router.get('/runs',                          c.getPayrollRuns);
router.get('/run/:runId',                    c.getPayrollByRun);
router.get('/summary',                       c.getPayrollSummary);
router.get('/month/:month',                  c.getPayrollByMonth);
router.get('/employee/:employeeId',          c.getEmployeePayrollHistory);
router.get('/:payrollRecordId/:month',       c.getPayrollRecord);

module.exports = router;
