const router = require("express").Router();
const postController = require("../controllers/post.controller");

// Create a post
router.post("/", postController.createPost);

// Get all posts
router.get("/", postController.getAllPosts);

// Update a post
router.put("/:id", postController.updatePost);

// Delete a post
router.delete("/:id", postController.deletePost);

// Like / Dislike a post
router.put("/:id/like", postController.likePost);

// Get a post
router.get("/:id", postController.getPost);

// Get timeline posts
router.get("/timeline/:userId", postController.getTimelinePosts);

// Get user's all posts
router.get("/profile/:username", postController.getUserPosts);

module.exports = router;
