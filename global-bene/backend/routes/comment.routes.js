const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { verifyJWT } = require('../middleware/auth.middleware');

// Public routes
router.get('/post/:postId', commentController.getPostComments);

// Protected routes
router.post('/post/:postId', verifyJWT, commentController.createComment);
router.post('/:id/vote', verifyJWT, commentController.voteComment);
router.delete('/:id/vote', verifyJWT, commentController.removeVote);
router.put('/:id', verifyJWT, commentController.updateComment);
router.delete('/:id', verifyJWT, commentController.deleteComment);

module.exports = router;

