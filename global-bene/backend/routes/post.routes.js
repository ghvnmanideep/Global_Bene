const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { authRequired } = require('../middleware/auth.middleware');
const parser = require('../utils/multer.cloudinary');

// Public routes
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

// Protected routes
router.post('/', authRequired, parser.single('image'), postController.createPost);
router.post('/:id/vote', authRequired, postController.votePost);
router.delete('/:id/vote', authRequired, postController.removeVote);
router.post('/:id/save', authRequired, postController.toggleSavePost);
router.delete('/:id', authRequired, postController.deletePost);

module.exports = router;

