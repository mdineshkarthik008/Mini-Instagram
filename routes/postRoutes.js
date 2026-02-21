const fs = require("fs");
const path = require("path");
const express = require("express");
const Post = require("../models/Post");
const upload = require("../config/upload");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const POSTS_PER_PAGE = 4;

function isOwner(post, user) {
  return post.author.toString() === user._id.toString();
}

function removeImageIfExists(relativeImagePath) {
  const absolutePath = path.join(__dirname, "..", relativeImagePath.replace(/^\//, ""));
  if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
}

router.get("/feed", requireAuth, async (req, res) => {
  try {
    const requestedPage = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const totalPosts = await Post.countDocuments();
    const totalPages = Math.max(Math.ceil(totalPosts / POSTS_PER_PAGE), 1);
    const currentPage = Math.min(requestedPage, totalPages);
    const skip = (currentPage - 1) * POSTS_PER_PAGE;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(POSTS_PER_PAGE)
      .populate("author", "name username email");

    return res.render("feed", {
      user: req.user,
      posts,
      page: currentPage,
      totalPages,
      error: null,
    });
  } catch (error) {
    return res.status(500).render("feed", {
      user: req.user,
      posts: [],
      page: 1,
      totalPages: 1,
      error: "Could not load feed.",
    });
  }
});

router.post("/posts", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const caption = (req.body.caption || "").trim();
    if (!caption) return res.status(400).send("Caption is required.");
    if (!req.file) return res.status(400).send("Image is required.");

    await Post.create({
      caption,
      image: `/uploads/${req.file.filename}`,
      author: req.user._id,
    });

    return res.redirect("/feed");
  } catch (error) {
    return res.status(500).send("Could not create post.");
  }
});

router.post("/posts/:id/update", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found.");

    if (!isOwner(post, req.user)) {
      return res.status(403).send("You can update only your own post.");
    }

    const caption = (req.body.caption || "").trim();
    if (caption) post.caption = caption;

    if (req.file) {
      removeImageIfExists(post.image);
      post.image = `/uploads/${req.file.filename}`;
    }

    await post.save();
    return res.redirect("/feed");
  } catch (error) {
    return res.status(500).send("Could not update post.");
  }
});

router.post("/posts/:id/delete", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found.");

    if (!isOwner(post, req.user)) {
      return res.status(403).send("You can delete only your own post.");
    }

    removeImageIfExists(post.image);

    await Post.deleteOne({ _id: post._id });
    return res.redirect("/feed");
  } catch (error) {
    return res.status(500).send("Could not delete post.");
  }
});

module.exports = router;
