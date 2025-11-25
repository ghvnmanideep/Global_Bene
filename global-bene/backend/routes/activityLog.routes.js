const express = require('express');
const { authRequired, customRoles } = require('../middleware/auth.middleware');

const {
    getMyActivityLogs,
    getAllActivityLogs,
    clearUserLogs,
} = require('../controllers/activityLog.controller');

const router = express.Router();

// 🔒 Protect all routes
router.use(authRequired);

// ✅ User logs
router.route("/my-activity-logs").get(getMyActivityLogs);

// ✅ Admin logs
router
    .route("/all-activity-logs")
    .get(customRoles("admin"), getAllActivityLogs);

router
    .route("/clear/:id")
    .delete( clearUserLogs);

module.exports = router;