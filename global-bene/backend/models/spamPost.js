const mongoose = require('mongoose');

const spamPostSchema = new mongoose.Schema(
  {
    originalPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // Optional for spam posts, required for spam comments
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    type: { type: String, enum: ['text', 'link', 'image'], default: 'text' },
    linkUrl: String,
    imageUrl: String,
    imagePublicId: String,
    tags: [String],
    category: { type: String, enum: ['general', 'tech', 'sports', 'political', 'entertainment', 'news', 'health', 'other'], default: 'general' },
    spamReason: { type: String, required: true },
    detectedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for better query performance
spamPostSchema.index({ author: 1 });
spamPostSchema.index({ detectedAt: -1 });

const SpamPost = mongoose.models.SpamPost || mongoose.model('SpamPost', spamPostSchema);
module.exports = SpamPost;