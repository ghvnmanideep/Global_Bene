const Report = require('../models/report');
const Post = require('../models/post');
const Comment = require('../models/comment');
const User = require('../models/user');
const { createNotification } = require('./notification.controller');
const { logActivity } = require('../utils/logActivity.utils');

// Report a post, comment, or user
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;
    const reporterId = req.user.id;

    // Validate target type
    if (!['Post', 'Comment', 'User'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type. Must be Post, Comment, or User.' });
    }

    // Check if target exists
    let targetExists = false;
    let targetData = null;

    if (targetType === 'Post') {
      targetData = await Post.findById(targetId);
      targetExists = !!targetData;
    } else if (targetType === 'Comment') {
      targetData = await Comment.findById(targetId);
      targetExists = !!targetData;
    } else if (targetType === 'User') {
      targetData = await User.findById(targetId);
      targetExists = !!targetData;
    }

    if (!targetExists) {
      return res.status(404).json({ message: `${targetType} not found` });
    }

    // Check if user already reported this target
    const existingReport = await Report.findOne({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this content' });
    }

    // Create the report
    const report = new Report({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason: reason || 'No reason provided'
    });

    await report.save();

    // Log activity
    await logActivity(
      reporterId,
      "report",
      `Reported ${targetType.toLowerCase()} for: ${reason}`,
      req,
      targetType.toLowerCase(),
      targetId
    );

    // If it's a post and has 3+ reports, notify admins
    if (targetType === 'Post') {
      const postReportCount = await Report.countDocuments({
        target_type: 'Post',
        target_id: targetId
      });

      if (postReportCount >= 3) {
        // Find all admins and notify them
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          await createNotification(
            admin._id,
            'admin_alert',
            `Post "${targetData.title}" has received ${postReportCount} reports`,
            reporterId
          );
        }
      }
    }

    res.status(201).json({
      message: 'Report submitted successfully',
      report: {
        _id: report._id,
        target_type: report.target_type,
        reason: report.reason,
        createdAt: report.createdAt
      }
    });
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ message: 'Server error creating report' });
  }
};

// Get reports for admin (with pagination and filters)
exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'open', targetType = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (targetType && targetType !== 'all') {
      query.target_type = targetType;
    }

    const reports = await Report.find(query)
      .populate('reporter_id', 'username email')
      .populate({
        path: 'target_id',
        refPath: 'target_type',
        select: targetType === 'Post' ? 'title content author' :
                targetType === 'Comment' ? 'content author post' :
                'username email'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    // Enhance report data with additional context
    const enhancedReports = await Promise.all(reports.map(async (report) => {
      const reportObj = report.toObject();

      // Add target details based on type
      if (report.target_type === 'Post' && report.target_id) {
        const post = await Post.findById(report.target_id).populate('author', 'username').populate('community', 'name');
        if (post) {
          reportObj.target_details = {
            title: post.title,
            author: post.author?.username,
            community: post.community?.name,
            createdAt: post.createdAt
          };
        }
      } else if (report.target_type === 'Comment' && report.target_id) {
        const comment = await Comment.findById(report.target_id).populate('author', 'username').populate('post', 'title');
        if (comment) {
          reportObj.target_details = {
            content: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
            author: comment.author?.username,
            post_title: comment.post?.title,
            createdAt: comment.createdAt
          };
        }
      } else if (report.target_type === 'User' && report.target_id) {
        const user = await User.findById(report.target_id).select('username email role isBanned');
        if (user) {
          reportObj.target_details = {
            username: user.username,
            email: user.email,
            role: user.role,
            isBanned: user.isBanned
          };
        }
      }

      return reportObj;
    }));

    res.json({
      reports: enhancedReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
};

// Update report status (resolve/close report)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, handledBy } = req.body;

    if (!['open', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be open or resolved.' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    if (handledBy) {
      report.handled_by = handledBy;
    }

    await report.save();

    // Log activity
    await logActivity(
      req.user.id,
      "update_report",
      `Updated report status to ${status}`,
      req,
      "report",
      id
    );

    res.json({
      message: 'Report status updated successfully',
      report
    });
  } catch (err) {
    console.error('Update report status error:', err);
    res.status(500).json({ message: 'Server error updating report status' });
  }
};

// Delete a report
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await Report.findByIdAndDelete(id);

    // Log activity
    await logActivity(
      req.user.id,
      "delete_report",
      `Deleted report for ${report.target_type}`,
      req,
      "report",
      id
    );

    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ message: 'Server error deleting report' });
  }
};

// Get report statistics for admin dashboard
exports.getReportStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const openReports = await Report.countDocuments({ status: 'open' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });

    // Reports by type
    const reportsByType = await Report.aggregate([
      { $group: { _id: '$target_type', count: { $sum: 1 } } }
    ]);

    // Recent reports (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentReports = await Report.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      stats: {
        totalReports,
        openReports,
        resolvedReports,
        recentReports,
        reportsByType: reportsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (err) {
    console.error('Get report stats error:', err);
    res.status(500).json({ message: 'Server error fetching report stats' });
  }
};
