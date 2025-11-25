const ActivityLog = require('../models/activityLog');
const { logActivity } = require('../utils/logActivity.utils');

// ================== USER: GET MY ACTIVITY ==================
const getMyActivityLogs = async (req, res) => {
    try {
        const log = await ActivityLog.findOne({ user_id: req.user.id })
            .populate("user_id", "username email role");

        if (!log) {
            return res.status(200).json({ activities: [], message: "No activity logs found for this user" });
        }

        // Return last 50 actions (latest first)
        const userData = log.user_id || {};
        const recentActivities = log.activities
            .slice(-50) // last 50
            .reverse() // show newest first
            .map(activity => ({
                event_id: activity._id,
                event_type: activity.event_type,
                user_id: userData._id || null,
                session_id: activity.session_id,
                entity_type: activity.entity_type,
                entity_id: activity.entity_id,
                props: activity.props,
                timestamp: activity.createdAt
            }));

        res.status(200).json({ activities: recentActivities, success: true });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).json({ message: "Error fetching activity logs", error: error.message });
    }
};

// ================== ADMIN: GET ALL ACTIVITY ==================
const getAllActivityLogs = async (req, res) => {
    try {
        const { userId, action } = req.query;

        let filter = {};
        if (userId) filter.user_id = userId;

        let logs = await ActivityLog.find(filter)
            .populate("user_id", "username email role");

        if (!logs || logs.length === 0) {
            return res.status(200).json({ logs: [], message: "No activity logs found" });
        }

        // Optional: filter activities by action
        if (action) {
            logs = logs.map((log) => {
                const userData = log.user_id || {};
                return {
                    _id: log._id,
                    user_id: userData._id || null,
                    user: userData,
                    activities: log.activities.filter((a) => a.event_type === action).map(activity => ({
                        event_id: activity._id,
                        event_type: activity.event_type,
                        user_id: userData._id || null,
                        session_id: activity.session_id,
                        entity_type: activity.entity_type,
                        entity_id: activity.entity_id,
                        props: activity.props,
                        timestamp: activity.createdAt
                    })),
                };
            });
        } else {
            logs = logs.map((log) => {
                const userData = log.user_id || {};
                return {
                    _id: log._id,
                    user_id: userData._id || null,
                    user: userData,
                    activities: log.activities.map(activity => ({
                        event_id: activity._id,
                        event_type: activity.event_type,
                        user_id: userData._id || null,
                        session_id: activity.session_id,
                        entity_type: activity.entity_type,
                        entity_id: activity.entity_id,
                        props: activity.props,
                        timestamp: activity.createdAt
                    })),
                };
            });
        }

        res.status(200).json({ logs, success: true });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).json({ message: "Error fetching activity logs", error: error.message });
    }
};

// ================== ADMIN: CLEAR USER LOGS ==================
const clearUserLogs = async (req, res) => {
    try {
        const { id } = req.params; // userId

        const log = await ActivityLog.findOne({ user_id: id });
        if (!log) {
            return res.status(200).json({ message: "No logs found for this user" });
        }

        await logActivity(
            req.user.id,
            "clear-logs",
            `Admin ${req.user.username} cleared logs for user ${id}`,
            req,
            null, // entity_type
            null, // entity_id
            null, // session_id
            {} // additionalProps
        );

        log.activities = []; // clear the array
        await log.save();

        res.status(200).json({
            message: `Activity logs for user ${id} cleared successfully`,
            success: true
        });
    } catch (error) {
        console.error("Error clearing logs:", error);
        res.status(500).json({ message: "Error clearing logs", error: error.message });
    }
};

module.exports = {
    getMyActivityLogs,
    getAllActivityLogs,
    clearUserLogs
};