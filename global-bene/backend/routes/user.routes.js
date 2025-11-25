const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyJWT } = require('../middleware/auth.middleware');
const parser = require('../utils/multer.cloudinary');

router.get('/me', verifyJWT, userController.getMe);
router.put('/update', verifyJWT, parser.single('avatar'), userController.updateProfile);
router.put('/password', verifyJWT, userController.changePassword);
router.post("/:id/follow", verifyJWT, userController.followUser);
router.post("/:id/unfollow", verifyJWT, userController.unfollowUser);
router.get('/search', userController.searchUsers);
router.get("/:id", userController.getUserById);
router.get("/:id/comments", verifyJWT, userController.getUserComments);
module.exports = router;