const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    // Voting - support both old and new formats
    upvotes: { type: mongoose.Schema.Types.Mixed, default: [] },
    downvotes: { type: mongoose.Schema.Types.Mixed, default: [] },
    // Legacy votes array for backward compatibility
    votes: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      voteType: { type: String, enum: ['upvote', 'downvote'], required: true },
    }],
    score: { type: Number, default: 0 },
    isEdited: { type: Boolean, default: false },
    spamStatus: { type: String, enum: ['not_spam', 'might_be_spam', 'spam'], default: 'not_spam' },
    spamConfidence: { type: Number, default: 0 },
    spamReason: { type: String, default: '' },

    // Auto-tagging for comments
    autoTags: [String],

    // Engagement counters
    likeCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
commentSchema.index({ author: 1 });
commentSchema.index({ post: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ score: -1 });

// Calculate score
commentSchema.pre('save', function (next) {
  if (this.isModified('votes') || this.isModified('upvotes') || this.isModified('downvotes')) {
    let upvotesCount = 0;
    let downvotesCount = 0;

    // Handle new array format
    if (Array.isArray(this.upvotes)) {
      upvotesCount = this.upvotes.length;
    } else if (typeof this.upvotes === 'number') {
      upvotesCount = this.upvotes;
    }

    if (Array.isArray(this.downvotes)) {
      downvotesCount = this.downvotes.length;
    } else if (typeof this.downvotes === 'number') {
      downvotesCount = this.downvotes;
    }

    // Fallback to old votes array if new arrays are empty
    if (upvotesCount === 0 && downvotesCount === 0 && Array.isArray(this.votes)) {
      upvotesCount = this.votes.filter(v => v.voteType === 'upvote').length;
      downvotesCount = this.votes.filter(v => v.voteType === 'downvote').length;
    }

    this.likeCount = upvotesCount;
    this.score = upvotesCount - downvotesCount;
  }
  next();
});

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
module.exports = Comment;

