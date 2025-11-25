const express = require('express');
const { vote, getUserVotes } = require('../controllers/vote.controller');
const { verifyJWT } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Vote on post or comment
router.post("/:target_type/:target_id/:vote_type", vote);

// Get user's vote data
router.get("/", getUserVotes);

module.exports = router;