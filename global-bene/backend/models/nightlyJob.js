const mongoose = require('mongoose');

const nightlyJobSchema = new mongoose.Schema(
  {
    jobType: {
      type: String,
      required: true,
      enum: ['user_interests', 'community_trending', 'post_ranking', 'recommendations']
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      required: true,
      enum: ['running', 'completed', 'failed'],
      default: 'running'
    },
    data: {
      // Store the actual analytics data
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    metadata: {
      processedCount: Number,
      duration: Number, // in milliseconds
      error: String,
      startTime: Date,
      endTime: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
nightlyJobSchema.index({ jobType: 1, date: -1 });
nightlyJobSchema.index({ date: -1 });
nightlyJobSchema.index({ status: 1 });

// TTL index to automatically delete old job records after 90 days
nightlyJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const NightlyJob = mongoose.models.NightlyJob || mongoose.model('NightlyJob', nightlyJobSchema);

module.exports = NightlyJob;