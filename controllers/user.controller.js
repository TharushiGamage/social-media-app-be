const User = require('../models/User');
const mongoose = require('mongoose');

// Get Current User (Protected)
const getCurrentUser = async (req, res) => {
    try {
        const { userId } = req.auth; // Clerk User ID from middleware
        if (!userId) {
            return res.status(401).json("Unauthorized");
        }
        const user = await User.findOne({ clerkId: userId });
        !user && res.status(404).json("User not found");
        const { password, updatedAt, ...other } = user._doc;
        res.status(200).json(other);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Get a user
const getUser = async (req, res) => {
    const userId = req.params.id;
    const username = req.query.username;
    try {
        const user = userId
            ? await User.findOne({ _id: userId }) // Check if id or clerkId? Spec says ID, usually DB _id, but maybe ClerkId? Let's check DB _id first.
            : await User.findOne({ username: username });
        const { password, updatedAt, ...other } = user._doc;
        res.status(200).json(other);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Update user
const updateUser = async (req, res) => {
    const { userId } = req.auth; // Current user
    // The param id is the one to update?
    // Spec: PUT /{id} -> Protected: Owner only

    // We need to verify if the requesting user (req.auth.userId) matches the target user's CLERK ID.
    // The endpoint param `id` might be the DB _id or Clerk ID. 
    // Let's assume endpoint uses DB _id for consistency with other REST principles, 
    // BUT we need to map req.auth.userId (Clerk ID) to the DB user to check ownership.

    // Simplified: If the user provides `userId` in body as per spec "userId: current_user_id_from_auth", 
    // but we should confim it using the token.

    /* Spec:
       Body: { "userId": "current_user_id_from_auth", ... }
       We should rely on req.auth.userId
    */

    if (!userId) return res.status(401).json("Unauthorized");

    // Find the target user in DB by the param id (assuming DB _id)
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json("User not found");

    if (targetUser.clerkId !== userId && !req.body.isAdmin) {
        return res.status(403).json("You can update only your account!");
    }

    try {
        const user = await User.findByIdAndUpdate(req.params.id, {
            $set: req.body,
        }, { new: true });
        res.status(200).json("Account has been updated");
    } catch (err) {
        return res.status(500).json(err);
    }
};

// Delete user
const deleteUser = async (req, res) => {
    const { userId } = req.auth;

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json("User not found");

    if (targetUser.clerkId !== userId && !req.body.isAdmin) { // Simulating isAdmin check from body or DB
        return res.status(403).json("You can delete only your account!");
    }
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json("Account has been deleted");
    } catch (err) {
        return res.status(500).json(err);
    }
};

// Follow a user
const followUser = async (req, res) => {
    // Current user: req.auth.userId (Clerk ID)
    // Target user: req.params.id (DB _id)

    if (!req.auth.userId) return res.status(401).json("Unauthorized");

    if (req.params.id !== req.auth.userId) { // Comparing DB ID vs Clerk ID? Mismatch likely.
        // We need the current user's DB _id to store in followers list.
        try {
            const currentUser = await User.findOne({ clerkId: req.auth.userId });
            const userToFollow = await User.findById(req.params.id);

            if (currentUser._id.toString() === req.params.id) {
                return res.status(403).json("You cannot follow yourself");
            }

            if (!userToFollow.followers.includes(currentUser._id.toString())) {
                await userToFollow.updateOne({ $push: { followers: currentUser._id.toString() } });
                await currentUser.updateOne({ $push: { followings: req.params.id } });
                res.status(200).json("User has been followed");
            } else {
                res.status(403).json("You allready follow this user");
            }
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("You cannot follow yourself");
    }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
    if (!req.auth.userId) return res.status(401).json("Unauthorized");

    try {
        const currentUser = await User.findOne({ clerkId: req.auth.userId });
        const userToUnfollow = await User.findById(req.params.id);

        if (currentUser._id.toString() === req.params.id) {
            return res.status(403).json("You cannot unfollow yourself");
        }

        if (userToUnfollow.followers.includes(currentUser._id.toString())) {
            await userToUnfollow.updateOne({ $pull: { followers: currentUser._id.toString() } });
            await currentUser.updateOne({ $pull: { followings: req.params.id } });
            res.status(200).json("User has been unfollowed");
        } else {
            res.status(403).json("You dont follow this user");
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

// Get friends
const getFriends = async (req, res) => {
    try {
        const userId = req.params.userId;
        let user;

        if (mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId);
        } else {
            user = await User.findOne({ clerkId: userId });
        }

        if (!user) return res.status(404).json("User not found");

        const friends = await Promise.all(
            user.followings.map((friendId) => {
                return User.findById(friendId);
            })
        );
        let friendList = [];
        friends.map((friend) => {
            if (friend) { // friend might be null if deleted
                const { _id, username, profilePicture } = friend;
                friendList.push({ _id, username, profilePicture });
            }
        });
        res.status(200).json(friendList);
    } catch (err) {
        res.status(500).json(err);
    }
};

module.exports = {
    getCurrentUser,
    getUser,
    updateUser,
    deleteUser,
    followUser,
    unfollowUser,
    getFriends
};
