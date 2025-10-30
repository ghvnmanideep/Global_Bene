const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authRequired } = require('../middleware/auth.middleware');
const parser = require('../utils/multer.cloudinary');

router.get('/me', authRequired, userController.getMe);
router.put('/update', authRequired, parser.single('avatar'), userController.updateProfile);
router.put('/password', authRequired, userController.changePassword);
router.put('/follow/:id', authRequired, userController.followUser);
router.put('/unfollow/:id', authRequired, userController.unfollowUser);
router.get('/search', userController.searchUsers);

module.exports = router;
