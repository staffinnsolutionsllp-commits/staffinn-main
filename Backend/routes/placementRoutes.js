/**
 * Placement Routes
 * Routes for placement analytics
 *
 * PRODUCTION ROUTES ONLY — all test/debug/v2/bulletproof/ultra-safe-*-sector-wise
 * routes removed (OPT-17). Only endpoints actually called by the frontend are kept.
 * Kept:
 *   ultra-safe-student-wise      (used by getPlacementAnalyticsStudentWise in api.js)
 *   ultra-safe-student-status/:id (used by getStudentPlacementStatus in api.js)
 *   student-wise-unique          (used by getStudentWiseAnalytics / getMISStudentWiseAnalytics)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getAllPlacements,
  getPlacementStats,
  getPlacementsByType,
  getPlacementsByInstitute,
  getPlacementsByRecruiter,
  getDashboardSummary,
  getStudentWiseAnalytics,
  getSectorWiseAnalytics,
  getCenterWiseAnalytics,
  getStudentStatus,
  getTrainingCenters,
  getCenterWiseStudents,
  getPlacementTracking
} = require('../controllers/placementController');

// ── Core authenticated routes ─────────────────────────────────────────────────

router.get('/placement-tracking', authenticate, getPlacementTracking);
router.get('/', authenticate, getAllPlacements);
router.get('/stats', authenticate, getPlacementStats);
router.get('/type/:type', authenticate, getPlacementsByType);
router.get('/institute/:instituteId', authenticate, getPlacementsByInstitute);
router.get('/recruiter/:recruiterId', authenticate, getPlacementsByRecruiter);

// Dashboard & analytics
router.get('/dashboard-summary', authenticate, getDashboardSummary);
router.get('/analytics/student-wise', authenticate, getStudentWiseAnalytics);
router.get('/analytics/sector-wise', authenticate, getSectorWiseAnalytics);
router.get('/analytics/center-wise', authenticate, getCenterWiseAnalytics);
router.get('/student-status/:studentId', authenticate, getStudentStatus);
router.get('/training-centers', authenticate, getTrainingCenters);
router.get('/center-wise-students/:centerId', authenticate, getCenterWiseStudents);

// ── ultra-safe-student-status — used by getStudentPlacementStatus in api.js ──

router.get('/ultra-safe-student-status/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const MisPlacementAnalytics = require('../models/misPlacementAnalyticsModel');

    const allPlacements = await MisPlacementAnalytics.getAllMisPlacements() || [];
    const studentPlacements = allPlacements.filter(p => p.studentId === studentId) || [];

    const misStudentModel = require('../models/misStudentModel');
    let studentInfo = null;
    try {
      studentInfo = await misStudentModel.getById(studentId);
    } catch (e) {
      // non-fatal
    }

    const hiredCompanies = studentPlacements
      .filter(p => p.status === 'Hired')
      .map(p => ({
        companyName: p.companyName || 'Unknown Company',
        jobTitle: p.jobTitle || 'Unknown Position',
        hiredDate: p.hiredDate || p.appliedDate || new Date().toISOString(),
        salaryPackage: p.salaryPackage || 'Not specified',
        appliedDate: p.appliedDate || new Date().toISOString()
      }));

    const rejectedCompanies = studentPlacements
      .filter(p => p.status === 'Rejected')
      .map(p => ({
        companyName: p.companyName || 'Unknown Company',
        jobTitle: p.jobTitle || 'Unknown Position',
        rejectedDate: p.rejectedDate || p.appliedDate || new Date().toISOString(),
        appliedDate: p.appliedDate || new Date().toISOString()
      }));

    const pendingCompanies = studentPlacements
      .filter(p => p.status === 'Applied' || p.status === 'Pending')
      .map(p => ({
        companyName: p.companyName || 'Unknown Company',
        jobTitle: p.jobTitle || 'Unknown Position',
        appliedDate: p.appliedDate || new Date().toISOString()
      }));

    res.json({
      success: true,
      data: {
        studentId,
        studentName: studentInfo?.fatherName || 'MIS Student',
        studentQualification: studentInfo?.qualification || 'N/A',
        hiredCompanies:   { count: hiredCompanies.length,   companies: hiredCompanies },
        rejectedCompanies:{ count: rejectedCompanies.length, companies: rejectedCompanies },
        pendingCompanies: { count: pendingCompanies.length,  companies: pendingCompanies },
        totalApplications: studentPlacements.length,
        currentStatus: studentPlacements.length > 0
          ? studentPlacements[studentPlacements.length - 1].status
          : 'Not Applied'
      }
    });
  } catch (error) {
    console.error('Error getting student placement status:', error);
    res.json({
      success: true,
      data: {
        studentId: req.params.studentId || 'unknown',
        studentName: 'MIS Student',
        studentQualification: 'N/A',
        hiredCompanies:   { count: 0, companies: [] },
        rejectedCompanies:{ count: 0, companies: [] },
        pendingCompanies: { count: 0, companies: [] },
        totalApplications: 0,
        currentStatus: 'Not Applied'
      }
    });
  }
});

// ── ultra-safe-student-wise — used by getPlacementAnalyticsStudentWise in api.js ─

router.get('/ultra-safe-student-wise', async (req, res) => {
  try {
    const MisPlacementAnalytics = require('../models/misPlacementAnalyticsModel');
    const batchModel = require('../models/batchModel');
    const CourseDetailModel = require('../models/courseDetailModel');

    const allPlacements = await MisPlacementAnalytics.getAllMisPlacements() || [];
    const allBatches = await batchModel.getAll() || [];
    const allCourses = await CourseDetailModel.getAll() || [];

    const studentMap = {};
    allPlacements.forEach(placement => {
      const studentId = placement.studentId;
      if (!studentMap[studentId]) {
        const studentBatches = allBatches.filter(batch =>
          batch.selectedStudents && batch.selectedStudents.includes(studentId)
        );
        const studentCourses = studentBatches.map(batch =>
          allCourses.find(course => course.id === batch.courseId)
        ).filter(Boolean);

        studentMap[studentId] = {
          studentId,
          studentName: placement.studentName || 'Unknown',
          qualification: placement.qualification || 'N/A',
          center: placement.center || 'Unknown',
          course: [...new Set(studentCourses.map(c => c.course).filter(Boolean))].join(', ') || 'N/A',
          batch: [...new Set(studentBatches.map(b => b.batchId).filter(Boolean))].join(', ') || 'N/A',
          sector: [...new Set(studentCourses.map(c => c.sector).filter(Boolean))].join(', ') || 'General',
          placements: []
        };
      }
      studentMap[studentId].placements.push(placement);
    });

    const studentData = Object.values(studentMap).map(student => {
      const hiredCount = student.placements.filter(p => p.status === 'Hired').length;
      const latestPlacement = student.placements[student.placements.length - 1];
      return {
        studentId: student.studentId,
        studentName: student.studentName,
        qualification: student.qualification,
        center: student.center,
        course: student.course,
        batch: student.batch,
        sector: student.sector,
        placedCount: hiredCount,
        totalApplications: student.placements.length,
        status: hiredCount > 0 ? 'Hired' : (latestPlacement?.status || 'Applied'),
        companyName: latestPlacement?.companyName || 'N/A'
      };
    });

    res.json({ success: true, data: studentData });
  } catch (error) {
    console.error('Error getting student-wise analytics:', error);
    res.json({ success: true, data: [] });
  }
});

// ── student-wise-unique — used by getStudentWiseAnalytics / getMISStudentWiseAnalytics ─

router.get('/student-wise-unique', authenticate, async (req, res) => {
  try {
    const MisPlacementAnalytics = require('../models/misPlacementAnalyticsModel');
    const allPlacements = await MisPlacementAnalytics.getAllMisPlacements() || [];

    // Deduplicate by studentId, keeping latest placement per student
    const studentMap = {};
    allPlacements.forEach(p => {
      if (!studentMap[p.studentId] ||
          new Date(p.updatedAt || p.createdAt) > new Date(studentMap[p.studentId].updatedAt || studentMap[p.studentId].createdAt)) {
        studentMap[p.studentId] = p;
      }
    });

    res.json({ success: true, data: Object.values(studentMap) });
  } catch (error) {
    console.error('Error getting unique student-wise analytics:', error);
    res.json({ success: true, data: [] });
  }
});

// ── Sectors & sector-wise students (used by MIS placement analytics) ──────────

router.get('/sectors', authenticate, async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    const CourseDetailModel = require('../models/courseDetailModel');
    const courses = await CourseDetailModel.getByInstitute(instituteId) || [];
    const sectors = [...new Set(courses.map(course => course.sector).filter(Boolean))];
    res.json({ success: true, data: sectors });
  } catch (error) {
    console.error('Error getting sectors:', error);
    res.json({ success: true, data: [] });
  }
});

router.get('/sector-wise-students/:sector', authenticate, async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    const { sector } = req.params;
    const CourseDetailModel = require('../models/courseDetailModel');
    const batchModel = require('../models/batchModel');
    const MisPlacementAnalytics = require('../models/misPlacementAnalyticsModel');

    const allCourses = await CourseDetailModel.getByInstitute(instituteId) || [];
    const sectorCourses = allCourses.filter(course => course.sector === sector);
    const sectorCourseIds = sectorCourses.map(course => course.id);

    const allBatches = await batchModel.getAll(instituteId) || [];
    const sectorBatches = allBatches.filter(batch => sectorCourseIds.includes(batch.courseId));

    const sectorStudentIds = [];
    sectorBatches.forEach(batch => {
      if (batch.selectedStudents && Array.isArray(batch.selectedStudents)) {
        sectorStudentIds.push(...batch.selectedStudents);
      }
    });

    const allPlacements = await MisPlacementAnalytics.getPlacementsByInstitute(instituteId) || [];
    const sectorPlacements = allPlacements.filter(p => sectorStudentIds.includes(p.studentId));

    const studentMap = {};
    sectorPlacements.forEach(placement => {
      const studentId = placement.studentId;
      if (!studentMap[studentId]) {
        const studentBatch = sectorBatches.find(batch =>
          batch.selectedStudents && batch.selectedStudents.includes(studentId)
        );
        const studentCourse = sectorCourses.find(course => course.id === studentBatch?.courseId);
        studentMap[studentId] = {
          studentId,
          studentName: placement.studentName || 'Unknown',
          qualification: placement.qualification || 'N/A',
          center: placement.center || 'Unknown',
          course: studentCourse?.course || 'N/A',
          batch: studentBatch?.batchId || 'N/A',
          sector,
          placements: []
        };
      }
      studentMap[studentId].placements.push(placement);
    });

    const studentData = Object.values(studentMap).map(student => {
      const hiredCount = student.placements.filter(p => p.status === 'Hired').length;
      const latestPlacement = student.placements[student.placements.length - 1];
      return {
        studentId: student.studentId,
        studentName: student.studentName,
        qualification: student.qualification,
        center: student.center,
        course: student.course,
        batch: student.batch,
        sector: student.sector,
        placedCount: hiredCount,
        totalApplications: student.placements.length,
        status: hiredCount > 0 ? 'Hired' : (latestPlacement?.status || 'Applied'),
        companyName: latestPlacement?.companyName || 'N/A'
      };
    });

    res.json({ success: true, data: studentData });
  } catch (error) {
    console.error('Error getting sector-wise students:', error);
    res.json({ success: true, data: [] });
  }
});

module.exports = router;
