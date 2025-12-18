const express = require('express');
const router = express.Router();
const { protect, authenticateAdmin } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const facultyListController = require('../controllers/facultyListController');

// Allow both institute and admin access
const allowInstituteOrAdmin = (req, res, next) => {
  // Try admin auth first
  authenticateAdmin(req, res, (err) => {
    if (!err) {
      return next();
    }
    // If admin auth fails, try institute auth
    protect(req, res, next);
  });
};

router.post('/upload-photo', protect, uploadSingle('profilePhoto'), facultyListController.uploadProfilePhoto);
router.post('/', protect, uploadSingle('certificate'), facultyListController.create);
router.get('/', protect, facultyListController.getAll);
router.get('/institute/:instituteId', allowInstituteOrAdmin, facultyListController.getByInstitute);
router.put('/:id', protect, uploadSingle('certificate'), facultyListController.update);
router.delete('/:id', allowInstituteOrAdmin, facultyListController.delete);

module.exports = router;
