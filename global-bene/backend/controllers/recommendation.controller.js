const UserInteractionLog = require('../models/userInteractionLog');
const User = require('../models/user');

// Get all interaction logs for AI team
exports.getInteractionLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 1000,
      userId,
      action,
      targetType,
      startDate,
      endDate,
      format = 'json'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Apply filters
    if (userId) {
      query.userId = userId;
    }

    if (action) {
      query.action = action;
    }

    if (targetType) {
      query.targetType = targetType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Get logs with user population for richer data
    const logs = await UserInteractionLog.find(query)
      .populate('userId', 'username email createdAt')
      .populate('targetId', 'title username name') // Works for posts, users, communities
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserInteractionLog.countDocuments(query);

    // Format data for AI team
    const formattedLogs = logs.map(log => ({
      userId: log.userId._id,
      username: log.userId.username,
      email: log.userId.email,
      userCreatedAt: log.userId.createdAt,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId._id,
      targetTitle: log.targetId.title || log.targetId.username || log.targetId.name,
      metadata: log.metadata,
      timestamp: log.timestamp,
      createdAt: log.createdAt
    }));

    // Return different formats based on request
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(formattedLogs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="interaction_logs.csv"');
      return res.send(csvData);
    }

    res.json({
      logs: formattedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        totalLogs: total,
        dateRange: {
          start: startDate || null,
          end: endDate || null
        },
        filters: {
          userId,
          action,
          targetType
        }
      }
    });

  } catch (err) {
    console.error('Get interaction logs error:', err);
    res.status(500).json({ message: 'Server error fetching interaction logs' });
  }
};

// Get user-specific interaction logs
exports.getUserInteractionLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 100, action, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId };

    if (action) {
      query.action = action;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    const logs = await UserInteractionLog.find(query)
      .populate('targetId', 'title username name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserInteractionLog.countDocuments(query);

    res.json({
      userId,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (err) {
    console.error('Get user interaction logs error:', err);
    res.status(500).json({ message: 'Server error fetching user interaction logs' });
  }
};

// Get interaction statistics
exports.getInteractionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) {
        matchQuery.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery.timestamp.$lte = new Date(endDate);
      }
    }

    const stats = await UserInteractionLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            action: '$action',
            targetType: '$targetType'
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          action: '$_id.action',
          targetType: '$_id.targetType',
          count: 1,
          uniqueUsersCount: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get total users with interactions
    const totalUsers = await UserInteractionLog.distinct('userId', matchQuery);
    const totalLogs = await UserInteractionLog.countDocuments(matchQuery);

    res.json({
      totalLogs,
      totalUsers: totalUsers.length,
      stats,
      dateRange: {
        start: startDate || null,
        end: endDate || null
      }
    });

  } catch (err) {
    console.error('Get interaction stats error:', err);
    res.status(500).json({ message: 'Server error fetching interaction stats' });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle nested objects and arrays
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Escape commas and quotes in strings
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};