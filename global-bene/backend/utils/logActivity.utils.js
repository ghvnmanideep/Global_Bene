// utils/logActivity.utils.js

const ActivityLog = require('../models/activityLog');

const parseUserAgent = (userAgent) => {
    if (!userAgent) return { device: "", browser: "", platform: "" };
    const ua = userAgent.toLowerCase();
    let browser = "";
    let platform = "";
    let device = "";

    if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
    else if (ua.includes("edg")) browser = "Edge";
    else browser = "Unknown";

    if (ua.includes("windows")) platform = "Windows";
    else if (ua.includes("mac")) platform = "MacOS";
    else if (ua.includes("linux")) platform = "Linux";
    else if (ua.includes("android")) platform = "Android";
    else if (ua.includes("iphone") || ua.includes("ipad")) platform = "iOS";
    else platform = "Unknown";

    device = ua.includes("mobile") ? "Mobile" : "Desktop";

    return { device, browser, platform };
};

const extractRequestContext = (req, fallbackSessionId) => {
    if (!req) {
        return {
            token: fallbackSessionId || null,
            userAgent: "",
            ipAddress: "",
            method: "",
            path: "",
        };
    }

    const authHeader = req.headers?.authorization || "";
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : req.cookies?.accessToken || fallbackSessionId;

    return {
        token: token || null,
        userAgent: req.headers?.["user-agent"] || "",
        ipAddress: req.ip || req.connection?.remoteAddress || "",
        method: req.method || "",
        path: req.originalUrl || req.url || "",
    };
};

const logActivity = async (
    userId,
    event_type,
    description,
    req,
    entity_type = null,
    entity_id = null,
    session_id = null,
    additionalProps = {}
) => {
    try {
        const { token, userAgent, ipAddress, method, path } = extractRequestContext(req, session_id);
        const { device, browser, platform } = parseUserAgent(userAgent);
        const occurredAt = new Date();

        const props = {
            geo_location: additionalProps.geo_location || "",
            ip_address: ipAddress,
            device,
            browser,
            platform,
            ...additionalProps,
        };

        const activity = {
            event_type,
            description,
            entity_type,
            entity_id,
            session_id: token,
            props,
            createdAt: occurredAt,
            updatedAt: occurredAt,
        };

        await ActivityLog.findOneAndUpdate(
            { user_id: userId },
            {
                $push: { activities: activity },
            },
            { upsert: true, new: true }
        );

    } catch (err) {
        console.error("Error logging activity:", err.message);
    }
};

module.exports = {
    logActivity
};