const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const tokenFromHeader = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    const token = req.cookies.token || tokenFromHeader;

    if (!token) {
      return res.redirect("/auth");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.clearCookie("token");
      return res.redirect("/auth");
    }

    req.user = user;
    next();
  } catch (error) {
    res.clearCookie("token");
    return res.redirect("/auth");
  }
}

module.exports = { requireAuth };
