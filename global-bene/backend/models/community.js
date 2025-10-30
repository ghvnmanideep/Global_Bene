const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    memberCount: { type: Number, default: 0 },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    postCount: { type: Number, default: 0 },
    iconUrl: String,
    bannerUrl: String,
    rules: [String],
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
communitySchema.index({ name: 1 });
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

