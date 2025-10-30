const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    votes: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      voteType: { type: String, enum: ['upvote', 'downvote'], required: true },
    }],
    score: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    isEdited: { type: Boolean, default: false },
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
  if (this.isModified('votes')) {
    this.upvotes = this.votes.filter(v => v.voteType === 'upvote').length;
    this.downvotes = this.votes.filter(v => v.voteType === 'downvote').length;
    this.score = this.upvotes - this.downvotes;
  }
  next();
});

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
module.exports = Comment;

