const express = require('express');
const {
    searchCommunities,
    searchPosts,
    searchUsers,
    searchAll
} = require('../controllers/search.controller');

const router = express.Router();

// Search routes
router.get("/communities", searchCommunities);
router.get("/posts", searchPosts);
router.get("/users", searchUsers);
router.get("/all", searchAll);

module.exports = router;