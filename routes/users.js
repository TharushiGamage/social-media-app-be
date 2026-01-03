const router = require("express").Router();
const userController = require("../controllers/user.controller");

// Get Current User (Protected)
router.get("/me", userController.getCurrentUser);
router.get("/", userController.getCurrentUser); // Optional alias

// Get friends (Public or Protected? Spec says Friends/Followings. Likely public or protected. Spec says endpoint: /friends/{userId})
router.get("/friends/:userId", userController.getFriends);

// Get User by ID (Public)
router.get("/:id", userController.getUser);

// Update User (Protected)
router.put("/:id", userController.updateUser);

// Delete User (Protected)
router.delete("/:id", userController.deleteUser);

// Follow User (Protected)
router.put("/:id/follow", userController.followUser);

// Unfollow User (Protected)
router.put("/:id/unfollow", userController.unfollowUser);

module.exports = router;
