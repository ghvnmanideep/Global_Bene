const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { authRequired } = require('../middleware/auth.middleware');

router.post('/send', contactController.sendContactEmail);

module.exports = router;
