const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    displayName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    memberCount: { type: Number, default: 0 },
    userGroups: [{
      name: { type: String, required: true },
      description: String,
      members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      permissions: {
        canPost: { type: Boolean, default: true },
        canComment: { type: Boolean, default: true },
        canModerate: { type: Boolean, default: false }
      },
      createdAt: { type: Date, default: Date.now }
    }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    postCount: { type: Number, default: 0 },
    iconUrl: String,
    bannerUrl: String,
    rules: [String],
    isPrivate: { type: Boolean, default: false },
    type: { type: String, enum: ['general', 'text', 'image', 'link', 'mixed'], default: 'general' },

    // Tagging and recommendation
    tags: [String], // topics for the community
    autoTags: [String], // AI-generated tags
    recommendationScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
// communitySchema.index({ name: 1 }); // Removed duplicate index
communitySchema.index({ creator: 1 });
communitySchema.index({ memberCount: -1 });

// Update member count
communitySchema.pre('save', function (next) {
  if (this.isModified('members')) {
    this.memberCount = this.members.length;
  }
  next();
});

const Community = mongoose.models.Community || mongoose.model('Community', communitySchema);
module.exports = Community;

