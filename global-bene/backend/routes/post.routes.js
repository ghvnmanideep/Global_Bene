const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
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

// Public routes
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

// Protected routes
router.post('/', verifyJWT, parser.single('image'), parseFormDataJSON, postController.createPost);
router.put('/:id', verifyJWT, parser.single('image'), parseFormDataJSON, postController.updatePost);
router.post('/:id/vote', verifyJWT, postController.votePost);
router.delete('/:id/vote', verifyJWT, postController.removeVote);
router.post('/:id/like', verifyJWT, postController.toggleLikePost);
router.post('/:id/save', verifyJWT, postController.toggleSavePost);
router.post('/:id/share', verifyJWT, postController.sharePost);
router.delete('/:id', verifyJWT, postController.deletePost);

module.exports = router;

