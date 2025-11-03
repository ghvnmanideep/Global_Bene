// // backend/controllers/user.controller.js
// const User = require('../models/user');

// exports.getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-passwordHash -refreshTokens -resetToken -emailToken');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json(user);
//   } catch (err) {
//     console.error('GetMe Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.updateProfile = async (req, res) => {
//   try {
//     const { bio, mobile, gender, dob, avatarUrl } = req.body;
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // If an avatar file was uploaded via Cloudinary, persist its URL and public id
//     if (req.file && req.file.path) {
//       user.profile.avatarUrl = req.file.path;
//       if (req.file.filename) user.profile.avatarPublicId = req.file.filename;
//     }

//     user.profile = {
//       ...user.profile,
//       bio: bio || user.profile?.bio,
//       mobile: mobile || user.profile?.mobile,
//       gender: gender || user.profile?.gender,
//       dob: dob || user.profile?.dob,
//       // Allow explicit avatarUrl override from body if sent (e.g., custom URL)
//       avatarUrl: avatarUrl || user.profile?.avatarUrl,
//     };

//     await user.save();
//     res.json({ message: 'Profile updated successfully', profile: user.profile });
//   } catch (err) {
//     console.error('UpdateProfile Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.changePassword = async (req, res) => {
//   try {
//     const { newPassword } = req.body;
//     if (!newPassword) return res.status(400).json({ message: 'New password is required' });

//     // Password validation regex
//     const strongPassword = (pw) =>
//       /^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/.test(pw);
    
//     if (!strongPassword(newPassword))
//       return res.status(400).json({ message: 'Password must be at least 8 characters, include uppercase, lowercase, number and symbol' });

//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // Store plain password - pre-save hook will hash it
//     user.passwordHash = newPassword;
//     user.refreshTokens = [];
//     await user.save();

//     res.json({ message: 'Password changed successfully' });
//   } catch (err) {
//     console.error('ChangePassword Error:', err);
//     res.status(500).json({ message: 'Server error changing password' });
//   }
// };

// // Follow a user
// exports.followUser = async (req, res) => {
//   try {
//     const targetUserId = req.params.id;
//     const userId = req.user.id;
//     if (targetUserId === userId) return res.status(400).json({ success: false, message: "You can't follow yourself." });

//     const me = await User.findById(userId);
//     const target = await User.findById(targetUserId);
//     if (!me || !target) return res.status(404).json({ success: false, message: "User not found." });

//     if (me.following.includes(targetUserId)) return res.json({ success: false, message: "Already following." });

//     me.following.push(targetUserId);
//     target.followers.push(userId);
//     await me.save();
//     await target.save();
//     res.json({ success: true, message: "Followed user." });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message || "Failed to follow user." });
//   }
// };

// // Unfollow a user
// exports.unfollowUser = async (req, res) => {
//   try {
//     const targetUserId = req.params.id;
//     const userId = req.user.id;
//     if (targetUserId === userId) return res.status(400).json({ success: false, message: "You can't unfollow yourself." });

//     const me = await User.findById(userId);
//     const target = await User.findById(targetUserId);
//     if (!me || !target) return res.status(404).json({ success: false, message: "User not found." });

//     me.following = me.following.filter(id => id.toString() !== targetUserId);
//     target.followers = target.followers.filter(id => id.toString() !== userId);
//     await me.save();
//     await target.save();
//     res.json({ success: true, message: "Unfollowed user." });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message || "Failed to unfollow user." });
//   }
// };

// exports.searchUsers = async (req, res) => {
//   try {
//     const { search = "", page = 1, limit = 20 } = req.query;
//     const skip = (page - 1) * limit;
//     let query = {};
//     if (search && search.trim()) {
//       const regex = new RegExp(search, 'i');
//       query.$or = [
//         { username: { $regex: regex } },
//         { email: { $regex: regex } },
//       ];
//     }
//     const users = await User.find(query)
//       .select('username email role profile')
//       .skip(skip)
//       .limit(parseInt(limit));
//     const total = await User.countDocuments(query);
//     res.json({ users, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
//   } catch (err) {
//     console.error('SearchUsers error:', err);
//     res.status(500).json({ message: 'Server error searching users' });
//   }
// };  
// // Get user by ID
// exports.getUserById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findById(id)
//       .select("-passwordHash -refreshTokens -resetToken -emailToken");
      
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json(user);
//   } catch (err) {
//     console.error("GetUserById Error:", err);
//     res.status(500).json({ message: "Server error fetching user" });
//   }
// };
// backend/controllers/user.controller.js
const User = require("../models/user");
const { createNotification } = require('./notification.controller');

