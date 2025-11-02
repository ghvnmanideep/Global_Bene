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
router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot', authController.forgotPassword);
router.post('/reset/:token', authController.resetPassword);
router.post("/google", authController.googleAuth);

router.get('/profile', authRequired, (req, res) => {
  res.json({ userId: req.user.id, username: req.user.username });
});

module.exports = router;
