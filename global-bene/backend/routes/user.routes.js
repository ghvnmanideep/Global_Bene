const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authRequired } = require('../middleware/auth.middleware');
const parser = require('../utils/multer.cloudinary');

router.get('/me', authRequired, userController.getMe);
router.put('/update', authRequired, parser.single('avatar'), userController.updateProfile);
router.put('/password', authRequired, userController.changePassword);
router.post("/:id/follow", authRequired, userController.followUser);
router.post("/:id/unfollow", authRequired, userController.unfollowUser);
router.get('/search', userController.searchUsers);
router.get("/:id", userController.getUserById);
module.exports = router;