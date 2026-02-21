const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relPath) {
  const abs = path.join(__dirname, "..", relPath);
  return fs.readFileSync(abs, "utf8");
}

try {
  const postRoutes = read("routes/postRoutes.js");
  const authRoutes = read("routes/authRoutes.js");
  const server = read("server.js");
  const postModel = read("models/Post.js");

  assert(/POSTS_PER_PAGE\s*=\s*4/.test(postRoutes), "Pagination is not set to 4 posts/page.");
  assert(
    /isOwner\(/.test(postRoutes) || /post\.author\.toString\(\)\s*!==\s*req\.user\._id\.toString\(\)/.test(postRoutes),
    "Ownership check for update/delete is missing."
  );
  assert(/jwt\.sign/.test(authRoutes), "JWT sign logic is missing.");
  assert(/identifier/.test(authRoutes), "Username/email login identifier is missing.");
  assert(/multer/.test(read("config/upload.js")), "Multer upload config is missing.");
  assert(/author:\s*{\s*type:\s*mongoose\.Schema\.Types\.ObjectId/.test(postModel), "Post model author relation missing.");
  assert(/app\.set\("view engine",\s*"ejs"\)/.test(server), "EJS setup missing.");

  console.log("Flow check passed: core mini-instagram phases are implemented.");
} catch (error) {
  console.error("Flow check failed:", error.message);
  process.exit(1);
}
