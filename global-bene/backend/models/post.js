const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  voteType: { type: String, enum: ['upvote', 'downvote'], required: true },
}, { _id: false });

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    content: {
      type: mongoose.Schema.Types.Mixed, // Allow both string and object
      default: ""
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },

    // Auto-tagging and metadata
    tags: [{ type: String }], // final tags shown to user
    autoTags: [{ type: String }], // AI-generated tags
    tagSource: {
      type: String,
      enum: ["manual", "auto", "mixed"],
      default: "auto"
    },
    language: { type: String, default: "en" },
    topics: [{ type: String }], // higher-level topics

    // Recommendation-related metrics
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // for ranking

    // Voting - support both old and new formats
    upvotes: { type: mongoose.Schema.Types.Mixed, default: [] },
    downvotes: { type: mongoose.Schema.Types.Mixed, default: [] },
    // Legacy votes array for backward compatibility
    votes: [voteSchema],

    // Like and save arrays
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Comments array
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],

    status: {
      type: String,
      enum: ["flagged", "removed", "active"],
      default: "active"
    },
    isPinned: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    label: { type: String, default: "safe" },

    // Legacy fields for backward compatibility (can be removed after migration)
    imageUrl: String,
    imagePublicId: String,
    linkUrl: String,
    type: { type: String, enum: ['text', 'link', 'image'], default: 'text' },
    category: { type: String, enum: ['general', 'tech', 'sports', 'political', 'entertainment', 'news', 'health', 'other'], default: 'general' },
    spamStatus: { type: String, enum: ['not_spam', 'might_be_spam', 'spam'], default: 'not_spam' },
    spamConfidence: { type: Number, default: 0 },
    spamReason: { type: String, default: '' },
    spamReports: [{
      reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String, default: 'Spam' },
      reportedAt: { type: Date, default: Date.now },
    }],
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for better query performance
postSchema.index({ author: 1 });
postSchema.index({ community: 1 });
postSchema.index({ score: -1 });
postSchema.index({ rankingScore: -1 }); 
postSchema.index({ hotScore: -1 }); // For hot posts
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ topics: 1 });
postSchema.index({ viewCount: -1 });
postSchema.index({ likeCount: -1 });
postSchema.index({ commentCount: -1 });
postSchema.index({ saveCount: -1 });
postSchema.index({ status: 1 }); // For filtering active posts

// Compound indexes for recommendation and search
postSchema.index({ tags: 1, createdAt: -1 });
postSchema.index({ topics: 1, score: -1 });
// Removed compound index with both tags and topics due to MongoDB parallel array limitation
postSchema.index({ createdAt: -1, score: -1 });

// Calculate score and metrics before saving
postSchema.pre('save', function (next) {
  // Calculate vote counts and score
  if (this.isModified('upvotes') || this.isModified('downvotes') || this.isModified('votes')) {
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

  // Calculate save count
  if (this.isModified('savedBy')) {
    this.saveCount = Array.isArray(this.savedBy) ? this.savedBy.length : 0;
  }

  // Calculate comment count
  if (this.isModified('comments')) {
    this.commentCount = Array.isArray(this.comments) ? this.comments.length : 0;
  }

  next();
});

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
module.exports = Post;

