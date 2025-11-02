const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const { authRequired } = require('../middleware/auth.middleware');

// Public routes
router.get('/', communityController.getAllCommunities);
router.get('/:id', communityController.getCommunityById);
router.get('/user/saved', authRequired, communityController.getUserSavedPosts);
router.get('/user/joined', authRequired, communityController.getUserCommunities);

// Protected routes
router.post('/', authRequired, communityController.createCommunity);
router.post('/:id/join', authRequired, communityController.toggleJoinCommunity);
router.put('/:id', authRequired, communityController.updateCommunity);

module.exports = router;

