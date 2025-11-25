const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const { verifyJWT } = require('../middleware/auth.middleware');

// Public routes
router.get('/', communityController.getAllCommunities);
router.get('/:id', communityController.getCommunityById);
router.get('/user/saved', verifyJWT, communityController.getUserSavedPosts);
router.get('/user/joined', verifyJWT, communityController.getUserCommunities);

// Protected routes
router.post('/', verifyJWT, communityController.createCommunity);
router.post('/:id/join', verifyJWT, communityController.toggleJoinCommunity);
router.put('/:id', verifyJWT, communityController.updateCommunity);
router.delete('/:id', verifyJWT, communityController.deleteCommunity);

// Moderator management routes (creator only)
router.post('/:id/moderators', verifyJWT, communityController.promoteToModerator);
router.delete('/:id/moderators', verifyJWT, communityController.demoteModerator);
router.get('/:id/members', verifyJWT, communityController.getCommunityMembers);
router.delete('/:id/members', verifyJWT, communityController.removeMember);

// Community admin routes (creator/platform admin only)
router.delete('/:id/users', verifyJWT, communityController.deleteCommunityUser);
router.post('/:id/transfer-ownership', verifyJWT, communityController.transferOwnership);

// User groups management (creator only)
router.post('/:id/groups', verifyJWT, communityController.createUserGroup);
router.get('/:id/groups', verifyJWT, communityController.getUserGroups);
router.post('/:id/groups/:groupId/users', verifyJWT, communityController.addUserToGroup);
router.delete('/:id/groups/:groupId/users', verifyJWT, communityController.removeUserFromGroup);

module.exports = router;

