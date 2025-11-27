const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyJWT } = require('../middleware/auth.middleware');
const parser = require('../utils/multer.cloudinary');

// Middleware to parse JSON strings in FormData
const parseFormDataJSON = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Parse JSON strings in FormData fields
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        try {
          // Try to parse as JSON
          req.body[key] = JSON.parse(req.body[key]);
        } catch (e) {
          // If parsing fails, keep the original string value
          // This handles cases where the field is intentionally a string
        }
      }
    });
  }
  next();
};

router.get('/me', verifyJWT, userController.getMe);
router.put('/update', verifyJWT, parser.single('avatar'), parseFormDataJSON, userController.updateProfile);
router.put('/password', verifyJWT, userController.changePassword);
router.post("/:id/follow", verifyJWT, userController.followUser);
router.post("/:id/unfollow", verifyJWT, userController.unfollowUser);
router.get('/search', userController.searchUsers);
router.get("/:id", userController.getUserById);
router.get("/:id/comments", verifyJWT, userController.getUserComments);
module.exports = router;