const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { verifyJWT } = require('../middleware/auth.middleware');
const parser = require('../utils/multer.cloudinary');

// Public routes
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

// Protected routes
router.post('/', verifyJWT, parser.single('image'), postController.createPost);
router.put('/:id', verifyJWT, parser.single('image'), postController.updatePost);
router.post('/:id/vote', verifyJWT, postController.votePost);
router.delete('/:id/vote', verifyJWT, postController.removeVote);
router.post('/:id/like', verifyJWT, postController.toggleLikePost);
router.post('/:id/save', verifyJWT, postController.toggleSavePost);
router.post('/:id/share', verifyJWT, postController.sharePost);
router.delete('/:id', verifyJWT, postController.deletePost);

module.exports = router;

