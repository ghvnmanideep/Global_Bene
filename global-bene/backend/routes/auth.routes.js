const express = require('express');
const passport = require('passport');
const router = express.Router();

// Import the auth controller to use its functions
const authController = require('../controllers/auth.controller');

const { createAccessToken } = require('../utils/token.util');
const { authRequired } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/verify-otp', authController.verifyOtp);
router.post('/forgot', authController.forgotPassword);
router.post('/reset/:token', authController.resetPassword);

router.get('/profile', authRequired, (req, res) => {
  res.json({ userId: req.user.id, username: req.user.username });
});

// Protected routes
router.get('/me', authRequired, authController.getMe);
router.put('/update', authRequired, authController.updateProfile);
router.put('/password', authRequired, authController.changePassword);
router.post('/:userId/follow', authRequired, authController.followUser);
router.post('/:userId/unfollow', authRequired, authController.unfollowUser);
router.get('/users/:id', authRequired, authController.getUserById);


module.exports = router;
