const express = require('express');
const passport = require('passport');
const router = express.Router();

// Import the auth controller to use its functions
const authController = require('../controllers/auth.controller');

const { createAccessToken } = require('../utils/token.util');
const { authRequired } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot', authController.forgotPassword);
router.post('/reset/:token', authController.resetPassword);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const accessToken = createAccessToken(req.user);
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}`;
    res.redirect(redirectUrl);
  }
);

router.get('/profile', authRequired, (req, res) => {
  res.json({ userId: req.user.id, username: req.user.username });
});

module.exports = router;
