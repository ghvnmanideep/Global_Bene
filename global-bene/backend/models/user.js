// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: String,
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: function () { return !this.googleId; } },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    emailVerified: { type: Boolean, default: false },
    emailToken: String,
    resetToken: String,
    resetTokenExpires: Date,
    otpCode: String,
    otpExpires: Date,
    refreshTokens: [refreshTokenSchema],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    spamPostCount: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    bannedReason: String,
    bannedAt: Date,

    // Recommendation-related fields
    interests: [String], // normalized topics/skills/industries
    preferredTags: [String], // tags the user often engages with or follows
    recommendationOptOut: { type: Boolean, default: false }, // if user disables personalization

    // Engagement summary fields
    totalLikesGiven: { type: Number, default: 0 },
    totalLikesReceived: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalSaves: { type: Number, default: 0 },

    profile: {
      bio: String,
      avatarUrl: String,
      avatarPublicId: String,
      mobile: String,
      gender: String,
      dob: Date,
    },
  },
  { timestamps: true }
);

// Pre-save hook: hash passwordHash if modified, for non-Google users
userSchema.pre('save', async function (next) {
  if (this.isModified('passwordHash') && !this.googleId) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  if (this.googleId) return Promise.resolve(false);
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Safe export to avoid OverwriteModelError:
const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
