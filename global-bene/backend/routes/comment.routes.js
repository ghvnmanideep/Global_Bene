const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { authRequired } = require('../middleware/auth.middleware');

// Public routes
router.get('/post/:postId', commentController.getPostComments);

// Protected routes
router.post('/post/:postId', authRequired, commentController.createComment);
router.post('/:id/vote', authRequired, commentController.voteComment);
router.put('/:id', authRequired, commentController.updateComment);
router.delete('/:id', authRequired, commentController.deleteComment);

module.exports = router;

