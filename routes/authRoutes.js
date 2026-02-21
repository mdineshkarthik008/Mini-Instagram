const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

router.get("/auth", (req, res) => {
  if (req.cookies.token) return res.redirect("/feed");
  return res.render("auth", { error: null });
});

router.post("/auth/signup", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).render("auth", { error: "Please fill in all signup fields." });
    }

    const normalizedEmail = normalize(email);
    const normalizedUsername = normalize(username);

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existing) {
      return res.status(409).render("auth", { error: "Email or username is already in use." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashed,
    });

    setAuthCookie(res, signToken(user._id.toString()));

    return res.redirect("/feed");
  } catch (error) {
    return res.status(500).render("auth", { error: "Signup failed. Please try again." });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const identifier = normalize(req.body.identifier || req.body.email);
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).render("auth", { error: "Enter username/email and password." });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      return res.status(401).render("auth", { error: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).render("auth", { error: "Invalid credentials." });
    }

    setAuthCookie(res, signToken(user._id.toString()));

    return res.redirect("/feed");
  } catch (error) {
    return res.status(500).render("auth", { error: "Login failed. Please try again." });
  }
});

router.get("/logout", (_req, res) => {
  res.clearCookie("token");
  return res.redirect("/auth");
});

module.exports = router;
