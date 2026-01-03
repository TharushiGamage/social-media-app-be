const Post = require("../models/Post");
const User = require("../models/User");

// Create a post
const createPost = async (req, res) => {
    // req.body contains { userId, desc, img }
    // Spec says: Body: { "userId": "...", "desc": "...", "img": "..." }
    // We should probably trust the body userId OR use req.auth.userId and verify.
    // Spec says "Protected: Yes". 
    // Best practice: Set userId from req.auth.userId (Clerk ID) or verify it matches.

    if (!req.auth.userId) return res.status(401).json("Unauthorized");

    const newPost = new Post(req.body);
    try {
        const savedPost = await newPost.save();
        res.status(200).json(savedPost);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Update a post
const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) { // Check ownership. Note: Post.userId stores... ClerkID or DB ID? 
            // In User Controller, we saw "userId" params usually referring to DB _id in URL, but here "userId" in Post model.
            // Let's assume Post.userId stores Clerk ID as provided in createPost (if payload sends Clerk ID) or DB ID?
            // The createPost payload in Spec says "userId": "user_id_123". 
            // If User Sync stores Clerk ID, let's assume Post refers to that. 
            // But wait, standard Mongoose relationship usually uses ObjectId.
            // However, with Clerk, using Clerk ID as foreign key is commmon too for simplicity. 
            // I'll stick to string ID (Clerk ID) or whatever the frontend sends, but consistency is key.
            // If createPost body has "userId", I'll use that.
            // Ideally, I should fetch User by Clerk ID to get _id if I want to use ObjectId.

            // Let's assume Post.userId is the string ID passed from frontend (likely Clerk ID or DB ID).
            // For safety, I'll compare against req.body.userId.

            await post.updateOne({ $set: req.body });
            res.status(200).json("The post has been updated");
        } else {
            res.status(403).json("You can update only your post");
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

// Delete a post
const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) {
            await post.deleteOne();
            res.status(200).json("The post has been deleted");
        } else {
            res.status(403).json("You can delete only your post");
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

// Like/Dislike a post
const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post.likes.includes(req.body.userId)) {
            await post.updateOne({ $push: { likes: req.body.userId } });
            res.status(200).json("The post has been liked");
        } else {
            await post.updateOne({ $pull: { likes: req.body.userId } });
            res.status(200).json("The post has been disliked");
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

// Get a post
const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Get timeline posts
const getTimelinePosts = async (req, res) => {
    // endpoint: GET /timeline/{userId} (or /timeline/all using token)
    // Spec says: Get all posts from the current user and users they follow.

    // Check if using userId param or inferred from token?
    // Spec: GET /timeline/{userId}

    // We need to fetch the current user's followings.
    // The userId in param is likely the DB _id of the current user? Or Clerk ID?
    // Let's assume DB _id if we follow "Get Friends" pattern which uses friends/{userId}.

    // BUT, the Post model stores "userId".
    // If Post.userId is Clerk ID, we need to match that.

    try {
        const currentUser = await User.findById(req.params.userId) || await User.findOne({ clerkId: req.params.userId });
        if (!currentUser) return res.status(404).json("User not found");

        const userPosts = await Post.find({ userId: currentUser._id.toString() }); // Assuming Post.userId uses DB ID? Or Clerk ID?
        // Wait, if createPost sends "userId": "...", we need to know what that ID is.
        // Let's make it robust. If Post.userId matches currentUser.clerkId or currentUser._id.
        // Usually, in these apps, we pick one.
        // Given spec: "userId": "user_id_123" in Post create body.
        // And User object has "_id": "user_id_123" (DB ID).
        // Let's assume Post.userId references User._id.

        // However, if the frontend sends Clerk ID, we might have a mismatch.
        // I will assume Post.userId === User.clerkId for easiest integration with Clerk, 
        // OR Post.userId === User._id. 
        // Let's look at `User` model. `clerkId` is unique string. `_id` is ObjectId.

        // I'll try to match both for the user's own posts just in case, but followings need consistency.
        // Let's assume the system uses User DB _id for internal relationships (followers/followings are ids).
        // In `user.controller.js`, `followUser` pushes `req.params.id` (User DB _id) and `currentUser._id`.
        // So `followings` array contains User DB _ids.

        // So Post.userId SHOULD be User DB _id.

        const userPostsByDbId = await Post.find({ userId: currentUser._id.toString() });
        // also get friends posts
        const friendPosts = await Promise.all(
            currentUser.followings.map((friendId) => {
                return Post.find({ userId: friendId });
            })
        );
        res.status(200).json(userPostsByDbId.concat(...friendPosts));
    } catch (err) {
        res.status(500).json(err);
    }
};

// Get user's all posts
const getUserPosts = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json("User not found");

        const posts = await Post.find({ userId: user._id.toString() }); // Assuming userId stores DB ID
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json(err);
    }
};

module.exports = {
    createPost,
    updatePost,
    deletePost,
    likePost,
    getPost,
    getTimelinePosts,
    getUserPosts
};
