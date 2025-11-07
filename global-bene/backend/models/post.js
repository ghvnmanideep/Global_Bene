const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  voteType: { type: String, enum: ['upvote', 'downvote'], required: true },
}, { _id: false });

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: {
      type: String,
      required: function() {
        // Required only for text posts
        return this.type === 'text';
      },
      default: '',
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: false }, // <-- was required: true
    votes: [voteSchema],
    score: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    commentCount: { type: Number, default: 0 },
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    imageUrl: String,
    imagePublicId: String,
    type: { type: String, enum: ['text', 'link', 'image'], default: 'text' },
    linkUrl: String,
    tags: [String],
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
postSchema.index({ createdAt: -1 });

// Calculate score before saving
postSchema.pre('save', function (next) {
  if (this.isModified('votes')) {
    this.upvotes = this.votes.filter(v => v.voteType === 'upvote').length;
    this.downvotes = this.votes.filter(v => v.voteType === 'downvote').length;
    this.score = this.upvotes - this.downvotes;
  }
  next();
});

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
module.exports = Post;

