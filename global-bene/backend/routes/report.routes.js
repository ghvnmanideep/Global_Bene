const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth.middleware');
const { adminRequired } = require('../middleware/admin.middleware');
const reportController = require('../controllers/report.controller');

// User routes (authenticated users can report)
router.post('/', verifyJWT, reportController.createReport);

// Admin routes (only admins can view/manage reports)
router.use(verifyJWT);
router.use(adminRequired);
router.get('/', reportController.getReports);
router.put('/:id/status', reportController.updateReportStatus);
router.delete('/:id', reportController.deleteReport);
router.get('/stats/overview', reportController.getReportStats);

module.exports = router;