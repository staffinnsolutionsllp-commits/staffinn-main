const express = require('express');
const router = express.Router();
const payrollController = require('../../controllers/hrms/hrmsPayrollController');
const { authenticateToken } = require('../../middleware/hrmsAuth');

// Run payroll for a month
router.post('/run', authenticateToken, payrollController.runPayroll);

// Get payroll records for a specific month
router.get('/month/:month', authenticateToken, payrollController.getPayrollByMonth);

// Get payroll summary
router.get('/summary', authenticateToken, payrollController.getPayrollSummary);

// Get employee payroll history
router.get('/employee/:employeeId', authenticateToken, payrollController.getEmployeePayrollHistory);

// Get single payroll record
router.get('/:payrollRecordId/:month', authenticateToken, payrollController.getPayrollRecord);

module.exports = router;
