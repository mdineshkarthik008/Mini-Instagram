require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");

const app = express();
const port = Number(process.env.PORT) || 3001;
const mongoUri = process.env.MONGODB_URI;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  if (req.cookies.token) return res.redirect("/feed");
  return res.redirect("/auth");
});

app.use(authRoutes);
app.use(postRoutes);

app.use((error, _req, res, _next) => {
  if (error && error.message && error.message.includes("Only image files are allowed")) {
    return res.status(400).send("Please upload a valid image (jpeg, png, webp, gif).");
  }
  if (error && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).send("Image size must be 5MB or less.");
  }
  return res.status(500).send("Something went wrong.");
});

async function startServer() {
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in environment. Create .env and set MONGODB_URI.");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET in environment. Create .env and set JWT_SECRET.");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    app.listen(port, () => {
      console.log(`Mini Instagram running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