// =================== GET CURRENT USER ===================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-passwordHash -refreshTokens -resetToken -emailToken"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("GetMe Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =================== UPDATE PROFILE ===================
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio, mobile, gender, dob, avatarUrl } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if username is being changed and if it's unique
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Username already taken" });
      }
      user.username = username.toLowerCase();
    }

    // Handle avatar upload from Cloudinary
    if (req.file && req.file.path) {
      user.profile.avatarUrl = req.file.path;
      if (req.file.filename) user.profile.avatarPublicId = req.file.filename;
    }

    user.profile = {
      ...user.profile,
      bio: bio || user.profile?.bio,
      mobile: mobile || user.profile?.mobile,
      gender: gender || user.profile?.gender,
      dob: dob || user.profile?.dob,
      avatarUrl: avatarUrl || user.profile?.avatarUrl,
    };

    await user.save();
    res.json({
      message: "Profile updated successfully",
      profile: user.profile,
    });
  } catch (err) {
    console.error("UpdateProfile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =================== CHANGE PASSWORD ===================
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json({ message: "New password is required" });

    const strongPassword = (pw) =>
      /^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/.test(pw);

    if (!strongPassword(newPassword))
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, include uppercase, lowercase, number and symbol",
      });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.passwordHash = newPassword; // pre-save hook will hash this
    user.refreshTokens = [];
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("ChangePassword Error:", err);
    res.status(500).json({ message: "Server error changing password" });
  }
};

// =================== FOLLOW USER ===================
exports.followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const userId = req.user.id;

    if (targetUserId === userId)
      return res
        .status(400)
        .json({ success: false, message: "You can't follow yourself." });

    const me = await User.findById(userId);
    const target = await User.findById(targetUserId);
    if (!me || !target)
      return res.status(404).json({ success: false, message: "User not found." });

    if (me.following.includes(targetUserId))
      return res.json({ success: false, message: "Already following." });

    me.following.push(targetUserId);
    target.followers.push(userId);
    await me.save();
    await target.save();

    // Create notification for the followed user
    await createNotification(targetUserId, 'follow', `${me.username} started following you`, userId);

    res.json({ success: true, message: "Followed user." });
  } catch (err) {
    console.error("FollowUser Error:", err);
    res.status(500).json({ success: false, message: "Failed to follow user." });
  }
};

// =================== UNFOLLOW USER ===================
exports.unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const userId = req.user.id;

    if (targetUserId === userId)
      return res
        .status(400)
        .json({ success: false, message: "You can't unfollow yourself." });

    const me = await User.findById(userId);
    const target = await User.findById(targetUserId);
    if (!me || !target)
      return res.status(404).json({ success: false, message: "User not found." });

    me.following = me.following.filter((id) => id.toString() !== targetUserId);
    target.followers = target.followers.filter((id) => id.toString() !== userId);

    await me.save();
    await target.save();

    res.json({ success: true, message: "Unfollowed user." });
  } catch (err) {
    console.error("UnfollowUser Error:", err);
    res.status(500).json({ success: false, message: "Failed to unfollow user." });
  }
};

// =================== SEARCH USERS ===================
exports.searchUsers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search, "i");
      query.$or = [{ username: { $regex: regex } }, { email: { $regex: regex } }];
    }

    const users = await User.find(query)
      .select("username email role profile")
      .skip(skip)
      .limit(parseInt(limit));
    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("SearchUsers Error:", err);
    res.status(500).json({ message: "Server error searching users" });
  }
};

// =================== GET USER BY ID ===================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(
      "-passwordHash -refreshTokens -resetToken -emailToken"
    );

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("GetUserById Error:", err);
    res.status(500).json({ message: "Server error fetching user" });
  }
};
