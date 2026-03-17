const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByDepartment,
  getEmployeeStats,
  getEmployeeCredentials
} = require('../../controllers/hrms/hrmsEmployeeController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

router.get('/stats', getEmployeeStats);
router.post('/', authorizeRoles('admin', 'hr'), createEmployee);
router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);
router.get('/:id/credentials', authorizeRoles('admin', 'hr'), getEmployeeCredentials);
router.put('/:id', authorizeRoles('admin', 'hr'), updateEmployee);
router.delete('/:id', authorizeRoles('admin', 'hr'), deleteEmployee);
router.get('/department/:departmentId', getEmployeesByDepartment);

module.exports = router;